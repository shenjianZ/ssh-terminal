// AI 状态管理

import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { ChatMessage, AIConversation, ServerConversationGroup, ServerIdentity } from '@/types/ai';
import { AIClient } from '@/lib/ai/aiClient';
import { aiCache } from '@/lib/ai/cache';
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/ai/promptTemplates';
import { playSound, SoundEffect } from '@/lib/sounds';
import { AIHistoryManager } from '@/lib/ai/historyManager';

interface AIStore {
  // 配置
  config: any | null;
  isLoading: boolean;
  error: string | null;

  // 对话历史（内存 - 按服务器身份）
  conversations: Map<string, ChatMessage[]>;  // serverId -> messages
  currentServerId: string | null;             // 当前选中的服务器 ID
  currentConnectionId: string | null;         // 当前活跃的连接 ID（用于实时终端交互）

  // 历史记录管理（持久化）
  serverGroups: ServerConversationGroup[];    // 按服务器分组的历史
  selectedConversationId: string | null;      // 当前选中的对话 ID

  // 连接状态追踪
  activeConnections: Set<string>;            // 当前活跃的 connectionId

  // 流式状态
  streamingServerId: string | null;          // 当前正在流式生成的服务器ID

  // UI 状态
  isChatOpen: boolean;

  // ========== 配置管理 ==========

  loadConfig: () => Promise<void>;
  saveConfig: (config: any) => Promise<void>;
  getDefaultConfig: () => Promise<any>;

  // ========== AI 操作 ==========

  sendMessage: (serverId: string, message: string) => Promise<string>;
  explainCommand: (command: string) => Promise<string>;
  naturalLanguageToCommand: (input: string) => Promise<string>;
  analyzeError: (error: string) => Promise<string>;
  testConnection: (providerId: string) => Promise<boolean>;

  // ========== 对话历史管理 ==========

  getConversationHistory: (serverId: string) => ChatMessage[];
  clearConversation: (serverId: string) => void;

  // 新增：按服务器分组的历史管理

  loadServerGroups: () => Promise<void>;
  selectServer: (serverId: string) => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  createConversation: (serverId: string) => void;
  isServerOnline: (serverId: string) => boolean;
  updateActiveConnections: (connectionIds: string[]) => void;

  // ========== UI 控制 ==========

  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
}

