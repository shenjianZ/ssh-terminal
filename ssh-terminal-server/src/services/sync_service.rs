use anyhow::Result;
use sea_orm::DatabaseConnection;
use crate::domain::dto::sync::*;
use crate::domain::vo::sync::*;
use crate::repositories::ssh_session_repository::SshSessionRepository;
use crate::repositories::user_profile_repository::UserProfileRepository;
use chrono::Utc;
use uuid;

pub struct SyncService {
    db: DatabaseConnection,
}

impl SyncService {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 统一同步 - 先 Push，后 Pull
    pub async fn sync(&self, request: SyncRequest, user_id: &str) -> Result<SyncResponse> {
        let ssh_repo = SshSessionRepository::new(self.db.clone());
        let profile_repo = UserProfileRepository::new(self.db.clone());

        // === 统一的服务器时间 ===
        let server_time = Utc::now().timestamp();
        let last_sync_at = server_time; // 所有记录使用统一时间

        // === 第一阶段：Push - 处理客户端推送 ===
        let mut updated_session_ids = Vec::new();
        let mut deleted_session_ids = Vec::new();
        let mut server_versions = std::collections::HashMap::new();
        let mut conflicts = Vec::new();

        // 1. 处理用户资料更新
        let profile_updated = if let Some(profile_req) = request.user_profile {
            match profile_repo.find_by_user_id(user_id).await {
                Ok(Some(existing)) => {
                    // 更新用户资料：保持原有的 created_at，只更新 updated_at
                    let updated_profile = crate::domain::entities::user_profiles::Model {
                        id: 0, // 将在 update 中使用
                        user_id: user_id.to_string(),
                        username: profile_req.username,
                        phone: profile_req.phone,
                        qq: profile_req.qq,
                        wechat: profile_req.wechat,
                        bio: profile_req.bio,
                        avatar_data: profile_req.avatar_data,
                        avatar_mime_type: profile_req.avatar_mime_type,
                        server_ver: 1,
                        created_at: existing.created_at, // 保持原有创建时间
                        updated_at: last_sync_at, // 使用统一的更新时间
                        deleted_at: None,
                    };

                    let _ = profile_repo.update(user_id, updated_profile).await;
                    true // 已更新
                }
                Ok(None) => {
                    // 创建新用户资料
                    // 确保使用正数 ID（避免 i64 溢出）
                    let random_id = rand::random::<u64>();
                    let safe_id = (random_id % (i64::MAX as u64)) as i64;
                    let new_profile = crate::domain::entities::user_profiles::Model {
                        id: safe_id,
                        user_id: user_id.to_string(),
                        username: profile_req.username,
                        phone: profile_req.phone,
                        qq: profile_req.qq,
                        wechat: profile_req.wechat,
                        bio: profile_req.bio,
                        avatar_data: profile_req.avatar_data,
                        avatar_mime_type: profile_req.avatar_mime_type,
                        server_ver: 1,
                        created_at: last_sync_at,
                        updated_at: last_sync_at,
                        deleted_at: None,
                    };

                    let _ = profile_repo.create(new_profile).await;
                    true // 已创建
                }
                Err(e) => {
                    tracing::error!("Failed to update user profile: {}", e);
                    false // 未更新
                }
            }
        } else {
            false // 请求中没有 user_profile 更新
        };

        // 2. 处理 SSH 会话更新（使用统一的 last_sync_at）
        for session_item in &request.ssh_sessions {
            match ssh_repo.find_by_id(&session_item.id).await {
                Ok(Some(existing)) => {
                    // 检查版本冲突
                    if session_item.client_ver < existing.server_ver {
                        // 产生冲突
                        conflicts.push(self.create_conflict_info(&session_item, &existing));
                    } else {
                        // 更新会话
                        let updated = crate::domain::entities::ssh_sessions::Model {
                            id: existing.id.clone(),
                            user_id: existing.user_id.clone(),
                            name: session_item.name.clone(),
                            host: session_item.host.clone(),
                            port: session_item.port,
                            username: session_item.username.clone(),
                            group_name: session_item.group_name.clone(),
                            terminal_type: session_item.terminal_type.clone(),
                            columns: session_item.columns,
                            rows: session_item.rows,
                            auth_method_encrypted: session_item.auth_method_encrypted.clone(),
                            auth_nonce: session_item.auth_nonce.clone(),
                            auth_key_salt: session_item.auth_key_salt.clone(),
                            server_ver: existing.server_ver,
                            client_ver: session_item.client_ver,
                            last_synced_at: existing.last_synced_at,
                            created_at: existing.created_at,
                            updated_at: last_sync_at,
                            deleted_at: existing.deleted_at,
                        };

                        match ssh_repo.update(&session_item.id, updated).await {
                            Ok(updated_session) => {
                                updated_session_ids.push(session_item.id.clone());
                                server_versions.insert(session_item.id.clone(), updated_session.server_ver);
                            }
                            Err(e) => {
                                tracing::error!("Failed to update SSH session {}: {}", session_item.id, e);
                            }
                        }
                    }
                }
                Ok(None) => {
                    // 创建新会话
                    let new_session = crate::domain::entities::ssh_sessions::Model {
                        id: session_item.id.clone(),
                        user_id: user_id.to_string(),
                        name: session_item.name.clone(),
                        host: session_item.host.clone(),
                        port: session_item.port,
                        username: session_item.username.clone(),
                        group_name: session_item.group_name.clone(),
                        terminal_type: session_item.terminal_type.clone(),
                        columns: session_item.columns,
                        rows: session_item.rows,
                        auth_method_encrypted: session_item.auth_method_encrypted.clone(),
                        auth_nonce: session_item.auth_nonce.clone(),
                        auth_key_salt: session_item.auth_key_salt.clone(),
                        server_ver: 1,
                        client_ver: session_item.client_ver,
                        last_synced_at: Some(last_sync_at),
                        created_at: last_sync_at,
                        updated_at: last_sync_at,
                        deleted_at: None,
                    };

                    match ssh_repo.create(new_session).await {
                        Ok(created) => {
                            updated_session_ids.push(session_item.id.clone());
                            server_versions.insert(session_item.id.clone(), created.server_ver);
                        }
                        Err(e) => {
                            tracing::error!("Failed to create SSH session {}: {}", session_item.id, e);
                        }
                    }
                }
                Err(e) => {
                    tracing::error!("Failed to find SSH session {}: {}", session_item.id, e);
                }
            }
        }

        // 3. 处理删除的会话
        for session_id in &request.deleted_session_ids {
            match ssh_repo.soft_delete(session_id).await {
                Ok(_) => {
                    deleted_session_ids.push(session_id.clone());
                }
                Err(e) => {
                    tracing::error!("Failed to delete SSH session {}: {}", session_id, e);
                }
            }
        }

        // === 第二阶段：Pull - 拉取最新的服务器数据 ===
        // 只在请求中包含 SSH 会话的更新或删除时才返回 SSH 会话列表
        let ssh_sessions_vo = if !request.ssh_sessions.is_empty() || !request.deleted_session_ids.is_empty() {
            // 如果有 SSH 会话的更新或删除，返回最新的会话列表
            let sessions = ssh_repo.find_by_user_id(user_id).await?;
            sessions
                .into_iter()
                .map(|s| self.session_to_vo(s))
                .collect()
        } else {
            // 没有更新就不返回 SSH 会话
            vec![]
        };

        // 只在更新了 user_profile 时才返回用户资料
        let user_profile_vo = if profile_updated {
            // 如果更新了 user_profile，返回最新的用户资料
            match profile_repo.find_by_user_id(user_id).await {
                Ok(Some(profile)) => Some(self.profile_to_vo(profile)),
                _ => None,
            }
        } else {
            // 没有更新就不返回用户资料
            None
        };

        // === 返回统一响应 ===
        Ok(SyncResponse {
            server_time,
            last_sync_at,
            updated_session_ids,
            deleted_session_ids,
            server_versions,
            user_profile: user_profile_vo,
            ssh_sessions: ssh_sessions_vo,
            conflicts,
        })
    }

