pub mod auth;
pub mod user;
pub mod ssh;
pub mod sync;
pub mod health;

/// 统一的 API 响应结构
use serde::Serialize;
use axum::http::StatusCode;

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    /// HTTP 状态码
    pub code: u16,
    /// 响应消息
    pub message: String,
    /// 响应数据
    pub data: Option<T>,
}

impl<T: Serialize> ApiResponse<T> {
    /// 成功响应（200）
    pub fn success(data: T) -> Self {
        Self {
            code: 200,
            message: "Success".to_string(),
            data: Some(data),
        }
    }

    /// 成功响应（自定义消息）
    pub fn success_with_message(data: T, message: &str) -> Self {
        Self {
            code: 200,
            message: message.to_string(),
            data: Some(data),
        }
    }

    /// 错误响应
    #[allow(dead_code)]
    pub fn error(status_code: StatusCode, message: &str) -> ApiResponse<()> {
        ApiResponse {
            code: status_code.as_u16(),
            message: message.to_string(),
            data: None,
        }
    }

    /// 错误响应（带数据）
    #[allow(dead_code)]
    pub fn error_with_data(status_code: StatusCode, message: &str, data: T) -> ApiResponse<T> {
        ApiResponse {
            code: status_code.as_u16(),
            message: message.to_string(),
            data: Some(data),
        }
    }
}
