import { useTerminalStore } from '@/store/terminalStore';
import { useSessionStore } from '@/store/sessionStore';
import { useTerminalConfigStore } from '@/store/terminalConfigStore';
import { invoke } from '@tauri-apps/api/core';

/**
 * 快捷键动作执行器
 * 将动作ID映射到实际的操作
 */
export class KeybindingActionExecutor {
  /**
   * 执行快捷键动作
   * @param actionId 动作ID
   * @returns 是否成功执行
   */
  async execute(actionId: string): Promise<boolean> {
    console.log(`[KeybindingExecutor] Executing action: ${actionId}`);

    switch (actionId) {
      // ========== 全局快捷键 ==========
      case 'global.newConnection':
        return this.executeGlobalNewConnection();

      case 'global.openSettings':
        return this.executeGlobalOpenSettings();

      case 'global.toggleSidebar':
        return this.executeGlobalToggleSidebar();

      // ========== 终端快捷键 ==========
      case 'terminal.newTab':
        return this.executeTerminalNewTab();

      case 'terminal.closeTab':
        return this.executeTerminalCloseTab();

      case 'terminal.nextTab':
        return this.executeTerminalNextTab();

      case 'terminal.previousTab':
        return this.executeTerminalPreviousTab();

      case 'terminal.find':
        return this.executeTerminalFind();

      case 'terminal.clear':
        return this.executeTerminalClear();

      // case 'terminal.copy' 已删除 - Ctrl+C 有特殊的中断信号含义，不应作为快捷键

      case 'terminal.paste':
        return this.executeTerminalPaste();

      case 'terminal.zoomIn':
        return this.executeTerminalZoomIn();

      case 'terminal.zoomOut':
        return this.executeTerminalZoomOut();

      case 'terminal.zoomReset':
        return this.executeTerminalZoomReset();

      case 'terminal.openNLToCmd':
        return this.executeTerminalOpenNLToCmd();

      case 'terminal.explainCommand':
        return this.executeTerminalExplainCommand();

      case 'terminal.analyzeError':
        return this.executeTerminalAnalyzeError();

      case 'terminal.openAIChat':
        return this.executeTerminalOpenAIChat();

      // ========== SFTP 快捷键 ==========
      case 'sftp.upload':
        return this.executeSftpUpload();

      case 'sftp.download':
        return this.executeSftpDownload();

      case 'sftp.refresh':
        return this.executeSftpRefresh();

      // ========== 会话管理快捷键 ==========
      case 'session.quickConnect':
        return this.executeSessionQuickConnect();

      default:
        console.warn(`[KeybindingExecutor] Unknown action: ${actionId}`);
        return false;
    }
  }

  // ========== 全局快捷键实现 ==========

  /**
   * 打开快速连接对话框
   */
  private async executeGlobalNewConnection(): Promise<boolean> {
    try {
      // 触发一个全局事件，由 Terminal 页面监听并打开快速连接对话框
      const event = new CustomEvent('keybinding-new-connection');
      window.dispatchEvent(event);
      console.log('[KeybindingExecutor] Triggered new connection dialog');
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error opening new connection:', error);
      return false;
    }
  }

  /**
   * 打开设置页面
   */
  private async executeGlobalOpenSettings(): Promise<boolean> {
    try {
      // 使用路由导航到设置页面
      const event = new CustomEvent('keybinding-navigate', { detail: { path: '/settings' } });
      window.dispatchEvent(event);
      console.log('[KeybindingExecutor] Triggered navigation to settings');
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error opening settings:', error);
      return false;
    }
  }

  /**
   * 切换侧边栏
   */
  private async executeGlobalToggleSidebar(): Promise<boolean> {
    try {
      // 触发切换侧边栏事件
      const event = new CustomEvent('keybinding-toggle-sidebar');
      window.dispatchEvent(event);
      console.log('[KeybindingExecutor] Triggered sidebar toggle');
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error toggling sidebar:', error);
      return false;
    }
  }

  // ========== 终端快捷键实现 ==========

  /**
   * 新建标签页（复制当前连接）
   */
  private async executeTerminalNewTab(): Promise<boolean> {
    try {
      const activeTab = useTerminalStore.getState().getActiveTab();
      if (!activeTab) {
        // 如果没有活跃标签，打开快速连接对话框
        console.log('[KeybindingExecutor] No active tab, opening quick connect dialog');
        return this.executeGlobalNewConnection();
      }

      // 获取会话信息
      const sessions = useSessionStore.getState().sessions;
      const currentSession = sessions.find((s) => s.id === activeTab.connectionId);

      if (!currentSession) {
        console.log('[KeybindingExecutor] Current session not found, opening quick connect dialog');
        return this.executeGlobalNewConnection();
      }

      // 确定要复制的 sessionId
      // 如果是临时连接（有 connectionSessionId），使用它；否则使用 id
      const sessionIdToDuplicate = currentSession.connectionSessionId || currentSession.id;

      console.log('[KeybindingExecutor] Duplicating session:', sessionIdToDuplicate);

      // 创建新连接实例
      const newConnectionId = await useSessionStore.getState().createConnection(sessionIdToDuplicate);

      // 触发事件，让 Terminal.tsx 创建新标签页
      const event = new CustomEvent('keybinding-duplicate-tab', {
        detail: {
          connectionId: newConnectionId,
          sessionId: sessionIdToDuplicate,
        }
      });
      window.dispatchEvent(event);

      console.log('[KeybindingExecutor] Created new connection:', newConnectionId);
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error duplicating tab:', error);
      // 如果复制失败，回退到打开快速连接对话框
      return this.executeGlobalNewConnection();
    }
  }

