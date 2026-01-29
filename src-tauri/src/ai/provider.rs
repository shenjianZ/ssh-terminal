// AI Provider 抽象层

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

/// 聊天消息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

/// AI Provider trait - 所有 AI 服务提供商都需要实现这个 trait
#[async_trait]
pub trait AIProvider: Send + Sync {
    /// 发送聊天请求
    async fn chat(&self, messages: Vec<ChatMessage>) -> Result<String, Box<dyn std::error::Error + Send + Sync>>;

    /// 测试连接
    async fn test_connection(&self) -> Result<bool, Box<dyn std::error::Error + Send + Sync>>;
}
