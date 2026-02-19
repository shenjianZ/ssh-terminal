use axum::{extract::State, Json};
use validator::Validate;
use crate::domain::dto::user::UpdateProfileRequest;
use crate::domain::vo::{ApiResponse, user::UserProfileResult};
use crate::repositories::user_profile_repository::UserProfileRepository;
use crate::domain::entities::user_profiles;
use crate::infra::middleware::UserId;
use crate::AppState;
use chrono::Utc;

/// 获取当前用户资料
pub async fn get_profile_handler(
    State(state): State<AppState>,
    UserId(user_id): UserId,
) -> Result<Json<ApiResponse<UserProfileResult>>, axum::http::StatusCode> {
    let repo = UserProfileRepository::new(state.pool);

    match repo.find_by_user_id(&user_id).await {
        Ok(Some(profile)) => {
            let vo = profile_to_result(profile);
            Ok(Json(ApiResponse::success(vo)))
        }
        Ok(None) => Err(axum::http::StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to get user profile: {}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// 更新用户资料
pub async fn update_profile_handler(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Json(request): Json<UpdateProfileRequest>,
) -> Result<Json<ApiResponse<UserProfileResult>>, axum::http::StatusCode> {
    let repo = UserProfileRepository::new(state.pool);
    
    // 先获取现有资料
    let existing = match repo.find_by_user_id(&user_id).await {
        Ok(Some(profile)) => profile,
        Ok(None) => {
            // 如果不存在，创建新的
            // 确保使用正数 ID（避免 i64 溢出）
            let random_id = rand::random::<u64>();
            let safe_id = (random_id % (i64::MAX as u64)) as i64;
            let new_profile = user_profiles::Model {
                id: safe_id,
                user_id: user_id.clone(),
                username: request.username.clone(),
                phone: request.phone.clone(),
                qq: request.qq.clone(),
                wechat: request.wechat.clone(),
                bio: request.bio.clone(),
                avatar_data: request.avatar_data.clone(),
                avatar_mime_type: request.avatar_mime_type.clone(),
                server_ver: 1,
                created_at: Utc::now().timestamp(),
                updated_at: Utc::now().timestamp(),
                deleted_at: None,
            };
            
            match repo.create(new_profile).await {
                Ok(created) => {
                    let vo = profile_to_result(created);
                    return Ok(Json(ApiResponse::success(vo)));
                }
                Err(e) => {
                    tracing::error!("Failed to create user profile: {}", e);
                    return Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
                }
            }
        }
        Err(e) => {
            tracing::error!("Failed to get user profile: {}", e);
            return Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
        }
    };
    
    // 更新字段
    let mut updated = existing.clone();
    updated.username = request.username.or(existing.username);
    updated.phone = request.phone.or(existing.phone);
    updated.qq = request.qq.or(existing.qq);
    updated.wechat = request.wechat.or(existing.wechat);
    updated.bio = request.bio.or(existing.bio);
    updated.avatar_data = request.avatar_data.or(existing.avatar_data);
    updated.avatar_mime_type = request.avatar_mime_type.or(existing.avatar_mime_type);
    
    match repo.update(&user_id, updated).await {
        Ok(profile) => {
            let vo = profile_to_result(profile);
            Ok(Json(ApiResponse::success(vo)))
        }
        Err(e) => {
            tracing::error!("Failed to update user profile: {}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// 删除用户资料（软删除）
pub async fn delete_profile_handler(
    State(state): State<AppState>,
    UserId(user_id): UserId,
) -> Result<Json<ApiResponse<()>>, axum::http::StatusCode> {
    let repo = UserProfileRepository::new(state.pool);
    
    match repo.soft_delete(&user_id).await {
        Ok(_) => Ok(Json(ApiResponse::success(()))),
        Err(e) => {
            tracing::error!("Failed to delete user profile: {}", e);
            Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// 将 Model 转换为 Result
fn profile_to_result(profile: user_profiles::Model) -> UserProfileResult {
    UserProfileResult {
        id: profile.id,
        user_id: profile.user_id,
        username: profile.username,
        phone: profile.phone,
        qq: profile.qq,
        wechat: profile.wechat,
        bio: profile.bio,
        avatar_data: profile.avatar_data,
        avatar_mime_type: profile.avatar_mime_type,
        server_ver: profile.server_ver,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
    }
}