  /**
   * 关闭当前标签页
   */
  private async executeTerminalCloseTab(): Promise<boolean> {
    try {
      const activeTab = useTerminalStore.getState().getActiveTab();
      if (!activeTab) {
        console.log('[KeybindingExecutor] No active tab to close');
        return false;
      }

      useTerminalStore.getState().removeTab(activeTab.id);
      console.log('[KeybindingExecutor] Closed tab:', activeTab.id);
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error closing tab:', error);
      return false;
    }
  }

  /**
   * 切换到下一个标签页
   */
  private async executeTerminalNextTab(): Promise<boolean> {
    try {
      const { tabs } = useTerminalStore.getState();
      if (tabs.length === 0) {
        return false;
      }

      const currentTabIndex = tabs.findIndex(t => t.isActive);
      if (currentTabIndex === -1) {
        return false;
      }

      const nextIndex = (currentTabIndex + 1) % tabs.length;
      const nextTab = tabs[nextIndex];

      useTerminalStore.getState().setActiveTab(nextTab.id);
      useTerminalStore.getState().focusTerminal(nextTab.connectionId);

      console.log('[KeybindingExecutor] Switched to next tab:', nextTab.id);
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error switching to next tab:', error);
      return false;
    }
  }

  /**
   * 切换到上一个标签页
   */
  private async executeTerminalPreviousTab(): Promise<boolean> {
    try {
      const { tabs } = useTerminalStore.getState();
      if (tabs.length === 0) {
        return false;
      }

      const currentTabIndex = tabs.findIndex(t => t.isActive);
      if (currentTabIndex === -1) {
        return false;
      }

      const prevIndex = currentTabIndex === 0 ? tabs.length - 1 : currentTabIndex - 1;
      const prevTab = tabs[prevIndex];

      useTerminalStore.getState().setActiveTab(prevTab.id);
      useTerminalStore.getState().focusTerminal(prevTab.connectionId);

      console.log('[KeybindingExecutor] Switched to previous tab:', prevTab.id);
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error switching to previous tab:', error);
      return false;
    }
  }

  /**
   * 打开搜索对话框
   */
  private async executeTerminalFind(): Promise<boolean> {
    try {
      // 触发搜索对话框事件
      const event = new CustomEvent('keybinding-terminal-find');
      window.dispatchEvent(event);
      console.log('[KeybindingExecutor] Triggered terminal find dialog');
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error opening find dialog:', error);
      return false;
    }
  }

