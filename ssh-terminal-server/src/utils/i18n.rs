use once_cell::sync::Lazy;
use serde_json::json;

/// 支持的语言
pub const ZH_CN: &str = "zh-CN";
pub const EN: &str = "en";

/// 消息键枚举
#[derive(Debug, Clone, Copy)]
#[allow(dead_code)]
pub enum MessageKey {
    // ==================== Success Messages ====================
    SuccessDefault,
    SuccessRegister,
    SuccessLogin,
    SuccessRefreshToken,
    SuccessDeleteAccount,
    SuccessDeleteRefreshToken,
    SuccessResolveConflict,
    SuccessSync,
    SuccessCreateSession,
    SuccessListSessions,
    SuccessGetSession,
    SuccessUpdateSession,
    SuccessDeleteSession,
    SuccessGetProfile,
    SuccessCreateProfile,
    SuccessUpdateProfile,
    SuccessDeleteProfile,
    SuccessHealthCheck,
    SuccessServerInfo,
    SuccessKeepServer,
    SuccessKeepLocal,
    SuccessKeepBoth,

    // ==================== Error Messages ====================
    ErrorDefault,
    ErrorResourceNotFound,
    ErrorUnauthorized,
    ErrorInternalServerError,
    ErrorPasswordHashFailed,
    ErrorGenerateUniqueUserIdFailed,
    ErrorRedisSaveFailed,
    ErrorRedisExpireFailed,
    ErrorRedisQueryFailed,
    ErrorRedisDeleteFailed,
    ErrorEmailAlreadyRegistered,
    ErrorEmailOrPasswordIncorrect,
    ErrorParsePasswordHashFailed,
    ErrorRefreshTokenInvalid,
    ErrorUserNotFound,
    ErrorPasswordIncorrect,
    ErrorUserDeleted,
    ErrorMissingClientData,
    ErrorQueryFailed,
    ErrorInsertFailed,
    ErrorInsertQueryFailed,
    ErrorDeleteFailed,
    ErrorSoftDeleteFailed,
    ErrorUserNotFoundOrDeleted,
    ErrorUserProfileNotFound,
    ErrorSshSessionNotFound,
    ErrorBatchSoftDeleteFailed,
    ErrorDatabaseConfigError,
    ErrorDatabaseConnectionFailed,
    ErrorDatabaseHealthCheckFailed,
    ErrorMysqlDatabaseRequired,
    ErrorMysqlHostRequired,
    ErrorMysqlUserRequired,
    ErrorMysqlPasswordRequired,
    ErrorMysqlConnectionFailed,
    ErrorMysqlDatabaseCreateFailed,
    ErrorPostgresqlDatabaseRequired,
    ErrorPostgresqlHostRequired,
    ErrorPostgresqlUserRequired,
    ErrorPostgresqlPasswordRequired,
    ErrorPostgresqlConnectionFailed,
    ErrorPostgresqlDatabaseCreateFailed,
    ErrorSqlitePathRequired,
    ErrorGetCurrentDirFailed,
    ErrorSqliteDirCreateFailed,
    ErrorSqliteFileCreateFailed,
    ErrorCreateTableFailed,
    ErrorRedisInitFailed,
    ErrorTokenDecodeFailed,
    ErrorMissingAuthHeader,
    ErrorInvalidAuthFormat,
    ErrorInvalidToken,
    ErrorVerifyUserFailed,
    ErrorUserIdNotFound,

    // ==================== Conflict Messages ====================
    ConflictVersionConflict,
    ConflictSessionConflict,
    ConflictProfileConflict,
    ConflictSshSessionKeepServer,
    ConflictUserProfileKeepServer,

    // ==================== Email Messages ====================
    EmailVerifyCodeSubject,
    SuccessEmailQueued,
    SuccessGetEmailLog,
    ErrorEmailDisabled,
    ErrorEmailRateLimit,
    ErrorEmailDailyLimit,
    ErrorEmailLogNotFound,
    ErrorVerifyCodeRequired,
    ErrorVerifyCodeExpired,
    ErrorVerifyCodeInvalid,
    ErrorEmailInvalidTemplate,
    SuccessGetQueueStatus,
    ErrorEmailSendFailed,
    ErrorEmailInvalidAddress,
    ErrorEmailConnectionFailed,
    ErrorEmailTimeout,
}

