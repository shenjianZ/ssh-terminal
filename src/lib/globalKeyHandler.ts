import { normalizeKeyCombo } from '@/lib/keybindingParser';
import { useKeybindingStore } from '@/store/keybindingStore';
import { keybindingActionExecutor } from '@/lib/keybindingActions';

/**
 * 快捷键生效范围
 */
export enum KeybindingScope {
  /** 全局 - 在所有页面生效 */
  Global = 'global',
  /** 仅终端页面 */
  Terminal = 'terminal',
  /** 仅会话管理页面 */
  Session = 'session',
  /** 仅SFTP文件管理页面 */
  SFTP = 'sftp',
  /** 仅设置页面 */
  Settings = 'settings',
}

/**
 * 快捷键优先级
 */
export enum KeybindingPriority {
  /** 组件级（最高优先级，如对话框） */
  Component = 3,
  /** 页面级（中等优先级，如终端页面） */
  Page = 2,
  /** 全局级（最低优先级，如应用全局快捷键） */
  Global = 1,
}

/**
 * 动作ID到生效范围的映射
 */
const ACTION_SCOPES: Record<string, KeybindingScope> = {
  // 全局快捷键
  'global.newConnection': KeybindingScope.Global,
  'global.openSettings': KeybindingScope.Global,
  'global.toggleSidebar': KeybindingScope.Global,

  // 终端快捷键
  'terminal.newTab': KeybindingScope.Terminal,
  'terminal.closeTab': KeybindingScope.Terminal,
  'terminal.nextTab': KeybindingScope.Terminal,
  'terminal.previousTab': KeybindingScope.Terminal,
  'terminal.find': KeybindingScope.Terminal,
  'terminal.clear': KeybindingScope.Terminal,
  'terminal.paste': KeybindingScope.Terminal,
  'terminal.zoomIn': KeybindingScope.Terminal,
  'terminal.zoomOut': KeybindingScope.Terminal,
  'terminal.zoomReset': KeybindingScope.Terminal,
  'terminal.openNLToCmd': KeybindingScope.Terminal,

  // SFTP快捷键
  'sftp.upload': KeybindingScope.SFTP,
  'sftp.download': KeybindingScope.SFTP,
  'sftp.refresh': KeybindingScope.SFTP,

  // 会话管理快捷键
  'session.quickConnect': KeybindingScope.Session, // 快速连接只在会话管理页面生效
};

/**
 * 快捷键处理器类型
 */
type KeybindingHandler = (
  event: KeyboardEvent,
  actionId: string
) => boolean | Promise<boolean>;

/**
 * 注册的快捷键监听器
 */
interface RegisteredListener {
  priority: KeybindingPriority;
  handler: KeybindingHandler;
  id: string;
}

/**
 * 全局快捷键处理器
 * 单例模式，管理整个应用的快捷键监听
 */
class GlobalKeyHandler {
  private listeners: Map<string, RegisteredListener> = new Map();
  private isEnabled = true;
  private listenerIdCounter = 0;
  private defaultListenerRegistered = false;
  private currentPath: string = '/';

  /**
   * 设置当前路径（用于判断快捷键是否应该生效）
   */
  setCurrentPath(path: string): void {
    this.currentPath = path;
  }

  /**
   * 检查动作是否应该在当前页面生效
   */
  private shouldHandleAction(actionId: string): boolean {
    const scope = ACTION_SCOPES[actionId];

    // 如果没有定义范围，默认在全局生效
    if (!scope) {
      return true;
    }

    // 全局快捷键始终生效
    if (scope === KeybindingScope.Global) {
      return true;
    }

    // 根据当前路径判断
    const path = this.currentPath;

    switch (scope) {
      case KeybindingScope.Terminal:
        return path === '/' || path === '/terminal';

      case KeybindingScope.Session:
        return path === '/sessions';

      case KeybindingScope.SFTP:
        return path === '/sftp';

      case KeybindingScope.Settings:
        return path === '/settings';

      default:
        return true;
    }
  }

  /**
   * 启用全局快捷键处理
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * 禁用全局快捷键处理
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * 注册快捷键监听器
   * @param priority 优先级
   * @param handler 处理函数，返回true表示已处理，false表示继续传递
   * @returns 监听器ID（用于注销）
   */
  register(priority: KeybindingPriority, handler: KeybindingHandler): string {
    const id = `listener-${this.listenerIdCounter++}`;
    this.listeners.set(id, { priority, handler, id });
    return id;
  }

