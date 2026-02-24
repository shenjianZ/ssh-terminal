pub mod session;
pub mod terminal;
pub mod storage;
pub mod sftp;
pub mod recording;
pub mod keybindings;
pub mod audio;
pub mod ai;
pub mod ai_history;
pub mod auth;
pub mod sync;
pub mod user_profile;
pub mod app_settings;
pub mod ssh_session;
pub mod records;

pub use session::*;
pub use terminal::*;
pub use storage::*;
pub use sftp::*;
pub use recording::*;
pub use keybindings::*;
pub use audio::*;
pub use ai::*;
pub use auth::*;
pub use sync::*;
pub use user_profile::*;
pub use app_settings::*;
pub use ssh_session::*;
pub use records::*;

// 导出 AI 配置相关的类型（用于 Tauri 命令序列化）
#[allow(unused_imports)]
pub use crate::config::storage::{AIConfig, AIProviderConfig, AIShortcuts};
