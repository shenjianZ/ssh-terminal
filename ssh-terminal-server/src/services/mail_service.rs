use crate::config::email::EmailConfig;
use crate::domain::dto::mail::MailTaskDto;
use crate::domain::vo::mail::EmailResult;
use crate::infra::mail::mailer::{Mailer, SmtpConfig};
use crate::infra::mail::queue::MailQueue;
use crate::infra::mail::rate_limit::MailRateLimit;
use crate::infra::redis::redis_client::RedisClient;
use crate::infra::redis::redis_key::{BusinessType, RedisKey};
use crate::repositories::email_log_repository::EmailLogRepository;
use crate::utils::i18n::{self, MessageKey};
use crate::utils::mail_template;
use anyhow::{Context, Result};
use rand::Rng;

/// 邮件服务
pub struct MailService {
    redis_client: RedisClient,
    email_log_repo: EmailLogRepository,
    email_config: EmailConfig,
}

impl MailService {
    pub fn new(
        redis_client: RedisClient,
        email_log_repo: EmailLogRepository,
        email_config: EmailConfig,
    ) -> Self {
        Self {
            redis_client,
            email_log_repo,
            email_config,
        }
    }

    /// 发送验证码邮件（异步队列模式）
    ///
    /// ⚠️ **已弃用：此方法使用异步队列模式，不会立即返回邮件发送结果**
    /// - 如果邮箱地址无效，仍会返回成功，然后邮件在后台发送失败
    /// - 推荐使用 `send_verify_code_sync()` 方法，可以立即获取真实的发送结果
    ///
    /// - user_id: 用户 ID
    /// - email: 收件人邮箱
    /// - lang: 语言代码（zh-CN 或 en）
    /// #[deprecated(note = "请使用 send_verify_code_sync() 方法以获取实时发送结果")]
    pub async fn send_verify_code_async(
        &self,
        user_id: &str,
        email: &str,
        lang: &str,
    ) -> Result<EmailResult> {
        let rate_limit = MailRateLimit::new(self.redis_client.clone());
        let queue = MailQueue::new(self.redis_client.clone());

        // 1. 检查每日限制（每天最多发送 10 次）
        let can_send_daily = rate_limit
            .check_daily_limit(user_id)
            .await
            .context("Failed to check daily limit")?;

        if !can_send_daily {
            let daily_count = rate_limit.get_daily_count(user_id).await.unwrap_or(10);
            let message = i18n::t_with_vars(
                Some(lang),
                MessageKey::ErrorEmailDailyLimit,
                &[("count", &daily_count.to_string())],
            );
            return Err(anyhow::anyhow!("{}", message));
        }

        // 2. 检查限频（60秒内只能发送一次）
        let can_send = rate_limit
            .check_rate_limit(user_id)
            .await
            .context("Failed to check rate limit")?;

        if !can_send {
            let ttl = rate_limit.get_rate_ttl(user_id).await.unwrap_or(60);
            let message = i18n::t_with_vars(
                Some(lang),
                MessageKey::ErrorEmailRateLimit,
                &[("ttl", &ttl.to_string())],
            );
            return Err(anyhow::anyhow!("{}", message));
        }

        // 3. 生成 6 位数字验证码
        let code = self.generate_verify_code();

        // 4. 将验证码保存到 Redis（5分钟有效期）
        let verify_key = RedisKey::new(BusinessType::Auth)
            .add_identifier("verify_code")
            .add_identifier(email);
        self.redis_client
            .set(&verify_key.to_string(), &code)
            .await
            .context("Failed to save verify code to Redis")?;
        self.redis_client
            .expire(&verify_key.to_string(), 300) // 5分钟 = 300秒
            .await
            .context("Failed to set verify code expiration")?;

        // 5. 创建邮件日志记录
        self.email_log_repo
            .create(user_id, email, "verify_code")
            .await
            .context("Failed to create email log")?;

        // 6. 构建邮件任务
        let task = MailTaskDto {
            to: email.to_string(),
            template: "verify_code".to_string(),
            lang: lang.to_string(),
            data: serde_json::json!({ "code": code }),
            retry: 0,
        };

        // 7. 推入队列
        queue
            .push(&task)
            .await
            .context("Failed to push mail task to queue")?;

        // 8. 返回成功结果
        Ok(EmailResult::success())
    }