  /**
   * 注销快捷键监听器
   */
  unregister(listenerId: string): void {
    this.listeners.delete(listenerId);
  }

  /**
   * 处理键盘事件
   * @param event 键盘事件
   * @returns 是否已处理
   */
  async handleKeyEvent(event: KeyboardEvent): Promise<boolean> {
    // 如果全局快捷键被禁用，不处理
    if (!this.isEnabled) {
      return false;
    }

    // 检查事件目标
    const target = event.target as HTMLElement;

    // 忽略在输入框、文本域等元素中的按键
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return false;
    }

    // 忽略只有修饰键的事件
    if (
      event.key === 'Control' ||
      event.key === 'Alt' ||
      event.key === 'Shift' ||
      event.key === 'Meta'
    ) {
      return false;
    }

    // 标准化快捷键组合
    const keys = normalizeKeyCombo(event);

    // 从 store 中查找对应的动作ID
    const actionId = useKeybindingStore.getState().getActionByKeys(keys);

    // 如果没有找到对应的快捷键，不处理
    if (!actionId) {
      return false;
    }

    // 检查动作是否应该在当前页面生效
    if (!this.shouldHandleAction(actionId)) {
      console.log(`[GlobalKeyHandler] Action ${actionId} not allowed in current path: ${this.currentPath}`);
      return false;
    }

    console.log(`[GlobalKeyHandler] Matched keybinding: ${actionId}`, keys);

    // 按优先级排序监听器（高优先级在前）
    const sortedListeners = Array.from(this.listeners.values()).sort(
      (a, b) => b.priority - a.priority
    );

    // 依次调用监听器，直到有一个返回true
    for (const listener of sortedListeners) {
      const handled = await listener.handler(event, actionId);
      if (handled) {
        // 如果监听器返回true，表示已处理，阻止默认行为
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation(); // 立即停止事件传播
        console.log(`[GlobalKeyHandler] Event handled by listener, stopped propagation`);
        return true;
      }
    }

    // 如果没有自定义监听器处理，使用默认动作执行器
    const executed = await keybindingActionExecutor.execute(actionId);
    if (executed) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation(); // 立即停止事件传播
      console.log(`[GlobalKeyHandler] Event handled by executor, stopped propagation`);
      return true;
    }

    // 如果所有都没有处理，不阻止默认行为
    return false;
  }

  /**
   * 初始化全局键盘监听
   */
  initialize(): void {
    // 防止重复初始化
    if (this.defaultListenerRegistered) {
      return;
    }

    // 在文档级别监听键盘事件
    document.addEventListener('keydown', this.onKeyDown, { capture: true });
    this.defaultListenerRegistered = true;
    console.log('[GlobalKeyHandler] Initialized');
  }

  /**
   * 销毁全局键盘监听
   */
  destroy(): void {
    document.removeEventListener('keydown', this.onKeyDown, { capture: true });
    this.listeners.clear();
    this.defaultListenerRegistered = false;
  }

  /**
   * 键盘事件处理函数（实例方法，以便可以在销毁时移除监听器）
   */
  private onKeyDown = async (event: KeyboardEvent): Promise<void> => {
    await this.handleKeyEvent(event);
  };
}

/**
 * 全局快捷键处理器单例
 */
export const globalKeyHandler = new GlobalKeyHandler();

/**
 * 初始化全局快捷键处理器
 * 应在应用启动时调用
 */
export function initializeGlobalKeyHandler(): void {
  globalKeyHandler.initialize();
}

/**
 * 快捷键 Hook（用于组件中注册快捷键监听器）
 */
export function useKeybinding(
  handler: KeybindingHandler,
  priority: KeybindingPriority = KeybindingPriority.Global
): () => void {
  // 存储监听器ID
  let listenerId: string | null = null;

  // 组件挂载时注册监听器
  const register = () => {
    listenerId = globalKeyHandler.register(priority, handler);
  };

  // 组件卸载时注销监听器
  const unregister = () => {
    if (listenerId) {
      globalKeyHandler.unregister(listenerId);
      listenerId = null;
    }
  };

  // 立即注册
  register();

  // 返回注销函数（如果组件需要手动注销）
  return unregister;
}
