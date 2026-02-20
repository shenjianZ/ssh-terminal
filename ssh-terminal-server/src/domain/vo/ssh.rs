use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Clone)]
pub struct SshSessionVO {
    pub id: String,
    pub user_id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub group_name: String,
    pub terminal_type: Option<String>,
    pub columns: Option<u16>,
    pub rows: Option<u16>,
    pub auth_method_encrypted: String,
    pub auth_nonce: String,
    pub auth_key_salt: Option<String>,
    pub server_ver: i32,
    pub client_ver: i32,
    pub last_synced_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>,
}

/// 分页响应
#[derive(Debug, Serialize)]
pub struct PaginatedSshSessions {
    pub data: Vec<SshSessionVO>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
}
