use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct RedisConfig {
    /// Redis 主机地址
    #[serde(default = "default_redis_host")]
    pub host: String,

    /// Redis 端口
    #[serde(default = "default_redis_port")]
    pub port: u16,

    /// Redis 密码（可选）
    #[serde(default)]
    pub password: Option<String>,

    /// Redis 数据库编号（可选）
    #[serde(default = "default_redis_db")]
    pub db: u8,
}

pub fn default_redis_host() -> String {
    "localhost".to_string()
}

pub fn default_redis_port() -> u16 {
    6379
}

pub fn default_redis_db() -> u8 {
    0
}

impl RedisConfig {
    /// 构建 Redis 连接 URL
    pub fn build_url(&self) -> String {
        // 判断密码是否存在且非空
        match &self.password {
            Some(password) if !password.is_empty() => {
                // 有密码：redis://:password@host:port/db
                format!(
                    "redis://:{}@{}:{}/{}",
                    password, self.host, self.port, self.db
                )
            }
            _ => {
                // 无密码（None 或空字符串）：redis://host:port/db
                format!("redis://{}:{}/{}", self.host, self.port, self.db)
            }
        }
    }
}
