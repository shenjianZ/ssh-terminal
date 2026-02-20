use axum::{extract::State, Json};
use validator::Validate;
use crate::domain::dto::sync::*;
use crate::domain::vo::{ApiResponse, sync::*};
use crate::services::sync_service::SyncService;
use crate::infra::middleware::UserId;
use crate::AppState;

/// Resolve Conflict - 解决冲突
pub async fn resolve_conflict_handler(
    State(state): State<AppState>,
    Json(request): Json<ResolveConflictRequest>,
) -> Result<Json<ApiResponse<ResolveConflictResponse>>, axum::http::StatusCode> {
    // 验证请求
    if let Err(_) = request.validate() {
        return Err(axum::http::StatusCode::BAD_REQUEST);
    }

    let service = SyncService::new(state.pool);

    match service.resolve_conflict(request).await {
        Ok(response) => Ok(Json(ApiResponse::success(response))),
        Err(e) => {
            tracing::error!("Resolve conflict failed: {}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// 统一同步 - 合并 Pull 和 Push
pub async fn sync_handler(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Json(request): Json<SyncRequest>,
) -> Result<Json<ApiResponse<SyncResponse>>, axum::http::StatusCode> {
    // 验证请求
    if let Err(_) = request.validate() {
        return Err(axum::http::StatusCode::BAD_REQUEST);
    }

    let service = SyncService::new(state.pool);

    match service.sync(request, &user_id).await {
        Ok(response) => Ok(Json(ApiResponse::success(response))),
        Err(e) => {
            tracing::error!("Sync failed: {}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
