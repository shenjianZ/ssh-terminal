use crate::AppState;
use crate::repositories::user_repository::UserRepository;
use axum::{
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct Claims {
    pub sub: String, // user_id
    #[allow(dead_code)]
    pub exp: usize,
}

/// JWT 认证中间件
pub async fn auth_middleware(
    State(state): State<AppState>,
    headers: HeaderMap,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // 1. 提取 Authorization header
    let auth_header = headers
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if !auth_header.starts_with("Bearer ") {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let token = &auth_header[7..];

    // 2. 验证 JWT
    let jwt_secret = &state.config.auth.jwt_secret;

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_ref()),
        &Validation::default(),
    )
    .map_err(|_| StatusCode::UNAUTHORIZED)?;

    let user_id = &token_data.claims.sub;

    // 3. 检查用户是否已被软删除
    let user_repo = UserRepository::new(state.pool.clone());
    let user = user_repo
        .find_by_id_raw(user_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if user.map(|u| u.deleted_at.is_some()).unwrap_or(true) {
        // 用户不存在或已被删除
        return Err(StatusCode::UNAUTHORIZED);
    }

    // 4. 将 user_id 添加到请求扩展
    req.extensions_mut().insert(user_id.clone());

    Ok(next.run(req).await)
}
