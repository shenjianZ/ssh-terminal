use serde::{Deserialize, Serialize};

/// 统一同步响应
#[derive(Debug, Serialize)]
pub struct SyncResponse {
    /// 服务器时间（Unix 时间戳，秒）
    pub server_time: i64,

    /// 最后同步时间（统一的）
    pub last_sync_at: i64,

    /// === Push 结果 ===
    /// 成功更新的会话 ID
    pub updated_session_ids: Vec<String>,

    /// 成功删除的会话 ID（客户端请求删除的）
    pub deleted_session_ids: Vec<String>,

    /// 服务器版本号映射（id -> server_ver）
    pub server_versions: std::collections::HashMap<String, i32>,

    /// === Pull 结果 ===
    /// 用户资料
    pub user_profile: Option<super::user::UserProfileVO>,

    /// SSH 会话列表（从服务器拉取的新数据）
    pub ssh_sessions: Vec<super::ssh::SshSessionVO>,

    /// === 冲突信息 ===
    /// 需要解决的冲突
    pub conflicts: Vec<ConflictInfo>,
}

/// 冲突信息
#[derive(Debug, Serialize, Clone)]
pub struct ConflictInfo {
    pub id: String,
    pub entity_type: String,  // "user_profile", "ssh_session"
    pub client_ver: i32,
    pub server_ver: i32,
    pub client_data: Option<serde_json::Value>,
    pub server_data: Option<serde_json::Value>,
    pub message: String,
}

/// 解决冲突响应
#[derive(Debug, Serialize)]
pub struct ResolveConflictResponse {
    pub conflict_id: String,
    pub resolved: bool,
    pub new_id: Option<String>,
    pub message: String,
}
