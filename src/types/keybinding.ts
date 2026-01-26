/**
 * 快捷键组合
 */
export interface KeyCombination {
  /** Ctrl键（Mac上是Cmd键） */
  ctrl: boolean;
  /** Alt键（Mac上是Option键） */
  alt: boolean;
  /** Shift键 */
  shift: boolean;
  /** 按键代码（使用KeyboardEvent.code，如'KeyA', 'Digit1'等） */
  key: string;
}

/**
 * 快捷键动作定义
 */
export interface KeybindingAction {
  /** 动作ID */
  id: string;
  /** 动作名称 */
  name: string;
  /** 动作描述 */
  description: string;
  /** 分类 */
  category: 'global' | 'terminal' | 'session' | 'sftp' | 'other';
  /** 默认快捷键（可选） */
  defaultKeybinding?: KeyCombination;
}

/**
 * 快捷键预设方案
 */
export interface KeybindingPreset {
  /** 预设ID */
  id: string;
  /** 预设名称 */
  name: string;
  /** 预设描述 */
  description: string;
  /** 快捷键映射 */
  keybindings: Record<string, KeyCombination>;
}

/**
 * 快捷键配置
 */
export interface KeybindingConfig {
  version: string;
  keybindings: Record<string, KeyCombination>;
}

/**
 * 快捷键冲突信息
 */
export interface ConflictInfo {
  /** 冲突类型：'exact' - 完全相同, 'prefix' - 前缀冲突 */
  type: 'exact' | 'prefix';
  /** 冲突的动作ID */
  actionId: string;
  /** 冲突的快捷键 */
  keys: KeyCombination;
}

/**
 * 可用的所有快捷键动作
 */
export const KEYBINDING_ACTIONS: KeybindingAction[] = [
  // 全局快捷键
  {
    id: 'global.newConnection',
    name: '新建连接',
    description: '快速创建新的SSH连接',
    category: 'global',
    defaultKeybinding: { ctrl: true, alt: false, shift: false, key: 'KeyN' },
  },
  {
    id: 'global.openSettings',
    name: '打开设置',
    description: '打开应用设置页面',
    category: 'global',
    defaultKeybinding: { ctrl: true, alt: false, shift: false, key: 'Comma' },
  },
  {
    id: 'global.toggleSidebar',
    name: '切换侧边栏',
    description: '显示或隐藏侧边栏',
    category: 'global',
    defaultKeybinding: { ctrl: true, alt: false, shift: false, key: 'KeyB' },
  },

  // 终端快捷键
  {
    id: 'terminal.newTab',
    name: '新建标签页',
    description: '复制当前终端连接，创建新标签页（如果没有活跃标签则打开快速连接）',
    category: 'terminal',
    defaultKeybinding: { ctrl: true, alt: false, shift: false, key: 'KeyT' },
  },
  {
    id: 'terminal.closeTab',
    name: '关闭标签页',
    description: '关闭当前标签页',
    category: 'terminal',
    defaultKeybinding: { ctrl: true, alt: false, shift: false, key: 'KeyW' },
  },
  {
    id: 'terminal.nextTab',
    name: '下一个标签页',
    description: '切换到下一个标签页',
    category: 'terminal',
    defaultKeybinding: { ctrl: true, alt: false, shift: false, key: 'Tab' }, // 实际上是Ctrl+Tab
  },
  {
    id: 'terminal.previousTab',
    name: '上一个标签页',
    description: '切换到上一个标签页',
    category: 'terminal',
    defaultKeybinding: { ctrl: true, alt: true, shift: false, key: 'Tab' }, // 实际上是Ctrl+Shift+Tab
  },
  {
    id: 'terminal.find',
    name: '查找',
    description: '在终端中搜索文本',
    category: 'terminal',
    defaultKeybinding: { ctrl: true, alt: false, shift: false, key: 'KeyF' },
  },
  {
    id: 'terminal.clear',
    name: '清屏',
    description: '清除终端屏幕内容',
    category: 'terminal',
    defaultKeybinding: { ctrl: true, alt: false, shift: false, key: 'KeyL' },
  },
  // 'terminal.copy' 已删除 - Ctrl+C 有特殊的中断信号含义，不应作为快捷键
  {
    id: 'terminal.paste',
    name: '粘贴',
    description: '粘贴剪贴板内容',
    category: 'terminal',
    defaultKeybinding: { ctrl: true, alt: false, shift: false, key: 'KeyV' },
  },
  {
    id: 'terminal.zoomIn',
    name: '放大字体',
    description: '增加终端字体大小',
    category: 'terminal',
    defaultKeybinding: { ctrl: true, alt: false, shift: false, key: 'Equal' }, // Ctrl++
  },
  {
    id: 'terminal.zoomOut',
    name: '缩小字体',
    description: '减小终端字体大小',
    category: 'terminal',
    defaultKeybinding: { ctrl: true, alt: false, shift: false, key: 'Minus' }, // Ctrl+-
  },
  {
    id: 'terminal.zoomReset',
    name: '重置字体',
    description: '重置字体大小为默认值',
    category: 'terminal',
    defaultKeybinding: { ctrl: true, alt: false, shift: false, key: 'Digit0' }, // Ctrl+0
  },

  // SFTP快捷键
  {
    id: 'sftp.upload',
    name: '上传文件',
    description: '上传选中的本地文件',
    category: 'sftp',
    defaultKeybinding: { ctrl: true, alt: false, shift: false, key: 'KeyU' },
  },
  {
    id: 'sftp.download',
    name: '下载文件',
    description: '下载选中的远程文件',
    category: 'sftp',
    defaultKeybinding: { ctrl: true, alt: false, shift: false, key: 'KeyD' },
  },
  {
    id: 'sftp.refresh',
    name: '刷新文件列表',
    description: '刷新当前文件列表',
    category: 'sftp',
    defaultKeybinding: { ctrl: false, alt: false, shift: false, key: 'F5' },
  },

  // 会话管理快捷键
  {
    id: 'session.quickConnect',
    name: '新建会话',
    description: '在会话管理页面创建新会话',
    category: 'session',
    defaultKeybinding: { ctrl: true, alt: false, shift: false, key: 'KeyK' },
  },
];
