use anyhow::Result;
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

/// JWT 工具类，负责生成和验证 JWT token
pub struct TokenService;

impl TokenService {
    /// 生成 JWT access token
    pub fn generate_access_token(
        user_id: &str,
        expiration_minutes: u64,
        jwt_secret: &str,
    ) -> Result<String> {
        let expiration = Utc::now()
            .checked_add_signed(Duration::minutes(expiration_minutes as i64))
            .expect("invalid expiration timestamp")
            .timestamp() as usize;

        let claims = Claims {
            sub: user_id.to_string(),
            exp: expiration,
            token_type: TokenType::Access,
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(jwt_secret.as_ref()),
        )?;

        Ok(token)
    }

    /// 生成 refresh token
    pub fn generate_refresh_token(
        user_id: &str,
        expiration_days: i64,
        jwt_secret: &str,
    ) -> Result<String> {
        let expiration = Utc::now()
            .checked_add_signed(Duration::days(expiration_days))
            .expect("invalid expiration timestamp")
            .timestamp() as usize;

        let claims = Claims {
            sub: user_id.to_string(),
            exp: expiration,
            token_type: TokenType::Refresh,
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(jwt_secret.as_ref()),
        )?;

        Ok(token)
    }

    /// 生成 access token 和 refresh token
    pub fn generate_token_pair(
        user_id: &str,
        access_token_expiration_minutes: u64,
        refresh_token_expiration_days: i64,
        jwt_secret: &str,
    ) -> Result<(String, String)> {
        let access_token =
            Self::generate_access_token(user_id, access_token_expiration_minutes, jwt_secret)?;
        let refresh_token =
            Self::generate_refresh_token(user_id, refresh_token_expiration_days, jwt_secret)?;

        Ok((access_token, refresh_token))
    }

    /// 从 token 中解码出 user_id
    pub fn decode_user_id(token: &str, jwt_secret: &str) -> Result<String> {
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(jwt_secret.as_ref()),
            &Validation::default(),
        )
        .map_err(|e| anyhow::anyhow!("Token 解码失败: {}", e))?;

        Ok(token_data.claims.sub)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // user_id
    pub exp: usize,  // 过期时间
    pub token_type: TokenType,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum TokenType {
    Access,
    Refresh,
}