impl MessageKey {
    fn as_str(&self) -> &'static str {
        match self {
            // Success
            MessageKey::SuccessDefault => "api.success.default",
            MessageKey::SuccessRegister => "api.success.register",
            MessageKey::SuccessLogin => "api.success.login",
            MessageKey::SuccessRefreshToken => "api.success.refresh_token",
            MessageKey::SuccessDeleteAccount => "api.success.delete_account",
            MessageKey::SuccessDeleteRefreshToken => "api.success.delete_refresh_token",
            MessageKey::SuccessResolveConflict => "api.success.resolve_conflict",
            MessageKey::SuccessSync => "api.success.sync",
            MessageKey::SuccessCreateSession => "api.success.create_session",
            MessageKey::SuccessListSessions => "api.success.list_sessions",
            MessageKey::SuccessGetSession => "api.success.get_session",
            MessageKey::SuccessUpdateSession => "api.success.update_session",
            MessageKey::SuccessDeleteSession => "api.success.delete_session",
            MessageKey::SuccessGetProfile => "api.success.get_profile",
            MessageKey::SuccessCreateProfile => "api.success.create_profile",
            MessageKey::SuccessUpdateProfile => "api.success.update_profile",
            MessageKey::SuccessDeleteProfile => "api.success.delete_profile",
            MessageKey::SuccessHealthCheck => "api.success.health_check",
            MessageKey::SuccessServerInfo => "api.success.server_info",
            MessageKey::SuccessKeepServer => "api.success.keep_server",
            MessageKey::SuccessKeepLocal => "api.success.keep_local",
            MessageKey::SuccessKeepBoth => "api.success.keep_both",

            // Error
            MessageKey::ErrorDefault => "api.error.default",
            MessageKey::ErrorResourceNotFound => "api.error.resource_not_found",
            MessageKey::ErrorUnauthorized => "api.error.unauthorized",
            MessageKey::ErrorInternalServerError => "api.error.internal_server_error",
            MessageKey::ErrorPasswordHashFailed => "api.error.password_hash_failed",
            MessageKey::ErrorGenerateUniqueUserIdFailed => "api.error.generate_unique_user_id_failed",
            MessageKey::ErrorRedisSaveFailed => "api.error.redis_save_failed",
            MessageKey::ErrorRedisExpireFailed => "api.error.redis_expire_failed",
            MessageKey::ErrorRedisQueryFailed => "api.error.redis_query_failed",
            MessageKey::ErrorRedisDeleteFailed => "api.error.redis_delete_failed",
            MessageKey::ErrorEmailAlreadyRegistered => "api.error.email_already_registered",
            MessageKey::ErrorEmailOrPasswordIncorrect => "api.error.email_or_password_incorrect",
            MessageKey::ErrorParsePasswordHashFailed => "api.error.parse_password_hash_failed",
            MessageKey::ErrorRefreshTokenInvalid => "api.error.refresh_token_invalid",
            MessageKey::ErrorUserNotFound => "api.error.user_not_found",
            MessageKey::ErrorPasswordIncorrect => "api.error.password_incorrect",
            MessageKey::ErrorUserDeleted => "api.error.user_deleted",
            MessageKey::ErrorMissingClientData => "api.error.missing_client_data",
            MessageKey::ErrorQueryFailed => "api.error.query_failed",
            MessageKey::ErrorInsertFailed => "api.error.insert_failed",
            MessageKey::ErrorInsertQueryFailed => "api.error.insert_query_failed",
            MessageKey::ErrorDeleteFailed => "api.error.delete_failed",
            MessageKey::ErrorSoftDeleteFailed => "api.error.soft_delete_failed",
            MessageKey::ErrorUserNotFoundOrDeleted => "api.error.user_not_found_or_deleted",
            MessageKey::ErrorUserProfileNotFound => "api.error.user_profile_not_found",
            MessageKey::ErrorSshSessionNotFound => "api.error.ssh_session_not_found",
            MessageKey::ErrorBatchSoftDeleteFailed => "api.error.batch_soft_delete_failed",
            MessageKey::ErrorDatabaseConfigError => "api.error.database_config_error",
            MessageKey::ErrorDatabaseConnectionFailed => "api.error.database_connection_failed",
            MessageKey::ErrorDatabaseHealthCheckFailed => "api.error.database_health_check_failed",
            MessageKey::ErrorMysqlDatabaseRequired => "api.error.mysql_database_required",
            MessageKey::ErrorMysqlHostRequired => "api.error.mysql_host_required",
            MessageKey::ErrorMysqlUserRequired => "api.error.mysql_user_required",
            MessageKey::ErrorMysqlPasswordRequired => "api.error.mysql_password_required",
            MessageKey::ErrorMysqlConnectionFailed => "api.error.mysql_connection_failed",
            MessageKey::ErrorMysqlDatabaseCreateFailed => "api.error.mysql_database_create_failed",
            MessageKey::ErrorPostgresqlDatabaseRequired => "api.error.postgresql_database_required",
            MessageKey::ErrorPostgresqlHostRequired => "api.error.postgresql_host_required",
            MessageKey::ErrorPostgresqlUserRequired => "api.error.postgresql_user_required",
            MessageKey::ErrorPostgresqlPasswordRequired => "api.error.postgresql_password_required",
            MessageKey::ErrorPostgresqlConnectionFailed => "api.error.postgresql_connection_failed",
            MessageKey::ErrorPostgresqlDatabaseCreateFailed => "api.error.postgresql_database_create_failed",
            MessageKey::ErrorSqlitePathRequired => "api.error.sqlite_path_required",
            MessageKey::ErrorGetCurrentDirFailed => "api.error.get_current_dir_failed",
            MessageKey::ErrorSqliteDirCreateFailed => "api.error.sqlite_dir_create_failed",
            MessageKey::ErrorSqliteFileCreateFailed => "api.error.sqlite_file_create_failed",
            MessageKey::ErrorCreateTableFailed => "api.error.create_table_failed",
            MessageKey::ErrorRedisInitFailed => "api.error.redis_init_failed",
            MessageKey::ErrorTokenDecodeFailed => "api.error.token_decode_failed",
            MessageKey::ErrorMissingAuthHeader => "api.error.missing_auth_header",
            MessageKey::ErrorInvalidAuthFormat => "api.error.invalid_auth_format",
            MessageKey::ErrorInvalidToken => "api.error.invalid_token",
            MessageKey::ErrorVerifyUserFailed => "api.error.verify_user_failed",
            MessageKey::ErrorUserIdNotFound => "api.error.user_id_not_found",

            // Conflict
            MessageKey::ConflictVersionConflict => "api.conflict.version_conflict",
            MessageKey::ConflictSessionConflict => "api.conflict.session_conflict",
            MessageKey::ConflictProfileConflict => "api.conflict.profile_conflict",
            MessageKey::ConflictSshSessionKeepServer => "api.conflict.ssh_session_keep_server",
            MessageKey::ConflictUserProfileKeepServer => "api.conflict.user_profile_keep_server",

            // Email
            MessageKey::EmailVerifyCodeSubject => "api.email.verify_code_subject",
            MessageKey::SuccessEmailQueued => "api.email.success_queued",
            MessageKey::SuccessGetEmailLog => "api.email.success_get_email_log",
            MessageKey::ErrorEmailDisabled => "api.email.error_disabled",
            MessageKey::ErrorEmailRateLimit => "api.email.error_rate_limit",
            MessageKey::ErrorEmailDailyLimit => "api.email.error_daily_limit",
            MessageKey::ErrorEmailLogNotFound => "api.email.error_log_not_found",
            MessageKey::ErrorVerifyCodeRequired => "api.email.error_verify_code_required",
            MessageKey::ErrorVerifyCodeExpired => "api.email.error_verify_code_expired",
            MessageKey::ErrorVerifyCodeInvalid => "api.email.error_verify_code_invalid",
            MessageKey::ErrorEmailInvalidTemplate => "api.email.error_invalid_template",
            MessageKey::SuccessGetQueueStatus => "api.email.success_get_queue_status",
            MessageKey::ErrorEmailSendFailed => "api.email.error_send_failed",
            MessageKey::ErrorEmailInvalidAddress => "api.email.error_invalid_address",
            MessageKey::ErrorEmailConnectionFailed => "api.email.error_connection_failed",
            MessageKey::ErrorEmailTimeout => "api.email.error_timeout",
        }
    }
}

