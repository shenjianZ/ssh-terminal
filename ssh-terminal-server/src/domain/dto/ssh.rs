use serde::Deserialize;
use validator::Validate;

/// 创建 SSH 会话请求
#[derive(Debug, Deserialize, Validate)]
pub struct CreateSshSessionRequest {
    #[validate(length(min = 1))]
    pub name: String,
    
    #[validate(length(min = 1))]
    pub host: String,
    
    #[validate(range(min = 1, max = 65535))]
    pub port: u16,
    
    #[validate(length(min = 1))]
    pub username: String,
    
    #[serde(default = "default_group_name")]
    pub group_name: String,
    
    pub terminal_type: Option<String>,
    pub columns: Option<u16>,
    pub rows: Option<u16>,
    
    #[validate(length(min = 1))]
    pub auth_method_encrypted: String,
    
    #[validate(length(min = 1))]
    pub auth_nonce: String,
    
    pub auth_key_salt: Option<String>,
}

/// 更新 SSH 会话请求
#[derive(Debug, Deserialize, Validate)]
pub struct UpdateSshSessionRequest {
    pub name: Option<String>,
    pub host: Option<String>,
    pub port: Option<u16>,
    pub username: Option<String>,
    pub group_name: Option<String>,
    pub terminal_type: Option<String>,
    pub columns: Option<u16>,
    pub rows: Option<u16>,
    pub auth_method_encrypted: Option<String>,
    pub auth_nonce: Option<String>,
    pub auth_key_salt: Option<String>,
}

/// 分页查询请求
#[derive(Debug, Deserialize, Validate)]
pub struct ListSshSessionsRequest {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub group_name: Option<String>,
}

fn default_group_name() -> String {
    "默认分组".to_string()
}
