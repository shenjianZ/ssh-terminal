use anyhow::Result;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand::Rng;

use crate::utils::jwt::TokenService;
use crate::domain::dto::auth::{RegisterRequest, LoginRequest, DeleteUserRequest};
use crate::domain::entities::users;
use crate::domain::entities::user_profiles;
use crate::config::auth::AuthConfig;
use crate::infra::redis::{redis_client::RedisClient, redis_key::{BusinessType, RedisKey}};
use crate::repositories::user_repository::UserRepository;
use crate::repositories::user_profile_repository::UserProfileRepository;

pub struct AuthService {
    user_repo: UserRepository,
    user_profile_repo: UserProfileRepository,
    redis_client: RedisClient,
    auth_config: AuthConfig,
}

impl AuthService {
    pub fn new(
        user_repo: UserRepository,
        user_profile_repo: UserProfileRepository,
        redis_client: RedisClient,
        auth_config: AuthConfig,
    ) -> Self {
        Self {
            user_repo,
            user_profile_repo,
            redis_client,
            auth_config,
        }
    }

    /// 哈希密码
    pub fn hash_password(&self, password: &str) -> Result<String> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| anyhow::anyhow!("密码哈希失败: {}", e))?
            .to_string();
        Ok(password_hash)
    }

    /// 生成用户 ID
    pub fn generate_user_id(&self) -> String {
        let mut rng = rand::thread_rng();
        rng.gen_range(1_000_000_000i64..10_000_000_000i64)
            .to_string()
    }

    /// 生成唯一的用户 ID
    pub async fn generate_unique_user_id(&self) -> Result<String> {
        let mut attempts = 0;
        const MAX_ATTEMPTS: u32 = 10;

        loop {
            let candidate_id = self.generate_user_id();

            let existing = self.user_repo.count_by_id(&candidate_id).await?;
            if existing == 0 {
                return Ok(candidate_id);
            }

            attempts += 1;
            if attempts >= MAX_ATTEMPTS {
                return Err(anyhow::anyhow!("生成唯一用户 ID 失败"));
            }
        }
    }

    /// 保存 refresh_token 到 Redis
    async fn save_refresh_token(&self, user_id: &str, refresh_token: &str, expiration_days: i64) -> Result<()> {
        let key = RedisKey::new(BusinessType::Auth)
            .add_identifier("refresh_token")
            .add_identifier(user_id);

        let expiration_seconds = expiration_days * 24 * 3600;

        self.redis_client
            .set_ex(&key.build(), refresh_token, expiration_seconds as u64)
            .await
            .map_err(|e| anyhow::anyhow!("Redis 保存失败: {}", e))?;

        Ok(())
    }

    /// 获取并删除 refresh_token
    async fn get_and_delete_refresh_token(&self, user_id: &str) -> Result<String> {
        let key = RedisKey::new(BusinessType::Auth)
            .add_identifier("refresh_token")
            .add_identifier(user_id);

        let token: Option<String> = self.redis_client
            .get(&key.build())
            .await
            .map_err(|e| anyhow::anyhow!("Redis 查询失败: {}", e))?;

        if token.is_some() {
            self.redis_client
                .delete_key(&key)
                .await
                .map_err(|e| anyhow::anyhow!("Redis 删除失败: {}", e))?;
        }

        token.ok_or_else(|| anyhow::anyhow!("刷新令牌无效或已过期"))
    }

    /// 删除用户的 refresh_token
    pub async fn delete_refresh_token(&self, user_id: &str) -> Result<()> {
        let key = RedisKey::new(BusinessType::Auth)
            .add_identifier("refresh_token")
            .add_identifier(user_id);

        self.redis_client
            .delete_key(&key)
            .await
            .map_err(|e| anyhow::anyhow!("Redis 删除失败: {}", e))?;

        Ok(())
    }

    /// 注册用户
    pub async fn register(
        &self,
        request: RegisterRequest,
    ) -> Result<(users::Model, String, String)> {
        // 1. 检查邮箱是否已存在
        let existing = self.user_repo.count_by_email(&request.email).await?;

        if existing > 0 {
            return Err(anyhow::anyhow!("邮箱已注册"));
        }

        // 2. 哈希密码
        let password_hash = self.hash_password(&request.password)?;

        // 3. 生成用户 ID
        let user_id = self.generate_unique_user_id().await?;

        // 4. 插入数据库并获取包含真实 created_at 的用户对象
        let user = self.user_repo.insert(user_id.clone(), request.email, password_hash).await?;

        // 5. 生成 token
        let (access_token, refresh_token) = TokenService::generate_token_pair(
            &user_id,
            self.auth_config.access_token_expiration_minutes,
            self.auth_config.refresh_token_expiration_days,
            &self.auth_config.jwt_secret,
        )?;

        // 6. 保存 refresh_token
        self.save_refresh_token(&user_id, &refresh_token, self.auth_config.refresh_token_expiration_days as i64).await?;

        // 7. 创建初始用户资料
        // 确保使用正数 ID（避免 i64 溢出）
        let random_id = rand::random::<u64>();
        let safe_id = (random_id % (i64::MAX as u64)) as i64;
        let user_profile = user_profiles::Model {
            id: safe_id,
            user_id: user_id.clone(),
            username: None,
            phone: None,
            qq: None,
            wechat: None,
            bio: None,
            avatar_data: None,
            avatar_mime_type: None,
            server_ver: 1,
            created_at: chrono::Utc::now().timestamp(),
            updated_at: chrono::Utc::now().timestamp(),
            deleted_at: None,
        };
        self.user_profile_repo.create(user_profile).await?;

        Ok((user, access_token, refresh_token))
    }

    /// 登录
    pub async fn login(
        &self,
        request: LoginRequest,
    ) -> Result<(users::Model, String, String)> {
        // 1. 查询用户
        let user = self.user_repo.find_by_email(&request.email).await?
            .ok_or_else(|| anyhow::anyhow!("邮箱或密码错误"))?;

        // 2. 验证密码
        let password_hash = self.user_repo.get_password_hash(&request.email).await?
            .ok_or_else(|| anyhow::anyhow!("邮箱或密码错误"))?;

        let parsed_hash = PasswordHash::new(&password_hash)
            .map_err(|e| anyhow::anyhow!("解析密码哈希失败: {}", e))?;
        let argon2 = Argon2::default();

        argon2
            .verify_password(request.password.as_bytes(), &parsed_hash)
            .map_err(|_| anyhow::anyhow!("邮箱或密码错误"))?;

        // 3. 生成 token
        let (access_token, refresh_token) = TokenService::generate_token_pair(
            &user.id,
            self.auth_config.access_token_expiration_minutes,
            self.auth_config.refresh_token_expiration_days,
            &self.auth_config.jwt_secret,
        )?;

        // 4. 保存 refresh_token
        self.save_refresh_token(&user.id, &refresh_token, self.auth_config.refresh_token_expiration_days as i64).await?;

        Ok((user, access_token, refresh_token))
    }

    /// 使用 refresh_token 刷新 access_token
    pub async fn refresh_access_token(
        &self,
        refresh_token: &str,
    ) -> Result<(String, String)> {
        // 1. 从 refresh_token 中解码出 user_id
        let user_id = TokenService::decode_user_id(refresh_token, &self.auth_config.jwt_secret)?;

        // 2. 从 Redis 获取存储的 token 并删除
        let stored_token = self.get_and_delete_refresh_token(&user_id).await?;

        // 3. 验证 token 是否匹配
        if stored_token != refresh_token {
            return Err(anyhow::anyhow!("刷新令牌无效"));
        }

        // 4. 生成新的 token 对
        let (new_access_token, new_refresh_token) = TokenService::generate_token_pair(
            &user_id,
            self.auth_config.access_token_expiration_minutes,
            self.auth_config.refresh_token_expiration_days,
            &self.auth_config.jwt_secret,
        )?;

        // 5. 保存新的 refresh_token
        self.save_refresh_token(&user_id, &new_refresh_token, self.auth_config.refresh_token_expiration_days as i64).await?;

        Ok((new_access_token, new_refresh_token))
    }

    /// 删除用户
    pub async fn delete_user(&self, request: DeleteUserRequest) -> Result<()> {
        let password_hash = self.user_repo.get_password_hash(&request.user_id).await?
            .ok_or_else(|| anyhow::anyhow!("用户不存在"))?;

        let parsed_hash = PasswordHash::new(&password_hash)
            .map_err(|e| anyhow::anyhow!("解析密码哈希失败: {}", e))?;
        let argon2 = Argon2::default();

        argon2
            .verify_password(request.password.as_bytes(), &parsed_hash)
            .map_err(|_| anyhow::anyhow!("密码错误"))?;

        self.user_repo.delete_by_id(&request.user_id).await?;

        Ok(())
    }
}
