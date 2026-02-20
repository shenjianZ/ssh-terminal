use crate::config::database::{DatabaseConfig, DatabaseType};
use sea_orm::{
    ConnectionTrait, Database, DatabaseConnection, DbBackend, EntityName, EntityTrait, ConnectOptions, Schema,
    Statement,
};
use std::time::Duration;

/// 数据库连接池（SeaORM 统一接口）
pub type DbPool = DatabaseConnection;

// 在编译时嵌入SQL文件（每个数据库一个完整初始化文件）
const MYSQL_SQL: &str = include_str!("../docs/sql/mysql.sql");
const POSTGRES_SQL: &str = include_str!("../docs/sql/postgres.sql");
const SQLITE_SQL: &str = include_str!("../docs/sql/sqlite.sql");

/// 创建数据库连接池
pub async fn create_pool(config: &DatabaseConfig) -> anyhow::Result<DbPool> {
    let url = config
        .build_url()
        .map_err(|e| anyhow::anyhow!("数据库配置错误: {}", e))?;

    tracing::debug!("数据库连接 URL: {}", url);

    let mut opt = ConnectOptions::new(&url);
    opt.max_connections(config.max_connections)
        .min_connections(1)
        .connect_timeout(Duration::from_secs(8))
        .idle_timeout(Duration::from_secs(600))      // 10分钟空闲超时
        .max_lifetime(Duration::from_secs(1800))     // 30分钟连接生命周期
        .acquire_timeout(Duration::from_secs(30))    // 获取连接超时30秒
        .test_before_acquire(true)                   // 获取连接前测试连接有效性
        .sqlx_logging(true)
        .sqlx_logging_level(log::LevelFilter::Info);

    let pool = Database::connect(opt)
        .await
        .map_err(|e| anyhow::anyhow!("数据库连接失败: {}", e))?;

    tracing::info!("已连接到数据库: {}", sanitize_url(&url));

    Ok(pool)
}

/// 隐藏 URL 中的敏感信息（用于日志输出）
fn sanitize_url(url: &str) -> String {
    // 隐藏密码：mysql://user:password@host -> mysql://user:***@host
    if let Some(at_pos) = url.find('@') {
        if let Some(scheme_end) = url.find("://") {
            if scheme_end < at_pos {
                return format!("{}***@{}", &url[..scheme_end + 3], &url[at_pos + 1..]);
            }
        }
    }
    url.to_string()
}

/// 健康检查（保持向后兼容）
pub async fn health_check(pool: &DbPool) -> anyhow::Result<()> {
    // 使用官方推荐的 ping 方法
    pool.ping()
        .await
        .map_err(|e| anyhow::anyhow!("数据库健康检查失败: {}", e))
}

/// 初始化数据库和表结构
/// 每次启动时检查数据库和表是否存在，不存在则创建
pub async fn init_database(config: &DatabaseConfig) -> anyhow::Result<DatabaseConnection> {
    match config.database_type {
        DatabaseType::MySQL => {
            init_mysql_database(config).await?;
        }
        DatabaseType::PostgreSQL => {
            init_postgresql_database(config).await?;
        }
        DatabaseType::SQLite => {
            // 确保 SQLite 数据库文件的目录存在
            init_sqlite_database(config).await?;
        }
    }

    // 连接到数据库
    let pool = create_pool(config).await?;

    // 创建表
    create_tables(&pool).await?;

    // 创建索引、触发器和函数
    create_indexes_and_triggers(&pool).await?;

    Ok(pool)
}

/// 获取端口号（根据数据库类型返回默认值）
fn get_database_port(config: &DatabaseConfig) -> u16 {
    config.port.unwrap_or_else(|| match config.database_type {
        DatabaseType::MySQL => 3306,
        DatabaseType::PostgreSQL => 5432,
        DatabaseType::SQLite => 0,
    })
}