/// 翻译消息（从请求上下文中获取语言）
pub fn t(lang: Option<&str>, key: MessageKey) -> String {
    let language = lang.unwrap_or(ZH_CN);
    get_translation(language, key)
}

/// 翻译消息（带变量替换）
pub fn t_with_vars(lang: Option<&str>, key: MessageKey, vars: &[(&str, &str)]) -> String {
    let mut message = t(lang, key);
    for (k, v) in vars {
        message = message.replace(&format!("{{{}}}", k), v);
    }
    message
}

/// 获取默认成功消息
pub fn t_success_default(lang: Option<&str>) -> String {
    t(lang, MessageKey::SuccessDefault)
}

/// 获取指定语言的翻译
fn get_translation(lang: &str, key: MessageKey) -> String {
    let messages = MESSAGES.get(lang).unwrap_or_else(|| MESSAGES.get(ZH_CN).unwrap());
    let key_str = key.as_str();

    // 支持嵌套 key，如 "api.success.default"
    let keys: Vec<&str> = key_str.split('.').collect();
    let mut current = messages;

    for k in keys {
        if let Some(val) = current.get(k) {
            current = val;
        } else {
            return key_str.to_string();
        }
    }

    if current.is_string() {
        current.as_str().unwrap().to_string()
    } else {
        key_str.to_string()
    }
}

