use serde::Deserialize;
use std::path::PathBuf;

/// 数据库类型
#[derive(Debug, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum DatabaseType {
    MySQL,
    SQLite,
    PostgreSQL,
}

#[derive(Debug, Deserialize, Clone)]
pub struct DatabaseConfig {
    /// 数据库类型
    #[serde(default = "default_database_type")]
    pub database_type: DatabaseType,

    /// 网络数据库配置（MySQL/PostgreSQL）
    pub host: Option<String>,
    #[serde(default)]
    pub port: Option<u16>,
    pub user: Option<String>,
    pub password: Option<String>,
    pub database: Option<String>,

    /// SQLite 文件路径
    pub path: Option<PathBuf>,

    /// 连接池最大连接数
    #[serde(default = "default_max_connections")]
    pub max_connections: u32,
}

impl DatabaseConfig {
    /// 获取端口号（根据数据库类型返回默认值）
    pub fn get_port(&self) -> u16 {
        self.port.unwrap_or_else(|| match self.database_type {
            DatabaseType::MySQL => 3306,
            DatabaseType::PostgreSQL => 5432,
            DatabaseType::SQLite => 0,
        })
    }

    /// 构建数据库连接 URL
    ///
    /// # 错误
    ///
    /// 当缺少必需的配置字段时返回错误
    pub fn build_url(&self) -> Result<String, String> {
        match self.database_type {
            DatabaseType::MySQL => {
                let host = self
                    .host
                    .as_ref()
                    .ok_or_else(|| "MySQL 需要配置 database.host".to_string())?;
                let user = self
                    .user
                    .as_ref()
                    .ok_or_else(|| "MySQL 需要配置 database.user".to_string())?;
                let password = self
                    .password
                    .as_ref()
                    .ok_or_else(|| "MySQL 需要配置 database.password".to_string())?;
                let database = self
                    .database
                    .as_ref()
                    .ok_or_else(|| "MySQL 需要配置 database.database".to_string())?;

                Ok(format!(
                    "mysql://{}:{}@{}:{}/{}",
                    user,
                    password,
                    host,
                    self.get_port(),
                    database
                ))
            }
            DatabaseType::SQLite => {
                let path = self
                    .path
                    .as_ref()
                    .ok_or_else(|| "SQLite 需要配置 database.path".to_string())?;

                // SQLite URL 格式
                // 相对路径：sqlite:./db.sqlite3
                // 绝对路径：sqlite:C:/path/to/db.sqlite3
                let path_str = path.to_string_lossy().replace('\\', "/");
                Ok(format!("sqlite:{}", path_str))
            }
            DatabaseType::PostgreSQL => {
                let host = self
                    .host
                    .as_ref()
                    .ok_or_else(|| "PostgreSQL 需要配置 database.host".to_string())?;
                let user = self
                    .user
                    .as_ref()
                    .ok_or_else(|| "PostgreSQL 需要配置 database.user".to_string())?;
                let password = self
                    .password
                    .as_ref()
                    .ok_or_else(|| "PostgreSQL 需要配置 database.password".to_string())?;
                let database = self
                    .database
                    .as_ref()
                    .ok_or_else(|| "PostgreSQL 需要配置 database.database".to_string())?;

                Ok(format!(
                    "postgresql://{}:{}@{}:{}/{}",
                    user,
                    password,
                    host,
                    self.get_port(),
                    database
                ))
            }
        }
    }

    /// 验证配置是否完整
    pub fn validate(&self) -> Result<(), String> {
        match self.database_type {
            DatabaseType::MySQL => {
                if self.host.is_none() {
                    return Err("MySQL 需要配置 database.host".to_string());
                }
                if self.user.is_none() {
                    return Err("MySQL 需要配置 database.user".to_string());
                }
                if self.password.is_none() {
                    return Err("MySQL 需要配置 database.password".to_string());
                }
                if self.database.is_none() {
                    return Err("MySQL 需要配置 database.database".to_string());
                }
            }
            DatabaseType::SQLite => {
                if self.path.is_none() {
                    return Err("SQLite 需要配置 database.path".to_string());
                }
            }
            DatabaseType::PostgreSQL => {
                if self.host.is_none() {
                    return Err("PostgreSQL 需要配置 database.host".to_string());
                }
                if self.user.is_none() {
                    return Err("PostgreSQL 需要配置 database.user".to_string());
                }
                if self.password.is_none() {
                    return Err("PostgreSQL 需要配置 database.password".to_string());
                }
                if self.database.is_none() {
                    return Err("PostgreSQL 需要配置 database.database".to_string());
                }
            }
        }
        Ok(())
    }
}

fn default_database_type() -> DatabaseType {
    DatabaseType::MySQL
}

fn default_max_connections() -> u32 {
    10
}
