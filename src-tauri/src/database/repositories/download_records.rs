//! 下载记录 Repository
//!
//! 管理下载记录的数据库操作

use anyhow::Result;
use r2d2_sqlite::rusqlite::Connection;
use serde::{Deserialize, Serialize};

/// 下载记录状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum DownloadStatus {
    Pending,
    Downloading,
    Completed,
    Failed,
    Cancelled,
}

impl From<&str> for DownloadStatus {
    fn from(s: &str) -> Self {
        match s {
            "pending" => DownloadStatus::Pending,
            "downloading" => DownloadStatus::Downloading,
            "completed" => DownloadStatus::Completed,
            "failed" => DownloadStatus::Failed,
            "cancelled" => DownloadStatus::Cancelled,
            _ => DownloadStatus::Pending,
        }
    }
}

impl DownloadStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            DownloadStatus::Pending => "pending",
            DownloadStatus::Downloading => "downloading",
            DownloadStatus::Completed => "completed",
            DownloadStatus::Failed => "failed",
            DownloadStatus::Cancelled => "cancelled",
        }
    }
}

/// 下载记录
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadRecord {
    pub id: i64,
    pub task_id: String,
    pub connection_id: String,
    pub remote_path: String,
    pub local_path: String,
    pub total_files: i64,
    pub total_dirs: i64,
    pub total_size: i64,
    pub status: String,
    pub bytes_transferred: i64,
    pub files_completed: i64,
    pub started_at: i64,
    pub completed_at: Option<i64>,
    pub elapsed_ms: Option<i64>,
    pub error_message: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// 分页结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedDownloadRecords {
    pub records: Vec<DownloadRecord>,
    pub total: u64,
    pub page: u32,
    pub page_size: u32,
}

/// 下载记录 Repository
pub struct DownloadRecordsRepository {
    // 这里暂时不使用连接池，直接使用 Connection
    // 如果需要连接池，可以修改为使用 Arc<r2d2::Pool<r2d2_sqlite::SqliteConnectionManager>>
}

impl DownloadRecordsRepository {
    /// 创建新的下载记录
    pub fn create(conn: &Connection, record: &DownloadRecord) -> Result<i64> {
        conn.execute(
            "INSERT INTO download_records (
                task_id, connection_id, remote_path, local_path,
                total_files, total_dirs, total_size, status,
                bytes_transferred, files_completed, started_at,
                completed_at, elapsed_ms, error_message,
                created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
            [
                &record.task_id,
                &record.connection_id,
                &record.remote_path,
                &record.local_path,
                &record.total_files.to_string(),
                &record.total_dirs.to_string(),
                &record.total_size.to_string(),
                &record.status,
                &record.bytes_transferred.to_string(),
                &record.files_completed.to_string(),
                &record.started_at.to_string(),
                &record.completed_at.map(|v| v.to_string()).unwrap_or_default(),
                &record.elapsed_ms.map(|v| v.to_string()).unwrap_or_default(),
                record.error_message.as_ref().map(|s| s.as_str()).unwrap_or_default(),
                &record.created_at.to_string(),
                &record.updated_at.to_string(),
            ],
        )?;

        Ok(conn.last_insert_rowid())
    }

    /// 更新状态
    pub fn update_status(conn: &Connection, task_id: &str, status: DownloadStatus, error_message: Option<String>) -> Result<()> {
        let now = chrono::Utc::now().timestamp();
        conn.execute(
            "UPDATE download_records SET status = ?1, error_message = ?2, updated_at = ?3 WHERE task_id = ?4",
            [status.as_str(), &error_message.unwrap_or_default(), &now.to_string(), task_id],
        )?;
        Ok(())
    }

    /// 更新进度
    pub fn update_progress(conn: &Connection, task_id: &str, bytes_transferred: i64, files_completed: i64) -> Result<()> {
        let now = chrono::Utc::now().timestamp();
        conn.execute(
            "UPDATE download_records SET bytes_transferred = ?1, files_completed = ?2, updated_at = ?3 WHERE task_id = ?4",
            [&bytes_transferred.to_string(), &files_completed.to_string(), &now.to_string(), task_id],
        )?;
        Ok(())
    }

    /// 标记完成
    pub fn mark_completed(conn: &Connection, task_id: &str, elapsed_ms: i64) -> Result<()> {
        let now = chrono::Utc::now().timestamp();
        conn.execute(
            "UPDATE download_records SET status = 'completed', completed_at = ?1, elapsed_ms = ?2, updated_at = ?3 WHERE task_id = ?4",
            [&now.to_string(), &elapsed_ms.to_string(), &now.to_string(), task_id],
        )?;
        Ok(())
    }

    /// 分页查询
    pub fn list_paginated(conn: &Connection, page: u32, page_size: u32) -> Result<PaginatedDownloadRecords> {
        let offset = (page - 1) * page_size;

        // 查询总数
        let total: u64 = conn.query_row(
            "SELECT COUNT(*) FROM download_records",
            [],
            |row| row.get::<_, i64>(0).map(|v| v as u64),
        )?;

        // 查询记录
        let mut stmt = conn.prepare(
            "SELECT * FROM download_records
             ORDER BY created_at DESC
             LIMIT ?1 OFFSET ?2"
        )?;

        let records: Result<Vec<DownloadRecord>, _> = stmt.query_map([page_size, offset], |row| {
            Ok(DownloadRecord {
                id: row.get(0)?,
                task_id: row.get(1)?,
                connection_id: row.get(2)?,
                remote_path: row.get(3)?,
                local_path: row.get(4)?,
                total_files: row.get(5)?,
                total_dirs: row.get(6)?,
                total_size: row.get(7)?,
                status: row.get(8)?,
                bytes_transferred: row.get(9)?,
                files_completed: row.get(10)?,
                started_at: row.get(11)?,
                completed_at: row.get(12)?,
                elapsed_ms: row.get(13)?,
                error_message: row.get(14)?,
                created_at: row.get(15)?,
                updated_at: row.get(16)?,
            })
        })?.collect();

        Ok(PaginatedDownloadRecords {
            records: records?,
            total,
            page,
            page_size,
        })
    }

    /// 删除记录
    pub fn delete(conn: &Connection, id: i64) -> Result<()> {
        conn.execute("DELETE FROM download_records WHERE id = ?1", [id])?;
        Ok(())
    }

    /// 根据 task_id 删除记录
    pub fn delete_by_task_id(conn: &Connection, task_id: &str) -> Result<()> {
        conn.execute("DELETE FROM download_records WHERE task_id = ?1", [task_id])?;
        Ok(())
    }

    /// 清空所有记录
    pub fn clear_all(conn: &Connection) -> Result<()> {
        conn.execute("DELETE FROM download_records", [])?;
        Ok(())
    }
}