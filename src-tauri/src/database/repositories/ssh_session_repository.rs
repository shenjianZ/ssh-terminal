use anyhow::Result;
use r2d2::PooledConnection;
use r2d2_sqlite::{rusqlite, SqliteConnectionManager};

use crate::database::DbPool;
use crate::models::ssh_session::*;

/// SSH 会话 Repository
pub struct SshSessionRepository {
    pool: DbPool,
}

impl SshSessionRepository {
    /// 创建新的 Repository 实例
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    /// 获取数据库连接
    fn get_conn(&self) -> Result<PooledConnection<SqliteConnectionManager>> {
        self.pool
            .get()
            .map_err(|e| anyhow::anyhow!("Failed to get database connection: {}", e))
    }

    /// 创建 SSH 会话
    pub fn create(&self, session: &SshSession) -> Result<SshSession> {
        let conn = self.get_conn()?;

        conn.execute(
            "INSERT INTO ssh_sessions (
                id, user_id, name, host, port, username, group_name,
                terminal_type, columns, rows,
                auth_method_encrypted, auth_nonce, auth_key_salt,
                server_ver, client_ver, is_dirty, last_synced_at,
                is_deleted, deleted_at, created_at, updated_at
            ) VALUES (
                :id, :user_id, :name, :host, :port, :username, :group_name,
                :terminal_type, :columns, :rows,
                :auth_method_encrypted, :auth_nonce, :auth_key_salt,
                :server_ver, :client_ver, :is_dirty, :last_synced_at,
                :is_deleted, :deleted_at, :created_at, :updated_at
            )",
            &[
                (":id", &session.id as &dyn rusqlite::ToSql),
                (":user_id", &session.user_id as &dyn rusqlite::ToSql),
                (":name", &session.name as &dyn rusqlite::ToSql),
                (":host", &session.host as &dyn rusqlite::ToSql),
                (":port", &(session.port as i32) as &dyn rusqlite::ToSql),
                (":username", &session.username as &dyn rusqlite::ToSql),
                (":group_name", &session.group_name as &dyn rusqlite::ToSql),
                (":terminal_type", &session.terminal_type as &dyn rusqlite::ToSql),
                (":columns", &session.columns.map(|c| c as i32) as &dyn rusqlite::ToSql),
                (":rows", &session.rows.map(|r| r as i32) as &dyn rusqlite::ToSql),
                (":auth_method_encrypted", &session.auth_method_encrypted as &dyn rusqlite::ToSql),
                (":auth_nonce", &session.auth_nonce as &dyn rusqlite::ToSql),
                (":auth_key_salt", &session.auth_key_salt as &dyn rusqlite::ToSql),
                (":server_ver", &session.server_ver as &dyn rusqlite::ToSql),
                (":client_ver", &session.client_ver as &dyn rusqlite::ToSql),
                (":is_dirty", &(session.is_dirty as i32) as &dyn rusqlite::ToSql),
                (":last_synced_at", &session.last_synced_at as &dyn rusqlite::ToSql),
                (":is_deleted", &(session.is_deleted as i32) as &dyn rusqlite::ToSql),
                (":deleted_at", &session.deleted_at as &dyn rusqlite::ToSql),
                (":created_at", &session.created_at as &dyn rusqlite::ToSql),
                (":updated_at", &session.updated_at as &dyn rusqlite::ToSql),
            ][..],
        )?;

