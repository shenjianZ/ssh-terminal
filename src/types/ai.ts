// AI 相关类型定义

/**
 * AI 服务提供商类型
 */
export type AIProviderType = 'openai' | 'ollama' | 'qwen' | 'wenxin';

/**
 * AI 聊天消息角色
 */
export type ChatMessageRole = 'user' | 'assistant' | 'system';

/**
 * 聊天消息
 */
export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
}

/**
 * AI Provider 配置
 */
export interface AIProviderConfig {
  id: string;
  type: AIProviderType;
  name: string;
  apiKey?: string; // 加密存储
  baseUrl?: string; // 自定义 API 地址
  model: string;
  temperature?: number;
  maxTokens?: number;
  enabled: boolean;
}

/**
 * AI 配置
 */
export interface AIConfig {
  providers: AIProviderConfig[];
  defaultProvider: string; // 默认使用的 provider ID
  shortcuts: {
    explainCommand: string; // 快捷键：命令解释
    openChat: string; // 快捷键：打开对话
    nlToCommand: string; // 快捷键：自然语言转命令
  };
}

/**
 * AI 对话历史
 */
export interface ConversationHistory {
  connectionId: string; // 关联的 SSH 连接 ID
  messages: ChatMessage[]; // 消息列表
  updatedAt: number; // 最后更新时间
}

/**
 * AI 命令类型
 */
export type AICommandType = 'chat' | 'explain_command' | 'generate_command' | 'analyze_error';

/**
 * 连接状态
 */
export type ConnectionStatus = 'active' | 'inactive';

/**
 * 服务器身份信息
 */
export interface ServerIdentity {
  sessionId: string;
  sessionName: string;
  host: string;
  port: number;
  username: string;
}

/**
 * AI 对话历史消息（持久化）
 */
export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // ISO 8601 格式
}

/**
 * AI 对话会话元数据
 */
export interface AIConversationMeta {
  id: string;
  title: string;
  serverIdentity: ServerIdentity;
  connectionInstanceId?: string;
  createdAt: string; // ISO 8601 格式
  updatedAt: string; // ISO 8601 格式
  messageCount: number;
  isArchived: boolean;
  connectionStatus: ConnectionStatus;
}

/**
 * AI 对话会话完整数据
 */
export interface AIConversation {
  meta: AIConversationMeta;
  messages: AIChatMessage[];
}

/**
 * 按服务器分组的对话列表
 */
export interface ServerConversationGroup {
  serverIdentity: ServerIdentity;
  conversations: AIConversationMeta[];
  totalConversations: number;
  activeConnectionCount: number;
  latestConversationAt?: string;
}

/**
 * 导出格式
 */
export type ExportFormat = 'markdown' | 'json' | 'text';
