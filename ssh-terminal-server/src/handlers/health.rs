use crate::AppState;
use crate::db;
use crate::domain::vo::{ApiResponse, health::*};
use axum::{
    extract::State,
    response::{IntoResponse, Json},
};

/// 健康检查端点
pub async fn health_check(State(state): State<AppState>) -> impl IntoResponse {
    match db::health_check(&state.pool).await {
        Ok(_) => Json(ApiResponse::success(HealthCheckResult::ok())),
        Err(_) => Json(ApiResponse::success(HealthCheckResult::unavailable())),
    }
}

/// 获取服务器信息
pub async fn server_info() -> impl IntoResponse {
    Json(ApiResponse::success(ServerInfoResult::new()))
}
