//! SFTP Tauri Commands
//!
//! 前端调用的 SFTP 操作命令

use crate::error::Result;
use crate::sftp::{SftpFileInfo, SftpManager};
use std::sync::Arc;
use std::path::Path;
use tauri::{AppHandle, State};

/// SFTP Manager 状态
pub type SftpManagerState = Arc<SftpManager>;

/// 列出目录内容
///
/// # 参数
/// - `manager`: SFTP Manager
/// - `connection_id`: SSH 连接 ID
/// - `path`: 目录路径
///
/// # 返回
/// 目录中的文件和子目录列表
#[tauri::command]
pub async fn sftp_list_dir(
    manager: State<'_, SftpManagerState>,
    connection_id: String,
    path: String,
) -> Result<Vec<SftpFileInfo>> {
    tracing::info!("Listing directory: {} on connection {}", path, connection_id);

    let entries = manager.list_dir(&connection_id, &path).await?;

    Ok(entries)
}

/// 创建目录
#[tauri::command]
pub async fn sftp_create_dir(
    manager: State<'_, SftpManagerState>,
    connection_id: String,
    path: String,
    recursive: bool,
) -> Result<()> {
    manager.create_dir(&connection_id, &path, recursive).await
}

/// 删除文件
///
/// # 参数
/// - `connection_id`: SSH 连接 ID
/// - `path`: 文件路径
#[tauri::command]
pub async fn sftp_remove_file(
    manager: State<'_, SftpManagerState>,
    connection_id: String,
    path: String,
) -> Result<()> {
    tracing::info!("Removing file: {} on connection {}", path, connection_id);
    manager.remove_file(&connection_id, &path).await
}

/// 删除目录
///
/// # 参数
/// - `connection_id`: SSH 连接 ID
/// - `path`: 目录路径
/// - `recursive`: 是否递归删除
#[tauri::command]
pub async fn sftp_remove_dir(
    manager: State<'_, SftpManagerState>,
    connection_id: String,
    path: String,
    recursive: bool,
) -> Result<()> {
    tracing::info!("Removing directory: {} (recursive: {}) on connection {}", path, recursive, connection_id);
    manager.remove_dir(&connection_id, &path, recursive).await
}

/// 重命名文件或目录
///
/// # 参数
/// - `connection_id`: SSH 连接 ID
/// - `old_path`: 原路径
/// - `new_path`: 新路径
#[tauri::command]
pub async fn sftp_rename(
    manager: State<'_, SftpManagerState>,
    connection_id: String,
    old_path: String,
    new_path: String,
) -> Result<()> {
    tracing::info!("Renaming: {} -> {} on connection {}", old_path, new_path, connection_id);
    manager.rename(&connection_id, &old_path, &new_path).await
}

/// 修改文件权限
///
/// # 参数
/// - `connection_id`: SSH 连接 ID
/// - `path`: 文件路径
/// - `mode`: 权限模式（Unix 风格，如 0o755）
#[tauri::command]
pub async fn sftp_chmod(
    manager: State<'_, SftpManagerState>,
    connection_id: String,
    path: String,
    mode: u32,
) -> Result<()> {
    tracing::info!("Changing permissions of {} to {:o} on connection {}", path, mode, connection_id);
    manager.chmod(&connection_id, &path, mode).await
}

/// 读取文件内容
///
/// # 参数
/// - `connection_id`: SSH 连接 ID
/// - `path`: 文件路径
///
/// # 返回
/// 文件内容的字节数组
#[tauri::command]
pub async fn sftp_read_file(
    manager: State<'_, SftpManagerState>,
    connection_id: String,
    path: String,
) -> Result<Vec<u8>> {
    tracing::info!("Reading file: {} on connection {}", path, connection_id);
    manager.read_file(&connection_id, &path).await
}

/// 写入文件内容
///
/// # 参数
/// - `connection_id`: SSH 连接 ID
/// - `path`: 文件路径
/// - `content`: 文件内容
#[tauri::command]
pub async fn sftp_write_file(
    manager: State<'_, SftpManagerState>,
    connection_id: String,
    path: String,
    content: Vec<u8>,
) -> Result<()> {
    tracing::info!("Writing {} bytes to {} on connection {}", content.len(), path, connection_id);
    manager.write_file(&connection_id, &path, content).await
}

/// 列出本地目录内容
///
/// # 参数
/// - `path`: 目录路径
///
/// # 返回
/// 目录中的文件和子目录列表
#[tauri::command]
pub async fn local_list_dir(path: String) -> Result<Vec<SftpFileInfo>> {
    tracing::info!("Listing local directory: {}", path);

    let path_obj = Path::new(&path);
    if !path_obj.exists() {
        return Err(crate::error::SSHError::NotFound(format!("路径不存在: {}", path)));
    }

    if !path_obj.is_dir() {
        return Err(crate::error::SSHError::Io(format!("不是目录: {}", path)));
    }

    let mut entries = Vec::new();

    let mut dir = tokio::fs::read_dir(&path).await
        .map_err(|e| crate::error::SSHError::Io(format!("无法读取目录: {}", e)))?;

    while let Some(entry) = dir.next_entry().await
        .map_err(|e| crate::error::SSHError::Io(format!("读取目录项失败: {}", e)))?
    {
        let metadata = entry.metadata().await
            .map_err(|e| crate::error::SSHError::Io(format!("获取文件元数据失败: {}", e)))?;

        let file_name = entry.file_name()
            .into_string()
            .map_err(|_| crate::error::SSHError::Io("文件名包含无效字符".to_string()))?;

        // 构建文件路径，规范化路径分隔符
        let file_path = if path.ends_with('/') || path.ends_with('\\') {
            format!("{}{}", path, file_name)
        } else {
            format!("{}{}{}", path, std::path::MAIN_SEPARATOR, file_name)
        };

        let file_info = SftpFileInfo {
            name: file_name.clone(),
            path: file_path,
            size: metadata.len(),
            is_dir: metadata.is_dir(),
            is_symlink: metadata.is_symlink(),
            modified: metadata.modified()
                .map(|t| t.duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs())
                .unwrap_or(0),
            mode: {
                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    metadata.permissions().mode()
                }
                #[cfg(windows)]
                {
                    0o644 // Windows 上无法获取 Unix 权限
                }
            },
            owner: None,
            group: None,
        };

        entries.push(file_info);
    }

    tracing::info!("Listed {} entries in local directory {}", entries.len(), path);
    Ok(entries)
}