export const useAIStore = create<AIStore>((set, get) => ({
  // 初始状态
  config: null,
  isLoading: false,
  error: null,
  conversations: new Map(),
  currentServerId: null,
  currentConnectionId: null,
  serverGroups: [],
  selectedConversationId: null,
  activeConnections: new Set(),
  streamingServerId: null,
  isChatOpen: false,

  // ========== 配置管理 ==========

  loadConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const config = await invoke<any>('storage_ai_config_load');
      set({ config, isLoading: false });
    } catch (error) {
      console.error('[AIStore] Failed to load config:', error);
      set({ isLoading: false, error: (error as Error).message });
    }
  },

  saveConfig: async (config) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('storage_ai_config_save', { config });
      set({ config, isLoading: false });
    } catch (error) {
      const errorMsg = `保存配置失败: ${error}`;
      console.error('[AIStore] Failed to save config:', error);
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  getDefaultConfig: async () => {
    try {
      return await invoke<any>('storage_ai_config_get_default');
    } catch (error) {
      console.error('[AIStore] Failed to get default config:', error);
      throw error;
    }
  },

  // ========== AI 操作 ==========

  sendMessage: async (serverId: string, message: string) => {
    const { config, conversations } = get();

    if (!config) {
      throw new Error('AI 配置未初始化');
    }

    const provider = config.providers.find((p: any) => p.id === config.defaultProvider && p.enabled);
    if (!provider) {
      throw new Error('没有可用的 AI Provider');
    }

    // 添加用户消息到历史
    const userMessage: ChatMessage = { role: 'user', content: message };
    const history = conversations.get(serverId) || [];
    const newHistory = [...history, userMessage];

    // 添加一个空的 assistant 消息（用于流式更新）
    const assistantMessage: ChatMessage = { role: 'assistant', content: '' };
    const updatedHistory = [...newHistory, assistantMessage];

    // 更新对话历史
    const newConversations = new Map(conversations);
    newConversations.set(serverId, updatedHistory);
    set({ conversations: newConversations, streamingServerId: serverId, isLoading: true, error: null });

    try {
      // 添加系统提示词
      const systemMessage: ChatMessage = { role: 'system', content: DEFAULT_SYSTEM_PROMPT };

      // 调用流式 AI API
      const contextMessages = [systemMessage, ...newHistory.slice(-20)];

      await AIClient.chatStream(provider, contextMessages, (chunk) => {
        const { conversations } = get();
        const currentConv = conversations.get(serverId);
        if (currentConv && currentConv.length > 0) {
          const lastMessage = currentConv[currentConv.length - 1];
          if (lastMessage.role === 'assistant') {
            const updatedConv = new Map(conversations);
            updatedConv.set(serverId, [
              ...currentConv.slice(0, -1),
              { ...lastMessage, content: lastMessage.content + chunk }
            ]);
            set({ conversations: updatedConv });
          }
        }
      });

      set({ streamingServerId: null, isLoading: false });
      playSound(SoundEffect.AI_STREAM_COMPLETE);

      // 自动保存对话到历史记录
      const { conversations: finalConversations } = get();
      const finalHistory = finalConversations.get(serverId);
      if (finalHistory && finalHistory.length > 0) {
        const conversation = buildConversation(serverId, finalHistory);
        await AIHistoryManager.saveConversation(conversation).catch(err => {
          console.error('[AIStore] Failed to save conversation:', err);
        });
      }

      return '';
    } catch (error) {
      const errorMsg = `发送消息失败: ${error}`;
      console.error('[AIStore] Send message failed:', error);

      // 移除失败的 assistant 消息
      const { conversations } = get();
      const currentConv = conversations.get(serverId);
      if (currentConv && currentConv.length > 0 && currentConv[currentConv.length - 1].role === 'assistant') {
        const updatedConv = new Map(conversations);
        updatedConv.set(serverId, currentConv.slice(0, -1));
        set({ conversations: updatedConv });
      }

      set({ error: errorMsg, streamingServerId: null, isLoading: false });
      throw error;
    }
  },

  explainCommand: async (command: string) => {
    const { config } = get();

    if (!config) {
      throw new Error('AI 配置未初始化');
    }

    const provider = config.providers.find((p: any) => p.id === config.defaultProvider && p.enabled);
    if (!provider) {
      throw new Error('没有可用的 AI Provider');
    }

    const cached = aiCache.get('explain', command);
    if (cached) {
      console.log('[AIStore] Using cached response for command explanation');
      return cached;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await AIClient.explainCommand(provider, command);
      aiCache.set('explain', command, response);
      set({ isLoading: false });
      return response;
    } catch (error) {
      const errorMsg = `命令解释失败: ${error}`;
      console.error('[AIStore] Explain command failed:', error);
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  naturalLanguageToCommand: async (input: string) => {
    const { config } = get();

    if (!config) {
      throw new Error('AI 配置未初始化');
    }

    const provider = config.providers.find((p: any) => p.id === config.defaultProvider && p.enabled);
    if (!provider) {
      throw new Error('没有可用的 AI Provider');
    }

    set({ isLoading: true, error: null });

    try {
      const command = await AIClient.generateCommand(provider, input);
      set({ isLoading: false });
      return command;
    } catch (error) {
      const errorMsg = `命令生成失败: ${error}`;
      console.error('[AIStore] Generate command failed:', error);
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  analyzeError: async (error: string) => {
    const { config } = get();

    if (!config) {
      throw new Error('AI 配置未初始化');
    }

    const provider = config.providers.find((p: any) => p.id === config.defaultProvider && p.enabled);
    if (!provider) {
      throw new Error('没有可用的 AI Provider');
    }

    const cached = aiCache.get('analyze_error', error);
    if (cached) {
      console.log('[AIStore] Using cached response for error analysis');
      return cached;
    }

    set({ isLoading: true, error: null });

    try {
      const analysis = await AIClient.analyzeError(provider, error);
      aiCache.set('analyze_error', error, analysis);
      set({ isLoading: false });
      return analysis;
    } catch (error) {
      const errorMsg = `错误分析失败: ${error}`;
      console.error('[AIStore] Analyze error failed:', error);
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  testConnection: async (providerId: string) => {
    const { config } = get();

    if (!config) {
      throw new Error('AI 配置未初始化');
    }

    const provider = config.providers.find((p: any) => p.id === providerId);
    if (!provider) {
      throw new Error('Provider not found');
    }

    set({ isLoading: true, error: null });

    try {
      const result = await AIClient.testConnection(provider);
      set({ isLoading: false });
      return result;
    } catch (error) {
      const errorMsg = `测试连接失败: ${error}`;
      console.error('[AIStore] Test connection failed:', error);
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  },

  // ========== 对话历史管理 ==========

  getConversationHistory: (serverId: string) => {
    const { conversations } = get();
    return conversations.get(serverId) || [];
  },

  clearConversation: (serverId: string) => {
    const { conversations } = get();
    const newConversations = new Map(conversations);
    newConversations.delete(serverId);
    set({ conversations: newConversations });
  },

  // ========== 按服务器分组的历史管理 ==========

  loadServerGroups: async () => {
    try {
      const groups = await AIHistoryManager.listServerGroups();
      set({ serverGroups: groups });
    } catch (error) {
      console.error('[AIStore] Failed to load server groups:', error);
    }
  },

  selectServer: async (serverId: string) => {
    set({ currentServerId: serverId, selectedConversationId: null });

    // 加载该服务器的对话历史
    const conversations = await AIHistoryManager.listConversationsByServer(serverId);
    if (conversations.length > 0) {
      // TODO: 加载完整对话内容
      console.log('[AIStore] Found conversations for server:', conversations.length);
    }
  },

  selectConversation: async (conversationId: string) => {
    set({ selectedConversationId: conversationId });
    // TODO: 加载完整对话内容
  },

  createConversation: (serverId: string) => {
    // 为指定服务器创建新对话
    const { conversations } = get();
    const newConversations = new Map(conversations);
    newConversations.set(serverId, []);
    set({
      conversations: newConversations,
      currentServerId: serverId,
      selectedConversationId: null
    });
  },

  isServerOnline: (_serverId: string) => {
    const { activeConnections } = get();
    // 简化实现：只要有任何活跃连接就认为服务器在线
    // TODO: 未来可以根据 serverId -> connectionId 映射更精确地判断
    return activeConnections.size > 0;
  },

  updateActiveConnections: (connectionIds: string[]) => {
    set({ activeConnections: new Set(connectionIds) });
  },

  // ========== UI 控制 ==========

  toggleChat: () => {
    const { isChatOpen } = get();
    set({ isChatOpen: !isChatOpen });
  },

  openChat: () => {
    set({ isChatOpen: true });
  },

  closeChat: () => {
    set({ isChatOpen: false });
  },
}));

// ========== 辅助函数 ==========

/**
 * 构建会话对象（用于持久化存储）
 *
 * 注意：这个函数需要 ServerIdentity 信息，暂时使用默认值
 * 实际使用时应该从 terminalStore 或 sessionStore 获取完整的 Session 信息
 */
function buildConversation(serverId: string, messages: ChatMessage[]): AIConversation {
  const firstUserMessage = messages.find(m => m.role === 'user');
  const now = new Date().toISOString();

  // TODO: 从 sessionStore 获取完整的 ServerIdentity
  // 暂时使用默认值
  const serverIdentity: ServerIdentity = {
    sessionId: serverId,
    sessionName: '服务器',
    host: 'unknown',
    port: 22,
    username: 'unknown',
  };

  return {
    meta: {
      id: `${serverId}-${Date.now()}`, // 生成唯一 ID
      title: generateTitle(firstUserMessage?.content || '新对话'),
      serverIdentity: serverIdentity,
      connectionInstanceId: serverId, // 可选
      createdAt: now,
      updatedAt: now,
      messageCount: messages.length,
      isArchived: false,
      connectionStatus: 'active' as const,
    },
    messages: messages.map(m => ({
      ...m,
      timestamp: now,
    })),
  };
}

/**
 * 生成会话标题
 */
function generateTitle(firstMessage: string): string {
  const title = firstMessage.slice(0, 30);
  return title.length < firstMessage.length ? `${title}...` : title;
}
