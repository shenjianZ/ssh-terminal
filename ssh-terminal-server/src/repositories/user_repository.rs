use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, DatabaseConnection, Set, ActiveModelTrait, PaginatorTrait, Insert};
use crate::domain::entities::users;
use anyhow::Result;

/// 用户数据访问仓库
pub struct UserRepository {
    db: DatabaseConnection,
}

impl UserRepository {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 根据 email 查询用户
    pub async fn find_by_email(&self, email: &str) -> Result<Option<users::Model>> {
        let user = users::Entity::find()
            .filter(users::Column::Email.eq(email))
            .one(&self.db)
            .await
            .map_err(|e| anyhow::anyhow!("查询失败: {}", e))?;

        Ok(user)
    }

    /// 统计邮箱数量
    pub async fn count_by_email(&self, email: &str) -> Result<i64> {
        let count = users::Entity::find()
            .filter(users::Column::Email.eq(email))
            .count(&self.db)
            .await
            .map_err(|e| anyhow::anyhow!("查询失败: {}", e))?;

        Ok(count as i64)
    }

    /// 统计用户 ID 数量
    pub async fn count_by_id(&self, id: &str) -> Result<i64> {
        let count = users::Entity::find()
            .filter(users::Column::Id.eq(id))
            .count(&self.db)
            .await
            .map_err(|e| anyhow::anyhow!("查询失败: {}", e))?;

        Ok(count as i64)
    }

    /// 获取密码哈希
    pub async fn get_password_hash(&self, email: &str) -> Result<Option<String>> {
        let user = users::Entity::find()
            .filter(users::Column::Email.eq(email))
            .one(&self.db)
            .await
            .map_err(|e| anyhow::anyhow!("查询失败: {}", e))?;

        Ok(user.map(|u| u.password_hash))
    }

    /// 插入用户（created_at 和 updated_at 会自动填充），返回插入后的用户对象
    /// 注意：由于 id 是 TEXT 类型，需要使用 Entity::insert() 而非 ActiveModel::insert()
    /// 以避免 SQLite last_insert_rowid() 问题
    pub async fn insert(&self, id: String, email: String, password_hash: String) -> Result<users::Model> {
        let user_id = id.clone();
        let now = chrono::Utc::now().timestamp();

        let user_model = users::ActiveModel {
            id: Set(id),
            email: Set(email),
            password_hash: Set(password_hash),
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

    /// 根据 ID 删除用户
    pub async fn delete_by_id(&self, id: &str) -> Result<()> {
        users::Entity::delete_by_id(id)
            .exec(&self.db)
            .await
            .map_err(|e| anyhow::anyhow!("删除失败: {}", e))?;

        Ok(())
    }
}
