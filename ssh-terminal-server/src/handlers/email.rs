use crate::domain::dto::mail::{GetLatestEmailLogRequest, SendVerifyCodeRequest};
use crate::domain::vo::mail::{EmailQueueStatusVO, EmailResult, EmailStatusVO};
use crate::domain::vo::ApiResponse;
use crate::infra::mail::queue::MailQueue;
use crate::infra::middleware::language::Language;
use crate::infra::middleware::logging::RequestId;
use crate::infra::middleware::user_id::UserId;
use crate::repositories::email_log_repository::EmailLogRepository;
use crate::services::mail_service::MailService;
use crate::utils::i18n::{t, t_with_vars, MessageKey};
use axum::{
    extract::{Extension, State},
    Json,
};
use tracing::info;

/// 发送验证码邮件（公开 API，无需认证）- 同步版本
pub async fn send_verify_code_sync_handler(
    Extension(request_id): Extension<RequestId>,
    Language(language): Language,
    State(state): State<crate::AppState>,
    Json(payload): Json<SendVerifyCodeRequest>,
) -> Result<Json<ApiResponse<EmailResult>>, crate::error::ErrorResponse> {
    info!(
        "[{}] 发送验证码邮件请求: email={}",
        request_id.0, payload.email
    );

    // 检查邮件功能是否启用
    if !state.config.email.enabled {
        let message = t(Some(language.as_str()), MessageKey::ErrorEmailDisabled);
        return Err(crate::error::ErrorResponse::new(message));
    }

    // 创建 Repository
    let email_log_repo = EmailLogRepository::new(state.pool.clone());

    // 创建 Service（传入 email_config）
    let mail_service = MailService::new(
        state.redis_client.clone(),
        email_log_repo,
        state.config.email.clone(),
    );

    // 使用 email 作为临时 user_id（因为用户还未注册）
    let temp_user_id = &payload.email;

    // 调用同步发送方法
    match mail_service
        .send_verify_code_sync(temp_user_id, &payload.email, &language)
        .await
    {
        Ok(_result) => {
            let message = t_with_vars(
                Some(language.as_str()),
                MessageKey::SuccessEmailQueued,
                &[("email", &payload.email)],
            );
            let email_result = EmailResult::success();
            let response = ApiResponse::success_with_message(email_result, &message);
            info!("[{}] 验证码邮件发送成功: {}", request_id.0, payload.email);
            Ok(Json(response))
        }
        Err(e) => {
            info!("[{}] 发送验证码邮件失败: {}", request_id.0, e.to_string());
            // 直接传递 Service 返回的具体错误消息（已包含详细信息）
            Err(crate::error::ErrorResponse::new(e.to_string()))
        }
    }
}

/// 发送验证码邮件（公开 API，无需认证）- 异步版本
///
/// ⚠️ **已弃用：此端点使用异步队列模式，不会立即返回邮件发送结果**
/// - 如果邮箱地址无效，仍会返回成功，然后邮件在后台发送失败
/// - 推荐使用 `/api/email/send-verify-code` 端点，可以立即获取真实的发送结果
/// #[deprecated(note = "请使用 /api/email/send-verify-code 端点以获取实时发送结果")]
pub async fn send_verify_code_async_handler(
    Extension(request_id): Extension<RequestId>,
    Language(language): Language,
    State(state): State<crate::AppState>,
    Json(payload): Json<SendVerifyCodeRequest>,
) -> Result<Json<ApiResponse<EmailResult>>, crate::error::ErrorResponse> {
    info!(
        "[{}] 发送验证码邮件请求（异步）: email={}",
        request_id.0, payload.email
    );

    // 检查邮件功能是否启用
    if !state.config.email.enabled {
        let message = t(Some(language.as_str()), MessageKey::ErrorEmailDisabled);
        return Err(crate::error::ErrorResponse::new(message));
    }

    // 创建 Repository
    let email_log_repo = EmailLogRepository::new(state.pool.clone());

    // 创建 Service（传入 email_config）
    let mail_service = MailService::new(
        state.redis_client.clone(),
        email_log_repo,
        state.config.email.clone(),
    );

    // 使用 email 作为临时 user_id（因为用户还未注册）
    let temp_user_id = &payload.email;

    // 调用异步发送方法
    match mail_service
        .send_verify_code_async(temp_user_id, &payload.email, &language)
        .await
    {
        Ok(_result) => {
            let message = t_with_vars(
                Some(language.as_str()),
                MessageKey::SuccessEmailQueued,
                &[("email", &payload.email)],
            );
            let email_result = EmailResult::success();
            let response = ApiResponse::success_with_message(email_result, &message);
            info!("[{}] 验证码邮件已加入队列: {}", request_id.0, payload.email);
            Ok(Json(response))
        }
        Err(e) => {
            info!("[{}] 发送验证码邮件失败: {}", request_id.0, e.to_string());
            // 直接传递 Service 返回的具体错误消息（已包含详细信息）
            Err(crate::error::ErrorResponse::new(e.to_string()))
        }
    }
}

