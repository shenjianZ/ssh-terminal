//! SFTP 管理器
//!
//! 管理多个 SFTP 会话，复用现有 SSH 连接

use crate::error::{Result, SSHError};
use crate::sftp::client::SftpClient;
use crate::ssh::manager::SSHManager;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{debug, error, info, warn};

/// SFTP 管理器
///
/// 负责创建和管理 SFTP 客户端会话
pub struct SftpManager {
    ssh_manager: Arc<SSHManager>,
    // SFTP 会话缓存: connection_id -> Arc<Mutex<SftpClient>>
    // 使用 Arc<Mutex<>> 允许在多个地方共享同一个客户端
    sessions: Arc<Mutex<HashMap<String, Arc<Mutex<SftpClient>>>>>,
}

impl SftpManager {
    /// 创建新的 SFTP 管理器
    pub fn new(ssh_manager: Arc<SSHManager>) -> Self {
        info!("Creating SFTP manager");
        Self {
            ssh_manager,
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// 列出目录
    pub async fn list_dir(&self, connection_id: &str, path: &str) -> Result<Vec<super::SftpFileInfo>> {
        info!("Listing directory: {}", path);

        // 获取或创建 SFTP 客户端
        let client = self.get_or_create_client(connection_id).await?;

        // 使用 SFTP 客户端列出目录
        let mut client_guard = client.lock().await;
        let files = client_guard.list_dir(path).await?;

        Ok(files)
    }

    /// 创建目录
    pub async fn create_dir(&self, connection_id: &str, path: &str, recursive: bool) -> Result<()> {
        let client = self.get_or_create_client(connection_id).await?;
        let mut client_guard = client.lock().await;
        client_guard.create_dir(path, recursive).await
    }

    /// 删除文件
    pub async fn remove_file(&self, connection_id: &str, path: &str) -> Result<()> {
        let client = self.get_or_create_client(connection_id).await?;
        let mut client_guard = client.lock().await;
        client_guard.remove_file(path).await
    }

    /// 删除目录
    pub async fn remove_dir(&self, connection_id: &str, path: &str, recursive: bool) -> Result<()> {
        let client = self.get_or_create_client(connection_id).await?;
        let mut client_guard = client.lock().await;
        client_guard.remove_dir(path, recursive).await
    }

    /// 重命名
    pub async fn rename(&self, connection_id: &str, old_path: &str, new_path: &str) -> Result<()> {
        let client = self.get_or_create_client(connection_id).await?;
        let mut client_guard = client.lock().await;
        client_guard.rename(old_path, new_path).await
    }

    /// 修改权限
    pub async fn chmod(&self, connection_id: &str, path: &str, mode: u32) -> Result<()> {
        let client = self.get_or_create_client(connection_id).await?;
        let mut client_guard = client.lock().await;
        client_guard.chmod(path, mode).await
    }

    /// 读取文件
    pub async fn read_file(&self, connection_id: &str, path: &str) -> Result<Vec<u8>> {
        let client = self.get_or_create_client(connection_id).await?;
        let mut client_guard = client.lock().await;
        client_guard.read_file(path).await
    }

    /// 写入文件
    pub async fn write_file(&self, connection_id: &str, path: &str, content: Vec<u8>) -> Result<()> {
        tracing::info!("=== Write File Start ===");
        tracing::info!("Connection ID: {}", connection_id);
        tracing::info!("Remote path: {}", path);
        tracing::info!("Content size: {} bytes", content.len());

        let client = self.get_or_create_client(connection_id).await?;
        tracing::info!("SFTP client obtained");

        let mut client_guard = client.lock().await;
        tracing::info!("Client lock acquired, calling write_file...");

        client_guard.write_file(path, &content).await
    }

    /// 获取或创建 SFTP 客户端
    ///
    /// 如果已存在则返回缓存的客户端，否则创建新的
    async fn get_or_create_client(&self, connection_id: &str) -> Result<Arc<Mutex<SftpClient>>> {
        // 检查缓存
        {
            let sessions = self.sessions.lock().await;
            if let Some(client) = sessions.get(connection_id) {
                debug!("Using cached SFTP client for connection: {}", connection_id);
                return Ok(client.clone());
            }
        }

        // 创建新的客户端
        let client = self.create_sftp_client(connection_id).await?;

        // 缓存客户端（包装在 Arc<Mutex<>> 中）
        let client_arc = Arc::new(Mutex::new(client));
        {
            let mut sessions = self.sessions.lock().await;
            sessions.insert(connection_id.to_string(), client_arc.clone());
        }

        Ok(client_arc)
    }

    /// 创建 SFTP 客户端
    ///
    /// 通过打开 SSH 连接上的 SFTP 子系统来创建
    async fn create_sftp_client(&self, connection_id: &str) -> Result<SftpClient> {
        info!("Creating SFTP client for connection: {}", connection_id);

        // 从 SSHManager 获取连接
        let connection = self.ssh_manager.get_connection(connection_id).await?;

        // 使用 ConnectionInstance 的 create_sftp_client 方法
        connection.create_sftp_client().await
    }

    /// 从 RusshBackend 创建 SFTP 客户端
    ///
    /// 这是一个辅助方法，用于从 RusshBackend 直接创建 SFTP 客户端
    pub async fn create_client_from_russh(
        &self,
        handle: &russh::client::Handle<crate::ssh::backends::russh::RusshHandler>,
        connection_id: &str,
    ) -> Result<SftpClient> {
        info!("Creating SFTP client from russh handle for connection: {}", connection_id);

        // 使用 SftpChannelStream 打开 channel
        use crate::ssh::backends::sftp_channel::SftpChannelStream;
        let stream = SftpChannelStream::open(handle).await?;

        // 直接使用 SftpChannelStream 创建 SFTP session
        // SftpChannelStream 实现了 AsyncRead + AsyncWrite + Unpin + Send + 'static
        let session = russh_sftp::client::SftpSession::new(stream)
            .await
            .map_err(|e| SSHError::Ssh(format!("Failed to create SFTP session: {}", e)))?;

        info!("SFTP session created successfully for connection: {}", connection_id);

        Ok(SftpClient::from_session(session))
    }

    /// 关闭 SFTP 会话
    ///
    /// # 参数
    /// - `connection_id`: 连接 ID
    pub async fn close_session(&self, connection_id: &str) -> Result<()> {
        debug!("Closing SFTP session for connection: {}", connection_id);

        let mut sessions = self.sessions.lock().await;
        if let Some(client) = sessions.remove(connection_id) {
            let _client_guard = client.lock().await;
            // 注意：close 会消耗 self，所以我们无法调用它
            // 这里我们只是从缓存中移除，让 SFTP session 自然关闭
            // 如果需要显式关闭，需要改变 SftpClient 的设计
            info!("SFTP session removed from cache for connection: {}", connection_id);
        }

        Ok(())
    }

    /// 关闭所有 SFTP 会话
    pub async fn close_all(&self) -> Result<()> {
        info!("Closing all SFTP sessions");

        let mut sessions = self.sessions.lock().await;
        let count = sessions.len();
        sessions.clear();

        info!("All {} SFTP sessions removed from cache", count);
        Ok(())
    }
}
