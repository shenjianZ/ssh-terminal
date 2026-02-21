use serde::{Deserialize, Serialize};

/// 用户认证信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserAuth {
    pub id: i64,
    pub user_id: String,
    pub server_url: String,
    pub email: String,
    pub password_encrypted: String,
    pub password_nonce: String,
    pub access_token_encrypted: String,
    pub refresh_token_encrypted: Option<String>,
    pub token_expires_at: Option<i64>,
    pub device_id: String,
    pub last_sync_at: Option<i64>,
    pub is_current: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

/// 登录请求
/// 注意：server_url 字段仅用于向后兼容，实际从后端 app_settings 表读取
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
    #[serde(default)]
    pub server_url: Option<String>,
}

/// 注册请求
/// 注意：server_url 字段仅用于向后兼容，实际从后端 app_settings 表读取
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    #[serde(default)]
    pub server_url: Option<String>,
}

/// 认证响应（客户端期望格式）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthResponse {
    pub token: String,
    pub refresh_token: String,
    pub user_id: String,
    pub email: String,
    pub device_id: String,
    pub server_url: String,
    pub expires_at: i64,
}

// ==================== 服务器返回类型（snake_case 格式）====================

/// 服务器注册结果（服务器返回格式）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerRegisterResult {
    pub user_id: String,
    pub email: String,
    pub created_at: i64,  // 服务器返回的是整数时间戳
    pub device_id: String,
    pub access_token: String,
    pub refresh_token: String,
}

/// 服务器登录结果（服务器返回格式）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerLoginResult {
    pub device_id: String,
    pub access_token: String,
    pub refresh_token: String,
}

/// 服务器刷新 Token 结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerRefreshResult {
    pub access_token: String,
    pub refresh_token: String,
}

/// 服务器登录请求（不含 server_url）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerLoginRequest {
    pub email: String,
    pub password: String,
}

/// 服务器注册请求（不含 server_url）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerRegisterRequest {
    pub email: String,
    pub password: String,
}

/// 账号信息（包含用户资料）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountWithProfile {
    pub user_id: String,
    pub email: String,
    pub server_url: String,
    pub is_current: bool,
    pub last_sync_at: Option<i64>,
    pub username: Option<String>,
    pub avatar_data: Option<String>,
}
