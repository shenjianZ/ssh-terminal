// OpenAI API 实现

use super::provider::{AIProvider, ChatMessage};
use async_trait::async_trait;
use reqwest::Client;
use secrecy::{Secret, ExposeSecret};
use serde::{Deserialize, Serialize};

/// OpenAI 请求体
#[derive(Debug, Serialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f32,
    max_tokens: u32,
}

/// OpenAI 响应体
#[derive(Debug, Deserialize)]
struct OpenAIResponse {
    choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    message: ChatMessage,
}

/// OpenAI Provider
pub struct OpenAIProvider {
    client: Client,
    api_key: Secret<String>,
    base_url: String,
    model: String,
    temperature: f32,
    max_tokens: u32,
}

impl OpenAIProvider {
    /// 创建新的 OpenAI Provider
    ///
    /// # 参数
    /// * `api_key` - OpenAI API Key
    /// * `base_url` - API 基础 URL（可选，默认为官方 API）
    /// * `model` - 使用的模型名称（如 gpt-4, gpt-3.5-turbo）
    /// * `temperature` - 温度参数（0-2）
    /// * `max_tokens` - 最大 token 数
    pub fn new(
        api_key: String,
        base_url: Option<String>,
        model: String,
        temperature: Option<f32>,
        max_tokens: Option<u32>,
    ) -> Self {
        Self {
            client: Client::new(),
            api_key: Secret::new(api_key),
            base_url: base_url.unwrap_or_else(|| "https://api.openai.com/v1".to_string()),
            model,
            temperature: temperature.unwrap_or(0.7),
            max_tokens: max_tokens.unwrap_or(2000),
        }
    }
}

#[async_trait]
impl AIProvider for OpenAIProvider {
    /// 发送聊天请求到 OpenAI API
    async fn chat(&self, messages: Vec<ChatMessage>) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let url = format!("{}/chat/completions", self.base_url);

        tracing::info!("[OpenAI] Sending request to: {}", url);
        tracing::info!("[OpenAI] Model: {}", self.model);
        tracing::info!("[OpenAI] Temperature: {}", self.temperature);
        tracing::info!("[OpenAI] Max tokens: {}", self.max_tokens);
        tracing::info!("[OpenAI] Messages count: {}", messages.len());

        let request = OpenAIRequest {
            model: self.model.clone(),
            messages,
            temperature: self.temperature,
            max_tokens: self.max_tokens,
        };

        tracing::debug!("[OpenAI] Request body: {:?}", serde_json::to_string(&request));

        let response = self.client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key.expose_secret()))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await?;

        tracing::info!("[OpenAI] Response status: {}", response.status());

        if !response.status().is_success() {
            let error_text = response.text().await?;
            tracing::error!("[OpenAI] API error response: {}", error_text);
            return Err(format!("OpenAI API error: {}", error_text).into());
        }

        let openai_response: OpenAIResponse = response.json().await?;

        let content = &openai_response.choices[0].message.content;
        let content_preview = if content.len() > 200 {
            format!("{}... (truncated, {} chars total)", &content[..200], content.len())
        } else {
            content.clone()
        };

        tracing::info!("[OpenAI] Response: {}", content_preview);
        Ok(content.clone())
    }

    /// 测试 OpenAI API 连接
    async fn test_connection(&self) -> Result<bool, Box<dyn std::error::Error + Send + Sync>> {
        tracing::info!("[OpenAI] Testing connection...");

        let messages = vec![
            ChatMessage {
                role: "user".to_string(),
                content: "Hello".to_string(),
            }
        ];

        match self.chat(messages).await {
            Ok(_) => {
                tracing::info!("[OpenAI] Connection test successful");
                Ok(true)
            },
            Err(e) => {
                tracing::error!("[OpenAI] Connection test failed: {}", e);
                Ok(false)
            }
        }
    }
}
