// AI 相关 Tauri 命令

use crate::ai::{ChatMessage, AIProviderManager, OpenAIProvider};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};

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
    /// AI Provider 管理器，负责缓存和复用 Provider 实例
    manager: Arc<AIProviderManager>,
}

impl AIManagerState {
    pub fn new() -> Self {
        Self {
            manager: Arc::new(AIProviderManager::new()),
        }
    }

    /// 获取 Provider 管理器的引用
    pub fn manager(&self) -> &Arc<AIProviderManager> {
        &self.manager
    }
}

/// AI 聊天命令（流式）
#[tauri::command]
pub async fn ai_chat_stream(
    app: AppHandle,
    config: AIProviderConfig,
    messages: Vec<ChatMessage>,
) -> Result<String, String> {
    // 创建 provider 实例
    let provider = match config.provider_type.as_str() {
        "ollama" => {
            // Ollama 暂不支持流式
            return Err("Ollama streaming not supported yet".to_string());
        }
        _ => {
            // OpenAI 兼容接口
            let api_key = config.api_key.ok_or("API key is required".to_string())?;
            OpenAIProvider::new(
                api_key,
                config.base_url,
                config.model,
                config.temperature,
                config.max_tokens,
            )
        }
    };

    // 使用流式方法，通过事件发送数据块
    provider.chat_stream(messages, |chunk| {
        // 发送流式数据块到前端
        let _ = app.emit("ai-chat-chunk", chunk);
    }).await.map_err(|e| e.to_string())
}

/// AI 聊天命令（非流式，保持兼容）
#[tauri::command]
pub async fn ai_chat(
    ai_manager: State<'_, AIManagerState>,
    config: AIProviderConfig,
    messages: Vec<ChatMessage>,
) -> Result<String, String> {
    // 使用管理器获取或创建 provider 实例（自动缓存复用）
    let provider = ai_manager.manager()
        .get_or_create_provider(&config)
        .map_err(|e| e.to_string())?;

    // 调用 chat 方法
    provider.chat(messages).await.map_err(|e| e.to_string())
}

/// AI 命令解释
#[tauri::command]
pub async fn ai_explain_command(
    ai_manager: State<'_, AIManagerState>,
    command: String,
    config: AIProviderConfig,
) -> Result<String, String> {
    let system_prompt = "你是 Linux/Unix 命令行专家。用最简洁的语言解释命令。

**输出格式**（严格遵循）：
```
功能：[一句话]
参数：[关键参数，用|分隔，无参数则写\"无\"]
示例：[一个实际用法示例]
风险：[有风险写具体风险，无风险写\"无\"]
```

**要求**：
- 功能不超过15字
- 参数只说最关键的2-3个
- 示例必须是可执行的真实命令
- 总字数不超过80字";

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

    ai_chat(ai_manager, config, messages).await
}

/// AI 自然语言转命令
#[tauri::command]
pub async fn ai_generate_command(
    ai_manager: State<'_, AIManagerState>,
    input: String,
    config: AIProviderConfig,
) -> Result<String, String> {
    let system_prompt = "你是 Linux 命令生成器。根据描述生成 Shell 命令。

**规则**：
1. 只输出命令，不解释
2. 需求不明确返回：\"？请明确需求\"
3. 危险操作在命令前加：\"⚠️ \"
4. 优先常用命令，避免复杂参数

**示例**：
\"看所有文件\" → ls -la
\"查log文件\" → find . -name \"*.log\"
\"停止nginx\" → systemctl stop nginx";

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

    ai_chat(ai_manager, config, messages).await
}

/// AI 错误分析
#[tauri::command]
pub async fn ai_analyze_error(
    ai_manager: State<'_, AIManagerState>,
    error: String,
    config: AIProviderConfig,
) -> Result<String, String> {
    let system_prompt = "你是 Linux 故障排查专家。快速诊断错误。

**输出格式**（严格遵循）：
```
原因：[1句话，最多30字]
解决：
1. [方案1，最多30字]
2. [方案2，最多30字]
预防：[1句话，最多25字]
```

**要求**：
- 直接给解决方案，不说废话
- 按成功率排序方案
- 总字数不超过120字";

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

    ai_chat(ai_manager, config, messages).await
}

/// 测试 AI 连接
#[tauri::command]
pub async fn ai_test_connection(
    ai_manager: State<'_, AIManagerState>,
    config: AIProviderConfig,
) -> Result<bool, String> {
    tracing::info!("[AI] Testing connection for provider type: {}", config.provider_type);
    tracing::info!("[AI] Provider config - model: {}, base_url: {:?}",
        config.model, config.base_url);
    tracing::info!("[AI] Provider config - temperature: {:?}, max_tokens: {:?}",
        config.temperature, config.max_tokens);

    // 使用管理器获取或创建 provider 实例
    let provider = ai_manager.manager()
        .get_or_create_provider(&config)
        .map_err(|e| {
            tracing::error!("[AI] Failed to get provider: {}", e);
            e
        })?;

    tracing::info!("[AI] Calling provider test_connection");
    let result = provider.test_connection().await.map_err(|e| {
        tracing::error!("[AI] Test connection error: {}", e);
        e.to_string()
    })?;

    tracing::info!("[AI] Test connection result: {}", result);
    Ok(result)
}

/// 清除 AI Provider 缓存
///
/// 当配置更改或需要强制重新创建 Provider 时使用
#[tauri::command]
pub async fn ai_clear_cache(
    ai_manager: State<'_, AIManagerState>,
) -> Result<(), String> {
    ai_manager.manager().clear_cache();
    tracing::info!("[AI] Cache cleared via command");
    Ok(())
}

/// 获取缓存信息
///
/// 返回缓存的 Provider 数量和列表
#[tauri::command]
pub async fn ai_get_cache_info(
    ai_manager: State<'_, AIManagerState>,
) -> Result<CacheInfo, String> {
    let size = ai_manager.manager().cache_size();
    let providers = ai_manager.manager().list_cached_providers();

    Ok(CacheInfo {
        cache_size: size,
        cached_providers: providers,
    })
}

/// 缓存信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheInfo {
    /// 缓存的 Provider 数量
    pub cache_size: usize,
    /// 缓存的 Provider key 列表
    pub cached_providers: Vec<String>,
}

/// 手动触发热重载
///
/// 当配置文件被外部修改时，可以手动调用此命令来同步缓存
#[tauri::command]
pub async fn ai_hot_reload(
    ai_manager: State<'_, AIManagerState>,
    app: AppHandle,
) -> Result<HotReloadResult, String> {
    // 加载当前配置
    let current_config = crate::config::Storage::load_ai_config(Some(&app))
        .map_err(|e| e.to_string())?;

    if current_config.is_some() {
        // 清除所有缓存（因为我们没有旧配置的信息，所以清除所有）
        let old_cache_size = ai_manager.manager().cache_size();
        ai_manager.manager().clear_cache();

        tracing::info!(
            "[AI Hot Reload] Manual reload: Cleared {} providers from cache",
            old_cache_size
        );

        Ok(HotReloadResult {
            success: true,
            removed_count: old_cache_size,
            message: format!("缓存已清除，下次调用将使用新配置创建 Provider"),
        })
    } else {
        Ok(HotReloadResult {
            success: true,
            removed_count: 0,
            message: "未找到 AI 配置，无需重载".to_string(),
        })
    }
}

/// 热重载结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotReloadResult {
    /// 是否成功
    pub success: bool,
    /// 移除的 Provider 数量
    pub removed_count: usize,
    /// 结果消息
    pub message: String,
}
