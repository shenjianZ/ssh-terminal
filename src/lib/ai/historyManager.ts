/**
 * AI 对话历史管理服务
 *
 * 提供与后端交互的历史记录管理功能
 */

import { invoke } from '@tauri-apps/api/core';
import type { AIConversation, AIConversationMeta, ServerConversationGroup, ExportFormat } from '@/types/ai';

/**
 * AI 历史管理器
 *
 * 提供对话历史的增删改查和导出功能
 */
export class AIHistoryManager {
  /**
   * 获取所有会话列表（旧版 - 扁平列表）
   */
  static async listConversations(): Promise<AIConversationMeta[]> {
    return invoke<AIConversationMeta[]>('ai_history_list');
  }

  /**
   * 按服务器分组获取对话历史（新版 - 推荐）
   */
  static async listServerGroups(): Promise<ServerConversationGroup[]> {
    return invoke<ServerConversationGroup[]>('ai_history_list_by_server');
  }

  /**
   * 获取指定服务器的所有对话
   */
  static async listConversationsByServer(serverId: string): Promise<AIConversationMeta[]> {
    return invoke<AIConversationMeta[]>('ai_history_list_by_server_id', { serverId });
  }

  /**
   * 获取指定会话详情
   */
  static async getConversation(id: string): Promise<AIConversation> {
    return invoke<AIConversation>('ai_history_get', { id });
  }

  /**
   * 保存会话
   *
   * 创建新会话或更新已有会话
   */
  static async saveConversation(conversation: AIConversation): Promise<void> {
    await invoke('ai_history_save', { conversation });
  }

  /**
   * 删除会话
   */
  static async deleteConversation(id: string): Promise<void> {
    await invoke('ai_history_delete', { id });
  }

  /**
   * 归档/取消归档会话
   */
  static async toggleArchive(id: string): Promise<void> {
    await invoke('ai_history_toggle_archive', { id });
  }

  /**
   * 更新会话标题
   */
  static async updateTitle(id: string, title: string): Promise<void> {
    await invoke('ai_history_update_title', { id, title });
  }

  /**
   * 更新连接状态
   */
  static async updateConnectionStatus(id: string, status: 'active' | 'inactive'): Promise<void> {
    await invoke('ai_history_update_connection_status', { id, status });
  }

  /**
   * 导出会话
   */
  static async exportConversation(id: string, format: ExportFormat): Promise<string> {
    return invoke<string>('ai_history_export', { id, format });
  }

  /**
   * 下载导出内容
   *
   * 将导出的内容保存为本地文件
   */
  static async downloadExport(
    content: string,
    filename: string,
    format: ExportFormat
  ): Promise<void> {
    const blob = new Blob([content], {
      type: format === 'json' ? 'application/json' : 'text/plain'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format === 'markdown' ? 'md' : format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
