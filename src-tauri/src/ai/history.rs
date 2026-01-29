//! AI 对话历史持久化存储模块
//!
//! 提供对话历史的存储、加载、查询和管理功能

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::path::PathBuf;
use std::collections::HashMap;
use std::cmp::Ordering;

/// 连接状态
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ConnectionStatus {
    /// 连接活跃
    Active,
    /// 连接已断开
    Inactive,
}

/// 服务器身份信息（Session/Profile）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerIdentity {
    /// Session 配置 ID
    pub session_id: String,
    /// Session 名称
    pub session_name: String,
    /// 主机地址
    pub host: String,
    /// 端口
    pub port: u16,
    /// 用户名
    pub username: String,
}

/// 对话消息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIChatMessage {
    /// 消息角色："user" | "assistant" | "system"
    pub role: String,
    /// 消息内容
    pub content: String,
    /// 消息时间戳
    pub timestamp: DateTime<Utc>,
}

/// 对话会话元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIConversationMeta {
    /// 会话唯一 ID
    pub id: String,
    /// 会话标题
    pub title: String,
    /// 关联的服务器身份
    pub server_identity: ServerIdentity,
    /// 具体连接实例ID（可选，用于追踪）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub connection_instance_id: Option<String>,
    /// 创建时间
    pub created_at: DateTime<Utc>,
    /// 更新时间
    pub updated_at: DateTime<Utc>,
    /// 消息数量
    pub message_count: usize,
    /// 是否已归档
    pub is_archived: bool,
    /// 连接状态
    pub connection_status: ConnectionStatus,
}

/// 对话会话完整数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIConversation {
    /// 会话元数据
    pub meta: AIConversationMeta,
    /// 消息列表
    pub messages: Vec<AIChatMessage>,
}

/// 按服务器身份分组的对话列表
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerConversationGroup {
    /// 服务器身份信息
    pub server_identity: ServerIdentity,
    /// 该服务器的所有对话
    pub conversations: Vec<AIConversationMeta>,
    /// 对话总数
    pub total_conversations: usize,
    /// 当前活跃的连接数
    pub active_connection_count: usize,
    /// 最后对话时间
    #[serde(skip_serializing_if = "Option::is_none")]
    pub latest_conversation_at: Option<DateTime<Utc>>,
}

/// 所有对话历史
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIChatHistory {
    /// 所有会话
    pub conversations: Vec<AIConversation>,
}

impl Default for AIChatHistory {
    fn default() -> Self {
        Self {
            conversations: Vec::new(),
        }
    }
}

impl AIChatHistory {
    /// 从文件加载历史记录
    ///
    /// 如果文件不存在，返回空的历史记录
    pub fn load() -> Result<Self, String> {
        let path = Self::get_history_path()?;
        if !path.exists() {
            return Ok(Self::default());
        }

        let content = std::fs::read_to_string(&path)
            .map_err(|e| format!("读取历史文件失败: {}", e))?;

        serde_json::from_str(&content)
            .map_err(|e| format!("解析历史文件失败: {}", e))
    }