    /// 发送验证码邮件（同步模式）
    /// - user_id: 用户 ID
    /// - email: 收件人邮箱
    /// - lang: 语言代码（zh-CN 或 en）
    ///
    /// 此方法直接发送邮件，返回真实的发送结果
    pub async fn send_verify_code_sync(
        &self,
        user_id: &str,
        email: &str,
        lang: &str,
    ) -> Result<EmailResult> {
        let rate_limit = MailRateLimit::new(self.redis_client.clone());

        // 1. 检查每日限制（每天最多发送 10 次）
        let can_send_daily = rate_limit
            .check_daily_limit(user_id)
            .await
            .context("Failed to check daily limit")?;

        if !can_send_daily {
            let daily_count = rate_limit.get_daily_count(user_id).await.unwrap_or(10);
            let message = i18n::t_with_vars(
                Some(lang),
                MessageKey::ErrorEmailDailyLimit,
                &[("count", &daily_count.to_string())],
            );
            return Err(anyhow::anyhow!("{}", message));
        }

        // 2. 检查限频（60秒内只能发送一次）
        let can_send = rate_limit
            .check_rate_limit(user_id)
            .await
            .context("Failed to check rate limit")?;

        if !can_send {
            let ttl = rate_limit.get_rate_ttl(user_id).await.unwrap_or(60);
            let message = i18n::t_with_vars(
                Some(lang),
                MessageKey::ErrorEmailRateLimit,
                &[("ttl", &ttl.to_string())],
            );
            return Err(anyhow::anyhow!("{}", message));
        }

        // 3. 生成 6 位数字验证码
        let code = self.generate_verify_code();

        // 4. 将验证码保存到 Redis（5分钟有效期）
        let verify_key = RedisKey::new(BusinessType::Auth)
            .add_identifier("verify_code")
            .add_identifier(email);
        self.redis_client
            .set(&verify_key.to_string(), &code)
            .await
            .context("Failed to save verify code to Redis")?;
        self.redis_client
            .expire(&verify_key.to_string(), 300) // 5分钟 = 300秒
            .await
            .context("Failed to set verify code expiration")?;

        // 5. 创建邮件日志记录
        self.email_log_repo
            .create(user_id, email, "verify_code")
            .await
            .context("Failed to create email log")?;

        // 6. 渲染邮件模板
        let data = serde_json::json!({ "code": code });
        let (subject, html_body) = mail_template::render_mail("verify_code", lang, &data)
            .context("Failed to render email template")?;

        // 7. 构建 Mailer 并同步发送邮件
        let smtp_config = SmtpConfig {
            host: self.email_config.smtp_host.clone(),
            port: self.email_config.smtp_port,
            username: self.email_config.smtp_username.clone(),
            password: self.email_config.smtp_password.clone(),
            from_name: self.email_config.from_name.clone(),
            from_email: self.email_config.from_email.clone(),
        };

        let mailer = Mailer::new(smtp_config, 1); // 同步模式使用单个连接
        let task = MailTaskDto {
            to: email.to_string(),
            template: "verify_code".to_string(),
            lang: lang.to_string(),
            data: serde_json::json!({ "code": code }),
            retry: 0,
        };

        // 8. 发送邮件并转换为国际化错误消息
        mailer
            .send(&task, &subject, &html_body)
            .await
            .map_err(|e| {
                let error_msg = e.to_string();
                let i18n_message = if error_msg.contains("timeout") {
                    i18n::t(Some(lang), MessageKey::ErrorEmailTimeout)
                } else if error_msg.contains("connection") || error_msg.contains("connect") {
                    i18n::t(Some(lang), MessageKey::ErrorEmailConnectionFailed)
                } else if error_msg.contains("Invalid email address") {
                    i18n::t(Some(lang), MessageKey::ErrorEmailInvalidAddress)
                } else {
                    i18n::t(Some(lang), MessageKey::ErrorEmailSendFailed)
                };
                anyhow::anyhow!("{}", i18n_message)
            })?;

        // 9. 返回成功结果
        Ok(EmailResult::success())
    }

    /// 生成 6 位数字验证码
    fn generate_verify_code(&self) -> String {
        let mut rng = rand::thread_rng();
        (0..6).map(|_| rng.gen_range(0..10).to_string()).collect()
    }
}
