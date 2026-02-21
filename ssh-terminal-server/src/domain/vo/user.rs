use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct UserProfileResult {
    pub id: i64,
    pub user_id: String,
    pub email: String,
    pub username: Option<String>,
    pub phone: Option<String>,
    pub qq: Option<String>,
    pub wechat: Option<String>,
    pub bio: Option<String>,
    pub avatar_data: Option<String>,
    pub avatar_mime_type: Option<String>,
    pub server_ver: i32,
    pub created_at: i64,
    pub updated_at: i64,
}

// 旧名称别名，保持兼容性
pub type UserProfileVO = UserProfileResult;
