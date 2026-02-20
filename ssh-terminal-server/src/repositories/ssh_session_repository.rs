use anyhow::Result;
use sea_orm::{DatabaseConnection, EntityTrait, ActiveModelTrait, QueryFilter, ColumnTrait, QueryOrder};
use crate::domain::entities::ssh_sessions::{self, Entity as SshSession};

pub struct SshSessionRepository {
    db: DatabaseConnection,
}

impl SshSessionRepository {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 根据 user_id 查找所有会话
    pub async fn find_by_user_id(&self, user_id: &str) -> Result<Vec<ssh_sessions::Model>> {
        let sessions = SshSession::find()
            .filter(ssh_sessions::Column::UserId.eq(user_id))
            .filter(ssh_sessions::Column::DeletedAt.is_null())
            .order_by_desc(ssh_sessions::Column::UpdatedAt)
            .all(&self.db)
            .await?;

        Ok(sessions)
    }

    /// 根据 ID 查找会话
    pub async fn find_by_id(&self, id: &str) -> Result<Option<ssh_sessions::Model>> {
        let session = SshSession::find_by_id(id.to_string())
            .filter(ssh_sessions::Column::DeletedAt.is_null())
            .one(&self.db)
            .await?;

        Ok(session)
    }

    /// 创建会话
    /// 注意：由于 id 是 TEXT 类型，需要使用 Entity::insert() 而非 ActiveModel::insert()
    /// 以避免 SQLite last_insert_rowid() 问题
    pub async fn create(&self, session: ssh_sessions::Model) -> Result<ssh_sessions::Model> {
        let session_id = session.id.clone();
        let now = chrono::Utc::now().timestamp();

        let active_model = ssh_sessions::ActiveModel {
            id: sea_orm::Set(session.id),
            user_id: sea_orm::Set(session.user_id),
            name: sea_orm::Set(session.name),
            host: sea_orm::Set(session.host),
            port: sea_orm::Set(session.port),
            username: sea_orm::Set(session.username),
            group_name: sea_orm::Set(session.group_name),
            terminal_type: sea_orm::Set(session.terminal_type),
            columns: sea_orm::Set(session.columns),
            rows: sea_orm::Set(session.rows),
            auth_method_encrypted: sea_orm::Set(session.auth_method_encrypted),
            auth_nonce: sea_orm::Set(session.auth_nonce),
            auth_key_salt: sea_orm::Set(session.auth_key_salt),
            server_ver: sea_orm::Set(session.server_ver),
            client_ver: sea_orm::Set(session.client_ver),
            last_synced_at: sea_orm::Set(session.last_synced_at),
            // 手动设置时间戳（Entity::insert 不会触发 ActiveModelBehavior）
            created_at: sea_orm::Set(now),
            updated_at: sea_orm::Set(now),
            deleted_at: sea_orm::Set(session.deleted_at),
        };

        // 使用 Entity::insert() 对 TEXT 主键正确处理
        SshSession::insert(active_model)
            .exec(&self.db)
            .await?;

        // 查询返回的完整对象
        let result = SshSession::find_by_id(session_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| anyhow::anyhow!("插入后查询失败"))?;

        Ok(result)
    }

    /// 更新会话
    pub async fn update(&self, id: &str, mut session: ssh_sessions::Model) -> Result<ssh_sessions::Model> {
        let existing = self.find_by_id(id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("SSH session not found"))?;

        // 在应用层设置当前时间
        let now = chrono::Utc::now().timestamp();

        let active_model = ssh_sessions::ActiveModel {
            id: sea_orm::Set(existing.id),
            user_id: sea_orm::Set(existing.user_id),
            name: sea_orm::Set(session.name),
            host: sea_orm::Set(session.host),
            port: sea_orm::Set(session.port),
            username: sea_orm::Set(session.username),
            group_name: sea_orm::Set(session.group_name),
            terminal_type: sea_orm::Set(session.terminal_type),
            columns: sea_orm::Set(session.columns),
            rows: sea_orm::Set(session.rows),
            auth_method_encrypted: sea_orm::Set(session.auth_method_encrypted),
            auth_nonce: sea_orm::Set(session.auth_nonce),
            auth_key_salt: sea_orm::Set(session.auth_key_salt),
            server_ver: sea_orm::Set(existing.server_ver + 1), // 应用层递增
            client_ver: sea_orm::Set(session.client_ver),
            last_synced_at: sea_orm::Set(session.last_synced_at),
            created_at: sea_orm::Set(existing.created_at),
            updated_at: sea_orm::Set(now), // 应用层更新时间戳
            deleted_at: sea_orm::Set(existing.deleted_at),
        };

        let result = active_model.update(&self.db).await?;
        Ok(result)
    }

    /// 软删除会话
    pub async fn soft_delete(&self, id: &str) -> Result<()> {
        let existing = self.find_by_id(id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("SSH session not found"))?;

        let now = chrono::Utc::now().timestamp();
        let active_model = ssh_sessions::ActiveModel {
            id: sea_orm::Set(existing.id),
            user_id: sea_orm::Set(existing.user_id),
            name: sea_orm::Set(existing.name),
            host: sea_orm::Set(existing.host),
            port: sea_orm::Set(existing.port),
            username: sea_orm::Set(existing.username),
            group_name: sea_orm::Set(existing.group_name),
            terminal_type: sea_orm::Set(existing.terminal_type),
            columns: sea_orm::Set(existing.columns),
            rows: sea_orm::Set(existing.rows),
            auth_method_encrypted: sea_orm::Set(existing.auth_method_encrypted),
            auth_nonce: sea_orm::Set(existing.auth_nonce),
            auth_key_salt: sea_orm::Set(existing.auth_key_salt),
            server_ver: sea_orm::Set(existing.server_ver),
            client_ver: sea_orm::Set(existing.client_ver),
            last_synced_at: sea_orm::Set(existing.last_synced_at),
            created_at: sea_orm::Set(existing.created_at),
            updated_at: sea_orm::Set(existing.updated_at),
            deleted_at: sea_orm::Set(Some(now)),
        };

        active_model.update(&self.db).await?;
        Ok(())
    }

    /// 批量创建会话
    pub async fn batch_create(&self, sessions: Vec<ssh_sessions::Model>) -> Result<Vec<ssh_sessions::Model>> {
        let mut results = Vec::new();
        
        for session in sessions {
            let result = self.create(session).await?;
            results.push(result);
        }
        
        Ok(results)
    }
}
