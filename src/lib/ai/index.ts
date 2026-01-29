/**
 * AI Provider 缓存池 - 前端集成示例
 *
 * 本文件展示了如何在前端使用 AI Provider 缓存池功能
 * 包括自动缓存、热重载和缓存管理
 */

import { invoke } from '@tauri-apps/api/core';

// ==================== 类型定义 ====================

/**
 * AI Provider 配置
 */
export interface AIProviderConfig {
  providerType: string;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * 聊天消息
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * 缓存信息
 */
export interface CacheInfo {
  cache_size: number;
  cached_providers: string[];
}

/**
 * 热重载结果
 */
export interface HotReloadResult {
  success: boolean;
  removedCount: number;
  message: string;
}

// ==================== AI 服务类 ====================

/**
 * AI 服务管理类
 *
 * 提供统一的 AI 功能接口，自动使用缓存池优化性能
 */
export class AIService {
  /**
   * AI 聊天对话
   *
   * @param config - AI Provider 配置
   * @param messages - 聊天消息列表
   * @returns AI 回复内容
   *
   * @example
   * ```typescript
   * const response = await AIService.chat({
   *   providerType: 'openai',
   *   apiKey: 'sk-xxx',
   *   model: 'gpt-4',
   *   temperature: 0.7,
   *   maxTokens: 2000
   * }, [
   *   { role: 'user', content: 'Hello!' }
   * ]);
   * ```
   */
  static async chat(
    config: AIProviderConfig,
    messages: ChatMessage[]
  ): Promise<string> {
    return invoke<string>('ai_chat', {
      config,
      messages
    });
  }

  /**
   * 流式 AI 聊天（实验性功能）
   *
   * @param config - AI Provider 配置
   * @param messages - 聊天消息列表
   * @param onChunk - 接收数据块的回调函数
   * @returns 完整的 AI 回复内容
   *
   * @example
   * ```typescript
   * await AIService.chatStream(
   *   config,
   *   messages,
   *   (chunk) => console.log('Received:', chunk)
   * );
   * ```
   */
  static async chatStream(
    config: AIProviderConfig,
    messages: ChatMessage[]
  ): Promise<string> {
    // 注意：流式功能需要前端监听事件
    // 这里仅作为示例，实际实现需要使用 Tauri 的事件监听
    return invoke<string>('ai_chat_stream', {
      config,
      messages
    });
  }

  /**
   * 解释 Shell 命令
   *
   * @param command - 要解释的命令
   * @param config - AI Provider 配置
   * @returns 命令解释
   *
   * @example
   * ```typescript
   * const explanation = await AIService.explainCommand(
   *   'ls -la',
   *   config
   * );
   * console.log(explanation);
   * // 输出：
   * // 功能：列出所有文件的详细信息
   * // 参数：l|a
   * // 示例：ls -la /home
   * // 风险：无
   * ```
   */
  static async explainCommand(
    command: string,
    config: AIProviderConfig
  ): Promise<string> {
    return invoke<string>('ai_explain_command', {
      command,
      config
    });
  }

  /**
   * 自然语言生成 Shell 命令
   *
   * @param input - 自然语言描述
   * @param config - AI Provider 配置
   * @returns 生成的 Shell 命令
   *
   * @example
   * ```typescript
   * const command = await AIService.generateCommand(
   *   '查看所有日志文件',
   *   config
   * );
   * console.log(command); // "find . -name \"*.log\""
   * ```
   */
  static async generateCommand(
    input: string,
    config: AIProviderConfig
  ): Promise<string> {
    return invoke<string>('ai_generate_command', {
      input,
      config
    });
  }

  /**
   * 分析错误信息
   *
   * @param error - 错误信息
   * @param config - AI Provider 配置
   * @returns 错误分析和解决方案
   *
   * @example
   * ```typescript
   * const analysis = await AIService.analyzeError(
   *   'Permission denied (publickey)',
   *   config
   * );
   * console.log(analysis);
   * // 输出错误原因和解决方法
   * ```
   */
  static async analyzeError(
    error: string,
    config: AIProviderConfig
  ): Promise<string> {
    return invoke<string>('ai_analyze_error', {
      error,
      config
    });
  }

  /**
   * 测试 AI Provider 连接
   *
   * @param config - AI Provider 配置
   * @returns 连接是否成功
   *
   * @example
   * ```typescript
   * const isConnected = await AIService.testConnection(config);
   * if (isConnected) {
   *   console.log('连接成功');
   * } else {
   *   console.log('连接失败');
   * }
   * ```
   */
  static async testConnection(config: AIProviderConfig): Promise<boolean> {
    return invoke<boolean>('ai_test_connection', {
      config
    });
  }
}

// ==================== 缓存管理类 ====================

/**
 * AI Provider 缓存管理类
 *
 * 提供缓存查询、清理和热重载功能
 */
export class AICacheManager {
  /**
   * 获取缓存信息
   *
   * @returns 缓存统计信息
   *
   * @example
   * ```typescript
   * const info = await AICacheManager.getCacheInfo();
   * console.log(`缓存数量: ${info.cacheSize}`);
   * console.log('缓存的 Providers:', info.cachedProviders);
   * ```
   */
  static async getCacheInfo(): Promise<CacheInfo> {
    return invoke<CacheInfo>('ai_get_cache_info');
  }

