use anyhow::Result;
use r2d2_sqlite::rusqlite::Connection;

/// 初始化数据库表结构
pub fn init_schema(conn: &Connection) -> Result<()> {
    tracing::info!("Initializing database schema");

    // 执行表结构初始化
    conn.execute_batch(
        "
        -- ==========================================
        -- 用户认证表（本地认证，加密存储，支持多账号）
        -- ==========================================
        CREATE TABLE IF NOT EXISTS user_auth (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL,
            password_encrypted TEXT NOT NULL,
            password_nonce TEXT NOT NULL,
            access_token_encrypted TEXT NOT NULL,
            refresh_token_encrypted TEXT,
            token_expires_at INTEGER,
            device_id TEXT NOT NULL,
            last_sync_at INTEGER,
            is_current BOOLEAN DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_user_auth_current ON user_auth(is_current);

        -- ==========================================
        -- 用户资料表（允许同步到服务器）
        -- ==========================================
        CREATE TABLE IF NOT EXISTS user_profiles (
            id INTEGER PRIMARY KEY,
            user_id TEXT NOT NULL UNIQUE,
            username TEXT,
            phone TEXT,
            qq TEXT,
            wechat TEXT,
            avatar_data TEXT,
            avatar_mime_type TEXT,
            bio TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        -- ==========================================
        -- SSH 会话表（支持同步）
        -- ==========================================
        CREATE TABLE IF NOT EXISTS ssh_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,

            -- 基本信息（同步到服务器）
            name TEXT NOT NULL,
            host TEXT NOT NULL,
            port INTEGER NOT NULL DEFAULT 22,
            username TEXT NOT NULL,
            group_name TEXT DEFAULT '默认分组',
            terminal_type TEXT,
            columns INTEGER,
            rows INTEGER,

            -- 认证信息（完整同步到服务器，使用端到端加密）
            -- 注意：auth_method_encrypted 在客户端使用用户密钥加密后上传
            -- 服务器无法解密，只有客户端可以解密
            auth_method_encrypted TEXT NOT NULL,
            auth_nonce TEXT,
            auth_key_salt TEXT,

            -- 同步字段
            server_ver INTEGER DEFAULT 0,
            client_ver INTEGER DEFAULT 0,
            is_dirty BOOLEAN DEFAULT 0,
            last_synced_at INTEGER,

            -- 时间戳
            is_deleted BOOLEAN DEFAULT 0,
            deleted_at INTEGER,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_ssh_sessions_user_id ON ssh_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_ssh_sessions_group ON ssh_sessions(group_name);
        CREATE INDEX IF NOT EXISTS idx_ssh_sessions_is_deleted ON ssh_sessions(is_deleted);

        -- ==========================================
        -- 同步状态表（支持多用户）
        -- ==========================================
        CREATE TABLE IF NOT EXISTS sync_state (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL UNIQUE,
            last_sync_at INTEGER,
            pending_count INTEGER DEFAULT 0,
            conflict_count INTEGER DEFAULT 0,
            last_error TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_sync_state_user_id ON sync_state(user_id);

        -- ==========================================
        -- 应用配置表（设备级配置）
        -- ==========================================
        CREATE TABLE IF NOT EXISTS app_settings (
            id INTEGER PRIMARY KEY,
            default_server_url TEXT,  -- 改为可为 NULL
            auto_sync_enabled BOOLEAN DEFAULT 0,
            sync_interval_minutes INTEGER DEFAULT 5,
            theme TEXT DEFAULT 'system',
            language TEXT DEFAULT 'zh-CN',
            updated_at INTEGER NOT NULL
        );

        -- 初始化默认配置（default_server_url 为 NULL，需要用户首次使用时设置）
        INSERT OR IGNORE INTO app_settings
            (id, auto_sync_enabled, sync_interval_minutes, theme, language, updated_at)
        VALUES (1, 0, 5, 'system', 'zh-CN', strftime('%s', 'now'));

        -- ==========================================
        -- 上传记录表
        -- ==========================================
        CREATE TABLE IF NOT EXISTS upload_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id TEXT NOT NULL UNIQUE,
            connection_id TEXT NOT NULL,

            -- 上传信息
            local_path TEXT NOT NULL,
            remote_path TEXT NOT NULL,

            -- 统计信息
            total_files INTEGER NOT NULL DEFAULT 0,
            total_dirs INTEGER NOT NULL DEFAULT 0,
            total_size INTEGER NOT NULL DEFAULT 0,

            -- 状态
            status TEXT NOT NULL, -- 'pending', 'uploading', 'completed', 'failed', 'cancelled'
            bytes_transferred INTEGER NOT NULL DEFAULT 0,
            files_completed INTEGER NOT NULL DEFAULT 0,

            -- 时间
            started_at INTEGER NOT NULL,
            completed_at INTEGER,
            elapsed_ms INTEGER,

            -- 错误信息
            error_message TEXT,

            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_upload_records_connection_id ON upload_records(connection_id);
        CREATE INDEX IF NOT EXISTS idx_upload_records_status ON upload_records(status);
        CREATE INDEX IF NOT EXISTS idx_upload_records_created_at ON upload_records(created_at DESC);

        -- ==========================================
        -- 下载记录表
        -- ==========================================
        CREATE TABLE IF NOT EXISTS download_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id TEXT NOT NULL UNIQUE,
            connection_id TEXT NOT NULL,

            -- 下载信息
            remote_path TEXT NOT NULL,
            local_path TEXT NOT NULL,

            -- 统计信息
            total_files INTEGER NOT NULL DEFAULT 0,
            total_dirs INTEGER NOT NULL DEFAULT 0,
            total_size INTEGER NOT NULL DEFAULT 0,

            -- 状态
            status TEXT NOT NULL, -- 'pending', 'downloading', 'completed', 'failed', 'cancelled'
            bytes_transferred INTEGER NOT NULL DEFAULT 0,
            files_completed INTEGER NOT NULL DEFAULT 0,

            -- 时间
            started_at INTEGER NOT NULL,
            completed_at INTEGER,
            elapsed_ms INTEGER,

            -- 错误信息
            error_message TEXT,

            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_download_records_connection_id ON download_records(connection_id);
        CREATE INDEX IF NOT EXISTS idx_download_records_status ON download_records(status);
        CREATE INDEX IF NOT EXISTS idx_download_records_created_at ON download_records(created_at DESC);
        ",
    )?;

    tracing::info!("Database schema initialized successfully");

    Ok(())
}