use serde::Serialize;

/// 注册结果
#[derive(Debug, Serialize)]
pub struct RegisterResult {
    pub user_id: String,
    pub email: String,
    pub created_at: i64,
    pub device_id: String,
    pub access_token: String,
    pub refresh_token: String,
}

impl From<(crate::domain::entities::users::Model, String, String)> for RegisterResult {
    fn from(
        (user_model, access_token, refresh_token): (
            crate::domain::entities::users::Model,
            String,
            String,
        ),
    ) -> Self {
        Self {
            user_id: user_model.id,
            email: user_model.email,
            created_at: user_model.created_at,
            device_id: user_model.device_id.unwrap_or_default(),
            access_token,
            refresh_token,
        }
    }
}

/// 登录结果
#[derive(Debug, Serialize)]
pub struct LoginResult {
    pub device_id: String,
    pub access_token: String,
    pub refresh_token: String,
}

impl From<(crate::domain::entities::users::Model, String, String)> for LoginResult {
    fn from(
        (user_model, access_token, refresh_token): (
            crate::domain::entities::users::Model,
            String,
            String,
        ),
    ) -> Self {
        Self {
            device_id: user_model.device_id.unwrap_or_default(),
            access_token,
            refresh_token,
        }
    }
}

/// 刷新 Token 结果
#[derive(Debug, Serialize)]
pub struct RefreshResult {
    pub access_token: String,
    pub refresh_token: String,
}
