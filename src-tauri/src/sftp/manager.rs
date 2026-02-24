//! SFTP 管理器
//!
//! 管理多个 SFTP 会话，复用现有 SSH 连接

use crate::error::{Result, SSHError};
use crate::sftp::client::SftpClient;
use crate::ssh::manager::SSHManager;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{debug, info};

/// SFTP 管理器
///
/// 负责创建和管理 SFTP 客户端会话
/// 采用双客户端架构：
/// - 浏览客户端：用于快速浏览操作（list_dir, remove_file 等）
/// - 任务客户端：每个上传/下载任务使用独立的 SFTP Client
pub struct SftpManager {
    ssh_manager: Arc<SSHManager>,
    // 浏览专用客户端映射: connection_id -> Arc<Mutex<SftpClient>>
    // 用于所有快速浏览操作（list_dir, remove_file, rename 等）
    browse_clients: Arc<Mutex<HashMap<String, Arc<Mutex<SftpClient>>>>>,
    // 任务客户端映射: task_id -> Arc<Mutex<SftpClient>>
    // 每个上传/下载任务使用独立的 SFTP Client，实现完全并发
    task_clients: Arc<Mutex<HashMap<String, Arc<Mutex<SftpClient>>>>>,
    // 取消令牌映射: task_id -> CancellationToken
    cancellation_tokens: Arc<Mutex<HashMap<String, tokio_util::sync::CancellationToken>>>,
}

