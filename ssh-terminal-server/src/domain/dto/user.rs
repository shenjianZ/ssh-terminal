use serde::Deserialize;
use validator::Validate;

/// 更新用户资料请求
#[derive(Debug, Deserialize, Validate)]
pub struct UpdateProfileRequest {
    pub username: Option<String>,
    pub phone: Option<String>,
    pub qq: Option<String>,
    pub wechat: Option<String>,
    pub bio: Option<String>,
    pub avatar_data: Option<String>,
    pub avatar_mime_type: Option<String>,
}
