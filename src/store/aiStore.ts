// AI 状态管理

import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { ChatMessage, AIConversation, ServerConversationGroup, ServerIdentity } from '@/types/ai';
import { AIClient } from '@/lib/ai/aiClient';
import { aiCache } from '@/lib/ai/cache';
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/ai/promptTemplates';
import { playSound, SoundEffect } from '@/lib/sounds';
import { AIHistoryManager } from '@/lib/ai/historyManager';
import { useSessionStore } from './sessionStore';

interface AIStore {
  // 配置
  config: any | null;
  isLoading: boolean;
  error: string | null;

  // 对话历史（内存 - 按连接ID）
  conversations: Map<string, ChatMessage[]>;  // connectionId -> messages（每个终端连接有独立的对话历史）
  currentServerId: string | null;             // 当前选中的连接 ID（实际是 connectionId）
  currentConnectionId: string | null;         // 当前活跃的连接 ID（用于实时终端交互）

  // 历史记录管理（持久化）
  serverGroups: ServerConversationGroup[];    // 按服务器分组的历史
  selectedConversationId: string | null;      // 当前选中的对话 ID（从历史记录中选择）

  // 连接状态追踪
  activeConnections: Set<string>;            // 当前活跃的 connectionId

  // 流式状态
  streamingConnectionId: string | null;      // 当前正在流式生成的连接ID

  // UI 状态
  isChatOpen: boolean;

  // ========== 配置管理 ==========

  loadConfig: () => Promise<void>;
  saveConfig: (config: any) => Promise<void>;
  getDefaultConfig: () => Promise<any>;

  // ========== AI 操作 ==========

  sendMessage: (connectionId: string, message: string) => Promise<string>;
  explainCommand: (command: string) => Promise<string>;
  naturalLanguageToCommand: (input: string) => Promise<string>;
  analyzeError: (error: string) => Promise<string>;
  testConnection: (providerId: string) => Promise<boolean>;

  // ========== 对话历史管理 ==========

  getConversationHistory: (connectionId: string) => ChatMessage[];
  clearConversation: (connectionId: string) => void;

  // 新增：按服务器分组的历史管理

  loadServerGroups: () => Promise<void>;
  selectServer: (serverId: string) => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  createConversation: (serverId: string) => void;
  isServerOnline: (serverId: string) => boolean;
  getServerActiveConnectionCount: (serverId: string) => number;
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
  streamingConnectionId: null,
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

