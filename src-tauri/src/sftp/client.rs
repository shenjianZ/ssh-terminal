//! SFTP 客户端封装
//!
//! 基于 russh_sftp::client::SftpSession 实现

use crate::error::{Result, SSHError};
use crate::sftp::{SftpFileInfo};
use russh_sftp::client::SftpSession;
use std::path::Path;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tracing::{debug, error, info, warn};

/// SFTP 客户端
///
/// 封装 russh_sftp::client::SftpSession，提供高级文件操作
pub struct SftpClient {
    session: SftpSession,
    connection_id: String,
}

impl SftpClient {
    /// 创建新的 SFTP 客户端（从已存在的 SftpSession）
    ///
    /// # 参数
    /// - `session`: 已创建的 SftpSession
    pub fn from_session(session: SftpSession) -> Self {
        Self {
            session,
            connection_id: "unknown".to_string(),
        }
    }

    /// 创建新的 SFTP 客户端
    ///
    /// # 参数
    /// - `stream`: 实现 AsyncRead + AsyncWrite 的数据流（通常是 SSH channel）
    /// - `connection_id`: 关联的连接 ID
    pub async fn new<S>(stream: S, connection_id: String) -> Result<Self>
    where
        S: AsyncReadExt + AsyncWriteExt + Unpin + Send + 'static,
    {
        info!("Creating SFTP client for connection: {}", connection_id);
        let session = SftpSession::new(stream)
            .await
            .map_err(|e| SSHError::Ssh(format!("Failed to create SFTP session: {}", e)))?;

        debug!("SFTP session created successfully");
        Ok(Self {
            session,
            connection_id,
        })
    }

    /// 列出目录内容
    ///
    /// # 参数
    /// - `path`: 目录路径
    ///
    /// # 返回
    /// 目录中的文件和子目录列表
    pub async fn list_dir(&mut self, path: &str) -> Result<Vec<SftpFileInfo>> {
        debug!("Listing directory: {}", path);

        let mut read_dir = self.session.read_dir(path).await
            .map_err(|e| SSHError::Ssh(format!("Failed to list directory '{}': {}", path, e)))?;

        let mut entries = Vec::new();

        // 使用 for 循环遍历目录（ReadDir 实现了 Iterator）
        loop {
            match read_dir.next() {
                Some(entry) => {
                    let metadata = entry.metadata();
                    let mut file_info: SftpFileInfo = metadata.into();

                    file_info.name = entry.file_name();
                    file_info.path = format!("{}/{}", path.trim_end_matches('/'), entry.file_name());

                    debug!("Found entry: {}", file_info.name);
                    entries.push(file_info);
                }
                None => {
                    // 迭代结束
                    break;
                }
            }
        }

        debug!("Listed {} entries in {}", entries.len(), path);
        Ok(entries)
    }

    /// 创建目录
    ///
    /// # 参数
    /// - `path`: 目录路径
    /// - `recursive`: 是否递归创建父目录
    pub async fn create_dir(&mut self, path: &str, recursive: bool) -> Result<()> {
        debug!("Creating directory: {} (recursive: {})", path, recursive);

        if recursive {
            // TODO: 实现递归创建
            // 需要逐级检查并创建父目录
        }

        self.session.create_dir(path).await
            .map_err(|e| SSHError::Ssh(format!("Failed to create directory '{}': {}", path, e)))?;

        debug!("Directory created: {}", path);
        Ok(())
    }

    /// 删除文件
    ///
    /// # 参数
    /// - `path`: 文件路径
    pub async fn remove_file(&mut self, path: &str) -> Result<()> {
        debug!("Removing file: {}", path);

        self.session.remove_file(path).await
            .map_err(|e| SSHError::Ssh(format!("Failed to remove file '{}': {}", path, e)))?;

        debug!("File removed: {}", path);
        Ok(())
    }

