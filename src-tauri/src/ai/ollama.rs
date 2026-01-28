// Ollama 本地模型实现

use super::provider::{AIProvider, ChatMessage};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};

/// Ollama 生成请求选项
#[derive(Debug, Serialize)]
struct OllamaOptions {
    temperature: f32,
    num_predict: u32,
}

/// Ollama 生成请求
#[derive(Debug, Serialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
    options: OllamaOptions,
}

/// Ollama 响应
#[derive(Debug, Deserialize)]
struct OllamaResponse {
    response: String,
}

/// Ollama Provider（本地模型）
pub struct OllamaProvider {
    client: Client,
    base_url: String,
    model: String,
    temperature: f32,
    max_tokens: u32,
}

impl OllamaProvider {
    /// 创建新的 Ollama Provider
    ///
    /// # 参数
    /// * `base_url` - Ollama 服务地址（可选，默认为 http://localhost:11434）
    /// * `model` - 使用的模型名称（如 llama3.2, mistral, etc.）
    /// * `temperature` - 温度参数（0-2）
    /// * `max_tokens` - 最大生成 token 数
    pub fn new(
        base_url: Option<String>,
        model: String,
        temperature: Option<f32>,
        max_tokens: Option<u32>,
    ) -> Self {
        Self {
            client: Client::new(),
            base_url: base_url.unwrap_or_else(|| "http://localhost:11434".to_string()),
            model,
            temperature: temperature.unwrap_or(0.7),
            max_tokens: max_tokens.unwrap_or(2000),
        }
    }

    /// 将 ChatMessage 转换为 Ollama 提示词格式
    fn format_prompt(&self, messages: Vec<ChatMessage>) -> String {
        messages
            .iter()
            .map(|msg| {
                match msg.role.as_str() {
                    "user" => format!("User: {}", msg.content),
                    "assistant" => format!("Assistant: {}", msg.content),
                    "system" => format!("System: {}", msg.content),
                    _ => msg.content.clone(),
                }
            })
            .collect::<Vec<_>>()
            .join("\n\n")
    }
}

#[async_trait]
impl AIProvider for OllamaProvider {
    /// 发送聊天请求到 Ollama API
    async fn chat(&self, messages: Vec<ChatMessage>) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let url = format!("{}/api/generate", self.base_url);

        tracing::info!("[Ollama] Sending request to: {}", url);
        tracing::info!("[Ollama] Model: {}", self.model);
        tracing::info!("[Ollama] Temperature: {}", self.temperature);
        tracing::info!("[Ollama] Num predict (max tokens): {}", self.max_tokens);
        tracing::info!("[Ollama] Messages count: {}", messages.len());

        let prompt = self.format_prompt(messages);
        tracing::debug!("[Ollama] Prompt length: {} chars", prompt.len());

        let request = OllamaRequest {
            model: self.model.clone(),
            prompt,
            stream: false,
            options: OllamaOptions {
                temperature: self.temperature,
                num_predict: self.max_tokens,
            },
        };

        tracing::debug!("[Ollama] Request body: {:?}", serde_json::to_string(&request));

        let response = self.client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await?;

        tracing::info!("[Ollama] Response status: {}", response.status());

        if !response.status().is_success() {
            let error_text = response.text().await?;
            tracing::error!("[Ollama] API error response: {}", error_text);
            return Err(format!("Ollama API error: {}", error_text).into());
        }

        let ollama_response: OllamaResponse = response.json().await?;

        let content = &ollama_response.response;
        let content_preview = if content.len() > 200 {
            format!("{}... (truncated, {} chars total)", &content[..200], content.len())
        } else {
            content.clone()
        };

        tracing::info!("[Ollama] Response: {}", content_preview);
        Ok(content.clone())
    }

    /// 测试 Ollama 服务连接
    async fn test_connection(&self) -> Result<bool, Box<dyn std::error::Error + Send + Sync>> {
        tracing::info!("[Ollama] Testing connection...");
        let url = format!("{}/api/tags", self.base_url);

        tracing::info!("[Ollama] Checking models at: {}", url);

        let response = self.client.get(&url).send().await?;

        tracing::info!("[Ollama] Response status: {}", response.status());

        if response.status().is_success() {
            tracing::info!("[Ollama] Connection test successful");
            Ok(true)
        } else {
            let error_text = response.text().await?;
            tracing::error!("[Ollama] Connection test failed: {}", error_text);
            Ok(false)
        }
    }
}
