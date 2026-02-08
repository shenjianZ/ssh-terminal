use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SessionConfig {
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub auth_method: AuthMethod,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub terminal_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub columns: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rows: Option<u16>,
    /// 是否启用严格的主机密钥验证
    #[serde(default = "default_strict_host_key_checking")]
    pub strict_host_key_checking: bool,
    /// 会话分组
    #[serde(default = "default_group")]
    pub group: String,
    /// 心跳间隔（秒），0表示禁用
    #[serde(default = "default_keep_alive_interval")]
    pub keep_alive_interval: u64,
}

/// 用于部分更新会话配置的结构体
#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SessionConfigUpdate {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub host: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auth_method: Option<AuthMethod>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub terminal_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub columns: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rows: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub strict_host_key_checking: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keep_alive_interval: Option<u64>,
}

fn default_strict_host_key_checking() -> bool {
    true // 默认启用严格的主机密钥验证
}

fn default_group() -> String {
    "默认分组".to_string()
}

fn default_keep_alive_interval() -> u64 {
    30 // 默认30秒
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub enum AuthMethod {
    Password { password: String },
    #[serde(rename_all = "camelCase")]
    PublicKey { private_key_path: String, passphrase: Option<String> },
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub enum SessionStatus {
    Disconnected,
    Connecting,
    Connected,
    Error(String),
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SessionInfo {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub status: SessionStatus,
    pub connected_at: Option<chrono::DateTime<chrono::Utc>>,
    pub group: String,
    /// 如果是连接实例，这个字段指向所属的session配置ID
    /// 如果是配置本身，这个字段为null
    #[serde(skip_serializing_if = "Option::is_none")]
    pub connection_session_id: Option<String>,
    /// 如果是连接实例且已连接，这个字段存储实际的connectionId
    #[serde(skip_serializing_if = "Option::is_none")]
    pub connection_id: Option<String>,
}
