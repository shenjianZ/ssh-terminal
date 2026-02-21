use anyhow::Result;
use sea_orm::{DatabaseConnection, EntityTrait, QueryFilter, ColumnTrait, ActiveModelTrait, Set};
use crate::domain::entities::user_profiles::{self, Entity as UserProfile};

pub struct UserProfileRepository {
    db: DatabaseConnection,
}

impl UserProfileRepository {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 根据 user_id 查找用户资料
    pub async fn find_by_user_id(&self, user_id: &str) -> Result<Option<user_profiles::Model>> {
        let profile = UserProfile::find()
            .filter(user_profiles::Column::UserId.eq(user_id))
            .filter(user_profiles::Column::DeletedAt.is_null())
            .one(&self.db)
            .await?;

        Ok(profile)
    }

    /// 根据 user_id 查找指定时间之后更新的用户资料（增量查询）
    pub async fn find_by_user_id_updated_after(&self, user_id: &str, after: i64) -> Result<Option<user_profiles::Model>> {
        let profile = UserProfile::find()
            .filter(user_profiles::Column::UserId.eq(user_id))
            .filter(user_profiles::Column::UpdatedAt.gt(after))
            .filter(user_profiles::Column::DeletedAt.is_null())
            .one(&self.db)
            .await?;

        Ok(profile)
    }

    /// 创建用户资料
    /// 注意：由于 id 是自增主键（i64），需要使用 Entity::insert() + 手动查询
    /// 以避免 SQLite last_insert_rowid() 问题
    pub async fn create(&self, profile: user_profiles::Model) -> Result<user_profiles::Model> {
        let profile_id = profile.id;
        let now = chrono::Utc::now().timestamp();

        let active_model = user_profiles::ActiveModel {
            id: Set(profile.id),
            user_id: Set(profile.user_id),
            username: Set(profile.username),
            phone: Set(profile.phone),
            qq: Set(profile.qq),
            wechat: Set(profile.wechat),
            bio: Set(profile.bio),
            avatar_data: Set(profile.avatar_data),
            avatar_mime_type: Set(profile.avatar_mime_type),
            server_ver: Set(profile.server_ver),
            // 手动设置时间戳（Entity::insert 不会触发 ActiveModelBehavior）
            created_at: Set(now),
            updated_at: Set(now),
            deleted_at: Set(profile.deleted_at),
        };

        // 使用 Entity::insert() 对自增主键正确处理
        UserProfile::insert(active_model)
            .exec(&self.db)
            .await
            .map_err(|e| anyhow::anyhow!("插入失败: {}", e))?;

        // 查询返回的完整 profile 对象
        let result = UserProfile::find_by_id(profile_id)
            .one(&self.db)
            .await
            .map_err(|e| anyhow::anyhow!("查询失败: {}", e))?
            .ok_or_else(|| anyhow::anyhow!("插入后查询失败"))?;

        Ok(result)
    }

    /// 更新用户资料
    pub async fn update(&self, user_id: &str, mut profile: user_profiles::Model) -> Result<user_profiles::Model> {
        let existing = self.find_by_user_id(user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("User profile not found"))?;

        // 在应用层设置当前时间
        let now = chrono::Utc::now().timestamp();

        let active_model = user_profiles::ActiveModel {
            id: sea_orm::Set(existing.id),
            user_id: sea_orm::Set(existing.user_id),
            username: sea_orm::Set(profile.username),
            phone: sea_orm::Set(profile.phone),
            qq: sea_orm::Set(profile.qq),
            wechat: sea_orm::Set(profile.wechat),
            bio: sea_orm::Set(profile.bio),
            avatar_data: sea_orm::Set(profile.avatar_data),
            avatar_mime_type: sea_orm::Set(profile.avatar_mime_type),
            server_ver: sea_orm::Set(existing.server_ver + 1),
            created_at: sea_orm::Set(existing.created_at),
            updated_at: sea_orm::Set(now), // 应用层更新时间戳
            deleted_at: sea_orm::Set(existing.deleted_at),
        };

        let result = active_model.update(&self.db).await?;
        Ok(result)
    }

    /// 软删除用户资料
    pub async fn soft_delete(&self, user_id: &str) -> Result<()> {
        let existing = self.find_by_user_id(user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("User profile not found"))?;

        let now = chrono::Utc::now().timestamp();
        let active_model = user_profiles::ActiveModel {
            id: sea_orm::Set(existing.id),
            user_id: sea_orm::Set(existing.user_id),
            username: sea_orm::Set(existing.username),
            phone: sea_orm::Set(existing.phone),
            qq: sea_orm::Set(existing.qq),
            wechat: sea_orm::Set(existing.wechat),
            bio: sea_orm::Set(existing.bio),
            avatar_data: sea_orm::Set(existing.avatar_data),
            avatar_mime_type: sea_orm::Set(existing.avatar_mime_type),
            server_ver: sea_orm::Set(existing.server_ver),
            created_at: sea_orm::Set(existing.created_at),
            updated_at: sea_orm::Set(existing.updated_at),
            deleted_at: sea_orm::Set(Some(now)),
        };

        active_model.update(&self.db).await?;
        Ok(())
    }
}