/// 为 MySQL 创建数据库（如果不存在）
async fn init_mysql_database(config: &DatabaseConfig) -> anyhow::Result<()> {
    let database_name = config
        .database
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("MySQL 需要配置 database.database"))?;

    let host = config
        .host
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("MySQL 需要配置 database.host"))?;
    let user = config
        .user
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("MySQL 需要配置 database.user"))?;
    let password = config
        .password
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("MySQL 需要配置 database.password"))?;

    // 连接到 MySQL 服务器（不指定数据库）
    let url = format!(
        "mysql://{}:{}@{}:{}",
        user,
        password,
        host,
        get_database_port(config)
    );

    let mut opt = ConnectOptions::new(&url);
    opt.max_connections(1)
        .connect_timeout(Duration::from_secs(8))
        .sqlx_logging(true);

    let conn = Database::connect(opt)
        .await
        .map_err(|e| anyhow::anyhow!("连接 MySQL 服务器失败: {}", e))?;

    // 检查数据库是否存在，不存在则创建
    let query = format!(
        "CREATE DATABASE IF NOT EXISTS `{}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
        database_name
    );

    conn.execute(Statement::from_string(
        sea_orm::DatabaseBackend::MySql,
        query,
    ))
    .await
    .map_err(|e| anyhow::anyhow!("创建 MySQL 数据库失败: {}", e))?;

    tracing::info!("✅ MySQL 数据库 '{}' 检查完成", database_name);

    Ok(())
}

/// 为 PostgreSQL 创建数据库（如果不存在）
async fn init_postgresql_database(config: &DatabaseConfig) -> anyhow::Result<()> {
    let database_name = config
        .database
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("PostgreSQL 需要配置 database.database"))?;

    let host = config
        .host
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("PostgreSQL 需要配置 database.host"))?;
    let user = config
        .user
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("PostgreSQL 需要配置 database.user"))?;
    let password = config
        .password
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("PostgreSQL 需要配置 database.password"))?;

    // 连接到 PostgreSQL 默认数据库（postgres）
    let url = format!(
        "postgresql://{}:{}@{}:{}/postgres",
        user,
        password,
        host,
        get_database_port(config)
    );

    let mut opt = ConnectOptions::new(&url);
    opt.max_connections(1)
        .connect_timeout(Duration::from_secs(8))
        .sqlx_logging(true);

    let conn = Database::connect(opt)
        .await
        .map_err(|e| anyhow::anyhow!("连接 PostgreSQL 服务器失败: {}", e))?;

    // 检查数据库是否存在，不存在则创建
    // PostgreSQL 不支持 CREATE DATABASE IF NOT EXISTS，需要先查询
    let check_query = format!(
        "SELECT 1 FROM pg_database WHERE datname='{}'",
        database_name
    );

    let result = conn
        .execute(Statement::from_string(
            sea_orm::DatabaseBackend::Postgres,
            check_query,
        ))
        .await;

    match result {
        Ok(_) => {
            tracing::info!("PostgreSQL 数据库 '{}' 已存在", database_name);
        }
        Err(_) => {
            // 数据库不存在，创建它
            let create_query = format!(
                "CREATE DATABASE {} WITH ENCODING 'UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8'",
                database_name
            );

            conn.execute(Statement::from_string(
                sea_orm::DatabaseBackend::Postgres,
                create_query,
            ))
            .await
            .map_err(|e| anyhow::anyhow!("创建 PostgreSQL 数据库失败: {}", e))?;

            tracing::info!("✅ PostgreSQL 数据库 '{}' 创建成功", database_name);
        }
    }

    Ok(())
}

/// 为 SQLite 确保数据库文件目录存在
async fn init_sqlite_database(config: &DatabaseConfig) -> anyhow::Result<()> {
    let path = config
        .path
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("SQLite 需要配置 database.path"))?;

    // 如果是相对路径，转换为绝对路径
    let absolute_path = if path.is_absolute() {
        path.clone()
    } else {
        std::env::current_dir()
            .map_err(|e| anyhow::anyhow!("获取当前目录失败: {}", e))?
            .join(path)
    };

    tracing::info!("SQLite 数据库路径: {}", absolute_path.display());

    // 获取数据库文件的父目录
    if let Some(parent) = absolute_path.parent() {
        // 如果父目录不存在，则创建
        if !parent.exists() {
            std::fs::create_dir_all(parent)
                .map_err(|e| anyhow::anyhow!("创建 SQLite 数据库目录失败: {}", e))?;
            tracing::info!("✅ SQLite 数据库目录创建成功: {}", parent.display());
        } else {
            tracing::info!("SQLite 数据库目录已存在: {}", parent.display());
        }
    }

    // 如果数据库文件不存在，创建空文件
    if !absolute_path.exists() {
        std::fs::File::create(&absolute_path)
            .map_err(|e| anyhow::anyhow!("创建 SQLite 数据库文件失败: {}", e))?;
        tracing::info!("✅ SQLite 数据库文件创建成功: {}", absolute_path.display());
    } else {
        tracing::info!("SQLite 数据库文件已存在: {}", absolute_path.display());
    }

    Ok(())
}

