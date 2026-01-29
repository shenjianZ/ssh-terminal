use crate::error::Result;
use crate::ssh::manager::SSHManager;
use crate::ssh::session::{SessionConfig, SessionConfigUpdate};
use std::sync::Arc;
use tauri::State;

// 全局SSH管理器状态
pub type SSHManagerState = Arc<SSHManager>;

/// 创建会话配置
#[tauri::command]
pub async fn session_create(
    manager: State<'_, SSHManagerState>,
    config: SessionConfig,
) -> Result<String> {
    manager.create_session(config).await
}

/// 创建会话配置（指定ID）
/// 用于从存储加载时使用已保存的ID
#[tauri::command]
pub async fn session_create_with_id(
    manager: State<'_, SSHManagerState>,
    id: String,
    config: SessionConfig,
) -> Result<String> {
    manager.create_session_with_id(Some(id), config).await
}

/// 创建临时会话
#[tauri::command]
pub async fn session_create_temp(
    manager: State<'_, SSHManagerState>,
    config: SessionConfig,
) -> Result<String> {
    manager.create_temporary_connection(config).await
}

/// 连接会话
#[tauri::command]
pub async fn session_connect(
    manager: State<'_, SSHManagerState>,
    session_id: String,
) -> Result<String> {
    manager.connect_session(&session_id).await
}

/// 断开会话
#[tauri::command]
pub async fn session_disconnect(
    manager: State<'_, SSHManagerState>,
    session_id: String,
) -> Result<()> {
    manager.disconnect_session(&session_id).await
}

/// 列出所有会话
#[tauri::command]
pub async fn session_list(
    manager: State<'_, SSHManagerState>,
) -> Result<Vec<crate::ssh::session::SessionInfo>> {
    Ok(manager.list_sessions().await)
}

/// 获取单个会话
#[tauri::command]
pub async fn session_get(
    manager: State<'_, SSHManagerState>,
    session_id: String,
) -> Result<crate::ssh::session::SessionInfo> {
    let session = manager.get_session(&session_id).await?;
    Ok(session.session_info().await)
}

/// 删除会话
#[tauri::command]
pub async fn session_delete(
    manager: State<'_, SSHManagerState>,
    session_id: String,
) -> Result<()> {
    manager.delete_session(&session_id).await
}

/// 更新会话
#[tauri::command]
pub async fn session_update(
    manager: State<'_, SSHManagerState>,
    session_id: String,
    updates: SessionConfigUpdate,
) -> Result<()> {
    manager.update_session(&session_id, updates).await
}
