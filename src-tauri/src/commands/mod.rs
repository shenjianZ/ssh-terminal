pub mod session;
pub mod terminal;
pub mod storage;
pub mod sftp;
pub mod recording;
pub mod keybindings;
pub mod audio;
pub mod ai;
pub mod ai_history;

pub use session::*;
pub use terminal::*;
pub use storage::*;
pub use sftp::*;
pub use recording::*;
pub use keybindings::*;
pub use audio::*;
pub use ai::*;

// 导出 AI 配置相关的类型（用于 Tauri 命令序列化）
#[allow(unused_imports)]
pub use crate::config::storage::{AIConfig, AIProviderConfig, AIShortcuts};