/// 辅助函数：创建单个表（如果不存在）
async fn create_single_table<E>(
    db: &DatabaseConnection,
    schema: &Schema,
    builder: &DbBackend,
    entity: E,
    table_name: &str,
) -> anyhow::Result<()>
where
    E: EntityName + EntityTrait,
{
    let create_table = schema.create_table_from_entity(entity);

    let sql = match builder {
        DbBackend::MySql => {
            use sea_orm::sea_query::MysqlQueryBuilder;
            create_table.to_string(MysqlQueryBuilder {})
        }
        DbBackend::Postgres => {
            use sea_orm::sea_query::PostgresQueryBuilder;
            create_table.to_string(PostgresQueryBuilder {})
        }
        DbBackend::Sqlite => {
            use sea_orm::sea_query::SqliteQueryBuilder;
            create_table.to_string(SqliteQueryBuilder {})
        }
    };

    let sql = sql.replace("CREATE TABLE", "CREATE TABLE IF NOT EXISTS");

    match db.execute(Statement::from_string(*builder, sql)).await {
        Ok(_) => {
            tracing::info!("✅ {}检查完成", table_name);
        }
        Err(e) => {
            let err_msg = e.to_string();
            if err_msg.contains("already exists") || (err_msg.contains("table") && err_msg.contains("exists")) {
                tracing::info!("✅ {}已存在", table_name);
            } else {
                return Err(anyhow::anyhow!("创建{}失败: {}", table_name, e));
            }
        }
    }

    Ok(())
}

/// 创建数据库表结构
async fn create_tables(db: &DatabaseConnection) -> anyhow::Result<()> {
    tracing::info!("检查数据库表结构...");

    let builder = db.get_database_backend();
    let schema = Schema::new(builder);

    // 导入所有 entities
    use crate::domain::entities::{users, user_profiles, ssh_sessions};

    // 创建所有表（添加新表只需一行！）
    create_single_table(db, &schema, &builder, users::Entity, "用户表").await?;
    create_single_table(db, &schema, &builder, user_profiles::Entity, "用户资料表").await?;
    create_single_table(db, &schema, &builder, ssh_sessions::Entity, "SSH会话表").await?;

    tracing::info!("✅ 数据库表结构检查完成");

    Ok(())
}

/// 创建索引、触发器和函数
async fn create_indexes_and_triggers(db: &DatabaseConnection) -> anyhow::Result<()> {
    tracing::info!("检查数据库索引、触发器和函数...");

    let backend = db.get_database_backend();

    // 根据数据库类型选择对应的SQL文件
    let sql = match backend {
        DbBackend::MySql => MYSQL_SQL,
        DbBackend::Postgres => POSTGRES_SQL,
        DbBackend::Sqlite => SQLITE_SQL,
    };

    // 执行自动化SQL脚本（包含索引、触发器、函数等）
    execute_sql_script(db, backend, sql).await?;

    tracing::info!("✅ 数据库对象（索引、触发器、函数）检查完成");

    Ok(())
}

/// 执行SQL脚本（支持多条语句）
async fn execute_sql_script(
    db: &DatabaseConnection,
    backend: DbBackend,
    sql: &str,
) -> anyhow::Result<()> {
    // 按分号分割SQL语句
    let statements: Vec<&str> = sql
        .split(';')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty() && !s.starts_with("--"))
        .collect();

    for statement in statements {
        if statement.is_empty() {
            continue;
        }

        match db.execute(Statement::from_string(backend, statement.to_string())).await {
            Ok(_) => {
                tracing::debug!("✅ SQL执行成功");
            }
            Err(e) => {
                let err_msg = e.to_string();
                // 忽略"已存在"错误
                if err_msg.contains("already exists")
                    || err_msg.contains("duplicate")
                    || err_msg.contains("Duplicate")
                {
                    tracing::debug!("对象已存在，跳过");
                } else {
                    tracing::warn!("SQL执行失败: {} \nSQL: {}", e, statement);
                }
            }
        }
    }

    Ok(())
}

