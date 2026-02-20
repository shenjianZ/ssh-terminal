use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct AuthConfig {
    #[serde(default = "default_jwt_secret")]
    pub jwt_secret: String,
    #[serde(default = "default_access_token_expiration_minutes")]
    pub access_token_expiration_minutes: u64,
    #[serde(default = "default_refresh_token_expiration_days")]
    pub refresh_token_expiration_days: i64,
}

fn default_jwt_secret() -> String {
    // ⚠️  警告：这是一个不安全的默认值，仅用于开发测试
    // 生产环境必须通过环境变量或配置文件设置强密钥
    "change-this-to-a-strong-secret-key-in-production".to_string()
}

fn default_access_token_expiration_minutes() -> u64 {
    15
}

fn default_refresh_token_expiration_days() -> i64 {
    7
}
