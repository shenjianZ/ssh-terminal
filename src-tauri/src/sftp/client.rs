//! SFTP 客户端封装
//!
//! 基于 russh_sftp::client::SftpSession 实现

use crate::error::{Result, SSHError};
use crate::sftp::{SftpFileInfo};
use russh_sftp::client::SftpSession;
use std::path::Path;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tracing::{debug, error, info, warn};

// 需要导入 Tauri 的 Event trait 来使用 emit 方法
use tauri::Emitter;

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
    #[allow(dead_code)]
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
            // 递归创建父目录（使用 ensure_dir_exists 避免递归问题）
            if let Some(parent) = Path::new(path).parent() {
                let parent_str = parent.to_str()
                    .ok_or_else(|| SSHError::Io("路径包含无效字符".to_string()))?;
                
                if !parent_str.is_empty() && parent_str != "/" {
                    // 使用 ensure_dir_exists 递归创建父目录
                    self.ensure_dir_exists(parent_str).await?;
                }
            }
        }

        // 尝试创建目录
        match self.session.create_dir(path).await {
            Ok(_) => {
                debug!("Directory created: {}", path);
                Ok(())
            }
            Err(e) => {
                let error_msg = format!("{:?}", e);
                // 如果目录已存在，不是错误
                if error_msg.contains("exists") || error_msg.contains("already exists") {
                    debug!("Directory already exists: {}", path);
                    Ok(())
                } else {
                    Err(SSHError::Ssh(format!("Failed to create directory '{}': {}", path, e)))
                }
            }
        }
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

    // ============================================================================
    // 未来特性：带进度回调的文件传输
    // 以下方法预留用于将来的带进度回调的文件上传/下载功能
    // ============================================================================

    /// 下载文件（带进度回调）
    ///
    /// # 参数
    /// - `remote_path`: 远程文件路径
    /// - `local_path`: 本地保存路径
    /// - `progress_callback`: 进度回调函数 (transferred, total)
    #[allow(dead_code)]
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
    #[allow(dead_code)]
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
            .map_err(|e| SSHError::Io(format!("无法打开本地文件 '{:?}': {}", local_path, e)))?;

        // 获取文件大小
        let file_size = local_file.metadata().await
            .map_err(|e| SSHError::Io(format!("无法获取文件 '{:?}' 的元数据: {}", local_path, e)))?
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
    #[allow(dead_code)]
    fn ensure_dir_exists<'a>(&'a mut self, path: &'a str) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<()>> + Send + 'a>> {
        Box::pin(async move {
            info!("ensure_dir_exists called with path: '{}'", path);

            // 尝试创建目录
            match self.session.create_dir(path).await {
                Ok(_) => {
                    info!("Directory created: {}", path);
                    Ok(())
                }
                Err(e) => {
                    let error_msg = format!("{:?}", e);
                    info!("create_dir failed with error: {}", error_msg);

                    // russh-sftp 在目录已存在时返回 "Failure" 错误
                    // 我们需要先检查目录是否已存在
                    match self.session.metadata(path).await {
                        Ok(metadata) => {
                            if metadata.is_dir() {
                                info!("Directory already exists: {}", path);
                                return Ok(());
                            } else {
                                // 路径存在但不是目录
                                return Err(SSHError::Io(format!("路径 '{}' 已存在但不是目录", path)));
                            }
                        }
                        Err(_) => {
                            // 获取元数据失败，说明目录不存在，需要创建
                        }
                    }

                    // 检查是否是"父目录不存在"错误
                    if error_msg.contains("No such file") {
                        if let Some(parent) = Path::new(path).parent() {
                            let parent_str = parent.to_str().ok_or_else(|| SSHError::Io("路径包含无效字符".to_string()))?;
                            info!("Parent directory parsed: '{}'", parent_str);
                            // 递归创建父目录（但不是根目录）
                            if !parent_str.is_empty() && parent_str != "/" {
                                info!("Creating parent directory: {}", parent_str);
                                self.ensure_dir_exists(parent_str).await?;

                                // 再次尝试创建目标目录
                                self.session.create_dir(path).await
                                    .map_err(|e| SSHError::Ssh(format!("无法创建目录 '{}': {}", path, e)))?;
                                return Ok(());
                            } else {
                                // 如果父目录为空或根目录，说明路径可能有问题
                                info!("Parent directory is empty or root, path might be invalid: {}", path);
                            }
                        }
                    }

                    // 其他错误（包括 "Failure" 但目录不存在的情况）
                    Err(SSHError::Ssh(format!("无法创建目录 '{}': {}", path, e)))
                }
            }
        })
    }

    /// 关闭 SFTP 会话
    #[allow(dead_code)]
    pub async fn close(self) -> Result<()> {
        debug!("Closing SFTP session for connection: {}", self.connection_id);
        self.session.close().await
            .map_err(|e| SSHError::Ssh(format!("Failed to close SFTP session: {}", e)))?;
        Ok(())
    }

    /// 流式上传文件（避免一次性读取整个文件到内存）
    ///
    /// # 参数
    /// - `local_path`: 本地文件路径
    /// - `remote_path`: 远程保存路径
    /// - `cancellation_token`: 取消令牌
    /// - `progress_callback`: 进度回调函数 (transferred, total)
    /// - `skip_dir_check`: 是否跳过目录检查（批量上传时使用，提高性能）
    pub async fn upload_file_stream<F>(
        &mut self,
        local_path: &str,
        remote_path: &str,
        cancellation_token: &tokio_util::sync::CancellationToken,
        progress_callback: F,
        skip_dir_check: bool,
    ) -> Result<u64>
    where
        F: Fn(u64, u64), // (transferred, total)
    {
        info!("Streaming upload: {} -> {}", local_path, remote_path);

        // 打开本地文件
        let mut local_file = tokio::fs::File::open(local_path).await
            .map_err(|e| SSHError::Io(format!("无法打开本地文件 '{}': {}", local_path, e)))?;

        // 获取文件大小
        let file_size = local_file.metadata().await
            .map_err(|e| SSHError::Io(format!("无法获取文件 '{}' 的元数据: {}", local_path, e)))?
            .len();

        // 确保父目录存在（除非跳过检查）
        if !skip_dir_check {
            let parent_dir = Path::new(remote_path).parent();
            info!("Remote path: '{}', parent: {:?}", remote_path, parent_dir);

            if let Some(parent_dir) = parent_dir {
                let parent_str = parent_dir.to_str()
                    .ok_or_else(|| SSHError::Io("路径包含无效字符".to_string()))?;
                info!("Parent directory string: '{}'", parent_str);
                if !parent_str.is_empty() && parent_str != "/" {
                    self.ensure_dir_exists(parent_str).await?;
                }
            } else {
                info!("No parent directory found for path: {}", remote_path);
            }
        }

        // 创建远程文件
        let mut remote_file = self.session.create(remote_path).await
            .map_err(|e| SSHError::Ssh(format!("无法创建远程文件 '{}': {}", remote_path, e)))?;

        // 分块读取和写入（64KB buffer）
        let mut buffer = vec![0u8; 64 * 1024];
        let mut transferred = 0u64;

        loop {
            // 检查是否被取消
            if cancellation_token.is_cancelled() {
                info!("Upload cancelled during file transfer: {}", local_path);
                return Err(SSHError::Io("上传已取消".to_string()));
            }

            let n = local_file.read(&mut buffer).await
                .map_err(|e| SSHError::Io(format!("无法从本地文件 '{}' 读取数据: {}", local_path, e)))?;

            if n == 0 {
                break; // EOF
            }

            // 再次检查是否被取消（在写入前）
            if cancellation_token.is_cancelled() {
                info!("Upload cancelled during file transfer: {}", local_path);
                return Err(SSHError::Io("上传已取消".to_string()));
            }

            remote_file.write_all(&buffer[..n]).await
                .map_err(|e| SSHError::Ssh(format!("无法写入远程文件 '{}': {}", remote_path, e)))?;

            transferred += n as u64;
            progress_callback(transferred, file_size);
        }

        // 确保数据刷新到服务器
        remote_file.sync_all().await
            .map_err(|e| SSHError::Ssh(format!("无法刷新远程文件 '{}' 到服务器: {}", remote_path, e)))?;

        info!("Stream upload completed: {} bytes", transferred);
        Ok(transferred)
    }

    /// 递归上传目录及其所有内容
    ///
    /// # 参数
    /// - `local_dir`: 本地目录路径
    /// - `remote_dir`: 远程目录路径
    /// - `window`: Tauri 窗口实例（用于发送进度事件）
    /// - `connection_id`: 连接 ID
    /// - `task_id`: 上传任务的唯一 ID
    /// - `cancellation_token`: 取消令牌
    ///
    /// # 返回
    /// 上传结果统计
    pub fn upload_directory_recursive<'a>(
        &'a mut self,
        local_dir: &'a str,
        remote_dir: &'a str,
        window: &'a tauri::Window,
        connection_id: &'a str,
        task_id: &'a str,
        cancellation_token: &'a tokio_util::sync::CancellationToken,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<crate::sftp::UploadDirectoryResult>> + Send + 'a>> {
        Box::pin(async move {
            use crate::sftp::{UploadDirectoryResult, UploadProgressEvent};
            use std::time::Instant;

            info!("=== Recursive Directory Upload Start ===");
            info!("Local: {}, Remote: {}", local_dir, remote_dir);

            let start_time = Instant::now();
            let mut total_files: u64 = 0;
            let mut total_dirs: u64 = 0;
            let mut total_size: u64 = 0;
            let mut files_completed: u64 = 0;
            let mut total_bytes_transferred: u64 = 0; // 修复：累计所有已传输字节数

            // 第一步：统计总文件数和总大小
            info!("Phase 1: Scanning directory structure...");
            let mut dir_queue = vec![(local_dir.to_string(), remote_dir.to_string())];
            let mut all_files: Vec<(String, String, u64)> = Vec::new(); // (local_path, remote_path, size)

            while let Some((local_path, remote_path)) = dir_queue.pop() {
                let mut entries = tokio::fs::read_dir(&local_path).await
                    .map_err(|e| SSHError::Io(format!("无法读取本地目录 '{}': {}", local_path, e)))?;

                while let Some(entry) = entries.next_entry().await
                    .map_err(|e| SSHError::Io(format!("读取目录条目失败: {}", e)))? {

                    let entry_path = entry.path();
                    let entry_name = entry.file_name().to_string_lossy().to_string();
                    let entry_type = entry.file_type().await
                        .map_err(|e| SSHError::Io(format!("无法获取文件类型: {}", e)))?;

                    if entry_type.is_dir() {
                        let new_local = format!("{}/{}", local_path, entry_name);
                        let new_remote = format!("{}/{}", remote_path, entry_name);
                        dir_queue.push((new_local, new_remote));
                        total_dirs += 1;
                    } else if entry_type.is_file() {
                        let metadata = entry.metadata().await
                            .map_err(|e| SSHError::Io(format!("无法获取文件元数据: {}", e)))?;
                        let file_size = metadata.len();

                        let remote_file_path = format!("{}/{}", remote_path, entry_name);
                        all_files.push((entry_path.to_string_lossy().to_string(), remote_file_path, file_size));

                        total_files += 1;
                        total_size += file_size;
                    } else if entry_type.is_symlink() {
                        // 符号链接：跳过并记录日志
                        info!("Skipping symbolic link: {} (符号链接上传暂不支持)", entry_path.display());
                    }
                }
            }

            info!("Scan complete: {} files, {} directories, total size: {} bytes", total_files, total_dirs, total_size);

            // 确保远程根目录存在
            self.ensure_dir_exists(remote_dir).await?;

            // Phase 1.5: 批量创建所有需要的目录
            info!("Phase 1.5: Creating directory structure...");
            let mut unique_dirs: std::collections::HashSet<String> = std::collections::HashSet::new();
            for (_, remote_file_path, _) in &all_files {
                if let Some(parent) = Path::new(remote_file_path).parent() {
                    if let Some(parent_str) = parent.to_str() {
                        if !parent_str.is_empty() && parent_str != "/" {
                            unique_dirs.insert(parent_str.to_string());
                        }
                    }
                }
            }

            // 按深度排序，先创建父目录再创建子目录
            let mut sorted_dirs: Vec<String> = unique_dirs.into_iter().collect();
            sorted_dirs.sort_by_key(|d| d.matches('/').count());

            // 批量创建目录
            for dir in &sorted_dirs {
                if let Err(e) = self.ensure_dir_exists(dir).await {
                    warn!("Failed to create directory '{}': {}", dir, e);
                }
            }
            info!("Directory structure created: {} directories", sorted_dirs.len());

            // 第二步：实际上传文件
            info!("Phase 2: Uploading files...");
            for (local_file_path, remote_file_path, _file_size) in all_files {
                // 检查是否被取消
                if cancellation_token.is_cancelled() {
                    info!("Upload cancelled for connection: {}", connection_id);
                    return Err(SSHError::Io("上传已取消".to_string()));
                }

                // 流式上传文件（跳过目录检查，已在 Phase 1.5 创建）
                let file_transferred = self.upload_file_stream(
                    &local_file_path,
                    &remote_file_path,
                    cancellation_token,
                    |_transferred, _total| {
                        // 文件内进度暂不发送，只发送文件级进度
                    },
                    true, // skip_dir_check: true
                ).await?;

                files_completed += 1;
                total_bytes_transferred += file_transferred; // 修复：累计字节数

                // 计算传输速度（基于总传输时间）
                let elapsed_ms = start_time.elapsed().as_millis() as u64;
                let speed_bytes_per_sec = if elapsed_ms > 0 {
                    (total_bytes_transferred * 1000) / elapsed_ms
                } else {
                    0
                };

                // 发送进度事件
                let progress_event = UploadProgressEvent {
                    task_id: task_id.to_string(),
                    connection_id: connection_id.to_string(),
                    current_file: local_file_path.clone(),
                    current_dir: Path::new(&local_file_path)
                        .parent()
                        .and_then(|p| p.to_str())
                        .unwrap_or("")
                        .to_string(),
                    files_completed,
                    total_files,
                    bytes_transferred: total_bytes_transferred, // 修复：使用累计字节数
                    total_bytes: total_size,
                    speed_bytes_per_sec,
                };

                if let Err(e) = window.emit("sftp-upload-progress", &progress_event) {
                    tracing::warn!("Failed to emit upload progress: {}", e);
                }

                info!("Uploaded {}/{} files: {} ({} bytes, {} KB/s)",
                    files_completed, total_files,
                    local_file_path,
                    file_transferred,
                    speed_bytes_per_sec / 1024
                );
            }

            let elapsed_time = start_time.elapsed().as_millis() as u64;

            info!("=== Directory Upload Complete ===");
            info!("Files: {}, Directories: {}, Total size: {} bytes", total_files, total_dirs, total_size);
            info!("Elapsed time: {} ms", elapsed_time);

            Ok(UploadDirectoryResult {
                total_files,
                total_dirs,
                total_size,
                elapsed_time_ms: elapsed_time,
            })
        })
    }

    /// 递归下载目录
    ///
    /// 分两个阶段执行：
    /// 1. 扫描远程目录结构，收集所有文件和目录
    /// 2. 逐个下载文件，同时创建本地目录结构
    ///
    /// # 参数
    /// - `remote_dir_path`: 远程目录路径
    /// - `local_dir_path`: 本地保存路径
    /// - `window`: Tauri 窗口实例（用于发送进度事件）
    /// - `connection_id`: SSH 连接 ID
    /// - `task_id`: 下载任务的唯一 ID
    /// - `cancellation_token`: 取消令牌
    ///
    /// # 返回
    /// 下载结果统计信息
    pub async fn download_directory_recursive<F>(
        &mut self,
        remote_dir_path: &str,
        local_dir_path: &str,
        window: &tauri::Window,
        connection_id: &str,
        task_id: &str,
        cancellation_token: &tokio_util::sync::CancellationToken,
        _progress_callback: F,
    ) -> Result<crate::sftp::DownloadDirectoryResult>
    where
        F: Fn(u64, u64),
    {
        let start_time = std::time::Instant::now();
        info!("=== Directory Download Start ===");
        info!("Remote: {}, Local: {}", remote_dir_path, local_dir_path);
        info!("Task ID: {}, Connection: {}", task_id, connection_id);

        // 🔥 阶段 1: 扫描远程目录结构
        let mut dir_queue = vec![(remote_dir_path.to_string(), local_dir_path.to_string())];
        let mut all_files: Vec<(String, String, u64)> = Vec::new();
        let mut total_files = 0u64;
        let mut total_dirs = 0u64;
        let mut total_size = 0u64;

        while let Some((remote_path, local_path)) = dir_queue.pop() {
            if cancellation_token.is_cancelled() {
                return Err(SSHError::Io("下载已取消".to_string()));
            }

            // 列出远程目录
            let entries = self.list_dir(&remote_path).await?;

            // 创建本地目录
            tokio::fs::create_dir_all(&local_path).await
                .map_err(|e| SSHError::Io(format!("创建本地目录失败: {}", e)))?;

            for entry in entries {
                let entry_name = entry.name;
                let entry_remote_path = if remote_path.ends_with('/') {
                    format!("{}{}", remote_path, entry_name)
                } else {
                    format!("{}/{}", remote_path, entry_name)
                };
                let entry_local_path = if local_path.ends_with('/') || local_path.ends_with('\\') {
                    format!("{}{}", local_path, entry_name)
                } else {
                    format!("{}{}{}", local_path, std::path::MAIN_SEPARATOR, entry_name)
                };

                if entry.is_dir {
                    dir_queue.push((entry_remote_path, entry_local_path));
                    total_dirs += 1;
                } else if !entry.is_dir {
                    all_files.push((entry_remote_path, entry_local_path, entry.size));
                    total_files += 1;
                    total_size += entry.size;
                }
            }
        }

        info!("Phase 1 complete: {} files, {} dirs, {} bytes", total_files, total_dirs, total_size);

        // 🔥 阶段 2: 逐个下载文件
        info!("Phase 2: Downloading files...");
        let mut files_completed = 0u64;
        let mut total_bytes_transferred = 0u64;

        for (remote_file_path, local_file_path, _file_size) in all_files {
            if cancellation_token.is_cancelled() {
                info!("Download cancelled for task: {}", task_id);
                return Err(SSHError::Io("下载已取消".to_string()));
            }

            // 流式下载文件
            let file_transferred = self.download_file_stream(
                &remote_file_path,
                &local_file_path,
                cancellation_token,
                |_transferred, _total| {
                    // 文件内进度暂不发送，只发送文件级进度
                }
            ).await?;

            files_completed += 1;
            total_bytes_transferred += file_transferred;

            // 计算传输速度（基于总传输时间）
            let elapsed_ms = start_time.elapsed().as_millis() as u64;
            let speed_bytes_per_sec = if elapsed_ms > 0 {
                (total_bytes_transferred * 1000) / elapsed_ms
            } else {
                0
            };

            // 发送进度事件
            let progress_event = crate::sftp::DownloadProgressEvent {
                task_id: task_id.to_string(),
                connection_id: connection_id.to_string(),
                current_file: remote_file_path.clone(),
                current_dir: Path::new(&remote_file_path)
                    .parent()
                    .and_then(|p| p.to_str())
                    .unwrap_or("")
                    .to_string(),
                files_completed,
                total_files,
                bytes_transferred: total_bytes_transferred,
                total_bytes: total_size,
                speed_bytes_per_sec,
            };

            if let Err(e) = window.emit("sftp-download-progress", &progress_event) {
                tracing::warn!("Failed to emit download progress: {}", e);
            }

            info!("Downloaded {}/{} files: {} ({} bytes, {} KB/s)",
                files_completed, total_files,
                remote_file_path,
                file_transferred,
                speed_bytes_per_sec / 1024
            );
        }

        let elapsed_time = start_time.elapsed().as_millis() as u64;

        info!("=== Directory Download Complete ===");
        info!("Files: {}, Directories: {}, Total size: {} bytes", total_files, total_dirs, total_size);
        info!("Elapsed time: {} ms", elapsed_time);

        Ok(crate::sftp::DownloadDirectoryResult {
            total_files,
            total_dirs,
            total_size,
            elapsed_time_ms: elapsed_time,
        })
    }

    /// 流式下载文件
    ///
    /// 使用固定大小的缓冲区（64KB）从远程文件读取并写入本地文件
    /// 避免一次性加载大文件到内存
    ///
    /// # 参数
    /// - `remote_path`: 远程文件路径
    /// - `local_path`: 本地保存路径
    /// - `cancellation_token`: 取消令牌
    /// - `progress_callback`: 进度回调函数
    ///
    /// # 返回
    /// 传输的字节数
    pub async fn download_file_stream<F>(
        &self,
        remote_path: &str,
        local_path: &str,
        cancellation_token: &tokio_util::sync::CancellationToken,
        progress_callback: F,
    ) -> Result<u64>
    where
        F: Fn(u64, u64),
    {
        info!("Starting file download: {} -> {}", remote_path, local_path);

        // 打开远程文件
        let mut remote_file = self.session.open(remote_path).await
            .map_err(|e| SSHError::Ssh(format!("无法打开远程文件: {}", e)))?;

        // 获取文件大小
        let file_size = remote_file.metadata().await
            .map_err(|e| SSHError::Ssh(format!("无法获取文件元数据: {}", e)))?
            .size.unwrap_or(0);

        // 创建本地文件
        let mut local_file = tokio::fs::File::create(local_path).await
            .map_err(|e| SSHError::Io(format!("无法创建本地文件: {}", e)))?;

        // 流式传输（64KB 缓冲区）
        let mut buffer = vec![0u8; 64 * 1024];
        let mut transferred = 0u64;

        loop {
            // 检查是否被取消
            if cancellation_token.is_cancelled() {
                return Err(SSHError::Io("下载已取消".to_string()));
            }

            // 从远程文件读取
            let n = remote_file.read(&mut buffer).await
                .map_err(|e| SSHError::Ssh(format!("读取远程文件失败: {}", e)))?;

            if n == 0 {
                break; // EOF
            }

            // 写入本地文件
            local_file.write_all(&buffer[..n]).await
                .map_err(|e| SSHError::Io(format!("写入本地文件失败: {}", e)))?;

            transferred += n as u64;
            progress_callback(transferred, file_size);
        }

        // 确保数据刷写到磁盘
        // 注意：russh_sftp 的 File 在 drop 时会自动关闭，无需手动调用 close()
        local_file.sync_all().await
            .map_err(|e| SSHError::Io(format!("同步本地文件失败: {}", e)))?;

        info!("File download completed: {} bytes", transferred);
        Ok(transferred)
    }
}