    /// 保存历史记录到文件
    pub fn save(&self) -> Result<(), String> {
        let path = Self::get_history_path()?;

        // 确保目录存在
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("创建目录失败: {}", e))?;
        }

        let content = serde_json::to_string_pretty(self)
            .map_err(|e| format!("序列化失败: {}", e))?;

        std::fs::write(&path, content)
            .map_err(|e| format!("写入文件失败: {}", e))?;

        Ok(())
    }

    /// 获取历史文件路径
    fn get_history_path() -> Result<PathBuf, String> {
        let storage_dir = dirs::home_dir()
            .ok_or_else(|| "无法获取用户主目录".to_string())?
            .join(".tauri-terminal");

        Ok(storage_dir.join("ai_chat_history.json"))
    }

    /// 添加或更新会话
    ///
    /// 如果会话已存在，则更新；否则添加新会话
    pub fn upsert_conversation(&mut self, conversation: AIConversation) {
        let pos = self.conversations
            .iter()
            .position(|c| c.meta.id == conversation.meta.id);

        if let Some(idx) = pos {
            self.conversations[idx] = conversation;
        } else {
            self.conversations.push(conversation);
        }
    }

    /// 删除会话
    pub fn delete_conversation(&mut self, id: &str) -> Result<(), String> {
        let pos = self.conversations
            .iter()
            .position(|c| c.meta.id == id)
            .ok_or_else(|| format!("会话 {} 不存在", id))?;

        self.conversations.remove(pos);
        Ok(())
    }

    /// 归档/取消归档会话
    pub fn toggle_archive(&mut self, id: &str) -> Result<(), String> {
        let conversation = self.conversations
            .iter_mut()
            .find(|c| c.meta.id == id)
            .ok_or_else(|| format!("会话 {} 不存在", id))?;

        conversation.meta.is_archived = !conversation.meta.is_archived;
        Ok(())
    }

    /// 更新会话标题
    pub fn update_title(&mut self, id: &str, title: String) -> Result<(), String> {
        let conversation = self.conversations
            .iter_mut()
            .find(|c| c.meta.id == id)
            .ok_or_else(|| format!("会话 {} 不存在", id))?;

        conversation.meta.title = title;
        Ok(())
    }

    /// 获取所有会话元数据
    pub fn list_conversations(&self) -> Vec<AIConversationMeta> {
        self.conversations
            .iter()
            .map(|c| c.meta.clone())
            .collect()
    }

    /// 获取指定会话
    pub fn get_conversation(&self, id: &str) -> Option<&AIConversation> {
        self.conversations
            .iter()
            .find(|c| c.meta.id == id)
    }

    /// 获取可变引用的指定会话
    pub fn get_conversation_mut(&mut self, id: &str) -> Option<&mut AIConversation> {
        self.conversations
            .iter_mut()
            .find(|c| c.meta.id == id)
    }

    /// 按服务器身份分组获取对话历史
    pub fn list_by_server(&self) -> Vec<ServerConversationGroup> {
        let mut server_map: HashMap<String, Vec<AIConversationMeta>> = HashMap::new();

        // 按 session_id 分组
        for conv in &self.conversations {
            let server_id = conv.meta.server_identity.session_id.clone();
            server_map
                .entry(server_id)
                .or_insert_with(Vec::new)
                .push(conv.meta.clone());
        }

        // 转换为分组结构
        let mut groups: Vec<ServerConversationGroup> = server_map
            .into_iter()
            .map(|(_session_id, conversations)| {
                let first = conversations.first().unwrap();
                let active_count = conversations
                    .iter()
                    .filter(|c| matches!(c.connection_status, ConnectionStatus::Active))
                    .count();

                ServerConversationGroup {
                    server_identity: first.server_identity.clone(),
                    total_conversations: conversations.len(),
                    active_connection_count: active_count,
                    latest_conversation_at: conversations
                        .iter()
                        .map(|c| c.updated_at)
                        .max(),
                    conversations,
                }
            })
            .collect();

        // 按最新对话时间排序
        groups.sort_by(|a, b| {
            match (&a.latest_conversation_at, &b.latest_conversation_at) {
                (Some(a_time), Some(b_time)) => b_time.cmp(a_time),
                (Some(_), None) => Ordering::Less,
                (None, Some(_)) => Ordering::Greater,
                (None, None) => Ordering::Equal,
            }
        });

        groups
    }

    /// 获取指定服务器的所有对话
    pub fn list_by_server_id(&self, server_id: &str) -> Vec<AIConversationMeta> {
        self.conversations
            .iter()
            .filter(|c| c.meta.server_identity.session_id == server_id)
            .map(|c| c.meta.clone())
            .collect()
    }

    /// 更新对话的连接状态
    pub fn update_connection_status(&mut self, id: &str, status: ConnectionStatus) -> Result<(), String> {
        let conversation = self.conversations
            .iter_mut()
            .find(|c| c.meta.id == id)
            .ok_or_else(|| format!("会话 {} 不存在", id))?;

        conversation.meta.connection_status = status;
        Ok(())
    }
}

/// 导出函数：将对话转换为 Markdown 格式
pub fn conversation_to_markdown(conv: &AIConversation) -> String {
    let mut output = String::new();
    output.push_str(&format!("# {}\n\n", conv.meta.title));
    output.push_str(&format!("**创建时间**: {}\n", conv.meta.created_at.format("%Y-%m-%d %H:%M:%S")));
    output.push_str(&format!("**更新时间**: {}\n", conv.meta.updated_at.format("%Y-%m-%d %H:%M:%S")));
    output.push_str(&format!("**消息数量**: {}\n\n", conv.meta.message_count));
    output.push_str("---\n\n");

    for msg in &conv.messages {
        let role = match msg.role.as_str() {
            "user" => "👤 用户",
            "assistant" => "🤖 助手",
            "system" => "⚙️ 系统",
            _ => "未知",
        };
        output.push_str(&format!("## {}\n\n", role));
        output.push_str(&msg.content);
        output.push_str("\n\n---\n\n");
    }

    output
}

/// 导出函数：将对话转换为纯文本格式
pub fn conversation_to_text(conv: &AIConversation) -> String {
    let mut output = String::new();
    output.push_str(&format!("标题: {}\n", conv.meta.title));
    output.push_str(&format!("创建时间: {}\n", conv.meta.created_at.format("%Y-%m-%d %H:%M:%S")));
    output.push_str(&format!("更新时间: {}\n", conv.meta.updated_at.format("%Y-%m-%d %H:%M:%S")));
    output.push_str(&format!("消息数量: {}\n\n", conv.meta.message_count));
    output.push_str(&"=".repeat(50));
    output.push_str("\n\n");

    for msg in &conv.messages {
        let role = match msg.role.as_str() {
            "user" => "[用户]",
            "assistant" => "[助手]",
            "system" => "[系统]",
            _ => "[未知]",
        };
        output.push_str(&format!("{} {}\n", role, msg.timestamp.format("%H:%M:%S")));
        output.push_str(&msg.content);
        output.push_str("\n\n");
    }

    output
}
