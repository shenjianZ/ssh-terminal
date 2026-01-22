use crate::error::Result;
use crate::config::Storage;
use crate::ssh::session::SessionConfig;
use tauri::State;

use super::session::SSHManagerState;

/// 保存所有会话配置到存储
#[tauri::command]
pub async fn storage_save_sessions(
    manager: State<'_, SSHManagerState>,
) -> Result<()> {
    let manager = manager.as_ref();

    // 获取所有会话配置（所有 session 都是持久化的）
    let session_configs = manager.get_all_session_configs().await;

    println!("Saving {} session configs", session_configs.len());

    let storage = Storage::new()?;
    storage.save_sessions(&session_configs)?;

    Ok(())
}

/// 从存储加载所有保存的会话
#[tauri::command]
pub async fn storage_load_sessions() -> std::result::Result<Vec<SessionConfig>, String> {
    let storage = Storage::new().map_err(|e| e.to_string())?;
    let sessions = storage.load_sessions().map_err(|e| e.to_string())?;
    Ok(sessions)
}

/// 清除所有保存的会话
#[tauri::command]
pub async fn storage_clear() -> std::result::Result<(), String> {
    let storage = Storage::new().map_err(|e| e.to_string())?;
    storage.clear().map_err(|e| e.to_string())?;
    Ok(())
}

/// 从存储中删除单个会话配置
#[tauri::command]
pub async fn storage_delete_session(session_name: String) -> std::result::Result<bool, String> {
    let storage = Storage::new().map_err(|e| e.to_string())?;
    storage.delete_session(&session_name).map_err(|e| e.to_string())
}

/// 保存应用配置
#[tauri::command]
pub async fn storage_save_app_config(config: crate::config::storage::TerminalConfig) -> std::result::Result<(), String> {
    Storage::save_app_config(&config).map_err(|e| e.to_string())
}

/// 加载应用配置
#[tauri::command]
pub async fn storage_load_app_config() -> std::result::Result<Option<crate::config::storage::TerminalConfig>, String> {
    Storage::load_app_config().map_err(|e| e.to_string())
}