/// 翻译字典
static MESSAGES: Lazy<serde_json::Value> = Lazy::new(|| {
    json!({
        "zh-CN": {
            "api": {
                "success": {
                    "default": "操作成功",
                    "register": "注册成功",
                    "login": "登录成功",
                    "refresh_token": "刷新令牌成功",
                    "delete_account": "账号删除成功",
                    "delete_refresh_token": "刷新令牌删除成功",
                    "resolve_conflict": "冲突解决成功",
                    "sync": "同步成功",
                    "create_session": "SSH 会话创建成功",
                    "list_sessions": "获取 SSH 会话列表成功",
                    "get_session": "获取 SSH 会话成功",
                    "update_session": "SSH 会话更新成功",
                    "delete_session": "SSH 会话删除成功",
                    "get_profile": "获取用户资料成功",
                    "create_profile": "用户资料创建成功",
                    "update_profile": "用户资料更新成功",
                    "delete_profile": "用户资料删除成功",
                    "health_check": "健康检查成功",
                    "server_info": "获取服务器信息成功",
                    "keep_server": "保留服务器版本",
                    "keep_local": "保留客户端版本",
                    "keep_both": "创建冲突副本"
                },
                "error": {
                    "default": "操作失败",
                    "resource_not_found": "资源未找到",
                    "unauthorized": "未授权",
                    "internal_server_error": "内部服务器错误",
                    "password_hash_failed": "密码哈希失败",
                    "generate_unique_user_id_failed": "生成唯一用户 ID 失败",
                    "redis_save_failed": "Redis 保存失败",
                    "redis_expire_failed": "Redis 设置过期时间失败",
                    "redis_query_failed": "Redis 查询失败",
                    "redis_delete_failed": "Redis 删除失败",
                    "email_already_registered": "邮箱已注册",
                    "email_or_password_incorrect": "邮箱或密码错误",
                    "parse_password_hash_failed": "解析密码哈希失败",
                    "refresh_token_invalid": "刷新令牌无效或已过期",
                    "user_not_found": "用户不存在",
                    "password_incorrect": "密码错误",
                    "user_deleted": "用户已被删除，无法同步",
                    "missing_client_data": "缺少客户端数据",
                    "query_failed": "查询失败",
                    "insert_failed": "插入失败",
                    "insert_query_failed": "插入后查询失败",
                    "delete_failed": "删除失败",
                    "soft_delete_failed": "软删除失败",
                    "user_not_found_or_deleted": "用户不存在或已删除",
                    "user_profile_not_found": "用户资料未找到",
                    "ssh_session_not_found": "SSH 会话未找到",
                    "batch_soft_delete_failed": "批量软删除失败",
                    "database_config_error": "数据库配置错误",
                    "database_connection_failed": "数据库连接失败",
                    "database_health_check_failed": "数据库健康检查失败",
                    "mysql_database_required": "MySQL 需要配置 database.database",
                    "mysql_host_required": "MySQL 需要配置 database.host",
                    "mysql_user_required": "MySQL 需要配置 database.user",
                    "mysql_password_required": "MySQL 需要配置 database.password",
                    "mysql_connection_failed": "连接 MySQL 服务器失败",
                    "mysql_database_create_failed": "创建 MySQL 数据库失败",
                    "postgresql_database_required": "PostgreSQL 需要配置 database.database",
                    "postgresql_host_required": "PostgreSQL 需要配置 database.host",
                    "postgresql_user_required": "PostgreSQL 需要配置 database.user",
                    "postgresql_password_required": "PostgreSQL 需要配置 database.password",
                    "postgresql_connection_failed": "连接 PostgreSQL 服务器失败",
                    "postgresql_database_create_failed": "创建 PostgreSQL 数据库失败",
                    "sqlite_path_required": "SQLite 需要配置 database.path",
                    "get_current_dir_failed": "获取当前目录失败",
                    "sqlite_dir_create_failed": "创建 SQLite 数据库目录失败",
                    "sqlite_file_create_failed": "创建 SQLite 数据库文件失败",
                    "create_table_failed": "创建{table}失败",
                    "redis_init_failed": "Redis 初始化失败",
                    "token_decode_failed": "Token 解码失败",
                    "missing_auth_header": "缺少授权头",
                    "invalid_auth_format": "无效的授权头格式",
                    "invalid_token": "无效或已过期的令牌",
                    "verify_user_failed": "验证用户失败",
                    "user_id_not_found": "请求中未找到用户 ID"
                },
                "conflict": {
                    "version_conflict": "客户端版本 {client} < 服务器版本 {server}",
                    "session_conflict": "会话 '{name}' 有冲突",
                    "profile_conflict": "用户资料有冲突",
                    "ssh_session_keep_server": "部分 SSH 会话已保留服务器版本",
                    "user_profile_keep_server": "用户资料已保留服务器版本"
                },
                "email": {
                    "verify_code_subject": "验证码",
                    "success_queued": "验证码已发送至 {email}",
                    "success_get_email_log": "获取邮件日志成功",
                    "error_disabled": "邮件功能未启用",
                    "error_rate_limit": "发送过于频繁，请 {ttl} 秒后再试",
                    "error_daily_limit": "今日发送次数已达上限 ({count}/10)",
                    "error_log_not_found": "未找到邮件日志",
                    "error_verify_code_required": "请先获取验证码",
                    "error_verify_code_expired": "验证码已过期",
                    "error_verify_code_invalid": "验证码错误",
                    "error_invalid_template": "无效的邮件模板",
                    "success_get_queue_status": "获取队列状态成功",
                    "error_send_failed": "邮件发送失败，请检查邮箱地址是否正确",
                    "error_invalid_address": "邮箱地址无效",
                    "error_connection_failed": "无法连接到邮件服务器",
                    "error_timeout": "邮件发送超时，请稍后重试"
                }
            }
        },
        "en": {
            "api": {
                "success": {
                    "default": "Operation successful",
                    "register": "Registration successful",
                    "login": "Login successful",
                    "refresh_token": "Token refresh successful",
                    "delete_account": "Account deleted successfully",
                    "delete_refresh_token": "Refresh token deleted successfully",
                    "resolve_conflict": "Conflict resolved successfully",
                    "sync": "Sync successful",
                    "create_session": "SSH session created successfully",
                    "list_sessions": "SSH sessions retrieved successfully",
                    "get_session": "SSH session retrieved successfully",
                    "update_session": "SSH session updated successfully",
                    "delete_session": "SSH session deleted successfully",
                    "get_profile": "User profile retrieved successfully",
                    "create_profile": "User profile created successfully",
                    "update_profile": "User profile updated successfully",
                    "delete_profile": "User profile deleted successfully",
                    "health_check": "Health check successful",
                    "server_info": "Server info retrieved successfully",
                    "keep_server": "Kept server version",
                    "keep_local": "Kept local version",
                    "keep_both": "Created a copy with conflict resolution"
                },
                "error": {
                    "default": "Operation failed",
                    "resource_not_found": "Resource not found",
                    "unauthorized": "Unauthorized",
                    "internal_server_error": "Internal server error",
                    "password_hash_failed": "Password hash failed",
                    "generate_unique_user_id_failed": "Failed to generate unique user ID",
                    "redis_save_failed": "Redis save failed",
                    "redis_expire_failed": "Redis set expiration failed",
                    "redis_query_failed": "Redis query failed",
                    "redis_delete_failed": "Redis delete failed",
                    "email_already_registered": "Email already registered",
                    "email_or_password_incorrect": "Email or password incorrect",
                    "parse_password_hash_failed": "Failed to parse password hash",
                    "refresh_token_invalid": "Refresh token is invalid or expired",
                    "user_not_found": "User not found",
                    "password_incorrect": "Password incorrect",
                    "user_deleted": "User has been deleted, cannot sync",
                    "missing_client_data": "Missing client data",
                    "query_failed": "Query failed",
                    "insert_failed": "Insert failed",
                    "insert_query_failed": "Query failed after insert",
                    "delete_failed": "Delete failed",
                    "soft_delete_failed": "Soft delete failed",
                    "user_not_found_or_deleted": "User not found or deleted",
                    "user_profile_not_found": "User profile not found",
                    "ssh_session_not_found": "SSH session not found",
                    "batch_soft_delete_failed": "Batch soft delete failed",
                    "database_config_error": "Database configuration error",
                    "database_connection_failed": "Database connection failed",
                    "database_health_check_failed": "Database health check failed",
                    "mysql_database_required": "MySQL requires database.database configuration",
                    "mysql_host_required": "MySQL requires database.host configuration",
                    "mysql_user_required": "MySQL requires database.user configuration",
                    "mysql_password_required": "MySQL requires database.password configuration",
                    "mysql_connection_failed": "Failed to connect to MySQL server",
                    "mysql_database_create_failed": "Failed to create MySQL database",
                    "postgresql_database_required": "PostgreSQL requires database.database configuration",
                    "postgresql_host_required": "PostgreSQL requires database.host configuration",
                    "postgresql_user_required": "PostgreSQL requires database.user configuration",
                    "postgresql_password_required": "PostgreSQL requires database.password configuration",
                    "postgresql_connection_failed": "Failed to connect to PostgreSQL server",
                    "postgresql_database_create_failed": "Failed to create PostgreSQL database",
                    "sqlite_path_required": "SQLite requires database.path configuration",
                    "get_current_dir_failed": "Failed to get current directory",
                    "sqlite_dir_create_failed": "Failed to create SQLite database directory",
                    "sqlite_file_create_failed": "Failed to create SQLite database file",
                    "create_table_failed": "Failed to create {table}",
                    "redis_init_failed": "Redis initialization failed",
                    "token_decode_failed": "Token decode failed",
                    "missing_auth_header": "Missing authorization header",
                    "invalid_auth_format": "Invalid authorization header format",
                    "invalid_token": "Invalid or expired token",
                    "verify_user_failed": "Failed to verify user",
                    "user_id_not_found": "User ID not found in request"
                },
                "conflict": {
                    "version_conflict": "Client version {client} < Server version {server}",
                    "session_conflict": "Session '{name}' has conflict",
                    "profile_conflict": "User profile has conflict",
                    "ssh_session_keep_server": "Some SSH sessions kept server version",
                    "user_profile_keep_server": "User profile kept server version"
                },
                "email": {
                    "verify_code_subject": "Verification Code",
                    "success_queued": "Verification code sent to {email}",
                    "success_get_email_log": "Get email log successful",
                    "error_disabled": "Email feature is disabled",
                    "error_rate_limit": "Please try again in {ttl} seconds",
                    "error_daily_limit": "Daily limit reached ({count}/10)",
                    "error_log_not_found": "Email log not found",
                    "error_verify_code_required": "Please get verification code first",
                    "error_verify_code_expired": "Verification code expired",
                    "error_verify_code_invalid": "Invalid verification code",
                    "error_invalid_template": "Invalid email template",
                    "success_get_queue_status": "Get queue status successful",
                    "error_send_failed": "Failed to send email, please check if the email address is correct",
                    "error_invalid_address": "Invalid email address",
                    "error_connection_failed": "Cannot connect to email server",
                    "error_timeout": "Email sending timeout, please try again later"
                }
            }
        }
    })
});