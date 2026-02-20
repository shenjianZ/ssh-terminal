/// 命令行参数和配置管理
/// 支持优先级：CLI 参数 > 环境变量 > 配置文件 > 默认值
use clap::{Parser, ValueEnum};
use std::path::PathBuf;

/// 运行环境（强类型）
#[derive(ValueEnum, Clone, Debug)]
pub enum Environment {
    /// 开发环境
    Development,
    /// 生产环境
    Production,
}

impl Environment {
    /// 转换为小写字符串
    pub fn as_str(&self) -> &'static str {
        match self {
            Environment::Development => "development",
            Environment::Production => "production",
        }
    }
}

/// 命令行参数
#[derive(Parser, Debug)]
#[command(name = "ssh-terminal-server")]
#[command(about = "SSH Terminal Server", long_about = None)]
#[command(author = "shenjainZ <shenjianZLT@gmail.com>")]
#[command(version = "1.0")]
#[command(propagate_version = true)]
pub struct CliArgs {
    /// 指定配置文件路径
    ///
    /// 支持相对路径和绝对路径
    /// 例如：-c config/production.toml
    #[arg(short, long, value_name = "FILE")]
    pub config: Option<PathBuf>,

    /// 指定运行环境
    ///
    /// 自动加载对应环境的配置文件（如 config/development.toml）
    /// 可通过环境变量 ENV 设置
    #[arg(
        short = 'e',
        long,
        value_enum,
        env = "ENV",
        default_value = "development"
    )]
    pub env: Environment,

    /// 指定服务器监听端口
    ///
    /// 覆盖配置文件中的 port 设置
    /// 可通过环境变量 SERVER_PORT 设置
    #[arg(short, long, global = true, env = "SERVER_PORT")]
    pub port: Option<u16>,

    /// 指定服务器监听地址
    ///
    /// 覆盖配置文件中的 host 设置
    /// 可通过环境变量 SERVER_HOST 设置
    #[arg(long, global = true, env = "SERVER_HOST")]
    pub host: Option<String>,

    /// 启用调试日志
    ///
    /// 输出详细的日志信息，包括 SQL 查询
    /// 可通过环境变量 DEBUG 设置
    /// 注意：与 -v 冲突，推荐使用 -v/-vv/-vvv
    #[arg(long, global = true, env = "DEBUG", conflicts_with = "verbose")]
    pub debug: bool,

    /// 工作目录
    ///
    /// 指定配置文件和数据库的基准目录
    #[arg(short, long, global = true)]
    pub work_dir: Option<PathBuf>,

    /// 显示详细日志（多级 verbose）
    ///
    /// -v     : info 级别日志
    /// -vv    : debug 级别日志（等同于 --debug）
    /// -vvv   : trace 级别日志（最详细）
    #[arg(short, long, global = true, action = clap::ArgAction::Count)]
    pub verbose: u8,
}

impl CliArgs {
    /// 获取是否启用调试
    pub fn is_debug_enabled(&self) -> bool {
        self.debug || self.verbose >= 2
    }

    /// 获取日志级别
    pub fn get_log_level(&self) -> &'static str {
        if self.debug {
            return "debug";
        }
        match self.verbose {
            0 => "info",
            1 => "debug",
            _ => "trace",
        }
    }

    /// 获取环境变量的日志过滤器（工程化版本）
    pub fn get_log_filter(&self) -> String {
        let level = self.get_log_level();
        match level {
            "trace" => "ssh_terminal_server=trace,tower_http=trace,axum=trace,sqlx=debug".into(),
            "debug" => "ssh_terminal_server=debug,tower_http=debug,axum=debug,sqlx=debug".into(),
            _ => "ssh_terminal_server=info,tower_http=info,axum=info".into(),
        }
    }

    /// 获取配置文件路径
    ///
    /// 优先级：
    /// 1. CLI 参数 --config
    /// 2. 环境变量 CONFIG
    /// 3. {work_dir}/config/{env}.toml
    /// 4. ./config/{env}.toml
    /// 5. ./config/default.toml
    ///
    /// 如果找不到配置文件，返回 None（允许仅使用环境变量运行）
    pub fn resolve_config_path(&self) -> Option<PathBuf> {
        use std::env;

        // 1. CLI 参数优先
        if let Some(ref config) = self.config {
            if config.exists() {
                return Some(config.clone());
            }
            eprintln!("⚠ 警告：指定的配置文件不存在: {}", config.display());
            eprintln!("  将仅使用环境变量运行");
            return None;
        }

        // 2. 环境变量
        if let Ok(config_path) = env::var("CONFIG") {
            let config = PathBuf::from(&config_path);
            if config.exists() {
                return Some(config);
            }
            eprintln!(
                "⚠ 警告：环境变量 CONFIG 指定的配置文件不存在: {}",
                config_path
            );
            eprintln!("  将仅使用环境变量运行");
            return None;
        }

        // 3-6. 查找配置文件
        let work_dir = self
            .work_dir
            .clone()
            .or_else(|| env::current_dir().ok())
            .unwrap_or_else(|| PathBuf::from("."));

        let env_name = self.env.as_str();

        // 按优先级尝试的位置
        let candidates = [
            // 工作目录下的环境配置
            work_dir.join("config").join(format!("{}.toml", env_name)),
            // 当前目录的环境配置
            PathBuf::from(format!("config/{}.toml", env_name)),
            // 工作目录下的默认配置
            work_dir.join("config").join("default.toml"),
            // 当前目录的默认配置
            PathBuf::from("config/default.toml"),
        ];

        for candidate in &candidates {
            if candidate.exists() {
                // 使用 println! 而非 tracing::info!
                println!("✓ Found configuration file: {}", candidate.display());
                return Some(candidate.clone());
            }
        }

        // 所有候选路径都找不到配置文件，返回 None
        eprintln!("ℹ 未找到配置文件，将仅使用环境变量和默认值");
        None
    }

    /// 获取覆盖配置
    ///
    /// CLI 参数可以覆盖配置文件中的值（仅 Web 服务器参数）
    pub fn get_overrides(&self) -> ConfigOverrides {
        ConfigOverrides {
            host: self.host.clone(),
            port: self.port,
        }
    }

    /// 显示启动信息（工程化版本：打印实际解析的配置）
    ///
    /// 使用 println! 而非 tracing::info!，因为 logger 可能尚未初始化
    pub fn print_startup_info(&self) {
        let separator = "=".repeat(60);
        println!("{}", separator);
        println!("SSH Terminal Server v1.0");
        println!("Environment: {}", self.env.as_str());

        // 打印实际解析的配置路径（而非 CLI 参数）
        if let Some(config_path) = self.resolve_config_path() {
            println!("Config file: {}", config_path.display());
        } else {
            println!("Config file: None (using environment variables)");
        }

        if let Some(ref work_dir) = self.work_dir {
            println!("Work directory: {}", work_dir.display());
        }

        // 打印实际的日志级别
        println!("Log level: {}", self.get_log_level());

        if self.is_debug_enabled() {
            println!("Debug mode: ENABLED");
        }
        println!("{}", separator);
    }
}

/// CLI 参数覆盖的配置（仅 Web 服务器参数）
#[derive(Debug, Clone)]
pub struct ConfigOverrides {
    /// Web 服务器主机覆盖
    pub host: Option<String>,

    /// Web 服务器端口覆盖
    pub port: Option<u16>,
}