impl SftpManager {
    /// 创建新的 SFTP 管理器
    pub fn new(ssh_manager: Arc<SSHManager>) -> Self {
        info!("Creating SFTP manager with dual-client architecture");
        Self {
            ssh_manager,
            browse_clients: Arc::new(Mutex::new(HashMap::new())),
            task_clients: Arc::new(Mutex::new(HashMap::new())),
            cancellation_tokens: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// 列出目录（使用浏览客户端）
    pub async fn list_dir(&self, connection_id: &str, path: &str) -> Result<Vec<super::SftpFileInfo>> {
        info!("Listing directory: {}", path);

        // 获取或创建浏览专用客户端
        let client = self.get_or_create_browse_client(connection_id).await?;

        // 使用 SFTP 客户端列出目录
        let mut client_guard = client.lock().await;
        let files = client_guard.list_dir(path).await?;

        Ok(files)
    }

    /// 创建目录（使用浏览客户端）
    pub async fn create_dir(&self, connection_id: &str, path: &str, recursive: bool) -> Result<()> {
        let client = self.get_or_create_browse_client(connection_id).await?;
        let mut client_guard = client.lock().await;
        client_guard.create_dir(path, recursive).await
    }

    /// 删除文件（使用浏览客户端）
    pub async fn remove_file(&self, connection_id: &str, path: &str) -> Result<()> {
        let client = self.get_or_create_browse_client(connection_id).await?;
        let mut client_guard = client.lock().await;
        client_guard.remove_file(path).await
    }

    /// 删除目录（使用浏览客户端）
    pub async fn remove_dir(&self, connection_id: &str, path: &str, recursive: bool) -> Result<()> {
        let client = self.get_or_create_browse_client(connection_id).await?;
        let mut client_guard = client.lock().await;
        client_guard.remove_dir(path, recursive).await
    }

    /// 重命名（使用浏览客户端）
    pub async fn rename(&self, connection_id: &str, old_path: &str, new_path: &str) -> Result<()> {
        let client = self.get_or_create_browse_client(connection_id).await?;
        let mut client_guard = client.lock().await;
        client_guard.rename(old_path, new_path).await
    }

    /// 修改权限（使用浏览客户端）
    pub async fn chmod(&self, connection_id: &str, path: &str, mode: u32) -> Result<()> {
        let client = self.get_or_create_browse_client(connection_id).await?;
        let mut client_guard = client.lock().await;
        client_guard.chmod(path, mode).await
    }

    /// 读取文件（使用浏览客户端）
    pub async fn read_file(&self, connection_id: &str, path: &str) -> Result<Vec<u8>> {
        let client = self.get_or_create_browse_client(connection_id).await?;
        let mut client_guard = client.lock().await;
        client_guard.read_file(path).await
    }

    /// 写入文件（使用浏览客户端）
    pub async fn write_file(&self, connection_id: &str, path: &str, content: Vec<u8>) -> Result<()> {
        tracing::info!("=== Write File Start ===");
        tracing::info!("Connection ID: {}", connection_id);
        tracing::info!("Remote path: {}", path);
        tracing::info!("Content size: {} bytes", content.len());

        let client = self.get_or_create_browse_client(connection_id).await?;
        tracing::info!("Browse SFTP client obtained");

        let mut client_guard = client.lock().await;
        tracing::info!("Client lock acquired, calling write_file...");

        client_guard.write_file(path, &content).await
    }

    /// 获取或创建浏览专用 SFTP Client
    ///
    /// 用于快速浏览操作如 list_dir, get_file_info, remove_file 等
    /// 每个连接只创建一个浏览客户端并缓存
    async fn get_or_create_browse_client(&self, connection_id: &str) -> Result<Arc<Mutex<SftpClient>>> {
        // 检查缓存
        {
            let browse_clients = self.browse_clients.lock().await;
            if let Some(client) = browse_clients.get(connection_id) {
                debug!("Using cached browse SFTP client for connection: {}", connection_id);
                return Ok(client.clone());
            }
        }

        // 创建新的浏览客户端
        let client = self.create_sftp_client(connection_id).await?;

        // 缓存客户端（包装在 Arc<Mutex<>> 中）
        let client_arc = Arc::new(Mutex::new(client));
        {
            let mut browse_clients = self.browse_clients.lock().await;
            browse_clients.insert(connection_id.to_string(), client_arc.clone());
        }

        Ok(client_arc)
    }

    /// 为任务创建独立的 SFTP Client
    ///
    /// 每个上传/下载任务使用独立的 SFTP Channel，实现完全并发
    /// 基于同一个 SSH 连接打开新的 SFTP subsystem
    pub async fn create_task_client(&self, connection_id: &str, task_id: &str) -> Result<Arc<Mutex<SftpClient>>> {
        info!("Creating task SFTP client for task: {} on connection: {}", task_id, connection_id);

        // 创建新的 SFTP Client（基于同一个 SSH 连接）
        let client = self.create_sftp_client(connection_id).await?;
        let client_arc = Arc::new(Mutex::new(client));

        // 注册到任务映射
        let mut task_clients = self.task_clients.lock().await;
        task_clients.insert(task_id.to_string(), client_arc.clone());

        Ok(client_arc)
    }

    /// 清理任务 SFTP Client
    ///
    /// 在任务完成或失败后调用，释放资源
    pub async fn cleanup_task_client(&self, task_id: &str) {
        let mut task_clients = self.task_clients.lock().await;
        task_clients.remove(task_id);
        info!("Task SFTP client cleaned up for task: {}", task_id);
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

    // ============================================================================
    // 未来特性：高级 SFTP 客户端管理
    // 以下方法预留用于将来的高级 SFTP 会话管理功能
    // ============================================================================

    /// 从 RusshBackend 创建 SFTP 客户端
    ///
    /// 这是一个辅助方法，用于从 RusshBackend 直接创建 SFTP 客户端
    #[allow(dead_code)]
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

    /// 关闭 SFTP 会话（保持向后兼容，关闭浏览客户端）
    ///
    /// # 参数
    /// - `connection_id`: 连接 ID
    #[allow(dead_code)]
    pub async fn close_session(&self, connection_id: &str) -> Result<()> {
        self.close_browse_session(connection_id).await
    }

    /// 获取或创建取消令牌（基于 task_id）
    ///
    /// 返回该任务的取消令牌，如果不存在则创建新的
    pub async fn get_cancellation_token(&self, task_id: &str) -> tokio_util::sync::CancellationToken {
        let tokens = self.cancellation_tokens.lock().await;
        if let Some(token) = tokens.get(task_id) {
            token.clone()
        } else {
            // 需要先释放锁才能插入
            drop(tokens);
            let token = tokio_util::sync::CancellationToken::new();
            let mut tokens = self.cancellation_tokens.lock().await;
            tokens.insert(task_id.to_string(), token.clone());
            token
        }
    }

    /// 取消任务操作（上传或下载）
    ///
    /// # 参数
    /// - `task_id`: 任务 ID
    pub async fn cancel_task(&self, task_id: &str) -> Result<()> {
        info!("Cancelling task: {}", task_id);

        let tokens = self.cancellation_tokens.lock().await;
        if let Some(token) = tokens.get(task_id) {
            token.cancel();
            info!("Cancellation token triggered for task: {}", task_id);
            Ok(())
        } else {
            Err(SSHError::Io("没有正在进行的任务".to_string()))
        }
    }

    /// 清理取消令牌
    ///
    /// 在任务完成或取消后调用，清理相关的取消令牌
    pub async fn cleanup_cancellation_token(&self, task_id: &str) {
        let mut tokens = self.cancellation_tokens.lock().await;
        tokens.remove(task_id);
    }

    /// 关闭浏览专用 SFTP 会话
    ///
    /// # 参数
    /// - `connection_id`: 连接 ID
    #[allow(dead_code)]
    pub async fn close_browse_session(&self, connection_id: &str) -> Result<()> {
        debug!("Closing browse SFTP session for connection: {}", connection_id);

        let mut browse_clients = self.browse_clients.lock().await;
        if let Some(client) = browse_clients.remove(connection_id) {
            let _client_guard = client.lock().await;
            // 注意：close 会消耗 self，所以我们无法调用它
            // 这里我们只是从缓存中移除，让 SFTP session 自然关闭
            info!("Browse SFTP session removed from cache for connection: {}", connection_id);
        }

        Ok(())
    }

    /// 关闭所有 SFTP 会话（包括浏览客户端和任务客户端）
    #[allow(dead_code)]
    pub async fn close_all(&self) -> Result<()> {
        info!("Closing all SFTP sessions");

        let mut browse_clients = self.browse_clients.lock().await;
        let mut task_clients = self.task_clients.lock().await;
        let browse_count = browse_clients.len();
        let task_count = task_clients.len();
        browse_clients.clear();
        task_clients.clear();

        info!("All {} browse and {} task SFTP sessions removed from cache", browse_count, task_count);
        Ok(())
    }
}
