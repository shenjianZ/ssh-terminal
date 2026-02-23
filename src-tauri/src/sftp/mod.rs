//! SFTP 文件管理模块
//!
//! 提供基于 SFTP 协议的远程文件操作功能

pub mod client;
pub mod manager;

pub use manager::SftpManager;

/// SFTP 文件信息
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SftpFileInfo {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub is_dir: bool,
    pub is_symlink: bool,
    pub modified: u64,     // Unix timestamp
    pub mode: u32,         // Unix permissions
    pub owner: Option<String>,
    pub group: Option<String>,
}

/// 从 russh_sftp::protocol::FileAttributes 转换
impl From<russh_sftp::protocol::FileAttributes> for SftpFileInfo {
    fn from(attrs: russh_sftp::protocol::FileAttributes) -> Self {
        Self {
            name: String::new(), // 需要从外部设置
            path: String::new(),
            size: attrs.size.unwrap_or(0),
            is_dir: attrs.is_dir(),
            is_symlink: false, // TODO: 从 FileAttributes 获取
            modified: attrs.mtime.unwrap_or(0) as u64,
            mode: attrs.permissions.unwrap_or(0),
            owner: attrs.user,
            group: attrs.group,
        }
    }
}

// ============================================================================
// 未来特性：文件传输进度追踪
// 以下类型和方法预留用于将来的文件传输进度追踪功能
// ============================================================================

/// 文件传输操作类型
#[allow(dead_code)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TransferOperation {
    Upload,
    Download,
    RemoteToRemote,
}

/// 传输源
#[allow(dead_code)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub enum TransferSource {
    Local { path: String },
    Remote { connection_id: String, path: String },
}

/// 传输状态
#[allow(dead_code)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TransferStatus {
    Pending,
    InProgress,
    Completed,
    Failed { reason: String },
    Cancelled,
}

/// 文件传输进度
#[allow(dead_code)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferProgress {
    pub id: String,
    pub operation: TransferOperation,
    pub source: TransferSource,
    pub destination: TransferSource,
    pub file_size: u64,
    pub transferred: u64,
    pub speed: u64,         // bytes/s
    pub status: TransferStatus,
}

/// 目录上传结果
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadDirectoryResult {
    pub total_files: u64,
    pub total_dirs: u64,
    pub total_size: u64,
    pub elapsed_time_ms: u64,
}

/// 上传进度事件
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadProgressEvent {
    pub task_id: String, // 上传任务的唯一 ID，用于区分多个并发上传任务
    pub connection_id: String,
    pub current_file: String,
    pub current_dir: String,
    pub files_completed: u64,
    pub total_files: u64,
    pub bytes_transferred: u64,
    pub total_bytes: u64,
    pub speed_bytes_per_sec: u64,
}
