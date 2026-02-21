use anyhow::Result;
use anyhow::anyhow;

use crate::database::repositories::{SshSessionRepository, SyncStateRepository, UserAuthRepository};
use crate::database::DbPool;
use crate::models::sync::*;
use crate::models::SshSession;
use crate::services::api_client::ApiClient;
use crate::commands::auth::ApiClientStateWrapper;

/// 同步选项
#[derive(Debug, Clone, Default)]
pub enum SyncOptions {
    /// 同步会话
    #[default]
    SyncSessions,
    /// 同步用户资料
    SyncProfile,
    /// 同步所有内容
    SyncAll,
    /// 不推送任何内容，仅拉取
    PullOnly,
}

/// 同步服务
pub struct SyncService {
    pool: DbPool,
    api_client_state: Option<ApiClientStateWrapper>,
}

impl SyncService {
    /// 创建新的同步服务实例
    pub fn new(pool: DbPool, api_client_state: Option<ApiClientStateWrapper>) -> Self {
        Self {
            pool,
            api_client_state,
        }
    }

    /// 获取 API 客户端
    fn get_api_client(&self) -> Result<ApiClient> {
        match &self.api_client_state {
            Some(state) => {
                state.get_client()
            }
            None => {
                Err(anyhow!("API client state not available - missing from service initialization"))
            }
        }
    }

    /// 通用同步方法（根据选项同步不同内容）
    pub async fn full_sync(&self, options: SyncOptions) -> Result<SyncReport> {
        tracing::info!("Starting sync with options: {:?}", options);

        // 1. 检查是否有用户登录
        let auth_repo = UserAuthRepository::new(self.pool.clone());
        let current_user = auth_repo.find_current()?
            .ok_or_else(|| anyhow::anyhow!("No user logged in"))?;

        // 2. 获取最后同步时间和脏数据（使用用户级别的同步状态）
        let state_repo = SyncStateRepository::new(self.pool.clone());
        let last_sync_at = state_repo.get(&current_user.user_id)?.last_sync_at;
        let device_id = current_user.device_id;

        // 3. 根据选项获取需要推送的数据
        let session_repo = SshSessionRepository::new(self.pool.clone());
        let (dirty_sessions, deleted_session_ids, user_profile_update) = match options {
            SyncOptions::SyncSessions => {
                let sessions = session_repo.get_dirty_sessions(&current_user.user_id)?;
                let deleted = session_repo.get_deleted_sessions(&current_user.user_id)?;
                (sessions, deleted, None)
            }
            SyncOptions::SyncProfile => {
                // 获取用户资料更新
                let profile_repo = crate::database::repositories::UserProfileRepository::new(self.pool.clone());
                let profile = profile_repo.find_by_user_id(&current_user.user_id)?
                    .map(|p| crate::models::user_profile::ServerUpdateProfileRequest {
                        username: p.username,
                        phone: p.phone,
                        qq: p.qq,
                        wechat: p.wechat,
                        bio: p.bio,
                        avatar_data: p.avatar_data,
                        avatar_mime_type: p.avatar_mime_type,
                    });
                (vec![], vec![], profile)
            }
            SyncOptions::SyncAll => {
                let sessions = session_repo.get_dirty_sessions(&current_user.user_id)?;
                let deleted = session_repo.get_deleted_sessions(&current_user.user_id)?;
                let profile_repo = crate::database::repositories::UserProfileRepository::new(self.pool.clone());
                let profile = profile_repo.find_by_user_id(&current_user.user_id)?
                    .map(|p| crate::models::user_profile::ServerUpdateProfileRequest {
                        username: p.username,
                        phone: p.phone,
                        qq: p.qq,
                        wechat: p.wechat,
                        bio: p.bio,
                        avatar_data: p.avatar_data,
                        avatar_mime_type: p.avatar_mime_type,
                    });
                (sessions, deleted, profile)
            }
            SyncOptions::PullOnly => {
                // 不推送任何内容，只拉取
                (vec![], vec![], None)
            }
        };

        // 4. 构建统一请求
        let request = self.build_sync_request_with_options(
            &current_user.user_id,
            last_sync_at,
            device_id,
            dirty_sessions,
            user_profile_update,
            deleted_session_ids,
        )?;

        // 5. 调用统一同步 API
        let response = self.get_api_client()?.sync(&request).await?;

        // 6. 应用 Pull 结果
        let ssh_sessions_len = response.ssh_sessions.len();
        self.apply_pull_data(&response, &current_user.user_id)?;

        // 7. 处理 Push 结果
        self.apply_push_result(&response, &current_user.user_id)?;

        // 8. 清理脏标记
        if matches!(options, SyncOptions::SyncSessions | SyncOptions::SyncAll) {
            let session_repo = SshSessionRepository::new(self.pool.clone());

            // 清理更新会话的脏标记
            let dirty_sessions = session_repo.get_dirty_sessions(&current_user.user_id)?;
            for session in &dirty_sessions {
                session_repo.clear_dirty_marker(&session.id, response.last_sync_at)?;
            }

            // 清理已删除会话的脏标记
            let deleted_sessions = session_repo.get_deleted_sessions(&current_user.user_id)?;
            for session_id in &deleted_sessions {
                session_repo.clear_dirty_marker(session_id, response.last_sync_at)?;
            }

            // 更新用户的最后同步时间
            let auth_repo = UserAuthRepository::new(self.pool.clone());
            auth_repo.update_last_sync(&current_user.user_id, response.last_sync_at)?;
        }

        // 9. 更新同步状态（使用用户级别）
        state_repo.update_last_sync(&current_user.user_id, response.last_sync_at)?;
        state_repo.update_conflict_count(&current_user.user_id, response.conflicts.len() as i32)?;
        state_repo.update_last_error(&current_user.user_id, None)?;

        tracing::info!("Sync completed successfully");

        Ok(SyncReport {
            success: true,
            last_sync_at: response.last_sync_at,
            pushed_sessions: response.updated_session_ids.len(),
            pulled_sessions: ssh_sessions_len,
            conflict_count: response.conflicts.len(),
            error: None,
            updated_session_ids: Some(response.updated_session_ids),
            message: response.message,
        })
    }

