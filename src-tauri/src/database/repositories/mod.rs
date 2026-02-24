//! Repository 模块
//!
//! 提供数据库操作的 Repository 层

pub mod user_auth_repository;
pub mod ssh_session_repository;
pub mod app_settings_repository;
pub mod user_profile_repository;
pub mod sync_state_repository;
pub mod upload_records;
pub mod download_records;

// 重新导出 Repository 类
pub use user_auth_repository::UserAuthRepository;
pub use ssh_session_repository::SshSessionRepository;
pub use app_settings_repository::AppSettingsRepository;
pub use user_profile_repository::UserProfileRepository;
pub use sync_state_repository::SyncStateRepository;
pub use upload_records::{UploadRecordsRepository, PaginatedUploadRecords};
pub use download_records::{DownloadRecordsRepository, PaginatedDownloadRecords};