/// 获取用户家目录
///
/// # 返回
/// 用户家目录的路径
#[tauri::command]
pub async fn local_home_dir() -> Result<String> {
    let home_dir = dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| crate::error::SSHError::Io("无法获取用户家目录".to_string()))?;

    tracing::info!("Home directory: {}", home_dir);
    Ok(home_dir)
}

/// 获取可用的盘符列表
///
/// # 返回
/// 盘符列表，Windows上例如 ["C:", "D:", "E:"]，Linux上例如 ["/"]
#[tauri::command]
pub async fn local_available_drives() -> Result<Vec<String>> {
    use sysinfo::Disks;

    // 获取并刷新磁盘列表
    let disks = Disks::new_with_refreshed_list();

    let mut drives = Vec::new();

    #[cfg(windows)]
    {
        // Windows: 提取盘符（如 "C:\", "D:\"）
        for disk in &disks {
            let mount_point = disk.mount_point();
            if let Some(path_str) = mount_point.to_str() {
                // 提取盘符，如 "C:" 而不是 "C:\"
                if path_str.len() >= 2 && path_str.chars().nth(1) == Some(':') {
                    drives.push(format!("{}:", path_str.chars().next().unwrap()));
                }
            }
        }
    }

    #[cfg(not(windows))]
    {
        // Linux/Unix: 返回根目录
        drives.push("/".to_string());
    }

    tracing::info!("Available drives: {:?}", drives);
    Ok(drives)
}

/// 获取盘符的根目录
///
/// # 参数
/// - `drive`: 盘符，例如 "C:"
///
/// # 返回
/// 该盘符的根目录路径
#[tauri::command]
pub async fn local_drive_root(drive: String) -> Result<String> {
    #[cfg(windows)]
    {
        if drive.ends_with(':') {
            Ok(format!("{}\\", drive))
        } else {
            Ok(format!("{}:", drive))
        }
    }

    #[cfg(not(windows))]
    {
        Ok("/".to_string())
    }
}

/// 上传文件（完整实现）
///
/// # 参数
/// - `manager`: SFTP Manager
/// - `connection_id`: SSH 连接 ID
/// - `local_path`: 本地文件路径
/// - `remote_path`: 远程保存路径
///
/// # 返回
/// 传输的字节数
#[tauri::command]
pub async fn sftp_upload_file(
    manager: State<'_, SftpManagerState>,
    connection_id: String,
    local_path: String,
    remote_path: String,
) -> Result<u64> {
    tracing::info!("=== Upload File Start ===");
    tracing::info!("Connection ID: {}", connection_id);
    tracing::info!("Local path: {}", local_path);
    tracing::info!("Remote path: {}", remote_path);

    // 检查本地文件是否存在
    let local_path_obj = std::path::Path::new(&local_path);
    tracing::info!("Local file exists: {}", local_path_obj.exists());

    if !local_path_obj.exists() {
        tracing::error!("Local file does not exist: {}", local_path);
        return Err(crate::error::SSHError::NotFound(format!("本地文件不存在: {}", local_path)));
    }

    // 读取本地文件
    tracing::info!("Reading local file...");
    let file_data = tokio::fs::read(&local_path).await
        .map_err(|e| {
            tracing::error!("Failed to read local file: {}", e);
            crate::error::SSHError::Io(format!("无法读取本地文件: {}", e))
        })?;

    let file_size = file_data.len() as u64;
    tracing::info!("Local file size: {} bytes", file_size);

    // 使用 SFTP manager 上传
    tracing::info!("Starting SFTP upload...");
    manager.write_file(&connection_id, &remote_path, file_data).await?;

    tracing::info!("Upload completed: {} bytes", file_size);
    Ok(file_size)
}

/// 下载文件（完整实现）
///
/// # 参数
/// - `manager`: SFTP Manager
/// - `connection_id`: SSH 连接 ID
/// - `remote_path`: 远程文件路径
/// - `local_path`: 本地保存路径
///
/// # 返回
/// 传输的字节数
#[tauri::command]
pub async fn sftp_download_file(
    manager: State<'_, SftpManagerState>,
    connection_id: String,
    remote_path: String,
    local_path: String,
) -> Result<u64> {
    tracing::info!("Downloading {} from connection {} to {}", remote_path, connection_id, local_path);

    // 从远程读取文件
    let file_data = manager.read_file(&connection_id, &remote_path).await?;

    let file_size = file_data.len() as u64;

    // 写入到本地文件
    tokio::fs::write(&local_path, file_data).await
        .map_err(|e| crate::error::SSHError::Io(format!("无法写入本地文件: {}", e)))?;

    tracing::info!("Download completed: {} bytes", file_size);
    Ok(file_size)
}