/// 获取最新邮件日志状态（需要认证）
pub async fn get_latest_email_log_handler(
    Extension(request_id): Extension<RequestId>,
    Language(language): Language,
    UserId(user_id): UserId,
    State(state): State<crate::AppState>,
    Json(payload): Json<GetLatestEmailLogRequest>,
) -> Result<Json<ApiResponse<Option<EmailStatusVO>>>, crate::error::ErrorResponse> {
    info!(
        "[{}] 查询最新邮件日志: user_id={}, email={}",
        request_id.0, user_id, payload.email
    );

    // 检查邮件功能是否启用
    if !state.config.email.enabled {
        let message = t(Some(language.as_str()), MessageKey::ErrorEmailDisabled);
        return Err(crate::error::ErrorResponse::new(message));
    }

    let email_log_repo = EmailLogRepository::new(state.pool.clone());
    match email_log_repo.find_latest_by_email(&payload.email).await {
        Ok(Some(log)) => {
            let vo = EmailStatusVO {
                id: log.id,
                user_id: log.user_id,
                email: log.email,
                template: log.template,
                status: log.status,
                error_message: log.error_message,
                retry_count: log.retry_count,
                created_at: log.created_at,
                updated_at: log.updated_at,
            };
            let message = t(Some(language.as_str()), MessageKey::SuccessGetEmailLog);
            let response = ApiResponse::success_with_message(Some(vo), &message);
            Ok(Json(response))
        }
        Ok(None) => {
            let message = t(Some(language.as_str()), MessageKey::ErrorEmailLogNotFound);
            let response = ApiResponse::success_with_message(None::<EmailStatusVO>, &message);
            Ok(Json(response))
        }
        Err(e) => {
            info!("[{}] 查询邮件日志失败: {}", request_id.0, e.to_string());
            Err(crate::error::ErrorResponse::new(e.to_string()))
        }
    }
}

/// 获取邮件队列状态（需要认证）
pub async fn get_queue_status_handler(
    Extension(request_id): Extension<RequestId>,
    Language(language): Language,
    UserId(_user_id): UserId,
    State(state): State<crate::AppState>,
) -> Result<Json<ApiResponse<EmailQueueStatusVO>>, crate::error::ErrorResponse> {
    info!("[{}] 查询邮件队列状态", request_id.0);

    // 检查邮件功能是否启用
    if !state.config.email.enabled {
        let message = t(Some(language.as_str()), MessageKey::ErrorEmailDisabled);
        return Err(crate::error::ErrorResponse::new(message));
    }

    let mail_queue = MailQueue::new(state.redis_client.clone());

    // 获取队列长度
    let queue_len = mail_queue.queue_len().await.unwrap_or(0);

    // 获取死信队列长度
    let dead_letter_len = mail_queue.dead_letter_len().await.unwrap_or(0);

    let status = EmailQueueStatusVO {
        queue_length: queue_len,
        dead_letter_length: dead_letter_len,
        enabled: state.config.email.enabled,
    };

    let message = t(Some(language.as_str()), MessageKey::SuccessGetQueueStatus);
    let response = ApiResponse::success_with_message(status, &message);
    Ok(Json(response))
}
