use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, DatabaseConnection, Set, ActiveModelTrait, PaginatorTrait};
use crate::domain::entities::users;
use anyhow::Result;

/// 用户数据访问仓库
pub struct UserRepository {
    pub(crate) db: DatabaseConnection,
}

impl UserRepository {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 获取数据库连接
    pub fn get_db(&self) -> DatabaseConnection {
        self.db.clone()
    }

    /// 根据 email 查询用户
    pub async fn find_by_email(&self, email: &str) -> Result<Option<users::Model>> {
        let user = users::Entity::find()
            .filter(users::Column::Email.eq(email))
            .filter(users::Column::DeletedAt.is_null())
            .one(&self.db)
            .await
            .map_err(|e| anyhow::anyhow!("查询失败: {}", e))?;

        Ok(user)
    }

    /// 统计邮箱数量（只统计未删除的）
    pub async fn count_by_email(&self, email: &str) -> Result<i64> {
        let count = users::Entity::find()
            .filter(users::Column::Email.eq(email))
            .filter(users::Column::DeletedAt.is_null())
            .count(&self.db)
            .await
            .map_err(|e| anyhow::anyhow!("查询失败: {}", e))?;

        Ok(count as i64)
    }

    /// 统计用户 ID 数量（只统计未删除的）
    pub async fn count_by_id(&self, id: &str) -> Result<i64> {
        let count = users::Entity::find()
            .filter(users::Column::Id.eq(id))
            .filter(users::Column::DeletedAt.is_null())
            .count(&self.db)
            .await
            .map_err(|e| anyhow::anyhow!("查询失败: {}", e))?;

        Ok(count as i64)
    }

    /// 获取密码哈希（根据 user_id）
    pub async fn get_password_hash_by_id(&self, user_id: &str) -> Result<Option<String>> {
        let user = users::Entity::find_by_id(user_id)
            .filter(users::Column::DeletedAt.is_null())
            .one(&self.db)
            .await
            .map_err(|e| anyhow::anyhow!("查询失败: {}", e))?;

        Ok(user.map(|u| u.password_hash))
    }

    /// 根据 ID 查询用户（不过滤 deleted_at，用于内部检查）
    pub async fn find_by_id_raw(&self, user_id: &str) -> Result<Option<users::Model>> {
        let user = users::Entity::find_by_id(user_id)
            .one(&self.db)
            .await
            .map_err(|e| anyhow::anyhow!("查询失败: {}", e))?;

        Ok(user)
    }

    /// 获取用户邮箱（根据 user_id，只返回未删除用户的邮箱）
    pub async fn get_email_by_id(&self, user_id: &str) -> Result<Option<String>> {
        let user = users::Entity::find_by_id(user_id)
            .filter(users::Column::DeletedAt.is_null())
            .one(&self.db)
            .await
            .map_err(|e| anyhow::anyhow!("查询失败: {}", e))?;

        Ok(user.map(|u| u.email))
    }

    /// 插入用户（created_at 和 updated_at 会自动填充），返回插入后的用户对象
    /// 注意：由于 id 是 TEXT 类型，需要使用 Entity::insert() 而非 ActiveModel::insert()
    /// 以避免 SQLite last_insert_rowid() 问题
    pub async fn insert(&self, id: String, email: String, password_hash: String, device_id: String) -> Result<users::Model> {
        let user_id = id.clone();
        let now = chrono::Utc::now().timestamp();

        let user_model = users::ActiveModel {
            id: Set(id),
            email: Set(email),
            password_hash: Set(password_hash),
            device_id: Set(Some(device_id)),
            // 手动设置时间戳（Entity::insert 不会触发 ActiveModelBehavior）
            created_at: Set(now),
            updated_at: Set(now),
            ..Default::default()
        };

        // 使用 Entity::insert() 对 TEXT 主键正确处理
        users::Entity::insert(user_model)
            .exec(&self.db)
            .await
            .map_err(|e| anyhow::anyhow!("插入失败: {}", e))?;

        // 查询返回的完整用户对象（包含自动填充的时间戳）
        let user = users::Entity::find_by_id(user_id)
            .one(&self.db)
            .await
            .map_err(|e| anyhow::anyhow!("查询失败: {}", e))?
            .ok_or_else(|| anyhow::anyhow!("插入后查询失败"))?;

        Ok(user)
    }

    /// 根据 ID 删除用户（硬删除，已弃用，建议使用 soft_delete）
    pub async fn delete_by_id(&self, id: &str) -> Result<()> {
        users::Entity::delete_by_id(id)
            .exec(&self.db)
            .await
            .map_err(|e| anyhow::anyhow!("删除失败: {}", e))?;

        Ok(())
    }

    /// 根据 ID 软删除用户
    pub async fn soft_delete_by_id(&self, user_id: &str) -> Result<()> {
        let user = users::Entity::find_by_id(user_id)
            .filter(users::Column::DeletedAt.is_null())
            .one(&self.db)
            .await
            .map_err(|e| anyhow::anyhow!("查询失败: {}", e))?
            .ok_or_else(|| anyhow::anyhow!("用户不存在或已删除"))?;

        let mut user_active: users::ActiveModel = user.into();
        user_active.deleted_at = Set(Some(chrono::Utc::now().timestamp()));
        user_active.update(&self.db)
            .await
            .map_err(|e| anyhow::anyhow!("软删除失败: {}", e))?;

        Ok(())
    }
}