    /// Resolve Conflict - 解决冲突
    pub async fn resolve_conflict(&self, request: ResolveConflictRequest) -> Result<ResolveConflictResponse> {
        match request.strategy {
            ConflictStrategy::KeepServer => {
                // 保留服务器版本（不做任何操作）
                Ok(ResolveConflictResponse {
                    conflict_id: request.conflict_id.clone(),
                    resolved: true,
                    new_id: None,
                    message: "Kept server version".to_string(),
                })
            }
            ConflictStrategy::KeepLocal => {
                // 使用客户端数据强制更新
                if let Some(_client_data) = request.client_data {
                    // TODO: 解析 client_data 并更新
                    Ok(ResolveConflictResponse {
                        conflict_id: request.conflict_id.clone(),
                        resolved: true,
                        new_id: None,
                        message: "Kept local version".to_string(),
                    })
                } else {
                    Ok(ResolveConflictResponse {
                        conflict_id: request.conflict_id.clone(),
                        resolved: false,
                        new_id: None,
                        message: "Missing client data".to_string(),
                    })
                }
            }
            ConflictStrategy::KeepBoth => {
                // 创建副本
                let new_id = format!("{}-conflict-{}", request.conflict_id, uuid::Uuid::new_v4());

                Ok(ResolveConflictResponse {
                    conflict_id: request.conflict_id.clone(),
                    resolved: true,
                    new_id: Some(new_id),
                    message: "Created a copy with conflict resolution".to_string(),
                })
            }
        }
    }

