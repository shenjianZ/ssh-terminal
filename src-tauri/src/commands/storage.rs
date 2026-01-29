use crate::error::Result;
use crate::config::Storage;
use crate::ssh::session::SessionConfig;
use tauri::{State, AppHandle};

use super::session::SSHManagerState;
use super::ai::AIManagerState;

/// 保存所有会话配置到存储
#[tauri::command]
pub async fn storage_sessions_save(
    manager: State<'_, SSHManagerState>,
    app: AppHandle,
) -> Result<()> {
    let manager = manager.as_ref();

    // 获取所有会话配置及其ID
    let session_configs = manager.get_all_session_configs_with_ids().await;

    println!("Saving {} session configs", session_configs.len());

    let storage = Storage::new(Some(&app))?;
    storage.save_sessions(&session_configs)?;

    Ok(())
}

/// 从存储加载所有保存的会话，返回 (id, config) 元组列表
#[tauri::command]
pub async fn storage_sessions_load(app: AppHandle) -> std::result::Result<Vec<(String, SessionConfig)>, String> {
    let storage = Storage::new(Some(&app)).map_err(|e| e.to_string())?;
    let sessions = storage.load_sessions().map_err(|e| e.to_string())?;
    Ok(sessions)
}

/// 清除所有保存的会话
#[tauri::command]
pub async fn storage_sessions_clear(app: AppHandle) -> std::result::Result<(), String> {
    let storage = Storage::new(Some(&app)).map_err(|e| e.to_string())?;
    storage.clear().map_err(|e| e.to_string())?;
    Ok(())
}

/// 从存储中删除单个会话配置
#[tauri::command]
pub async fn storage_session_delete(session_name: String, app: AppHandle) -> std::result::Result<bool, String> {
    let storage = Storage::new(Some(&app)).map_err(|e| e.to_string())?;
    storage.delete_session(&session_name).map_err(|e| e.to_string())
}

/// 保存应用配置
#[tauri::command]
pub async fn storage_config_save(config: crate::config::storage::TerminalConfig, app: AppHandle) -> std::result::Result<(), String> {
    Storage::save_app_config(&config, Some(&app)).map_err(|e| e.to_string())
}

/// 加载应用配置
#[tauri::command]
pub async fn storage_config_load(app: AppHandle) -> std::result::Result<Option<crate::config::storage::TerminalConfig>, String> {
    Storage::load_app_config(Some(&app)).map_err(|e| e.to_string())
}

/// 获取默认应用配置
#[tauri::command]
pub async fn storage_config_get_default() -> crate::config::storage::TerminalConfig {
    Storage::get_default_config()
}

/// 保存 AI 配置（带热重载）
#[tauri::command]
pub async fn storage_ai_config_save(
    config: crate::config::storage::AIConfig,
    app: AppHandle,
    ai_manager: State<'_, AIManagerState>,
) -> std::result::Result<(), String> {
    // 1. 加载旧配置（如果存在）
    let old_config = crate::config::Storage::load_ai_config(Some(&app))
        .unwrap_or(None);

    // 2. 保存新配置
    crate::config::Storage::save_ai_config(&config, Some(&app))
        .map_err(|e| e.to_string())?;

    // 3. 如果存在旧配置，执行智能热重载
    if let Some(old_cfg) = old_config {
        // 将 storage 配置转换为 Provider 配置
        let old_provider_configs: Vec<crate::commands::ai::AIProviderConfig> = old_cfg.providers
            .into_iter()
            .map(|p| crate::commands::ai::AIProviderConfig {
                provider_type: p.provider_type,
                api_key: p.api_key,
                base_url: p.base_url,
                model: p.model,
                temperature: Some(p.temperature),
                max_tokens: Some(p.max_tokens),
            })
            .collect();

        let new_provider_configs: Vec<crate::commands::ai::AIProviderConfig> = config.providers
            .iter()
            .map(|p| crate::commands::ai::AIProviderConfig {
                provider_type: p.provider_type.clone(),
                api_key: p.api_key.clone(),
                base_url: p.base_url.clone(),
                model: p.model.clone(),
                temperature: Some(p.temperature),
                max_tokens: Some(p.max_tokens),
            })
            .collect();

        // 执行智能热重载
        match ai_manager.manager().hot_reload(&old_provider_configs, &new_provider_configs) {
            Ok(removed_count) => {
                tracing::info!(
                    "[AI Config] Hot reload completed: {} providers removed from cache",
                    removed_count
                );
            }
            Err(e) => {
                tracing::warn!("[AI Config] Hot reload failed: {}", e);
                // 热重载失败不影响配置保存
            }
        }
    }

    Ok(())
}

/// 加载 AI 配置
#[tauri::command]
pub async fn storage_ai_config_load(app: AppHandle) -> std::result::Result<Option<crate::config::storage::AIConfig>, String> {
    crate::config::Storage::load_ai_config(Some(&app)).map_err(|e| e.to_string())
}

/// 获取默认 AI 配置
#[tauri::command]
pub async fn storage_ai_config_get_default() -> crate::config::storage::AIConfig {
    crate::config::Storage::get_default_ai_config()
}
