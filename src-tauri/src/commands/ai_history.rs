//! AI 对话历史 Tauri 命令
//!
//! 提供前端调用的对话历史管理命令

use crate::ai::history::{
    AIChatHistory, AIConversation, AIConversationMeta,
    ServerConversationGroup, ConnectionStatus,
    conversation_to_markdown, conversation_to_text
};

/// 获取所有会话列表
///
/// 返回所有会话的元数据（不包含消息内容）
#[tauri::command]
pub async fn ai_history_list() -> Result<Vec<AIConversationMeta>, String> {
    let history = AIChatHistory::load()?;
    Ok(history.list_conversations())
}

/// 获取指定会话详情
///
/// 根据 ID 获取完整的会话数据（包含所有消息）
#[tauri::command]
pub async fn ai_history_get(id: String) -> Result<AIConversation, String> {
    let history = AIChatHistory::load()?;
    history.get_conversation(&id)
        .cloned()
        .ok_or_else(|| format!("会话 {} 不存在", id))
}

/// 保存会话
///
/// 创建或更新会话（如果会话已存在则更新，否则创建新会话）
#[tauri::command]
pub async fn ai_history_save(conversation: AIConversation) -> Result<(), String> {
    let mut history = AIChatHistory::load()?;
    history.upsert_conversation(conversation);
    history.save()
}

/// 删除会话
///
/// 根据 ID 删除指定会话（此操作不可撤销）
#[tauri::command]
pub async fn ai_history_delete(id: String) -> Result<(), String> {
    let mut history = AIChatHistory::load()?;
    history.delete_conversation(&id)?;
    history.save()
}

/// 归档/取消归档会话
///
/// 切换会话的归档状态
#[tauri::command]
pub async fn ai_history_toggle_archive(id: String) -> Result<(), String> {
    let mut history = AIChatHistory::load()?;
    history.toggle_archive(&id)?;
    history.save()
}

/// 更新会话标题
///
/// 修改指定会话的标题
#[tauri::command]
pub async fn ai_history_update_title(id: String, title: String) -> Result<(), String> {
    let mut history = AIChatHistory::load()?;
    history.update_title(&id, title)?;
    history.save()
}

/// 导出会话
///
/// 将会话导出为指定格式：markdown、json 或 text
#[tauri::command]
pub async fn ai_history_export(id: String, format: String) -> Result<String, String> {
    let history = AIChatHistory::load()?;
    let conversation = history.get_conversation(&id)
        .ok_or_else(|| format!("会话 {} 不存在", id))?;

    match format.as_str() {
        "markdown" => Ok(conversation_to_markdown(conversation)),
        "json" => serde_json::to_string_pretty(conversation)
            .map_err(|e| format!("序列化失败: {}", e)),
        "text" => Ok(conversation_to_text(conversation)),
        _ => Err(format!("不支持的导出格式: {}", format))
    }
}

/// 按服务器身份分组获取对话历史
///
/// 返回按 Session/Profile 分组的对话列表，每个分组包含该服务器的所有对话
#[tauri::command]
pub async fn ai_history_list_by_server() -> Result<Vec<ServerConversationGroup>, String> {
    let history = AIChatHistory::load()?;
    Ok(history.list_by_server())
}

/// 获取指定服务器的所有对话
///
/// 根据 server_id (session_id) 获取该服务器的所有对话元数据
#[tauri::command]
pub async fn ai_history_list_by_server_id(server_id: String) -> Result<Vec<AIConversationMeta>, String> {
    let history = AIChatHistory::load()?;
    Ok(history.list_by_server_id(&server_id))
}

/// 更新对话的连接状态
///
/// 更新指定对话的连接状态为 Active 或 Inactive
#[tauri::command]
pub async fn ai_history_update_connection_status(
    id: String,
    status: String
) -> Result<(), String> {
    let connection_status = match status.as_str() {
        "active" => ConnectionStatus::Active,
        "inactive" => ConnectionStatus::Inactive,
        _ => return Err(format!("无效的连接状态: {}", status)),
    };

    let mut history = AIChatHistory::load()?;
    history.update_connection_status(&id, connection_status)?;
    history.save()
}