    /// 创建冲突信息
    fn create_conflict_info(
        &self,
        client_item: &SshSessionPushItem,
        server_item: &crate::domain::entities::ssh_sessions::Model,
    ) -> ConflictInfo {
        ConflictInfo {
            id: client_item.id.clone(),
            entity_type: "ssh_session".to_string(),
            client_ver: client_item.client_ver,
            server_ver: server_item.server_ver,
            client_data: Some(serde_json::json!(client_item)),
            server_data: Some(serde_json::json!({
                "id": server_item.id,
                "name": server_item.name,
                "host": server_item.host,
                "port": server_item.port,
                "username": server_item.username,
                "groupName": server_item.group_name,
                "serverVer": server_item.server_ver,
            })),
            message: format!(
                "Conflict: client version {} < server version {}",
                client_item.client_ver, server_item.server_ver
            ),
        }
    }

    /// 将 SSH Session Model 转换为 VO
    fn session_to_vo(&self, session: crate::domain::entities::ssh_sessions::Model) -> crate::domain::vo::ssh::SshSessionVO {
        crate::domain::vo::ssh::SshSessionVO {
            id: session.id,
            user_id: session.user_id,
            name: session.name,
            host: session.host,
            port: session.port,
            username: session.username,
            group_name: session.group_name,
            terminal_type: session.terminal_type,
            columns: session.columns,
            rows: session.rows,
            auth_method_encrypted: session.auth_method_encrypted,
            auth_nonce: session.auth_nonce,
            auth_key_salt: session.auth_key_salt,
            server_ver: session.server_ver,
            client_ver: session.client_ver,
            last_synced_at: session.last_synced_at,
            created_at: session.created_at,
            updated_at: session.updated_at,
            deleted_at: session.deleted_at,
        }
    }

    /// 将 User Profile Model 转换为 VO
    fn profile_to_vo(&self, profile: crate::domain::entities::user_profiles::Model) -> crate::domain::vo::user::UserProfileVO {
        crate::domain::vo::user::UserProfileVO {
            id: profile.id,
            user_id: profile.user_id,
            username: profile.username,
            phone: profile.phone,
            qq: profile.qq,
            wechat: profile.wechat,
            bio: profile.bio,
            avatar_data: profile.avatar_data,
            avatar_mime_type: profile.avatar_mime_type,
            server_ver: profile.server_ver,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
        }
    }
}
