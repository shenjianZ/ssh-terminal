use sea_orm::entity::prelude::*;
use sea_orm::Set;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    #[sea_orm(unique)]
    pub email: String,
    pub password_hash: String,
    pub created_at: i64,
    pub updated_at: i64,

    // 新增字段：设备追踪
    pub device_id: Option<String>,
    pub last_sync_at: Option<i64>,

    // 软删除
    pub deleted_at: Option<i64>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::user_profiles::Entity")]
    UserProfiles,
    #[sea_orm(has_many = "super::ssh_sessions::Entity")]
    SshSessions,
}

impl Related<super::user_profiles::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::UserProfiles.def()
    }
}

impl Related<super::ssh_sessions::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::SshSessions.def()
    }
}

#[async_trait::async_trait]
impl ActiveModelBehavior for ActiveModel {
    /// 在保存前自动填充时间戳
    async fn before_save<C>(self, _db: &C, insert: bool) -> Result<Self, DbErr>
    where
        C: ConnectionTrait,
    {
        let mut this = self;
        let now = chrono::Utc::now().timestamp();

        if insert {
            // 插入时：设置创建时间和更新时间
            this.created_at = Set(now);
            this.updated_at = Set(now);
        } else {
            // 更新时：只更新更新时间
            this.updated_at = Set(now);
        }

        Ok(this)
    }
}
