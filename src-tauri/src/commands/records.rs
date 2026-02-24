//! 记录管理命令
//!
//! 提供上传/下载记录的查询和管理功能

use crate::database::DbPool;
use crate::database::repositories::{
    PaginatedDownloadRecords, PaginatedUploadRecords, UploadRecordsRepository, DownloadRecordsRepository
};
use crate::error::Result;
use tauri::State;

/// 分页查询上传记录
///
/// # 参数
/// - `pool`: 数据库连接池
/// - `page`: 页码（从 1 开始）
/// - `page_size`: 每页数量
///
/// # 返回
/// 分页的上传记录
#[tauri::command]
pub async fn list_upload_records(pool: State<'_, DbPool>, page: u32, page_size: u32) -> Result<PaginatedUploadRecords> {
    let conn = pool.get()
        .map_err(|e| crate::error::SSHError::Io(format!("获取数据库连接失败: {}", e)))?;
    UploadRecordsRepository::list_paginated(&conn, page, page_size)
        .map_err(|e| crate::error::SSHError::Io(format!("查询上传记录失败: {}", e)))
}

/// # 参数
/// - `pool`: 数据库连接池
/// - `id`: 记录 ID
#[tauri::command]
pub async fn delete_upload_record(pool: State<'_, DbPool>, id: i64) -> Result<()> {
    let conn = pool.get()
        .map_err(|e| crate::error::SSHError::Io(format!("获取数据库连接失败: {}", e)))?;
    UploadRecordsRepository::delete(&conn, id)
        .map_err(|e| crate::error::SSHError::Io(format!("删除上传记录失败: {}", e)))
}

/// 清空所有上传记录
#[tauri::command]
pub async fn clear_upload_records(pool: State<'_, DbPool>) -> Result<()> {
    let conn = pool.get()
        .map_err(|e| crate::error::SSHError::Io(format!("获取数据库连接失败: {}", e)))?;
    UploadRecordsRepository::clear_all(&conn)
        .map_err(|e| crate::error::SSHError::Io(format!("清空上传记录失败: {}", e)))
}

/// 分页查询下载记录
///
/// # 参数
/// - `pool`: 数据库连接池
/// - `page`: 页码（从 1 开始）
/// - `page_size`: 每页数量
///
/// # 返回
/// 分页的下载记录
#[tauri::command]
pub async fn list_download_records(pool: State<'_, DbPool>, page: u32, page_size: u32) -> Result<PaginatedDownloadRecords> {
    let conn = pool.get()
        .map_err(|e| crate::error::SSHError::Io(format!("获取数据库连接失败: {}", e)))?;
    DownloadRecordsRepository::list_paginated(&conn, page, page_size)
        .map_err(|e| crate::error::SSHError::Io(format!("查询下载记录失败: {}", e)))
}

/// 删除下载记录
///
/// # 参数
/// - `pool`: 数据库连接池
/// - `id`: 记录 ID
#[tauri::command]
pub async fn delete_download_record(pool: State<'_, DbPool>, id: i64) -> Result<()> {
    let conn = pool.get()
        .map_err(|e| crate::error::SSHError::Io(format!("获取数据库连接失败: {}", e)))?;
    DownloadRecordsRepository::delete(&conn, id)
        .map_err(|e| crate::error::SSHError::Io(format!("删除下载记录失败: {}", e)))
}

/// 清空所有下载记录
#[tauri::command]
pub async fn clear_download_records(pool: State<'_, DbPool>) -> Result<()> {
    let conn = pool.get()
        .map_err(|e| crate::error::SSHError::Io(format!("获取数据库连接失败: {}", e)))?;
    DownloadRecordsRepository::clear_all(&conn)
        .map_err(|e| crate::error::SSHError::Io(format!("清空下载记录失败: {}", e)))
}