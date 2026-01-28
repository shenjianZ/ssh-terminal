// AI 相关 Tauri 命令

use crate::ai::{AIProvider, OpenAIProvider, OllamaProvider, ChatMessage};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::State;

/// AI Provider 配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIProviderConfig {
    #[serde(rename = "type")]
    pub provider_type: String,
    pub api_key: Option<String>,
    pub base_url: Option<String>,
    pub model: String,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

/// AI Manager 状态
pub struct AIManagerState {
    // 这里可以缓存 provider 实例
    providers: Arc<Mutex<Vec<String>>>,
}

impl AIManagerState {
    pub fn new() -> Self {
        Self {
            providers: Arc::new(Mutex::new(Vec::new())),
        }
    }
}

/// AI 聊天命令
#[tauri::command]
pub async fn ai_chat(
    config: AIProviderConfig,
    messages: Vec<ChatMessage>,
) -> Result<String, String> {
    // 创建 provider 实例
    let provider: Box<dyn AIProvider> = match config.provider_type.as_str() {
        "ollama" => {
            Box::new(OllamaProvider::new(
                config.base_url,
                config.model,
                config.temperature,
                config.max_tokens,
            ))
        }
        _ => {
            // 默认使用 OpenAI 兼容接口（适用于大多数 AI 服务）
            let api_key = config.api_key.ok_or("API key is required".to_string())?;
            Box::new(OpenAIProvider::new(
                api_key,
                config.base_url,
                config.model,
                config.temperature,
                config.max_tokens,
            ))
        }
    };

    // 调用 chat 方法
    provider.chat(messages).await.map_err(|e| e.to_string())
}

/// AI 命令解释
#[tauri::command]
pub async fn ai_explain_command(
    command: String,
    config: AIProviderConfig,
) -> Result<String, String> {
    let system_prompt = "你是一个 Linux/Unix 命令行专家。请简洁解释以下 Shell 命令的功能：

请按以下格式回答：
1. 命令功能：一句话总结
2. 参数说明：简要解释关键参数
3. 常用场景：1-2 个使用场景
4. 风险提示：如果有潜在风险，请警告

回答要简洁明了，不超过 200 字。";

    let messages = vec![
        ChatMessage {
            role: "system".to_string(),
            content: system_prompt.to_string(),
        },
        ChatMessage {
            role: "user".to_string(),
            content: format!("命令: {}", command),
        },
    ];

    ai_chat(config, messages).await
}

/// AI 自然语言转命令
#[tauri::command]
pub async fn ai_generate_command(
    input: String,
    config: AIProviderConfig,
) -> Result<String, String> {
    let system_prompt = "你是一个 Linux 命令生成助手。根据用户的自然语言描述，生成对应的 Shell 命令。

要求：
1. 只返回命令，不要解释
2. 如果需求不明确，返回 \"ERROR: 不明确的命令\"
3. 如果涉及危险操作，在命令前添加 \"# 警告: \"
4. 优先使用常用命令和参数

示例：
输入: \"查看当前目录所有文件\"
输出: ls -la

输入: \"查找所有 .log 文件\"
输出: find . -name \"*.log\"";

    let messages = vec![
        ChatMessage {
            role: "system".to_string(),
            content: system_prompt.to_string(),
        },
        ChatMessage {
            role: "user".to_string(),
            content: format!("用户需求: {}", input),
        },
    ];

    ai_chat(config, messages).await
}

/// AI 错误分析
#[tauri::command]
pub async fn ai_analyze_error(
    error: String,
    config: AIProviderConfig,
) -> Result<String, String> {
    let system_prompt = "你是一个 Linux 系统故障排查专家。请分析以下错误信息并提供解决方案。

请按以下格式回答：
1. 错误原因：简要说明为什么会发生这个错误
2. 解决方案：提供 2-3 个可能的解决方案，按推荐顺序排列
3. 预防措施：如何避免类似问题

回答要简洁实用，每个解决方案不超过 50 字。";

    let messages = vec![
        ChatMessage {
            role: "system".to_string(),
            content: system_prompt.to_string(),
        },
        ChatMessage {
            role: "user".to_string(),
            content: format!("错误信息:\n{}", error),
        },
    ];

    ai_chat(config, messages).await
}

/// 测试 AI 连接
#[tauri::command]
pub async fn ai_test_connection(
    config: AIProviderConfig,
) -> Result<bool, String> {
    tracing::info!("[AI] Testing connection for provider type: {}", config.provider_type);
    tracing::info!("[AI] Provider config - model: {}, base_url: {:?}",
        config.model, config.base_url);
    tracing::info!("[AI] Provider config - temperature: {:?}, max_tokens: {:?}",
        config.temperature, config.max_tokens);

    let provider: Box<dyn AIProvider> = match config.provider_type.as_str() {
        "ollama" => {
            tracing::info!("[AI] Creating Ollama provider");
            Box::new(OllamaProvider::new(
                config.base_url,
                config.model,
                config.temperature,
                config.max_tokens,
            ))
        }
        _ => {
            tracing::info!("[AI] Creating OpenAI-compatible provider for type: {}", config.provider_type);
            let api_key = config.api_key.ok_or("API key is required".to_string())?;
            Box::new(OpenAIProvider::new(
                api_key,
                config.base_url,
                config.model,
                config.temperature,
                config.max_tokens,
            ))
        }
    };

    tracing::info!("[AI] Calling provider test_connection");
    let result = provider.test_connection().await.map_err(|e| {
        tracing::error!("[AI] Test connection error: {}", e);
        e.to_string()
    })?;

    tracing::info!("[AI] Test connection result: {}", result);
    Ok(result)
}
