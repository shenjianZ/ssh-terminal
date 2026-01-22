use crate::error::Result;
use crate::ssh::manager::SSHManager;
use crate::ssh::session::SessionConfig;
use std::sync::Arc;
use tauri::State;

// 全局SSH管理器状态
pub type SSHManagerState = Arc<SSHManager>;

#[tauri::command]
pub async fn ssh_create_session(
    manager: State<'_, SSHManagerState>,
    config: SessionConfig,
) -> Result<String> {
    manager.create_session(config).await
}

#[tauri::command]
pub async fn ssh_create_temporary_connection(
    manager: State<'_, SSHManagerState>,
    config: SessionConfig,
) -> Result<String> {
    manager.create_temporary_connection(config).await
}

#[tauri::command]
pub async fn ssh_connect(
    manager: State<'_, SSHManagerState>,
    session_id: String,
) -> Result<String> {
    manager.connect_session(&session_id).await
}

#[tauri::command]
pub async fn ssh_disconnect(
    manager: State<'_, SSHManagerState>,
    session_id: String,
) -> Result<()> {
    manager.disconnect_session(&session_id).await
}

#[tauri::command]
pub async fn ssh_list_sessions(
    manager: State<'_, SSHManagerState>,
) -> Result<Vec<crate::ssh::session::SessionInfo>> {
    Ok(manager.list_sessions().await)
}

#[tauri::command]
pub async fn ssh_get_session(
    manager: State<'_, SSHManagerState>,
    session_id: String,
) -> Result<crate::ssh::session::SessionInfo> {
    let session = manager.get_session(&session_id).await?;
    Ok(session.session_info().await)
}

#[tauri::command]
pub async fn ssh_delete_session(
    manager: State<'_, SSHManagerState>,
    session_id: String,
) -> Result<()> {
    manager.delete_session(&session_id).await
}

#[tauri::command]
pub async fn ssh_update_session(
    manager: State<'_, SSHManagerState>,
    session_id: String,
    updates: crate::ssh::session::SessionConfig,
) -> Result<()> {
    manager.update_session(&session_id, updates).await
}
