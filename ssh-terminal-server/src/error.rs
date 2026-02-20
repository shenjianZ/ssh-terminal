use crate::domain::vo::ApiResponse;
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};

/// 应用错误类型
#[allow(dead_code)]
pub struct AppError(pub anyhow::Error);

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        tracing::error!("Application error: {:?}", self.0);

        let (status, message) = match self.0.downcast_ref::<&str>() {
            Some(&"not_found") => (StatusCode::NOT_FOUND, "Resource not found"),
            Some(&"unauthorized") => (StatusCode::UNAUTHORIZED, "Unauthorized"),
            _ => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"),
        };

        let body = ApiResponse::<()> {
            code: status.as_u16(),
            message: message.to_string(),
            data: None,
        };

        (status, Json(body)).into_response()
    }
}

// 为具体类型实现 From
impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        Self(err)
    }
}

/// 统一的 API 错误响应结构
#[derive(Debug)]
pub struct ErrorResponse {
    pub status: StatusCode,
    pub message: String,
}

impl ErrorResponse {
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            message: message.into(),
        }
    }

    #[allow(dead_code)]
    pub fn not_found(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::NOT_FOUND,
            message: message.into(),
        }
    }

    #[allow(dead_code)]
    pub fn unauthorized(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::UNAUTHORIZED,
            message: message.into(),
        }
    }

    #[allow(dead_code)]
    pub fn internal(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            message: message.into(),
        }
    }
}

impl IntoResponse for ErrorResponse {
    fn into_response(self) -> Response {
        let body = ApiResponse::<()> {
            code: self.status.as_u16(),
            message: self.message,
            data: None,
        };

        (self.status, Json(body)).into_response()
    }
}
