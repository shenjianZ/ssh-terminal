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

/// 文件传输操作类型
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TransferOperation {
    Upload,
    Download,
    RemoteToRemote,
}

/// 传输源
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub enum TransferSource {
    Local { path: String },
    Remote { connectionId: String, path: String },
}

/// 传输状态
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