    /// 删除目录（内部递归实现）
    ///
    /// 使用 Box::pin 来支持异步递归
    fn remove_dir_recursive<'a>(
        &'a mut self,
        path: &'a str,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<()>> + Send + 'a>> {
        Box::pin(async move {
            debug!("Recursively removing directory: {}", path);

            // 列出目录内容
            let mut read_dir = match self.session.read_dir(path).await {
                Ok(rd) => rd,
                Err(e) => {
                    // 如果无法读取目录，可能目录不存在或无权限
                    let error_msg = format!("{:?}", e);
                    if error_msg.contains("No such file") {
                        // 目录不存在，视为已删除
                        debug!("Directory does not exist, considering as removed: {}", path);
                        return Ok(());
                    }
                    return Err(SSHError::Ssh(format!("Failed to list directory '{}': {}", path, e)));
                }
            };

            // 递归删除所有条目
            loop {
                match read_dir.next() {
                    Some(entry) => {
                        let file_name = entry.file_name();
                        let entry_path = if path.ends_with('/') {
                            format!("{}{}", path, file_name)
                        } else {
                            format!("{}/{}", path, file_name)
                        };

                        let metadata = entry.metadata();

                        // 判断是否是目录
                        if metadata.is_dir() {
                            // 递归删除子目录
                            debug!("Recursively removing subdirectory: {}", entry_path);
                            self.remove_dir_recursive(&entry_path).await?;
                        } else {
                            // 删除文件
                            debug!("Removing file in directory: {}", entry_path);
                            self.session.remove_file(&entry_path).await
                                .map_err(|e| SSHError::Ssh(format!("Failed to remove file '{}': {}", entry_path, e)))?;
                        }
                    }
                    None => {
                        // 迭代结束
                        break;
                    }
                }
            }

            // 删除目录本身
            self.session.remove_dir(path).await
                .map_err(|e| SSHError::Ssh(format!("Failed to remove directory '{}': {}", path, e)))?;

            debug!("Directory removed: {}", path);
            Ok(())
        })
    }

    /// 删除目录
    ///
    /// # 参数
    /// - `path`: 目录路径
    /// - `recursive`: 是否递归删除
    pub async fn remove_dir(&mut self, path: &str, recursive: bool) -> Result<()> {
        debug!("Removing directory: {} (recursive: {})", path, recursive);

        if recursive {
            // 使用递归删除
            self.remove_dir_recursive(path).await?;
        } else {
            // 非递归，直接删除
            self.session.remove_dir(path).await
                .map_err(|e| SSHError::Ssh(format!("Failed to remove directory '{}': {}", path, e)))?;
        }

        debug!("Directory removed: {}", path);
        Ok(())
    }

    /// 重命名文件或目录
    ///
    /// # 参数
    /// - `old_path`: 原路径
    /// - `new_path`: 新路径
    pub async fn rename(&mut self, old_path: &str, new_path: &str) -> Result<()> {
        debug!("Renaming: {} -> {}", old_path, new_path);

        self.session.rename(old_path, new_path).await
            .map_err(|e| SSHError::Ssh(format!("Failed to rename '{}' to '{}': {}", old_path, new_path, e)))?;

        debug!("Renamed successfully");
        Ok(())
    }

    /// 修改文件权限
    ///
    /// # 参数
    /// - `path`: 文件路径
    /// - `mode`: 权限模式（Unix 风格，如 0o755）
    pub async fn chmod(&mut self, path: &str, mode: u32) -> Result<()> {
        debug!("Changing permissions of {} to {:o}", path, mode);

        let mut metadata = self.session.metadata(path).await
            .map_err(|e| SSHError::Ssh(format!("Failed to get metadata for '{}': {}", path, e)))?;

        metadata.permissions = Some(mode);

        self.session.set_metadata(path, metadata).await
            .map_err(|e| SSHError::Ssh(format!("Failed to set permissions for '{}': {}", path, e)))?;

        debug!("Permissions changed successfully");
        Ok(())
    }

