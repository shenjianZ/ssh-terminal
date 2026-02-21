use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ==================== 服务器请求类型（snake_case 格式）====================

/// 统一同步请求（发送给服务器）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncRequest {
    /// 最后同步时间（用于拉取）
    pub last_sync_at: Option<i64>,
    /// 设备 ID
    pub device_id: String,
    /// 用户资料更新（可选）
    pub user_profile: Option<crate::models::user_profile::ServerUpdateProfileRequest>,
    /// SSH 会话更新
    pub ssh_sessions: Vec<SshSessionPushItem>,
    /// 删除的会话 ID
    pub deleted_session_ids: Vec<String>,
}

/// SSH 会话推送项（snake_case 格式，用于与服务器通信）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshSessionPushItem {
    pub id: String,
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
    pub client_ver: i32,
    pub created_at: i64,
    pub updated_at: i64,
}

/// 更新用户资料请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProfileRequest {
    pub username: Option<String>,
    pub phone: Option<String>,
    pub qq: Option<String>,
    pub wechat: Option<String>,
    pub bio: Option<String>,
    pub avatar_data: Option<String>,
    pub avatar_mime_type: Option<String>,
}

// ==================== 客户端类型（用于 Tauri 命令）====================

/// 同步报告
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncReport {
    pub success: bool,
    pub last_sync_at: i64,
    pub pushed_sessions: usize,
    pub pulled_sessions: usize,
    pub conflict_count: usize,
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_session_ids: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

/// 同步状态
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncStatus {
    pub user_id: String,
    pub last_sync_at: Option<i64>,
    pub pending_count: i32,
    pub conflict_count: i32,
    pub last_error: Option<String>,
}

/// 冲突信息（客户端格式）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictInfo {
    pub id: String,
    pub entity_type: String,
    pub local_version: i32,
    pub server_version: i32,
    pub message: String,
}

/// 冲突解决策略
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ConflictStrategy {
    KeepBoth,   // 保留两个版本
    KeepServer, // 保留服务器版本
    KeepLocal,  // 保留本地版本
}

impl Default for ConflictStrategy {
    fn default() -> Self {
        ConflictStrategy::KeepBoth
    }
}

/// 冲突解决请求（发送给服务器）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolveConflictRequest {
    pub conflict_id: String,
    pub strategy: ConflictStrategy,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub client_data: Option<serde_json::Value>,
}

// ==================== 服务器响应类型（snake_case 格式）====================

/// 统一同步响应（来自服务器）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerSyncResponse {
    /// 服务器时间
    pub server_time: i64,
    /// 最后同步时间
    pub last_sync_at: i64,
    /// Push 结果
    pub updated_session_ids: Vec<String>,
    pub deleted_session_ids: Vec<String>,
    pub server_versions: HashMap<String, i32>,
    /// Pull 结果
    pub user_profile: Option<crate::models::user_profile::ServerUserProfile>,
    pub ssh_sessions: Vec<crate::models::ServerSshSession>,
    /// 冲突信息
    pub conflicts: Vec<ServerConflictInfo>,
    /// 消息
    pub message: Option<String>,
}

/// 服务器冲突信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConflictInfo {
    pub id: String,
    pub entity_type: String,
    pub client_ver: i32,
    pub server_ver: i32,
    pub client_data: Option<serde_json::Value>,
    pub server_data: Option<serde_json::Value>,
    pub message: String,
}

/// 服务器解决冲突响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerResolveConflictResponse {
    pub conflict_id: String,
    pub resolved: bool,
    pub new_id: Option<String>,
    pub message: String,
}
