use crate::error::ErrorResponse;
use crate::infra::middleware::logging::{log_info, RequestId};
use crate::domain::dto::auth::{RegisterRequest, LoginRequest, RefreshRequest, DeleteUserRequest};
use crate::domain::vo::auth::{RegisterResult, LoginResult, RefreshResult};
use crate::domain::vo::ApiResponse;
use crate::repositories::user_repository::UserRepository;
use crate::repositories::user_profile_repository::UserProfileRepository;
use crate::services::auth_service::AuthService;
use crate::AppState;
use axum::{
    extract::{Extension, State},
    Json,
};
use serde_json::json;

/// 注册
pub async fn register(
    Extension(request_id): Extension<RequestId>,
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<ApiResponse<RegisterResult>>, ErrorResponse> {
    log_info(&request_id, "注册请求参数", &payload);

    let user_repo = UserRepository::new(state.pool.clone());
    let user_profile_repo = UserProfileRepository::new(state.pool.clone());
    let service = AuthService::new(user_repo, user_profile_repo, state.redis_client.clone(), state.config.auth.clone());

    match service.register(payload).await {
        Ok((user_model, access_token, refresh_token)) => {
            let data = RegisterResult::from((user_model, access_token, refresh_token));
            let response = ApiResponse::success(data);
            log_info(&request_id, "注册成功", &response);
            Ok(Json(response))
        }
        Err(e) => {
            log_info(&request_id, "注册失败", &e.to_string());
            Err(ErrorResponse::new(e.to_string()))
        }
    }
}

/// 登录
pub async fn login(
    Extension(request_id): Extension<RequestId>,
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<ApiResponse<LoginResult>>, ErrorResponse> {
    log_info(&request_id, "登录请求参数", &payload);

    let user_repo = UserRepository::new(state.pool.clone());
    let user_profile_repo = UserProfileRepository::new(state.pool.clone());
    let service = AuthService::new(user_repo, user_profile_repo, state.redis_client.clone(), state.config.auth.clone());

    match service.login(payload).await {
        Ok((user_model, access_token, refresh_token)) => {
            let data = LoginResult::from((user_model, access_token, refresh_token));
            let response = ApiResponse::success(data);
            log_info(&request_id, "登录成功", &response);
            Ok(Json(response))
        }
        Err(e) => {
            log_info(&request_id, "登录失败", &e.to_string());
            Err(ErrorResponse::new(e.to_string()))
        }
    }
}

/// 刷新 Token
pub async fn refresh(
    Extension(request_id): Extension<RequestId>,
    State(state): State<AppState>,
    Json(payload): Json<RefreshRequest>,
) -> Result<Json<ApiResponse<RefreshResult>>, ErrorResponse> {
    log_info(
        &request_id,
        "刷新 token 请求",
        &json!({"device_id": "default"}),
    );

    let user_repo = UserRepository::new(state.pool.clone());
    let user_profile_repo = UserProfileRepository::new(state.pool.clone());
    let service = AuthService::new(user_repo, user_profile_repo, state.redis_client.clone(), state.config.auth.clone());

    match service
        .refresh_access_token(&payload.refresh_token)
        .await
    {
        Ok((access_token, refresh_token)) => {
            let data = RefreshResult {
                access_token,
                refresh_token,
            };
            let response = ApiResponse::success(data);

            log_info(
                &request_id,
                "刷新成功",
                &json!({"access_token": "***"}),
            );
            Ok(Json(response))
        }
        Err(e) => {
            log_info(&request_id, "刷新失败", &e.to_string());
            Err(ErrorResponse::new(e.to_string()))
        }
    }
}

/// 删除账号
pub async fn delete_account(
    Extension(request_id): Extension<RequestId>,
    State(state): State<AppState>,
    Extension(user_id): Extension<String>,
    Json(payload): Json<DeleteUserRequest>,
) -> Result<Json<ApiResponse<()>>, ErrorResponse> {
    log_info(&request_id, "删除账号请求", &format!("user_id={}", user_id));

    let user_repo = UserRepository::new(state.pool.clone());
    let user_profile_repo = UserProfileRepository::new(state.pool.clone());
    let service = AuthService::new(user_repo, user_profile_repo, state.redis_client.clone(), state.config.auth.clone());

    let delete_request = DeleteUserRequest {
        user_id: user_id.clone(),
        password: payload.password,
    };

    match service.delete_user(delete_request).await {
        Ok(_) => {
            log_info(&request_id, "账号删除成功", &format!("user_id={}", user_id));
            let response = ApiResponse::success_with_message((), "账号删除成功");
            Ok(Json(response))
        }
        Err(e) => {
            log_info(&request_id, "账号删除失败", &e.to_string());
            Err(ErrorResponse::new(e.to_string()))
        }
    }
}

/// 刷新令牌
pub async fn delete_refresh_token(
    Extension(request_id): Extension<RequestId>,
    State(state): State<AppState>,
    Extension(user_id): Extension<String>,
) -> Result<Json<ApiResponse<()>>, ErrorResponse> {
    log_info(&request_id, "删除刷新令牌请求", &format!("user_id={}", user_id));

    let user_repo = UserRepository::new(state.pool.clone());
    let user_profile_repo = UserProfileRepository::new(state.pool.clone());
    let service = AuthService::new(user_repo, user_profile_repo, state.redis_client.clone(), state.config.auth.clone());

    match service.delete_refresh_token(&user_id).await {
        Ok(_) => {
            log_info(&request_id, "刷新令牌删除成功", &format!("user_id={}", user_id));
            let response = ApiResponse::success_with_message((), "刷新令牌删除成功");
            Ok(Json(response))
        }
        Err(e) => {
            log_info(&request_id, "刷新令牌删除失败", &e.to_string());
            Err(ErrorResponse::new(e.to_string()))
        }
    }
}
