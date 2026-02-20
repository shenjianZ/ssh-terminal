use axum::{extract::{Path, Query, State}, Json};
use validator::Validate;
use crate::domain::dto::ssh::*;
use crate::domain::vo::{ApiResponse, ssh::*};
use crate::repositories::ssh_session_repository::SshSessionRepository;
use crate::domain::entities::ssh_sessions;
use crate::infra::middleware::UserId;
use crate::AppState;
use chrono::Utc;

/// 创建 SSH 会话
pub async fn create_session_handler(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Json(mut request): Json<CreateSshSessionRequest>,
) -> Result<Json<ApiResponse<SshSessionVO>>, axum::http::StatusCode> {
    // 验证请求
    if let Err(errors) = request.validate() {
        return Err(axum::http::StatusCode::BAD_REQUEST);
    }

    let repo = SshSessionRepository::new(state.pool);
    
    let session = ssh_sessions::Model {
        id: uuid::Uuid::new_v4().to_string(),
        user_id: user_id.clone(),
        name: request.name.clone(),
        host: request.host.clone(),
        port: request.port,
        username: request.username.clone(),
        group_name: request.group_name.clone(),
        terminal_type: request.terminal_type,
        columns: request.columns,
        rows: request.rows,
        auth_method_encrypted: request.auth_method_encrypted,
        auth_nonce: request.auth_nonce,
        auth_key_salt: request.auth_key_salt,
        server_ver: 1,
        client_ver: 0,
        last_synced_at: None,
        created_at: Utc::now().timestamp(),
        updated_at: Utc::now().timestamp(),
        deleted_at: None,
    };
    
    match repo.create(session).await {
        Ok(created) => {
            let vo = session_to_vo(created);
            Ok(Json(ApiResponse::success(vo)))
        }
        Err(e) => {
            tracing::error!("Failed to create SSH session: {}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// 获取所有 SSH 会话（分页）
pub async fn list_sessions_handler(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Query(params): Query<ListSshSessionsRequest>,
) -> Result<Json<ApiResponse<PaginatedSshSessions>>, axum::http::StatusCode> {
    let repo = SshSessionRepository::new(state.pool);
    
    match repo.find_by_user_id(&user_id).await {
        Ok(sessions) => {
            let page = params.page.unwrap_or(1);
            let page_size = params.page_size.unwrap_or(20);
            let total = sessions.len() as u64;
            
            let vo_list: Vec<SshSessionVO> = sessions
                .into_iter()
                .map(session_to_vo)
                .collect();
            
            let paginated = PaginatedSshSessions {
                data: vo_list,
                total,
                page,
                page_size,
            };
            
            Ok(Json(ApiResponse::success(paginated)))
        }
        Err(e) => {
            tracing::error!("Failed to list SSH sessions: {}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// 获取单个 SSH 会话
pub async fn get_session_handler(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<SshSessionVO>>, axum::http::StatusCode> {
    let repo = SshSessionRepository::new(state.pool);
    
    match repo.find_by_id(&id).await {
        Ok(Some(session)) => {
            let vo = session_to_vo(session);
            Ok(Json(ApiResponse::success(vo)))
        }
        Ok(None) => Err(axum::http::StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to get SSH session: {}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// 更新 SSH 会话
pub async fn update_session_handler(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(request): Json<UpdateSshSessionRequest>,
) -> Result<Json<ApiResponse<SshSessionVO>>, axum::http::StatusCode> {
    let repo = SshSessionRepository::new(state.pool);
    
    // 先获取现有会话
    let existing = match repo.find_by_id(&id).await {
        Ok(Some(session)) => session,
        Ok(None) => return Err(axum::http::StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to get SSH session: {}", e);
            return Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
        }
    };
    
    // 构建更新后的模型
    let mut updated = existing.clone();
    if let Some(name) = request.name { updated.name = name; }
    if let Some(host) = request.host { updated.host = host; }
    if let Some(port) = request.port { updated.port = port; }
    if let Some(username) = request.username { updated.username = username; }
    if let Some(group_name) = request.group_name { updated.group_name = group_name; }
    updated.terminal_type = request.terminal_type.or(existing.terminal_type);
    updated.columns = request.columns.or(existing.columns);
    updated.rows = request.rows.or(existing.rows);
    updated.auth_method_encrypted = request.auth_method_encrypted.unwrap_or(existing.auth_method_encrypted);
    updated.auth_nonce = request.auth_nonce.unwrap_or(existing.auth_nonce);
    updated.auth_key_salt = request.auth_key_salt.or(existing.auth_key_salt);
    
    match repo.update(&id, updated).await {
        Ok(session) => {
            let vo = session_to_vo(session);
            Ok(Json(ApiResponse::success(vo)))
        }
        Err(e) => {
            tracing::error!("Failed to update SSH session: {}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// 删除 SSH 会话（软删除）
pub async fn delete_session_handler(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<()>>, axum::http::StatusCode> {
    let repo = SshSessionRepository::new(state.pool);
    
    match repo.soft_delete(&id).await {
        Ok(_) => Ok(Json(ApiResponse::success(()))),
        Err(e) => {
            tracing::error!("Failed to delete SSH session: {}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// 将 Model 转换为 VO
fn session_to_vo(session: ssh_sessions::Model) -> SshSessionVO {
    SshSessionVO {
        id: session.id,
        user_id: session.user_id,
        name: session.name,
        host: session.host,
        port: session.port,
        username: session.username,
        group_name: session.group_name,
        terminal_type: session.terminal_type,
        columns: session.columns,
        rows: session.rows,
        auth_method_encrypted: session.auth_method_encrypted,
        auth_nonce: session.auth_nonce,
        auth_key_salt: session.auth_key_salt,
        server_ver: session.server_ver,
        client_ver: session.client_ver,
        last_synced_at: session.last_synced_at,
        created_at: session.created_at,
        updated_at: session.updated_at,
        deleted_at: session.deleted_at,
    }
}