    /// 读取文件内容
    ///
    /// # 参数
    /// - `path`: 文件路径
    ///
    /// # 返回
    /// 文件内容的字节数组
    pub async fn read_file(&mut self, path: &str) -> Result<Vec<u8>> {
        debug!("Reading file: {}", path);

        let data = self.session.read(path).await
            .map_err(|e| SSHError::Ssh(format!("Failed to read file '{}': {}", path, e)))?;

        debug!("Read {} bytes from {}", data.len(), path);
        Ok(data)
    }

    /// 写入文件内容
    ///
    /// # 参数
    /// - `path`: 文件路径
    /// - `data`: 文件内容
    pub async fn write_file(&mut self, path: &str, data: &[u8]) -> Result<()> {
        info!("=== write_file (SFTP client) Start ===");
        info!("Target path: {}", path);
        info!("Data length: {} bytes", data.len());

        // 创建远程文件（如果不存在）或截断（如果存在）
        debug!("Creating/opening remote file: {}", path);
        let mut file = self.session.create(path).await
            .map_err(|e| {
                let error_msg = format!("{:?}", e);
                error!("session.create() failed: {}", error_msg);
                SSHError::Ssh(format!("Failed to create remote file '{}': {}", path, e))
            })?;

        debug!("File created, writing {} bytes...", data.len());
        file.write_all(data).await
            .map_err(|e| {
                let error_msg = format!("{:?}", e);
                error!("write_all() failed: {}", error_msg);
                SSHError::Ssh(format!("Failed to write to remote file '{}': {}", path, e))
            })?;

        debug!("Syncing file to server...");
        file.sync_all().await
            .map_err(|e| {
                error!("sync_all() failed: {}", e);
                SSHError::Ssh(format!("Failed to sync remote file '{}': {}", path, e))
            })?;

        debug!("File written successfully");
        info!("write_file completed successfully");
        Ok(())
    }

    /// 下载文件（带进度回调）
    ///
    /// # 参数
    /// - `remote_path`: 远程文件路径
    /// - `local_path`: 本地保存路径
    /// - `progress_callback`: 进度回调函数 (transferred, total)
    pub async fn download_file<F>(
        &mut self,
        remote_path: &str,
        local_path: &Path,
        progress_callback: F,
    ) -> Result<()>
    where
        F: Fn(u64, u64), // (transferred, total)
    {
        info!("Downloading {} to {:?}", remote_path, local_path);

        // 打开远程文件
        let mut remote_file = self.session.open(remote_path).await
            .map_err(|e| SSHError::Ssh(format!("Failed to open remote file '{}': {}", remote_path, e)))?;

        // 获取文件大小
        let metadata = remote_file.metadata().await
            .map_err(|e| SSHError::Ssh(format!("Failed to get file metadata: {}", e)))?;
        let file_size = metadata.size.unwrap_or(0);

        // 创建本地文件
        let mut local_file = tokio::fs::File::create(local_path).await
            .map_err(|e| SSHError::Io(format!("Failed to create local file: {}", e)))?;

        // 分块读取和写入
        let mut buffer = vec![0u8; 64 * 1024]; // 64KB buffer
        let mut transferred = 0u64;

        loop {
            let n = remote_file.read(&mut buffer).await
                .map_err(|e| SSHError::Ssh(format!("Failed to read from remote file: {}", e)))?;

            if n == 0 {
                break; // EOF
            }

            local_file.write_all(&buffer[..n]).await
                .map_err(|e| SSHError::Io(format!("Failed to write to local file: {}", e)))?;

            transferred += n as u64;
            progress_callback(transferred, file_size);
        }

        // 确保数据写入磁盘
        local_file.flush().await
            .map_err(|e| SSHError::Io(format!("Failed to flush file: {}", e)))?;

        info!("Download completed: {} bytes", transferred);
        Ok(())
    }

