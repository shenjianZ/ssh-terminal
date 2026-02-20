use axum::{
    extract::FromRequestParts,
    http::StatusCode,
};
use async_trait::async_trait;

/// 用户 ID extractor
/// 从请求扩展中提取 user_id（由认证中间件设置）
#[derive(Debug, Clone)]
pub struct UserId(pub String);

#[async_trait]
impl<S> FromRequestParts<S> for UserId
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _state: &S,
    ) -> Result<Self, Self::Rejection> {
        // 从请求扩展中获取 user_id
        parts
            .extensions
            .get::<String>()
            .map(|id| UserId(id.clone()))
            .ok_or(StatusCode::UNAUTHORIZED)
    }
}
