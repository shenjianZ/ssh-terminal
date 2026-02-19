use sea_orm::entity::prelude::*;
use sea_orm::Set;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "user_profiles")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,

    #[sea_orm(unique)]
    pub user_id: String,

    // 用户资料信息
    pub username: Option<String>,
    pub phone: Option<String>,
    pub qq: Option<String>,
    pub wechat: Option<String>,
    pub bio: Option<String>,

    // 头像（Base64 编码）
    pub avatar_data: Option<String>,
    pub avatar_mime_type: Option<String>,

    // 时间戳
    pub created_at: i64,
    pub updated_at: i64,

    // 同步字段
    pub server_ver: i32,
    pub deleted_at: Option<i64>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::users::Entity",
        from = "Column::UserId",
        to = "super::users::Column::Id"
    )]
    User,
}

impl Related<super::users::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

#[async_trait::async_trait]
impl ActiveModelBehavior for ActiveModel {
    async fn before_save<C>(self, _db: &C, insert: bool) -> Result<Self, DbErr>
    where
        C: ConnectionTrait,
    {
        let mut this = self;
        let now = chrono::Utc::now().timestamp();

        if insert {
            this.created_at = Set(now);
            this.updated_at = Set(now);
            this.server_ver = Set(1);  // 初始版本
            // 如果没有设置 ID，生成一个（确保为正数，因为 sea-orm 的 last_insert_rowid 不支持负数）
            if this.id.is_unchanged() {
                let random_id = rand::random::<u64>();
                let safe_id = (random_id % (i64::MAX as u64)) as i64;
                this.id = Set(safe_id);
            }
        } else {
            this.updated_at = Set(now);
        }

        Ok(this)
    }
}