  /**
   * 清屏
   */
  private async executeTerminalClear(): Promise<boolean> {
    try {
      const activeTab = useTerminalStore.getState().getActiveTab();
      if (!activeTab) {
        return false;
      }

      const instance = useTerminalStore.getState().terminalInstances.get(activeTab.connectionId);
      if (instance?.terminal) {
        instance.terminal.clear();
        console.log('[KeybindingExecutor] Terminal cleared');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[KeybindingExecutor] Error clearing terminal:', error);
      return false;
    }
  }

  /**
   * 粘贴文本
   */
  private async executeTerminalPaste(): Promise<boolean> {
    try {
      const activeTab = useTerminalStore.getState().getActiveTab();
      if (!activeTab) {
        return false;
      }

      const text = await navigator.clipboard.readText();
      if (!text) {
        console.log('[KeybindingExecutor] Clipboard is empty');
        return false;
      }

      // 转换换行符：\n 或 \r\n -> \r
      // 终端使用 \r（回车符）作为换行
      const converted = text.replace(/\r\n/g, '\r').replace(/\n/g, '\r');

      await invoke('terminal_write', {
        sessionId: activeTab.connectionId,
        data: new TextEncoder().encode(converted),
      });

      console.log('[KeybindingExecutor] Pasted text from clipboard');
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error pasting:', error);
      return false;
    }
  }

  /**
   * 放大字体
   * 注意：此方法已废弃，实际缩放功能在 XTermWrapper 组件中实现
   * 保留此方法仅为兼容性，实际不会被调用
   */
  private async executeTerminalZoomIn(): Promise<boolean> {
    try {
      // 注意：这个方法不会被调用，实际处理在 XTermWrapper 中
      console.log('[KeybindingExecutor] Zoom in - handled in XTermWrapper component');
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error zooming in:', error);
      return false;
    }
  }

  /**
   * 缩小字体
   * 注意：此方法已废弃，实际缩放功能在 XTermWrapper 组件中实现
   * 保留此方法仅为兼容性，实际不会被调用
   */
  private async executeTerminalZoomOut(): Promise<boolean> {
    try {
      // 注意：这个方法不会被调用，实际处理在 XTermWrapper 中
      console.log('[KeybindingExecutor] Zoom out - handled in XTermWrapper component');
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error zooming out:', error);
      return false;
    }
  }

  /**
   * 重置字体大小
   * 注意：此方法已废弃，实际缩放功能在 XTermWrapper 组件中实现
   * 保留此方法仅为兼容性，实际不会被调用
   */
  private async executeTerminalZoomReset(): Promise<boolean> {
    try {
      // 注意：这个方法不会被调用，实际处理在 XTermWrapper 中
      const { config } = useTerminalConfigStore.getState();
      useTerminalConfigStore.getState().setConfig({ fontSize: config.fontSize });
      console.log('[KeybindingExecutor] Font size reset to config value:', config.fontSize);
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error resetting zoom:', error);
      return false;
    }
  }

  /**
   * 打开 AI 自然语言转命令面板
   */
  private async executeTerminalOpenNLToCmd(): Promise<boolean> {
    try {
      // 触发 NL2CMD 面板事件，由 XTermWrapper 监听并处理
      const event = new CustomEvent('keybinding-terminal-open-nl2cmd');
      window.dispatchEvent(event);
      console.log('[KeybindingExecutor] Triggered NL2CMD panel');
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error opening NL2CMD panel:', error);
      return false;
    }
  }

  /**
   * 打开/关闭 AI 对话面板
   */
  private async executeTerminalOpenAIChat(): Promise<boolean> {
    try {
      // 触发 AI 对话面板事件
      const event = new CustomEvent('keybinding-terminal-open-ai-chat');
      window.dispatchEvent(event);
      console.log('[KeybindingExecutor] Triggered AI chat panel');
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error opening AI chat panel:', error);
      return false;
    }
  }

  /**
   * AI 解释命令
   */
  private async executeTerminalExplainCommand(): Promise<boolean> {
    try {
      // 触发命令解释事件，由 XTermWrapper 监听并处理
      const event = new CustomEvent('keybinding-terminal-explain-command');
      window.dispatchEvent(event);
      console.log('[KeybindingExecutor] Triggered command explanation');
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error explaining command:', error);
      return false;
    }
  }

  /**
   * AI 分析错误
   */
  private async executeTerminalAnalyzeError(): Promise<boolean> {
    try {
      // 触发错误分析事件，由 XTermWrapper 监听并处理
      const event = new CustomEvent('keybinding-terminal-analyze-error');
      window.dispatchEvent(event);
      console.log('[KeybindingExecutor] Triggered error analysis');
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error analyzing error:', error);
      return false;
    }
  }

  // ========== 会话管理快捷键实现 ==========

  /**
   * 新建会话（在会话管理页面）
   */
  private async executeSessionQuickConnect(): Promise<boolean> {
    try {
      // 触发新建会话事件，由 SessionManager 页面监听并处理
      const event = new CustomEvent('keybinding-new-session');
      window.dispatchEvent(event);
      console.log('[KeybindingExecutor] Triggered new session dialog');
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error opening new session dialog:', error);
      return false;
    }
  }

  // ========== SFTP 快捷键实现 ==========

  /**
   * SFTP 上传文件
   */
  private async executeSftpUpload(): Promise<boolean> {
    try {
      // 触发上传文件事件
      const event = new CustomEvent('keybinding-sftp-upload');
      window.dispatchEvent(event);
      console.log('[KeybindingExecutor] Triggered SFTP upload');
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error triggering SFTP upload:', error);
      return false;
    }
  }

  /**
   * SFTP 下载文件
   */
  private async executeSftpDownload(): Promise<boolean> {
    try {
      // 触发下载文件事件
      const event = new CustomEvent('keybinding-sftp-download');
      window.dispatchEvent(event);
      console.log('[KeybindingExecutor] Triggered SFTP download');
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error triggering SFTP download:', error);
      return false;
    }
  }

  /**
   * SFTP 刷新文件列表
   */
  private async executeSftpRefresh(): Promise<boolean> {
    try {
      // 触发刷新文件列表事件
      const event = new CustomEvent('keybinding-sftp-refresh');
      window.dispatchEvent(event);
      console.log('[KeybindingExecutor] Triggered SFTP refresh');
      return true;
    } catch (error) {
      console.error('[KeybindingExecutor] Error triggering SFTP refresh:', error);
      return false;
    }
  }
}

// 导出单例
export const keybindingActionExecutor = new KeybindingActionExecutor();
