#![recursion_limit = "512"]

mod cli;
mod config;
mod db;
mod domain;
mod error;
mod handlers;
mod infra;
mod repositories;
mod services;
mod utils;

use axum::{
    routing::{delete, get, post, put},
    Router,
};
use clap::Parser;
use cli::CliArgs;
use tower_http::cors::{Any, CorsLayer};
use crate::utils::i18n::{t, MessageKey};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

/// 应用状态
#[derive(Clone)]
pub struct AppState {
    pub pool: db::DbPool,
    pub config: config::app::AppConfig,
    pub redis_client: infra::redis::redis_client::RedisClient,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 解析命令行参数
    let args = CliArgs::parse();

    // 初始化日志（使用北京时间）
    let offset = time::UtcOffset::from_hms(8, 0, 0).unwrap();
    let format = time::format_description::parse(
        "[year]-[month]-[day] [hour]:[minute]:[second]"
    ).unwrap();
    let timer = tracing_subscriber::fmt::time::OffsetTime::new(offset, format);

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| args.get_log_filter().into()),
        )
        .with(tracing_subscriber::fmt::layer().with_timer(timer))
        .init();

    // 打印启动信息
    args.print_startup_info();

    // 设置工作目录（如果指定）
    if let Some(ref work_dir) = args.work_dir {
        std::env::set_current_dir(work_dir).ok();
        println!("Working directory set to: {}", work_dir.display());
    }

    // 解析配置文件路径（可选）
    let config_path = args.resolve_config_path();

    // 加载配置（支持 CLI 覆盖）
    // 如果没有配置文件，将仅使用环境变量和默认值
    let config = config::app::AppConfig::load_with_overrides(
        config_path,
        args.get_overrides(),
        args.env.as_str(),
    )?;

    tracing::info!("Configuration loaded successfully");
    tracing::info!("Environment: {}", args.env.as_str());
    tracing::info!("Debug mode: {}", args.is_debug_enabled());

    // 初始化数据库（自动创建数据库和表）
    let pool = db::init_database(&config.database).await?;

    // 初始化 Redis 客户端
    let redis_client = infra::redis::redis_client::RedisClient::new(&config.redis.build_url())
        .await
        .map_err(|e| anyhow::anyhow!("{}: {}", t(None, MessageKey::ErrorRedisInitFailed), e))?;

    tracing::info!("Redis 连接池初始化成功");

    // 创建应用状态
    let app_state = AppState {
        pool: pool.clone(),
        config: config.clone(),
        redis_client: redis_client.clone(),
    };

    // 启动邮件 Worker（如果启用）
    if config.email.enabled {
        infra::mail::worker::start_mail_workers(
            redis_client,
            config.email.clone(),
            pool.clone(),
        ).await;
        tracing::info!("📧 Mail Workers started successfully (pool size: {})", config.email.worker_pool_size);
    } else {
        tracing::info!("📧 Mail feature is disabled");
    }

    // ========== 公开路由 ==========
    let public_routes = if config.email.enabled {
        Router::new()
            .route("/health", get(handlers::health::health_check))
            .route("/info", get(handlers::health::server_info))
            .route("/auth/register", post(handlers::auth::register))
            .route("/auth/login", post(handlers::auth::login))
            .route("/auth/refresh", post(handlers::auth::refresh))
            // 邮件 API（公开，无需认证）
            // 同步版本（推荐）：立即返回真实的发送结果
            .route(
                "/api/email/send-verify-code-sync",
                post(handlers::email::send_verify_code_sync_handler),
            )
            // 异步版本（已弃用）：使用队列模式，不会立即返回发送结果
            // ⚠️ 不建议使用，如果邮箱无效仍会返回成功
            .route(
                "/api/email/send-verify-code-async",
                post(handlers::email::send_verify_code_async_handler),
            )
    } else {
        Router::new()
            .route("/health", get(handlers::health::health_check))
            .route("/info", get(handlers::health::server_info))
            .route("/auth/register", post(handlers::auth::register))
            .route("/auth/login", post(handlers::auth::login))
            .route("/auth/refresh", post(handlers::auth::refresh))
    };

    // ========== 受保护路由 ==========
    let protected_routes = Router::new()
        .route("/auth/delete", post(handlers::auth::delete_account))
        .route(
            "/auth/delete-refresh-token",
            post(handlers::auth::delete_refresh_token),
        )
        // 用户资料 CRUD API
        .route(
            "/api/user/profile",
            get(handlers::user_profile::get_profile_handler),
        )
        .route(
            "/api/user/profile",
            put(handlers::user_profile::update_profile_handler),
        )
        .route(
            "/api/user/profile",
            delete(handlers::user_profile::delete_profile_handler),
        )
        // SSH 会话 CRUD API
        .route(
            "/api/ssh/sessions",
            get(handlers::ssh_session::list_sessions_handler),
        )
        .route(
            "/api/ssh/sessions",
            post(handlers::ssh_session::create_session_handler),
        )
        .route(
            "/api/ssh/sessions/:id",
            get(handlers::ssh_session::get_session_handler),
        )
        .route(
            "/api/ssh/sessions/:id",
            put(handlers::ssh_session::update_session_handler),
        )
        .route(
            "/api/ssh/sessions/:id",
            delete(handlers::ssh_session::delete_session_handler),
        )
        // 同步 API 路由
        .route("/api/sync", post(handlers::sync::sync_handler))
        .route(
            "/api/sync/resolve-conflict",
            post(handlers::sync::resolve_conflict_handler),
        )
        // 邮件状态路由（需要认证）
        .route(
            "/api/email/latest-log",
            post(handlers::email::get_latest_email_log_handler),
        )
        .route(
            "/api/email/queue-status",
            get(handlers::email::get_queue_status_handler),
        )
        // JWT 认证中间件（仅应用于受保护路由）
        .route_layer(axum::middleware::from_fn_with_state(
            app_state.clone(),
            infra::middleware::auth::auth_middleware,
        ));

    // ========== 合并路由 ==========
    let app = public_routes
        .merge(protected_routes)
        // 语言中间件（应用于所有路由）
        .layer(axum::middleware::from_fn(
            infra::middleware::language::language_middleware,
        ))
        // CORS（应用于所有路由）
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        // 日志中间件（应用于所有路由）
        .layer(axum::middleware::from_fn_with_state(
            app_state.clone(),
            infra::middleware::logging::request_logging_middleware,
        ))
        .with_state(app_state);

    // 启动服务器
    let addr = format!("{}:{}", config.server.host, config.server.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Server listening on {}", addr);
    tracing::info!("Press Ctrl+C to stop");

    axum::serve(listener, app).await?;

    Ok(())
}
