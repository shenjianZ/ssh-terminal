use anyhow::Result;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand::Rng;
use chrono::Utc;
use jsonwebtoken::{decode, DecodingKey, Validation};

use crate::utils::jwt::TokenService;
use crate::utils::jwt::Claims;
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

    /// 生成设备 ID
    pub fn generate_device_id(&self) -> String {
        uuid::Uuid::new_v4().to_string()
    }

    /// 保存 refresh_token 到 Redis Set
    async fn save_refresh_token(&self, user_id: &str, refresh_token: &str, expiration_days: i64) -> Result<()> {
        let key = RedisKey::new(BusinessType::Auth)
            .add_identifier("refresh_token")
            .add_identifier(user_id);

        let expiration_seconds = expiration_days * 24 * 3600;

        // 添加到 Set 中（而不是覆盖）
        self.redis_client
            .sadd_key(&key, refresh_token)
            .await
            .map_err(|e| anyhow::anyhow!("Redis 保存失败: {}", e))?;

        // 设置 Set 的过期时间（7 天）
        self.redis_client
            .expire_key(&key, expiration_seconds as u64)
            .await
            .map_err(|e| anyhow::anyhow!("Redis 设置过期时间失败: {}", e))?;

        Ok(())
    }

    /// 验证 refresh_token 是否在 Set 中（不删除）
    async fn verify_refresh_token(&self, user_id: &str, refresh_token: &str) -> Result<bool> {
        let key = RedisKey::new(BusinessType::Auth)
            .add_identifier("refresh_token")
            .add_identifier(user_id);

        let exists = self.redis_client
            .sismember_key(&key, refresh_token)
            .await
            .map_err(|e| anyhow::anyhow!("Redis 查询失败: {}", e))?;

        Ok(exists)
    }

    /// 删除用户的 refresh_token（删除整个 Set）
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

    /// 清理过期的 refresh_token（可选的后台任务）
    pub async fn cleanup_expired_tokens(&self, user_id: &str) -> Result<()> {
        let key = RedisKey::new(BusinessType::Auth)
            .add_identifier("refresh_token")
            .add_identifier(user_id);

        // 获取 Set 中所有的 token
        let tokens: Vec<String> = self.redis_client
            .smembers_key(&key)
            .await
            .map_err(|e| anyhow::anyhow!("Redis 查询失败: {}", e))?;

        let now = Utc::now().timestamp() as usize;
        let mut tokens_to_remove = Vec::new();

        // 验证每个 token 的过期时间
        for token in tokens {
            match crate::utils::jwt::TokenService::decode_user_id(&token, &self.auth_config.jwt_secret) {
                Ok(_) => {
                    // 解码 token 获取过期时间
                    match decode::<Claims>(
                        &token,
                        &DecodingKey::from_secret(self.auth_config.jwt_secret.as_ref()),
                        &Validation::default(),
                    ) {
                        Ok(token_data) => {
                            // 如果 token 已过期，添加到待删除列表
                            if token_data.claims.exp < now {
                                tokens_to_remove.push(token);
                            }
                        }
                        Err(_) => {
                            // 解码失败，说明 token 格式错误，也应该删除
                            tokens_to_remove.push(token);
                        }
                    }
                }
                Err(_) => {
                    // user_id 解码失败，删除无效 token
                    tokens_to_remove.push(token);
                }
            }
        }

        // 从 Set 中删除过期的 token
        if !tokens_to_remove.is_empty() {
            for token in &tokens_to_remove {
                self.redis_client
                    .srem_key(&key, token)
                    .await
                    .map_err(|e| anyhow::anyhow!("Redis 删除失败: {}", e))?;
            }
            tracing::info!("Cleaned up {} expired tokens for user {}", tokens_to_remove.len(), user_id);
        }

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

        // 4. 生成设备 ID
        let device_id = self.generate_device_id();

        // 5. 插入数据库并获取包含真实 created_at 的用户对象
        let user = self.user_repo.insert(user_id.clone(), request.email, password_hash, device_id).await?;

        // 6. 生成 token
        let (access_token, refresh_token) = TokenService::generate_token_pair(
            &user_id,
            self.auth_config.access_token_expiration_minutes,
            self.auth_config.refresh_token_expiration_days,
            &self.auth_config.jwt_secret,
        )?;

        // 7. 保存 refresh_token
        self.save_refresh_token(&user_id, &refresh_token, self.auth_config.refresh_token_expiration_days as i64).await?;

        // 8. 创建初始用户资料
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
        let parsed_hash = PasswordHash::new(&user.password_hash)
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

        // 2. 验证旧 token 是否在 Set 中
        let is_valid = self.verify_refresh_token(&user_id, refresh_token).await?;
        if !is_valid {
            return Err(anyhow::anyhow!("刷新令牌无效或已过期"));
        }

        // 3. 生成新的 token 对
        let (new_access_token, new_refresh_token) = TokenService::generate_token_pair(
            &user_id,
            self.auth_config.access_token_expiration_minutes,
            self.auth_config.refresh_token_expiration_days,
            &self.auth_config.jwt_secret,
        )?;

        // 4. 将新 token 添加到 Set 中
        self.save_refresh_token(&user_id, &new_refresh_token, self.auth_config.refresh_token_expiration_days as i64).await?;

        tracing::info!("Token refreshed successfully, new token added to set");

        Ok((new_access_token, new_refresh_token))
    }

    /// 删除用户（软删除）
    pub async fn delete_user(&self, request: DeleteUserRequest) -> Result<()> {
        let password_hash = self.user_repo.get_password_hash_by_id(&request.user_id).await?
            .ok_or_else(|| anyhow::anyhow!("用户不存在"))?;

        let parsed_hash = PasswordHash::new(&password_hash)
            .map_err(|e| anyhow::anyhow!("解析密码哈希失败: {}", e))?;
        let argon2 = Argon2::default();

        argon2
            .verify_password(request.password.as_bytes(), &parsed_hash)
            .map_err(|_| anyhow::anyhow!("密码错误"))?;

        // 软删除用户
        self.user_repo.soft_delete_by_id(&request.user_id).await?;

        // 软删除用户资料
        self.user_profile_repo.soft_delete(&request.user_id).await?;

        // 软删除用户的所有 SSH 会话
        let ssh_session_repo = crate::repositories::ssh_session_repository::SshSessionRepository::new(self.user_repo.get_db());
        ssh_session_repo.soft_delete_by_user_id(&request.user_id).await?;

        // 删除 Redis 中的 refresh_token
        self.delete_refresh_token(&request.user_id).await?;

        Ok(())
    }
}