    /// 只同步会话
    pub async fn sync_sessions(&self) -> Result<SyncReport> {
        self.full_sync(SyncOptions::SyncSessions).await
    }

    /// 只同步用户资料
    pub async fn sync_profile(&self) -> Result<SyncReport> {
        self.full_sync(SyncOptions::SyncProfile).await
    }

    /// 同步所有内容
    pub async fn sync_all(&self) -> Result<SyncReport> {
        self.full_sync(SyncOptions::SyncAll).await
    }

    /// 只拉取，不推送
    pub async fn pull_only(&self) -> Result<SyncReport> {
        self.full_sync(SyncOptions::PullOnly).await
    }

    /// 构建统一同步请求
    fn build_sync_request(
        &self,
        user_id: &str,
        last_sync_at: Option<i64>,
        device_id: String,
        dirty_sessions: Vec<SshSession>,
    ) -> Result<SyncRequest> {
        self.build_sync_request_with_options(user_id, last_sync_at, device_id, dirty_sessions, None, Vec::new())
    }

    /// 构建统一同步请求（带用户资料选项）
    fn build_sync_request_with_options(
        &self,
        user_id: &str,
        last_sync_at: Option<i64>,
        device_id: String,
        dirty_sessions: Vec<SshSession>,
        user_profile: Option<crate::models::user_profile::ServerUpdateProfileRequest>,
        deleted_session_ids: Vec<String>,
    ) -> Result<SyncRequest> {
        // 转换脏会话
        let ssh_sessions: Vec<SshSessionPushItem> = dirty_sessions
            .into_iter()
            .map(|s| SshSessionPushItem {
                id: s.id,
                name: s.name,
                host: s.host,
                port: s.port,
                username: s.username,
                group_name: s.group_name,
                terminal_type: s.terminal_type,
                columns: s.columns,
                rows: s.rows,
                auth_method_encrypted: s.auth_method_encrypted,
                auth_nonce: s.auth_nonce,
                auth_key_salt: s.auth_key_salt,
                client_ver: s.client_ver,
                created_at: s.created_at,
                updated_at: s.updated_at,
            })
            .collect();

        Ok(SyncRequest {
            last_sync_at,
            device_id,
            user_profile,
            ssh_sessions,
            deleted_session_ids,
        })
    }

    /// 应用 Pull 数据
    fn apply_pull_data(&self, response: &ServerSyncResponse, user_id: &str) -> Result<()> {
        let session_repo = SshSessionRepository::new(self.pool.clone());

        // 1. 应用 SSH 会话数据
        for server_session in &response.ssh_sessions {
            // 检查本地版本
            if let Some(local_session) = session_repo.find_by_id(&server_session.id)? {
                // 版本冲突检测
                if local_session.server_ver >= server_session.server_ver {
                    tracing::info!("Skipping server session (local version is newer or same)");
                    continue;
                }
            }

            // 应用服务器版本
            let local_session: crate::models::SshSession = server_session.clone().into();
            if let Some(existing) = session_repo.find_by_id(&server_session.id)? {
                // 更新现有会话（保留本地 is_dirty 和 is_deleted 状态）
                let mut updated = local_session;
                updated.is_dirty = existing.is_dirty;
                updated.is_deleted = existing.is_deleted;
                updated.deleted_at = existing.deleted_at;
                let _ = session_repo.update(&updated);
            } else {
                // 创建新会话
                let _ = session_repo.create(&local_session);
            }
        }

        // 2. 应用用户资料
        if let Some(server_profile) = &response.user_profile {
            let profile_repo = crate::database::repositories::UserProfileRepository::new(self.pool.clone());
            // 转换 ServerUserProfile 为 UserProfile 并保存
            let profile: crate::models::user_profile::UserProfile = server_profile.clone().into();
            let _ = profile_repo.save(&profile);
        }

        Ok(())
    }

