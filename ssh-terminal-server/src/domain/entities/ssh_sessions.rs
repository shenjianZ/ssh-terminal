use sea_orm::entity::prelude::*;
use sea_orm::Set;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "ssh_sessions")]
#[serde(rename_all = "camelCase")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    pub user_id: String,

    // SSH 基本信息
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub group_name: String,
    pub terminal_type: Option<String>,
    pub columns: Option<u16>,
    pub rows: Option<u16>,

    // 认证信息（加密存储）
    // 客户端使用用户密码加密后上传，服务器使用服务器密钥二次加密
    pub auth_method_encrypted: String,
    pub auth_nonce: String,
    pub auth_key_salt: Option<String>,

    // 同步控制
    pub server_ver: i32,
    pub client_ver: i32,
    pub last_synced_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,

    // 软删除
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
            this.server_ver = Set(1);
            this.client_ver = Set(0);
        } else {
            this.updated_at = Set(now);
            // 注意：server_ver 的递增由数据库触发器处理
        }

        Ok(this)
    }
}
