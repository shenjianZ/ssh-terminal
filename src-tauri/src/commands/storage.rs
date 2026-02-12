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

    // 获取内存中的所有会话配置及其ID
    let memory_sessions = manager.get_all_session_configs_with_ids().await;

    println!("Found {} session configs in memory", memory_sessions.len());

    // 先从存储加载已存在的会话
    let storage = Storage::new(Some(&app))?;
    let mut existing_sessions = match storage.load_sessions() {
        Ok(sessions) => {
            println!("Loaded {} existing sessions from storage", sessions.len());
            sessions
        }
        Err(e) => {
            println!("Failed to load existing sessions (file may not exist): {}", e);
            Vec::new()
        }
    };

    // 合并会话：以内存中的会话为准，但保留存储中不在内存中的会话
    let mut merged_sessions: std::collections::HashMap<String, SessionConfig> =
        std::collections::HashMap::new();

    // 1. 先添加存储中存在的所有会话
    for (id, config) in existing_sessions {
        merged_sessions.insert(id, config);
    }

    // 2. 用内存中的会话覆盖或添加
    for (id, config) in memory_sessions {
        merged_sessions.insert(id, config);
    }

    // 3. 转换为 Vec 并保存
    let sessions_to_save: Vec<(String, SessionConfig)> = merged_sessions
        .into_iter()
        .collect();

    println!("Saving {} merged session configs to storage", sessions_to_save.len());

    storage.save_sessions(&sessions_to_save)?;

    Ok(())
}

/// 创建会话并直接保存到存储（优化版：无需解密现有会话）
#[tauri::command]
pub async fn storage_session_create(
    config: SessionConfig,
    app: AppHandle,
) -> Result<String> {
    use crate::config::storage::SessionStorage;

    let storage = Storage::new(Some(&app))?;

    // 生成新的会话ID
    let session_id = uuid::Uuid::new_v4().to_string();

    // 加密新会话
    let saved_session = storage.encrypt_session_for_storage(session_id.clone(), config)?;

    // 读取现有存储（不解密）
    let mut storage_data = if storage.storage_path_exists() {
        let content = std::fs::read_to_string(&storage.get_storage_path())
            .map_err(|e| crate::error::SSHError::Storage(format!("Failed to read storage file: {}", e)))?;

        serde_json::from_str::<SessionStorage>(&content)
            .map_err(|e| crate::error::SSHError::Storage(format!("Failed to parse storage file: {}", e)))?
    } else {
        SessionStorage {
            version: "1.0".to_string(),
            sessions: Vec::new(),
        }
    };

    // 追加新会话
    storage_data.sessions.push(saved_session);

    // 直接保存（无需重新加密现有会话）
    let new_content = serde_json::to_string_pretty(&storage_data)
        .map_err(|e| crate::error::SSHError::Storage(format!("Failed to serialize sessions: {}", e)))?;

    // 使用原子写入
    storage.write_to_file(&new_content)?;

    println!("Created and saved session: {}", session_id);

    Ok(session_id)
}

/// 删除会话并直接更新存储（优化版：无需解密/加密）
#[tauri::command]
pub async fn storage_session_delete(
    session_id: String,
    app: AppHandle,
) -> Result<()> {
    let storage = Storage::new(Some(&app))?;

    // 使用优化的删除方法
    storage.delete_session_by_id(&session_id)?;

    Ok(())
}

/// 更新会话并直接更新存储
#[tauri::command]
pub async fn storage_session_update(
    session_id: String,
    updates: crate::ssh::session::SessionConfigUpdate,
    app: AppHandle,
) -> Result<()> {
    let storage = Storage::new(Some(&app))?;

    // 加载现有会话
    let mut existing_sessions = match storage.load_sessions() {
        Ok(sessions) => sessions,
        Err(_) => Vec::new(),
    };

    // 查找并更新会话
    let mut updated = false;
    for (id, config) in existing_sessions.iter_mut() {
        if id == &session_id {
            // 只更新提供的字段
            if let Some(name) = updates.name {
                config.name = name;
            }
            if let Some(host) = updates.host {
                config.host = host;
            }
            if let Some(port) = updates.port {
                config.port = port;
            }
            if let Some(username) = updates.username {
                config.username = username;
            }
            if let Some(group) = updates.group {
                config.group = group;
            }
            if let Some(auth_method) = updates.auth_method {
                config.auth_method = auth_method;
            }
            if let Some(terminal_type) = updates.terminal_type {
                config.terminal_type = Some(terminal_type);
            }
            if let Some(columns) = updates.columns {
                config.columns = Some(columns);
            }
            if let Some(rows) = updates.rows {
                config.rows = Some(rows);
            }
            if let Some(strict_host_key_checking) = updates.strict_host_key_checking {
                config.strict_host_key_checking = strict_host_key_checking;
            }
            if let Some(keep_alive_interval) = updates.keep_alive_interval {
                config.keep_alive_interval = keep_alive_interval;
            }
            updated = true;
            break;
        }
    }

    if !updated {
        return Err(crate::error::SSHError::SessionNotFound(session_id));
    }

    // 保存回文件
    storage.save_sessions(&existing_sessions)?;

    println!("Updated session in storage: {}", session_id);

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