  /**
   * 清除所有缓存
   *
   * 当配置发生重大变更时使用
   *
   * @example
   * ```typescript
   * await AICacheManager.clearCache();
   * console.log('缓存已清除');
   * ```
   */
  static async clearCache(): Promise<void> {
    await invoke('ai_clear_cache');
  }

  /**
   * 手动触发热重载
   *
   * 当配置文件被外部修改时使用
   *
   * @returns 热重载结果
   *
   * @example
   * ```typescript
   * const result = await AICacheManager.hotReload();
   * console.log(`移除了 ${result.removedCount} 个 Provider`);
   * ```
   */
  static async hotReload(): Promise<HotReloadResult> {
    return invoke<HotReloadResult>('ai_hot_reload');
  }

  /**
   * 监控缓存性能
   *
   * @returns 缓存性能指标
   *
   * @example
   * ```typescript
   * const metrics = await AICacheManager.getMetrics();
   * console.log(`缓存命中率: ${metrics.hitRate}%`);
   * ```
   */
  static async getMetrics(): Promise<{
    cache_size: number;
    cached_providers: string[];
    timestamp: number;
  }> {
    const info = await this.getCacheInfo();
    return {
      ...info,
      timestamp: Date.now()
    };
  }
}

// ==================== 配置管理类 ====================

/**
 * AI 配置管理类
 *
 * 管理配置的保存和加载，自动触发热重载
 */
export class AIConfigManager {
  /**
   * 保存 AI 配置
   *
   * 保存配置后会自动触发热重载，智能清理变更的 Provider 缓存
   *
   * @param config - AI 配置对象
   *
   * @example
   * ```typescript
   * await AIConfigManager.saveConfig({
   *   providers: [
   *     {
   *       id: 'openai-gpt4',
   *       providerType: 'openai',
   *       apiKey: 'sk-xxx',
   *       model: 'gpt-4',
   *       temperature: 0.7,
   *       maxTokens: 2000
   *     }
   *   ],
   *   defaultProvider: 'openai-gpt4',
   *   shortcuts: {}
   * });
   * console.log('配置已保存，缓存已自动更新');
   * ```
   */
  static async saveConfig(config: any): Promise<void> {
    await invoke('storage_ai_config_save', { config });
    // 注意：热重载在后端自动触发
  }

  /**
   * 加载 AI 配置
   *
   * @returns AI 配置对象，如果不存在则返回 null
   *
   * @example
   * ```typescript
   * const config = await AIConfigManager.loadConfig();
   * if (config) {
   *   console.log('已加载配置:', config.providers);
   * } else {
   *   console.log('未找到配置，使用默认配置');
   * }
   * ```
   */
  static async loadConfig(): Promise<any | null> {
    return invoke<any | null>('storage_ai_config_load');
  }

  /**
   * 获取默认配置
   *
   * @returns 默认的 AI 配置
   */
  static async getDefaultConfig(): Promise<any> {
    return invoke<any>('storage_ai_config_get_default');
  }
}

// ==================== 使用示例 ====================

/**
 * 完整使用示例
 *
 * 展示如何在应用中集成 AI 功能和缓存管理
 */
export async function exampleUsage() {
  // 1. 定义 AI Provider 配置
  const config: AIProviderConfig = {
    providerType: 'openai',
    apiKey: 'sk-your-api-key',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000
  };

  try {
    // 2. 测试连接
    console.log('测试 AI 连接...');
    const isConnected = await AIService.testConnection(config);
    if (!isConnected) {
      throw new Error('AI 连接失败');
    }
    console.log('✓ 连接成功');

    // 3. 使用 AI 功能（第一次调用会创建并缓存 Provider）
    console.log('\n第一次 AI 调用（创建缓存）...');
    const response1 = await AIService.chat(config, [
      { role: 'user', content: 'What is Rust?' }
    ]);
    console.log('回复 1:', response1);

    // 4. 查看缓存信息
    console.log('\n查看缓存状态...');
    const cacheInfo = await AICacheManager.getCacheInfo();
    console.log(`缓存数量: ${cacheInfo.cache_size}`);
    console.log('缓存的 Providers:', cacheInfo.cached_providers);

    // 5. 再次使用相同配置（会复用缓存）
    console.log('\n第二次 AI 调用（使用缓存）...');
    const response2 = await AIService.chat(config, [
      { role: 'user', content: 'What is Tauri?' }
    ]);
    console.log('回复 2:', response2);

    // 6. 其他 AI 功能
    console.log('\n使用命令解释功能...');
    const explanation = await AIService.explainCommand('ls -la', config);
    console.log('命令解释:', explanation);

    console.log('\n使用命令生成功能...');
    const command = await AIService.generateCommand('查看所有文件', config);
    console.log('生成的命令:', command);

    // 7. 保存配置（会自动触发热重载）
    console.log('\n保存配置...');
    const aiConfig = {
      providers: [
        {
          id: 'openai-gpt4',
          providerType: 'openai',
          apiKey: 'sk-your-api-key',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000
        }
      ],
      defaultProvider: 'openai-gpt4',
      shortcuts: {}
    };
    await AIConfigManager.saveConfig(aiConfig);
    console.log('✓ 配置已保存，缓存已自动更新');

    // 8. 手动清理缓存（如果需要）
    console.log('\n手动清除缓存...');
    await AICacheManager.clearCache();
    console.log('✓ 缓存已清除');

  } catch (error) {
    console.error('发生错误:', error);
  }
}

// 导出所有功能
export default {
  AIService,
  AICacheManager,
  AIConfigManager
};