        Ok(session.clone())
    }

    /// 更新 SSH 会话
    pub fn update(&self, session: &SshSession) -> Result<SshSession> {
        let conn = self.get_conn()?;

        conn.execute(
            "UPDATE ssh_sessions SET
                name = :name, host = :host, port = :port, username = :username, group_name = :group_name,
                terminal_type = :terminal_type, columns = :columns, rows = :rows,
                auth_method_encrypted = :auth_method_encrypted, auth_nonce = :auth_nonce, auth_key_salt = :auth_key_salt,
                server_ver = :server_ver, client_ver = :client_ver, is_dirty = :is_dirty, last_synced_at = :last_synced_at,
                updated_at = :updated_at
            WHERE id = :id",
            &[
                (":name", &session.name as &dyn rusqlite::ToSql),
                (":host", &session.host as &dyn rusqlite::ToSql),
                (":port", &(session.port as i32) as &dyn rusqlite::ToSql),
                (":username", &session.username as &dyn rusqlite::ToSql),
                (":group_name", &session.group_name as &dyn rusqlite::ToSql),
                (":terminal_type", &session.terminal_type as &dyn rusqlite::ToSql),
                (":columns", &session.columns.map(|c| c as i32) as &dyn rusqlite::ToSql),
                (":rows", &session.rows.map(|r| r as i32) as &dyn rusqlite::ToSql),
                (":auth_method_encrypted", &session.auth_method_encrypted as &dyn rusqlite::ToSql),
                (":auth_nonce", &session.auth_nonce as &dyn rusqlite::ToSql),
                (":auth_key_salt", &session.auth_key_salt as &dyn rusqlite::ToSql),
                (":server_ver", &session.server_ver as &dyn rusqlite::ToSql),
                (":client_ver", &session.client_ver as &dyn rusqlite::ToSql),
                (":is_dirty", &(session.is_dirty as i32) as &dyn rusqlite::ToSql),
                (":last_synced_at", &session.last_synced_at as &dyn rusqlite::ToSql),
                (":updated_at", &session.updated_at as &dyn rusqlite::ToSql),
                (":id", &session.id as &dyn rusqlite::ToSql),
            ][..],
        )?;

        Ok(session.clone())
    }

    /// 删除 SSH 会话（软删除）
    pub fn delete(&self, id: &str) -> Result<()> {
        let conn = self.get_conn()?;
        let now = chrono::Utc::now().timestamp();

        conn.execute(
            "UPDATE ssh_sessions SET is_deleted = 1, is_dirty = 1, deleted_at = ?1, updated_at = ?2 WHERE id = ?3",
            (now, now, id),
        )?;

        Ok(())
    }

    /// 根据 ID 获取 SSH 会话
    pub fn find_by_id(&self, id: &str) -> Result<Option<SshSession>> {
        let conn = self.get_conn()?;

        let mut stmt = conn.prepare(
            "SELECT
                id, user_id, name, host, port, username, group_name,
                terminal_type, columns, rows,
                auth_method_encrypted, auth_nonce, auth_key_salt,
                server_ver, client_ver, is_dirty, last_synced_at,
                is_deleted, deleted_at, created_at, updated_at
            FROM ssh_sessions
            WHERE id = ?1"
        )?;

        let mut rows = stmt.query([id])?;

        if let Some(row) = rows.next()? {
            Ok(Some(self.row_to_session(row)?))
        } else {
            Ok(None)
        }
    }

    /// 获取用户的所有 SSH 会话
    pub fn find_by_user(&self, user_id: &str) -> Result<Vec<SshSession>> {
        let conn = self.get_conn()?;

        tracing::info!("[find_by_user] Querying sessions for user_id: {}", user_id);

        let mut stmt = conn.prepare(
            "SELECT
                id, user_id, name, host, port, username, group_name,
                terminal_type, columns, rows,
                auth_method_encrypted, auth_nonce, auth_key_salt,
                server_ver, client_ver, is_dirty, last_synced_at,
                is_deleted, deleted_at, created_at, updated_at
            FROM ssh_sessions
            WHERE user_id = ?1 AND is_deleted = 0
            ORDER BY created_at DESC"
        )?;

        let rows = stmt.query_map([user_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, i32>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, String>(6)?,
                row.get::<_, Option<String>>(7)?,
                row.get::<_, Option<i32>>(8)?,
                row.get::<_, Option<i32>>(9)?,
                row.get::<_, String>(10)?,
                row.get::<_, String>(11)?,
                row.get::<_, Option<String>>(12)?,
                row.get::<_, i32>(13)?,
                row.get::<_, i32>(14)?,
                row.get::<_, i32>(15)?,
                row.get::<_, Option<i64>>(16)?,
                row.get::<_, i32>(17)?,
                row.get::<_, Option<i64>>(18)?,
                row.get::<_, i64>(19)?,
                row.get::<_, i64>(20)?,
            ))
        })?;

        let mut sessions = Vec::new();
        for row in rows {
            let (
                id, user_id, name, host, port, username, group_name,
                terminal_type, columns, rows,
                auth_method_encrypted, auth_nonce, auth_key_salt,
                server_ver, client_ver, is_dirty, last_synced_at,
                is_deleted, deleted_at, created_at, updated_at,
            ) = row?;

            sessions.push(SshSession {
                id,
                user_id,
                name,
                host,
                port: port as u16,
                username,
                group_name,
                terminal_type,
                columns: columns.map(|c| c as u16),
                rows: rows.map(|r| r as u16),
                auth_method_encrypted,
                auth_nonce,
                auth_key_salt,
                server_ver,
                client_ver,
                is_dirty: is_dirty != 0,
                last_synced_at,
                is_deleted: is_deleted != 0,
                deleted_at,
                created_at,
                updated_at,
            });
        }

        tracing::info!("[find_by_user] Found {} sessions", sessions.len());
        Ok(sessions)
    }

    /// 获取所有需要同步的会话（脏数据）
    pub fn get_dirty_sessions(&self, user_id: &str) -> Result<Vec<SshSession>> {
        let conn = self.get_conn()?;

        let mut stmt = conn.prepare(
            "SELECT
                id, user_id, name, host, port, username, group_name,
                terminal_type, columns, rows,
                auth_method_encrypted, auth_nonce, auth_key_salt,
                server_ver, client_ver, is_dirty, last_synced_at,
                is_deleted, deleted_at, created_at, updated_at
            FROM ssh_sessions
            WHERE user_id = ?1 AND is_dirty = 1 AND is_deleted = 0"
        )?;

        let rows = stmt.query_map([user_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, i32>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, String>(6)?,
                row.get::<_, Option<String>>(7)?,
                row.get::<_, Option<i32>>(8)?,
                row.get::<_, Option<i32>>(9)?,
                row.get::<_, String>(10)?,
                row.get::<_, String>(11)?,
                row.get::<_, Option<String>>(12)?,
                row.get::<_, i32>(13)?,
                row.get::<_, i32>(14)?,
                row.get::<_, i32>(15)?,
                row.get::<_, Option<i64>>(16)?,
                row.get::<_, i32>(17)?,
                row.get::<_, Option<i64>>(18)?,
                row.get::<_, i64>(19)?,
                row.get::<_, i64>(20)?,
            ))
        })?;

        let mut sessions = Vec::new();
        for row in rows {
            let (
                id, user_id, name, host, port, username, group_name,
                terminal_type, columns, rows,
                auth_method_encrypted, auth_nonce, auth_key_salt,
                server_ver, client_ver, is_dirty, last_synced_at,
                is_deleted, deleted_at, created_at, updated_at,
            ) = row?;

            sessions.push(SshSession {
                id,
                user_id,
                name,
                host,
                port: port as u16,
                username,
                group_name,
                terminal_type,
                columns: columns.map(|c| c as u16),
                rows: rows.map(|r| r as u16),
                auth_method_encrypted,
                auth_nonce,
                auth_key_salt,
                server_ver,
                client_ver,
                is_dirty: is_dirty != 0,
                last_synced_at,
                is_deleted: is_deleted != 0,
                deleted_at,
                created_at,
                updated_at,
            });
        }

        Ok(sessions)
    }

    /// 获取已删除的会话 ID（仅返回未同步的删除操作）
    pub fn get_deleted_sessions(&self, user_id: &str) -> Result<Vec<String>> {
        let conn = self.get_conn()?;

        let mut stmt = conn.prepare(
            "SELECT id FROM ssh_sessions WHERE user_id = ?1 AND is_deleted = 1 AND is_dirty = 1"
        )?;

        let rows = stmt.query_map([user_id], |row| row.get::<_, String>(0))?;

        let mut ids = Vec::new();
        for row in rows {
            ids.push(row?);
        }

        Ok(ids)
    }

    /// 根据 user_id 获取 SSH 会话列表
    pub fn find_by_user_id(&self, user_id: &str) -> Result<Vec<SshSession>> {
        self.find_by_user(user_id)
    }

    /// 清理脏标记
    /// 注意：server_ver 应该由 apply_push_result 根据服务器响应更新，而不是在这里递增
    pub fn clear_dirty_marker(&self, id: &str, sync_time: i64) -> Result<()> {
        let conn = self.get_conn()?;

        conn.execute(
            "UPDATE ssh_sessions SET is_dirty = 0, last_synced_at = ?1 WHERE id = ?2",
            (sync_time, id),
        )?;

        Ok(())
    }

    /// 将数据库行转换为 SshSession
    fn row_to_session(&self, row: &rusqlite::Row) -> Result<SshSession> {
        Ok(SshSession {
            id: row.get(0)?,
            user_id: row.get(1)?,
            name: row.get(2)?,
            host: row.get(3)?,
            port: row.get::<_, i32>(4)? as u16,
            username: row.get(5)?,
            group_name: row.get(6)?,
            terminal_type: row.get(7)?,
            columns: row.get::<_, Option<i32>>(8)?.map(|c| c as u16),
            rows: row.get::<_, Option<i32>>(9)?.map(|r| r as u16),
            auth_method_encrypted: row.get(10)?,
            auth_nonce: row.get(11)?,
            auth_key_salt: row.get(12)?,
            server_ver: row.get(13)?,
            client_ver: row.get(14)?,
            is_dirty: row.get::<_, i32>(15)? != 0,
            last_synced_at: row.get(16)?,
            is_deleted: row.get::<_, i32>(17)? != 0,
            deleted_at: row.get(18)?,
            created_at: row.get(19)?,
            updated_at: row.get(20)?,
        })
    }
}