    /// 应用 Push 结果
    fn apply_push_result(&self, response: &ServerSyncResponse, user_id: &str) -> Result<()> {
        let session_repo = SshSessionRepository::new(self.pool.clone());

        // 更新服务器版本号
        for (id, server_ver) in &response.server_versions {
            if let Some(mut session) = session_repo.find_by_id(id)? {
                session.server_ver = *server_ver;
                session.last_synced_at = Some(response.last_sync_at);
                let _ = session_repo.update(&session);
            }
        }

        // 更新同步状态
        let state_repo = SyncStateRepository::new(self.pool.clone());
        state_repo.update_conflict_count(user_id, response.conflicts.len() as i32)?;

        Ok(())
    }

    /// 解决冲突（内部实现）
    fn resolve_conflict(&self, conflict: &ConflictInfo, user_id: &str) -> Result<()> {
        tracing::warn!(
            "Conflict detected for {}: {} (local: v{}, server: v{})",
            conflict.entity_type, conflict.id, conflict.local_version, conflict.server_version
        );

        // TODO: 实现冲突解决策略
        // 当前为 stub 实现，记录冲突但不处理

        Ok(())
    }

    /// 解决冲突（API 调用）
    pub async fn resolve_conflict_api(&self, conflict_id: String, strategy: ConflictStrategy) -> Result<SyncReport> {
        tracing::info!("Resolving conflict {} with strategy {:?}", conflict_id, strategy);

        // 获取 API 客户端
        let api_client = self.get_api_client()?;

        // 调用服务器 resolve-conflict API
        let request = ResolveConflictRequest {
            conflict_id: conflict_id.clone(),
            strategy,
            client_data: None,
        };

        let resolve_response = api_client.resolve_conflict(&request).await?;

        // 如果有新创建的 ID 或者需要获取更新后的数据，需要重新拉取
        let mut report = SyncReport {
            success: resolve_response.resolved,
            last_sync_at: chrono::Utc::now().timestamp(),
            pushed_sessions: 0,
            pulled_sessions: 0,
            conflict_count: 0,
            error: Some(resolve_response.message.clone()),
            updated_session_ids: None,
            message: Some(resolve_response.message),
        };

        // 获取当前用户 ID 和设备 ID
        let auth_repo = UserAuthRepository::new(self.pool.clone());
        let current_user = auth_repo.find_current()?
            .ok_or_else(|| anyhow::anyhow!("No user logged in"))?;
        let device_id = current_user.device_id;

        // 如果冲突已解决，重新拉取数据
        if resolve_response.resolved {
            // 获取脏会话
            let session_repo = SshSessionRepository::new(self.pool.clone());
            let dirty_sessions = session_repo.get_dirty_sessions(&current_user.user_id)?;

            // 获取已删除会话
            let deleted_session_ids = session_repo.get_deleted_sessions(&current_user.user_id)?;

            // 构建统一请求（不指定 last_sync_at，拉取所有数据）
            let request = self.build_sync_request_with_options(
                &current_user.user_id,
                None,
                device_id,
                dirty_sessions,
                None,
                deleted_session_ids,
            )?;

            let sync_response = api_client.sync(&request).await?;

            // 应用拉取的数据
            let ssh_sessions_len = sync_response.ssh_sessions.len();
            self.apply_pull_data(&sync_response, &current_user.user_id)?;

            // 处理 Push 结果
            self.apply_push_result(&sync_response, &current_user.user_id)?;

            // 更新同步状态
            let state_repo = SyncStateRepository::new(self.pool.clone());
            state_repo.update_last_sync(&current_user.user_id, sync_response.last_sync_at)?;
            state_repo.update_conflict_count(&current_user.user_id, sync_response.conflicts.len() as i32)?;
            state_repo.update_last_error(&current_user.user_id, None)?;

            report = SyncReport {
                success: true,
                last_sync_at: sync_response.last_sync_at,
                pushed_sessions: sync_response.updated_session_ids.len(),
                pulled_sessions: ssh_sessions_len,
                conflict_count: sync_response.conflicts.len(),
                error: None,
                updated_session_ids: resolve_response.new_id.map(|id| vec![id]),
                message: sync_response.message,
            };
        }

        Ok(report)
    }

    /// 获取同步状态
    pub fn get_sync_status(&self) -> Result<SyncStatus> {
        let auth_repo = UserAuthRepository::new(self.pool.clone());
        let current_user = auth_repo.find_current()?
            .ok_or_else(|| anyhow::anyhow!("No user logged in"))?;

        let state_repo = SyncStateRepository::new(self.pool.clone());
        state_repo.get(&current_user.user_id)
    }

    /// 手动触发同步（返回 Future）
    pub fn sync_now(&self) -> Result<SyncReport> {
        // 注意：由于 async，实际使用时需要在 async 上下文中调用
        // 这里提供一个同步的 stub 版本
        Ok(SyncReport {
            success: false,
            last_sync_at: 0,
            pushed_sessions: 0,
            pulled_sessions: 0,
            conflict_count: 0,
            error: Some("Use async full_sync instead".to_string()),
            updated_session_ids: None,
            message: Some("Use async full_sync instead".to_string()),
        })
    }
}
