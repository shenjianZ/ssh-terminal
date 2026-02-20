use super::{auth::AuthConfig, database::DatabaseConfig, redis::RedisConfig, server::ServerConfig};
use config::{Config, ConfigError, Environment, File};
use serde::Deserialize;
use std::path::PathBuf;

// 导入 redis 默认值函数（使用完整路径）
use crate::config::redis::default_redis_host;

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub auth: AuthConfig,
    pub redis: RedisConfig,
}

impl AppConfig {
    /// 加载配置（支持 CLI 覆盖）
    ///
    /// 如果 config_path 为 None，则仅使用环境变量和默认值
    pub fn load_with_overrides(
        cli_config_path: Option<std::path::PathBuf>,
        overrides: crate::cli::ConfigOverrides,
        _environment: &str,
    ) -> Result<Self, ConfigError> {
        // 使用 ConfigBuilder 设置配置
        let mut builder = Config::builder();

        // 如果提供了配置文件，先加载它
        if let Some(config_path) = cli_config_path {
            if !config_path.exists() {
                tracing::error!("Configuration file not found: {}", config_path.display());
                return Err(ConfigError::NotFound(
                    config_path.to_string_lossy().to_string(),
                ));
            }
            tracing::info!("Loading configuration from: {}", config_path.display());
            builder = builder.add_source(File::from(config_path));
        } else {
            tracing::info!("No configuration file found, using environment variables and defaults");
            tracing::warn!("⚠️  没有找到配置文件，将使用 SQLite 作为默认数据库");
            tracing::warn!("   默认数据库路径: db.sqlite3");
            tracing::warn!("   如需使用其他数据库，请创建配置文件或设置环境变量");

            // 直接使用 set_default 设置默认值
            // 注意：这些值会被环境变量覆盖
            builder = builder.set_default("server.host", default_server_host())?;
            builder = builder.set_default("server.port", default_server_port())?;

            // 设置 database 默认值（使用 SQLite 作为默认数据库）
            builder = builder.set_default("database.database_type", "sqlite")?;
            builder = builder.set_default("database.path", "db.sqlite3")?;
            builder = builder.set_default("database.max_connections", 10)?;

            // 设置 auth 默认值
            builder = builder.set_default("auth.jwt_secret", default_jwt_secret())?;
            builder = builder.set_default("auth.access_token_expiration_minutes", 15)?;
            builder = builder.set_default("auth.refresh_token_expiration_days", 7)?;

            // 设置 redis 默认值
            builder = builder.set_default("redis.host", default_redis_host())?;
            builder = builder.set_default("redis.port", 6379)?;
            builder = builder.set_default("redis.db", 0)?;
        }

        // 添加环境变量源（会覆盖配置文件的值）
        builder = builder.add_source(Environment::default().separator("_"));

        // 应用 CLI 覆盖（仅 Web 服务器参数）
        if let Some(host) = overrides.host {
            builder = builder.set_override("server.host", host)?;
        }
        if let Some(port) = overrides.port {
            builder = builder.set_override("server.port", port)?;
        }

        let settings = builder.build()?;
        let config: AppConfig = settings.try_deserialize()?;

        // 安全警告：检查是否使用了默认的 JWT 密钥
        if config.auth.jwt_secret == "change-this-to-a-strong-secret-key-in-production" {
            tracing::warn!("⚠️  警告：正在使用不安全的默认 JWT 密钥！");
            tracing::warn!("  请通过环境变量 AUTH_JWT_SECRET 或配置文件设置强密钥");
            tracing::warn!("  示例：AUTH_JWT_SECRET=your-secure-random-string-here");
        }

        // 验证数据库配置
        if let Err(e) = config.database.validate() {
            tracing::error!("数据库配置无效: {}", e);
            return Err(ConfigError::Message(format!("数据库配置无效: {}", e)));
        }

        Ok(config)
    }

    /// 从指定路径加载配置
    pub fn load_from_path(path: &str) -> Result<Self, ConfigError> {
        tracing::info!("Loading configuration from: {}", path);

        let settings = Config::builder()
            .add_source(File::from(PathBuf::from(path)))
            .add_source(Environment::default().separator("_"))
            .build()?;

        let config: AppConfig = settings.try_deserialize()?;

        // 安全警告：检查是否使用了默认的 JWT 密钥
        if config.auth.jwt_secret == "change-this-to-a-strong-secret-key-in-production" {
            tracing::warn!("⚠️  警告：正在使用不安全的默认 JWT 密钥！");
            tracing::warn!("  请通过环境变量 AUTH_JWT_SECRET 或配置文件设置强密钥");
            tracing::warn!("  示例：AUTH_JWT_SECRET=your-secure-random-string-here");
        }

        // 验证数据库配置
        if let Err(e) = config.database.validate() {
            tracing::error!("数据库配置无效: {}", e);
            return Err(ConfigError::Message(format!("数据库配置无效: {}", e)));
        }

        Ok(config)
    }
}

// 默认值函数（复用）
fn default_server_host() -> String {
    "127.0.0.1".to_string()
}

fn default_server_port() -> u16 {
    3000
}

fn default_jwt_secret() -> String {
    "change-this-to-a-strong-secret-key-in-production".to_string()
}
