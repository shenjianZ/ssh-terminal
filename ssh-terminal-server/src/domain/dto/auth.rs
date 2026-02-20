use serde::Deserialize;
use std::fmt;

/// 注册请求
#[derive(Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
}

// 实现 Debug trait，对密码进行脱敏
impl fmt::Debug for RegisterRequest {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "RegisterRequest {{ email: {}, password: *** }}", self.email)
    }
}

/// 登录请求
#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

// 实现 Debug trait
impl fmt::Debug for LoginRequest {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "LoginRequest {{ email: {}, password: *** }}", self.email)
    }
}

/// 删除用户请求
#[derive(Deserialize)]
pub struct DeleteUserRequest {
    pub user_id: String,
    pub password: String,
}

// 实现 Debug trait
impl fmt::Debug for DeleteUserRequest {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "DeleteUserRequest {{ user_id: {}, password: *** }}", self.user_id)
    }
}

/// 刷新令牌请求
#[derive(Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

// RefreshRequest 的 refresh_token 是敏感字段，需要脱敏
impl fmt::Debug for RefreshRequest {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "RefreshRequest {{ refresh_token: *** }}")
    }
}