  sendMessage: async (connectionId: string, message: string) => {
    const { config, conversations, currentServerId } = get();

    if (!config) {
      throw new Error('AI 配置未初始化');
    }

    const provider = config.providers.find((p: any) => p.id === config.defaultProvider && p.enabled);
    if (!provider) {
      throw new Error('没有可用的 AI Provider');
    }

    // 如果切换了连接，更新currentServerId和currentConnectionId
    if (currentServerId !== connectionId) {
      set({ currentServerId: connectionId, currentConnectionId: connectionId });
    }

    // 添加用户消息到历史
    const userMessage: ChatMessage = { role: 'user', content: message };
    const history = conversations.get(connectionId) || [];
    const newHistory = [...history, userMessage];

    // 添加一个空的 assistant 消息（用于流式更新）
    const assistantMessage: ChatMessage = { role: 'assistant', content: '' };
    const updatedHistory = [...newHistory, assistantMessage];

    // 更新对话历史（使用 connectionId 作为 key）
    const newConversations = new Map(conversations);
    newConversations.set(connectionId, updatedHistory);
    set({ conversations: newConversations, streamingConnectionId: connectionId, isLoading: true, error: null });

    try {
      // 添加系统提示词
      const systemMessage: ChatMessage = { role: 'system', content: DEFAULT_SYSTEM_PROMPT };

      // 调用流式 AI API
      const contextMessages = [systemMessage, ...newHistory.slice(-20)];

      await AIClient.chatStream(provider, contextMessages, (chunk) => {
        const { conversations } = get();
        const currentConv = conversations.get(connectionId);
        if (currentConv && currentConv.length > 0) {
          const lastMessage = currentConv[currentConv.length - 1];
          if (lastMessage.role === 'assistant') {
            const updatedConv = new Map(conversations);
            updatedConv.set(connectionId, [
              ...currentConv.slice(0, -1),
              { ...lastMessage, content: lastMessage.content + chunk }
            ]);
            set({ conversations: updatedConv });
          }
        }
      });

      set({ streamingConnectionId: null, isLoading: false });
      playSound(SoundEffect.AI_STREAM_COMPLETE);

      // 自动保存对话到历史记录
      // 直接使用 connectionId 作为 conversationId（一个连接对应一个对话）
      const { conversations: finalConversations } = get();
      const finalHistory = finalConversations.get(connectionId);
      if (finalHistory && finalHistory.length > 0) {
        const conversation = buildConversation(connectionId, finalHistory);
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
      const currentConv = conversations.get(connectionId);
      if (currentConv && currentConv.length > 0 && currentConv[currentConv.length - 1].role === 'assistant') {
        const updatedConv = new Map(conversations);
        updatedConv.set(connectionId, currentConv.slice(0, -1));
        set({ conversations: updatedConv });
      }

      set({ error: errorMsg, streamingConnectionId: null, isLoading: false });
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

  getConversationHistory: (connectionId: string) => {
    const { conversations } = get();
    return conversations.get(connectionId) || [];
  },

  clearConversation: (connectionId: string) => {
    const { conversations } = get();
    const newConversations = new Map(conversations);
    newConversations.delete(connectionId);
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
    set({
      currentConnectionId: serverId,
      currentServerId: serverId,
      selectedConversationId: null,
      // 注意：不重置 currentConversationIds，保留其他连接的对话ID
    });

    // 加载该连接的对话历史
    // serverId 是 connectionId（连接实例ID）
    const conversations = await AIHistoryManager.listConversationsByConnection(serverId);
    if (conversations.length > 0) {
      // 找到最近的对话并加载
      const latestConversation = conversations.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];

      // 加载该对话的完整内容
      await get().selectConversation(latestConversation.id);
      console.log('[AIStore] Loaded latest conversation for connection:', serverId);
    } else {
      // 没有对话历史，清空内存
      const { conversations } = get();
      const newConversations = new Map(conversations);
      newConversations.set(serverId, []);
      set({ conversations: newConversations });
      console.log('[AIStore] No conversation history for connection:', serverId);
    }
  },

  selectConversation: async (conversationId: string) => {
    set({ selectedConversationId: conversationId });

    try {
      // 从历史记录中加载对话内容
      const conversation = await AIHistoryManager.getConversation(conversationId);

      // 将 AIChatMessage 转换为 ChatMessage（移除 timestamp 字段）
      const messages: ChatMessage[] = conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // 提取消息并更新 conversations Map
      // 使用 connectionId 作为键，确保每个连接有独立的对话历史
      const connectionId = conversation.meta.connectionId;
      const newConversations = new Map(get().conversations);
      newConversations.set(connectionId, messages);
      set({
        conversations: newConversations,
        currentConnectionId: connectionId,
        currentServerId: connectionId,
        selectedConversationId: conversationId
      });
    } catch (error) {
      console.error('[AIStore] Failed to load conversation:', error);
    }
  },

  createConversation: (connectionId: string) => {
    // 为指定连接创建新对话
    // 直接清空内存中的对话历史即可，不需要生成新的ID
    const { conversations } = get();
    const newConversations = new Map(conversations);
    newConversations.set(connectionId, []); // 清空内存中的对话历史
    set({
      conversations: newConversations,
      currentConnectionId: connectionId,
      currentServerId: connectionId,
      selectedConversationId: null
    });
    console.log('[AIStore] Created new conversation for connection:', connectionId);
  },

  isServerOnline: (serverId: string) => {
    const { activeConnections } = get();
    const sessionStore = useSessionStore.getState();
    const { sessions } = sessionStore;

    // 找到属于该服务器的所有session（包括配置和连接实例）
    // serverId 可能是：
    // 1. session配置ID (s.id === serverId)
    // 2. 临时连接ID (s.connectionSessionId === serverId)
    // 3. connectionId (s.connectionId === serverId)
    const serverSessions = sessions.filter(s =>
      s.id === serverId ||
      s.connectionSessionId === serverId ||
      s.connectionId === serverId
    );

    // 如果没有找到任何匹配的session，检查 activeConnections
    if (serverSessions.length === 0 && activeConnections.has(serverId)) {
      return true;
    }

    // 检查是否有任何连接处于活跃状态
    const hasActiveConnection = serverSessions.some(s => s.status === 'connected');

    // 同时也检查 activeConnections 中是否有匹配的连接
    const hasActiveConnectionId = serverSessions.some(s =>
      s.connectionId && activeConnections.has(s.connectionId)
    );

    return hasActiveConnection || hasActiveConnectionId;
  },

  getServerActiveConnectionCount: (serverId: string) => {
    const sessionStore = useSessionStore.getState();
    const { sessions } = sessionStore;

    // 找到属于该服务器的所有session
    // serverId 可能是 sessionId、connectionSessionId 或 connectionId
    const serverSessions = sessions.filter(s =>
      s.id === serverId ||
      s.connectionSessionId === serverId ||
      s.connectionId === serverId
    );

    // 统计活跃连接数
    return serverSessions.filter(s => s.status === 'connected').length;
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
 * 从 sessionStore 获取完整的 Session 信息
 *
 * @param connectionId - 连接 ID（每个终端连接的唯一标识，也作为对话ID）
 * @param messages - 消息列表
 */
function buildConversation(connectionId: string, messages: ChatMessage[]): AIConversation {
  const firstUserMessage = messages.find(m => m.role === 'user');
  const now = new Date().toISOString();

  // 从 sessionStore 获取完整的 Session 信息
  // 注意：connectionId 是唯一标识，每个终端连接都有独立的 connectionId
  const sessionStore = useSessionStore.getState();
  const session = sessionStore.sessions.find(s => s.connectionId === connectionId || s.id === connectionId);

  // 判断是否是持久化配置的连接
  // 逻辑：如果有 connectionSessionId，且该 ID 在 sessions 列表中存在对应的持久化配置，则是持久化连接
  // 否则是快速连接（临时连接）
  const isPersistentSession = session?.connectionSessionId &&
    sessionStore.sessions.some(s => s.id === session.connectionSessionId && !s.connectionId);

  // 生成服务器配置ID（用于分组同一服务器的所有对话）
  // 确保持久化配置和临时连接到同一服务器时，使用相同的sessionId
  const generateServerConfigId = (s: any): string => {
    // 如果是持久化配置的连接，使用其配置ID
    if (isPersistentSession && s.connectionSessionId) {
      return s.connectionSessionId;
    }
    // 对于临时连接（快速连接），使用固定的 sessionId
    // 这样所有快速连接的对话都会聚合在一起
    return 'quick-connect';
  };

  // 构建正确的 ServerIdentity
  const serverIdentity: ServerIdentity = session ? {
    sessionId: generateServerConfigId(session),
    sessionName: isPersistentSession ? session.name : '快速连接对话',
    host: session.host,
    port: session.port,
    username: session.username,
  } : {
    sessionId: 'quick-connect',
    sessionName: '快速连接对话',
    host: 'unknown',
    port: 22,
    username: 'unknown',
  };

  return {
    meta: {
      id: connectionId, // 直接使用 connectionId 作为对话ID
      title: generateTitle(firstUserMessage?.content || '新对话'),
      connectionId: connectionId, // 使用 connectionId（连接实例ID）
      serverIdentity: serverIdentity,
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