    /// 上传文件（带进度回调）
    ///
    /// # 参数
    /// - `local_path`: 本地文件路径
    /// - `remote_path`: 远程保存路径
    /// - `progress_callback`: 进度回调函数 (transferred, total)
    pub async fn upload_file<F>(
        &mut self,
        local_path: &Path,
        remote_path: &str,
        progress_callback: F,
    ) -> Result<()>
    where
        F: Fn(u64, u64), // (transferred, total)
    {
        info!("Uploading {:?} to {}", local_path, remote_path);

        // 打开本地文件
        let mut local_file = tokio::fs::File::open(local_path).await
            .map_err(|e| SSHError::Io(format!("Failed to open local file: {}", e)))?;

        // 获取文件大小
        let file_size = local_file.metadata().await
            .map_err(|e| SSHError::Io(format!("Failed to get file metadata: {}", e)))?
            .len();

        // 确保父目录存在（递归创建）
        if let Some(parent_dir) = Path::new(remote_path).parent() {
            let parent_str = parent_dir.to_str().unwrap();
            // 如果父目录不是根目录
            if !parent_str.is_empty() && parent_str != "/" {
                info!("Ensuring parent directory exists: {}", parent_str);
                self.ensure_dir_exists(parent_str).await?;
            }
        }

        // 创建远程文件
        // 使用 create 方法，它会创建新文件或截断已存在的文件
        info!("Creating remote file: {}", remote_path);

        let mut remote_file = self.session.create(remote_path).await
            .map_err(|e| {
                let error_msg = format!("{:?}", e);
                error!("Failed to create file '{}': {}", remote_path, error_msg);
                SSHError::Ssh(format!("Failed to create remote file '{}': {}", remote_path, e))
            })?;

        info!("File opened for writing");

        // 分块读取和写入
        let mut buffer = vec![0u8; 64 * 1024]; // 64KB buffer
        let mut transferred = 0u64;

        loop {
            let n = local_file.read(&mut buffer).await
                .map_err(|e| SSHError::Io(format!("Failed to read from local file: {}", e)))?;

            if n == 0 {
                break; // EOF
            }

            remote_file.write_all(&buffer[..n]).await
                .map_err(|e| SSHError::Ssh(format!("Failed to write to remote file: {}", e)))?;

            transferred += n as u64;
            progress_callback(transferred, file_size);
        }

        // 确保数据刷新到服务器
        remote_file.sync_all().await
            .map_err(|e| SSHError::Ssh(format!("Failed to sync remote file: {}", e)))?;

        info!("Upload completed: {} bytes", transferred);
        Ok(())
    }

    /// 确保目录存在（递归创建）
    ///
    /// 如果目录不存在，递归创建父目录，然后创建目标目录
    fn ensure_dir_exists<'a>(&'a mut self, path: &'a str) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<()>> + Send + 'a>> {
        Box::pin(async move {
            // 尝试创建目录
            match self.session.create_dir(path).await {
                Ok(_) => {
                    info!("Directory created or already exists: {}", path);
                    Ok(())
                }
                Err(e) => {
                    let error_msg = format!("{:?}", e);

                    // 如果是"已存在"错误，那不是问题
                    if error_msg.contains("exists") || error_msg.contains("already exists") {
                        info!("Directory already exists: {}", path);
                        return Ok(());
                    }

                    // 如果是"父目录不存在"错误，递归创建父目录
                    if error_msg.contains("No such file") {
                        if let Some(parent) = Path::new(path).parent() {
                            let parent_str = parent.to_str().unwrap();
                            // 递归创建父目录（但不是根目录）
                            if !parent_str.is_empty() && parent_str != "/" {
                                info!("Creating parent directory: {}", parent_str);
                                self.ensure_dir_exists(parent_str).await?;

                                // 再次尝试创建目标目录
                                self.session.create_dir(path).await
                                    .map_err(|e| SSHError::Ssh(format!("Failed to create directory '{}': {}", path, e)))?;
                                return Ok(());
                            }
                        }
                    }

                    // 其他错误
                    Err(SSHError::Ssh(format!("Failed to create directory '{}': {}", path, e)))
                }
            }
        })
    }

    /// 关闭 SFTP 会话
    pub async fn close(self) -> Result<()> {
        debug!("Closing SFTP session for connection: {}", self.connection_id);
        self.session.close().await
            .map_err(|e| SSHError::Ssh(format!("Failed to close SFTP session: {}", e)))?;
        Ok(())
    }
}
