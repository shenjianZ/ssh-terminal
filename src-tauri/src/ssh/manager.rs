use crate::error::{Result, SSHError};
use crate::ssh::session::{SessionConfig, SessionConfigUpdate, SessionStatus, SessionInfo};
use crate::ssh::connection::{ConnectionInstance, ConnectionInfo};
use crate::ssh::backend::SSHBackend;
#[cfg(not(target_os = "android"))]
use crate::ssh::backends::DefaultBackend;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::{AppHandle, Emitter};
use tracing::error as tracing_error;

// 常量定义
const BUFFER_SIZE: usize = 8192;

/// SSH管理器：维护Session配置和Connection实例
#[derive(Clone)]
pub struct SSHManager {
    /// 会话配置：sessionId -> SessionConfig
    sessions: Arc<RwLock<HashMap<String, SessionConfig>>>,
    /// 连接实例：connectionId -> ConnectionInstance
    connections: Arc<RwLock<HashMap<String, ConnectionInstance>>>,
    app_handle: AppHandle,
}

impl SSHManager {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            sessions: Arc::new(RwLock::new(HashMap::new())),
            connections: Arc::new(RwLock::new(HashMap::new())),
            app_handle,
        }
    }

    // ============= Session配置管理 =============

    /// 创建新的会话配置（持久化）
    /// 如果提供了id，使用该id；否则生成新的UUID
    pub async fn create_session_with_id(&self, id: Option<String>, config: SessionConfig) -> Result<String> {
        let session_id = id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

        {
            let mut sessions = self.sessions.write().await;
            sessions.insert(session_id.clone(), config);
        }

        println!("Created persistent session config: {}", session_id);
        Ok(session_id)
    }

    /// 创建新的会话配置（持久化），生成新的ID
    pub async fn create_session(&self, config: SessionConfig) -> Result<String> {
        self.create_session_with_id(None, config).await
    }

    /// 创建临时连接（不保存到 sessions，直接创建 connection 实例）
    /// 用于快速连接功能
    pub async fn create_temporary_connection(&self, config: SessionConfig) -> Result<String> {
        let temp_session_id = uuid::Uuid::new_v4().to_string();
        let connection_id = uuid::Uuid::new_v4().to_string();

        // 创建连接实例
        let connection = ConnectionInstance::new(
            connection_id.clone(),
            temp_session_id,
            config.clone(),
        );

        {
            let mut connections = self.connections.write().await;
            connections.insert(connection_id.clone(), connection);
        }

        println!("Created temporary connection: {}", connection_id);
        Ok(connection_id)
    }

    /// 获取会话配置
    pub async fn get_session_config(&self, id: &str) -> Result<SessionConfig> {
        let sessions = self.sessions.read().await;
        sessions
            .get(id)
            .cloned()
            .ok_or_else(|| SSHError::SessionNotFound(id.to_string()))
    }

    /// 更新会话配置
    pub async fn update_session(&self, id: &str, updates: SessionConfigUpdate) -> Result<()> {
        let mut sessions = self.sessions.write().await;
        let session = sessions
            .get_mut(id)
            .ok_or_else(|| SSHError::SessionNotFound(id.to_string()))?;

        // 只更新提供的字段
        if let Some(name) = updates.name {
            session.name = name;
        }
        if let Some(host) = updates.host {
            session.host = host;
        }
        if let Some(port) = updates.port {
            session.port = port;
        }
        if let Some(username) = updates.username {
            session.username = username;
        }
        if let Some(group) = updates.group {
            session.group = group;
        }
        if let Some(auth_method) = updates.auth_method {
            session.auth_method = auth_method;
        }
        if let Some(terminal_type) = updates.terminal_type {
            session.terminal_type = Some(terminal_type);
        }
        if let Some(columns) = updates.columns {
            session.columns = Some(columns);
        }
        if let Some(rows) = updates.rows {
            session.rows = Some(rows);
        }
        if let Some(strict_host_key_checking) = updates.strict_host_key_checking {
            session.strict_host_key_checking = strict_host_key_checking;
        }
        if let Some(keep_alive_interval) = updates.keep_alive_interval {
            session.keep_alive_interval = keep_alive_interval;
        }

        println!("Updated session config: {} ({})", id, session.name);
        Ok(())
    }

    /// 删除会话配置及其所有连接
    pub async fn delete_session(&self, id: &str) -> Result<()> {
        println!("Deleting session/connection: {}", id);

        // 先尝试作为session配置ID删除
        let session_existed = {
            let mut sessions = self.sessions.write().await;
            sessions.remove(id).is_some()
        };

        if session_existed {
            // 是session配置，删除所有相关连接
            let connection_ids: Vec<String> = {
                let connections = self.connections.read().await;
                connections
                    .values()
                    .filter(|c| c.session_id == id)
                    .map(|c| c.id.clone())
                    .collect()
            };

            for conn_id in connection_ids {
                self.disconnect_connection(&conn_id).await?;
                let mut connections = self.connections.write().await;
                connections.remove(&conn_id);
                println!("Removed connection: {}", conn_id);
            }

            println!("Deleted session config: {}", id);
            Ok(())
        } else {
            // 不是session配置，尝试作为connection ID删除
            self.disconnect_connection(id).await?;
            let mut connections = self.connections.write().await;
            connections.remove(id)
                .ok_or_else(|| SSHError::SessionNotFound(id.to_string()))?;
            println!("Deleted connection: {}", id);
            Ok(())
        }
    }

    /// 获取所有会话配置
    pub async fn get_all_session_configs(&self) -> Vec<SessionConfig> {
        let sessions = self.sessions.read().await;
        sessions.values().cloned().collect()
    }

    /// 获取所有会话配置及其ID（用于持久化存储）
    pub async fn get_all_session_configs_with_ids(&self) -> Vec<(String, SessionConfig)> {
        let sessions = self.sessions.read().await;
        sessions
            .iter()
            .map(|(id, config)| (id.clone(), config.clone()))
            .collect()
    }

    /// 列出所有连接（用于前端显示）
    pub async fn list_connections(&self) -> Vec<ConnectionInfo> {
        let connections = self.connections.read().await;
        let mut infos = Vec::new();

        for connection in connections.values() {
            infos.push(connection.info().await);
        }

        infos
    }

    // ============= Connection实例管理 =============

    /// 基于session配置创建新的连接实例
    pub async fn create_connection(&self, session_id: &str) -> Result<String> {
        // 获取session配置
        let config = self.get_session_config(session_id).await?;

        // 创建新的connection实例
        let connection_id = uuid::Uuid::new_v4().to_string();
        let connection = ConnectionInstance::new(connection_id.clone(), session_id.to_string(), config.clone());

        {
            let mut connections = self.connections.write().await;
            connections.insert(connection_id.clone(), connection);
        }

        println!("Created connection instance: {} for session: {}", connection_id, session_id);
        Ok(connection_id)
    }

    /// 获取连接实例
    pub async fn get_connection(&self, id: &str) -> Result<ConnectionInstance> {
        let connections = self.connections.read().await;
        connections
            .get(id)
            .cloned()
            .ok_or_else(|| SSHError::SessionNotFound(id.to_string()))
    }

    /// 连接指定的连接实例
    pub async fn connect_connection(&self, connection_id: &str) -> Result<()> {
        let connection = self.get_connection(connection_id).await?;
        connection.set_status(SessionStatus::Connecting).await;

        println!("Starting SSH connection for: {}", connection_id);

        #[cfg(not(target_os = "android"))]
        {
            // 桌面平台：使用实际的 SSH 后端
            // 创建后端实例
            let mut backend = Box::new(DefaultBackend::new());

            // 建立连接
            backend.connect(&connection.config).await?;

            // 取出 reader
            let reader = backend.reader()
                .map_err(|e| SSHError::ConnectionFailed(format!("Failed to get backend reader: {}", e)))?;

            // 保存后端到连接
            {
                let mut backend_guard = connection.backend.lock().await;
                *backend_guard = Some(backend);
            }

            // 保存 reader 到连接
            {
                let mut reader_guard = connection.backend_reader.lock().await;
                *reader_guard = Some(reader);
            }
        }

        connection.set_status(SessionStatus::Connected).await;

        // 设置连接时间
        {
            let mut connected_at = connection.connected_at.lock().await;
            *connected_at = Some(chrono::Utc::now());
        }

        println!("Starting SSH reader for connection: {}", connection_id);

        // 启动读取器
        self.start_backend_reader(connection_id.to_string(), connection.clone());

        Ok(())
    }

    /// 断开连接实例
    pub async fn disconnect_connection(&self, id: &str) -> Result<()> {
        let connection = self.get_connection(id).await?;

        // 使用后端断开连接
        {
            let mut backend_guard = connection.backend.lock().await;
            if let Some(ref mut backend) = *backend_guard {
                backend.disconnect().await?;
            }
            *backend_guard = None;
        }

        // 清理 PTY 和子进程
        #[cfg(not(target_os = "android"))]
        {
            {
                let mut child_guard = connection.child.lock().await;
                if let Some(ref mut child) = *child_guard {
                    let _ = child.kill();
                }
                *child_guard = None;
            }
        }

        #[cfg(target_os = "android")]
        {
            // 移动端：清理占位符对象
            let mut child_guard = connection.child.lock().await;
            *child_guard = None;
        }

        {
            let mut pty_pair_guard = connection.pty_pair.lock().await;
            *pty_pair_guard = None;
        }

        connection.set_status(SessionStatus::Disconnected).await;

        // 清除连接时间
        let mut connected_at = connection.connected_at.lock().await;
        *connected_at = None;

        Ok(())
    }

    /// 写入数据到连接实例
    pub async fn write_to_connection(&self, id: &str, data: Vec<u8>) -> Result<()> {
        let connection = self.get_connection(id).await?;

        // 记录写入的详细信息
        let text = String::from_utf8_lossy(&data);
        let data_len = data.len();
        println!("[SSH Write] Writing {} bytes to connection: {}", data_len, id);
        println!("[SSH Write] Data content: {:?}", text);
        println!("[SSH Write] Data bytes (first 50): {:?}", &data[..data_len.min(50)]);

        // 使用后端的 write 方法
        let mut backend_guard = connection.backend.lock().await;
        if let Some(ref mut backend) = *backend_guard {
            backend.write(&data).await?;
        } else {
            return Err(SSHError::NotConnected);
        }

        println!("[SSH Write] Successfully wrote {} bytes to connection: {}", data_len, id);
        println!("---------------");

        Ok(())
    }

    /// 调整连接实例的PTY大小
    pub async fn resize_connection(&self, id: &str, rows: u16, cols: u16) -> Result<()> {
        let connection = self.get_connection(id).await?;

        // 使用后端的 resize 方法
        let mut backend_guard = connection.backend.lock().await;
        if let Some(ref mut backend) = *backend_guard {
            backend.resize(rows, cols).await?;
        } else {
            return Err(SSHError::NotConnected);
        }

        Ok(())
    }

    /// 启动后端读取器
    fn start_backend_reader(&self, connection_id: String, connection: ConnectionInstance) {
        let app_handle = self.app_handle.clone();

        println!("Starting backend reader task for connection: {}", connection_id);

        tokio::spawn(async move {
            // 检查 reader 是否可用
            let reader_lock = connection.backend_reader.lock().await;
            let has_reader = reader_lock.is_some();
            drop(reader_lock);

            if !has_reader {
                eprintln!("No backend reader available for connection: {}", connection_id);
                return;
            }

            println!("Backend reader acquired for connection: {}", connection_id);

            let mut buffer = [0u8; BUFFER_SIZE];
            let mut read_count = 0;

            loop {
                // 每次循环都重新获取 reader
                let mut reader_guard = connection.backend_reader.lock().await;
                let reader = match reader_guard.as_mut() {
                    Some(r) => r,
                    None => {
                        eprintln!("Backend reader disappeared for connection: {}", connection_id);
                        break;
                    }
                };

                use tokio::io::AsyncReadExt;

                match reader.read(&mut buffer).await {
                    Ok(n) if n > 0 => {
                        read_count += 1;
                        let data = buffer[..n].to_vec();
                        let text = String::from_utf8_lossy(&data);
                        
                        // 记录读取的详细信息（不打印 Raw bytes）
                        println!("[SSH Read] Read {} bytes from connection: {} (read #{})", n, connection_id, read_count);
                        println!("[SSH Read] Text content: {:?}", text);

                        // 释放锁后再发送事件
                        drop(reader_guard);

                        // 发送事件到前端（使用connectionId）
                        let event_name = format!("ssh-output-{}", connection_id);
                        if let Err(e) = app_handle.emit(&event_name, data) {
                            eprintln!("[SSH Read] Failed to emit event {}: {}", event_name, e);
                        } else {
                            println!("[SSH Read] Successfully emitted event: {} ({} bytes)", event_name, n);
                        }
                        println!("---------------");
                    }
                    Ok(_) => {
                        // EOF，连接关闭
                        println!("EOF received, stopping reader for connection: {}", connection_id);
                        break;
                    }
                    Err(e) => {
                        // 读取错误
                        eprintln!("Read error for connection {}: {}", connection_id, e);
                        break;
                    }
                }
            }

            println!("Backend reader task ended for connection: {}", connection_id);
        });
    }

    // ============= 兼容性方法（暂时保留以支持旧API）============

    /// 兼容旧API：list_sessions
    /// 返回所有配置和连接的合并列表
    /// - 配置项：id是配置ID，connection_session_id为null
    /// - 连接项：id是连接ID，connection_session_id指向配置ID
    pub async fn list_sessions(&self) -> Vec<SessionInfo> {
        let mut infos = Vec::new();

        // 1. 添加所有会话配置（始终显示配置）
        let sessions = self.sessions.read().await;
        for (session_id, config) in sessions.iter() {
            infos.push(SessionInfo {
                id: session_id.clone(),
                name: config.name.clone(),
                host: config.host.clone(),
                port: config.port,
                username: config.username.clone(),
                status: SessionStatus::Disconnected,
                connected_at: None,
                group: config.group.clone(),
                connection_session_id: None,  // 配置本身
                connection_id: None,  // 配置本身没有 connection_id
            });
        }

        // 2. 添加所有连接实例（已连接的）
        let connections = self.connections.read().await;
        for connection in connections.values() {
            infos.push(connection.session_info().await);
        }

        infos
    }

    /// 兼容旧API：connect_session
    /// 如果传入的是 session_id（会话配置ID），创建新连接并连接
    /// 如果传入的是 connection_id（连接实例ID），直接连接该连接
    pub async fn connect_session(&self, id: &str) -> Result<String> {
        // 先检查是否是已存在的连接实例
        {
            let connections = self.connections.read().await;
            if connections.contains_key(id) {
                // 是连接实例ID，直接连接
                drop(connections);
                self.connect_connection(id).await?;
                return Ok(id.to_string());
            }
        }

        // 不是连接实例，尝试作为会话配置ID处理
        // 创建新的连接实例
        let connection_id = self.create_connection(id).await?;
        // 连接它
        self.connect_connection(&connection_id).await?;
        Ok(connection_id)
    }

    /// 兼容旧API：get_session (实际获取连接)
    pub async fn get_session(&self, id: &str) -> Result<ConnectionInstance> {
        self.get_connection(id).await
    }

    /// 兼容旧API：disconnect_session
    pub async fn disconnect_session(&self, id: &str) -> Result<()> {
        self.disconnect_connection(id).await
    }

    /// 兼容旧API：write_to_session
    pub async fn write_to_session(&self, id: &str, data: Vec<u8>) -> Result<()> {
        self.write_to_connection(id, data).await
    }

    /// 兼容旧API：resize_session
    pub async fn resize_session(&self, id: &str, rows: u16, cols: u16) -> Result<()> {
        self.resize_connection(id, rows, cols).await
    }

    /// 打开 SFTP channel
    ///
    /// 在指定的连接上打开一个新的 SFTP 子系统 channel
    pub async fn open_sftp_channel(&self, connection_id: &str) -> Result<russh_sftp::client::SftpSession> {
        let connection = self.get_connection(connection_id).await?;

        // 获取 backend
        let backend_guard = connection.backend.lock().await;
        let _backend = backend_guard.as_ref()
            .ok_or_else(|| SSHError::NotConnected)?;

        // 尝试获取 RusshBackend 的 handle
        // 注意：这里我们需要访问 RusshBackend 的内部 handle
        // 由于我们使用的是 trait object，需要使用 downcasting

        // 为了简化，我们使用一个替代方案：
        // 直接创建一个新的 SFTP 连接，而不是复用现有连接
        // 这是一个临时解决方案

        tracing_error!("SFTP channel opening requires direct access to RusshBackend handle");
        Err(SSHError::NotSupported("SFTP requires architecture redesign".to_string()))

        // 完整实现需要：
        // 1. 在 ConnectionInstance 中保存 RusshBackend 的具体类型（而不是 trait object）
        // 2. 或者提供一个方法来通过 trait 获取 SFTP channel
        // 3. 使用 russh::client::Handle 打开 channel_open_session() 和 request_subsystem()
    }
}
