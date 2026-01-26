import type { KeybindingPreset, KeyCombination } from '@/types/keybinding';

/**
 * 默认快捷键配置
 * 根据 VSCode 风格设计
 */
export const DEFAULT_KEYBINDINGS: Record<string, KeyCombination> = {
  // 全局快捷键
  'global.newConnection': { ctrl: true, alt: false, shift: false, key: 'KeyN' },
  'global.openSettings': { ctrl: true, alt: false, shift: false, key: 'Comma' },
  'global.toggleSidebar': { ctrl: true, alt: false, shift: false, key: 'KeyB' },

  // 终端快捷键
  'terminal.newTab': { ctrl: true, alt: false, shift: false, key: 'KeyT' },
  'terminal.closeTab': { ctrl: true, alt: false, shift: false, key: 'KeyW' },
  'terminal.nextTab': { ctrl: true, alt: false, shift: false, key: 'Tab' },
  'terminal.previousTab': { ctrl: true, alt: true, shift: false, key: 'Tab' },
  'terminal.find': { ctrl: true, alt: false, shift: false, key: 'KeyF' },
  'terminal.clear': { ctrl: true, alt: false, shift: false, key: 'KeyL' },
  // 'terminal.copy' 已删除 - Ctrl+C 有特殊的中断信号含义，不应作为快捷键
  'terminal.paste': { ctrl: true, alt: false, shift: false, key: 'KeyV' },
  'terminal.zoomIn': { ctrl: true, alt: false, shift: false, key: 'Equal' },
  'terminal.zoomOut': { ctrl: true, alt: false, shift: false, key: 'Minus' },
  'terminal.zoomReset': { ctrl: true, alt: false, shift: false, key: 'Digit0' },

  // SFTP快捷键
  'sftp.upload': { ctrl: true, alt: false, shift: false, key: 'KeyU' },
  'sftp.download': { ctrl: true, alt: false, shift: false, key: 'KeyD' },
  'sftp.refresh': { ctrl: false, alt: false, shift: false, key: 'F5' }, // 使用 F5 而不是 Ctrl+R，避免与终端反向搜索冲突

  // 会话管理快捷键
  'session.quickConnect': { ctrl: true, alt: false, shift: false, key: 'KeyK' },
};

/**
 * VSCode 风格预设
 */
export const VSCODE_PRESET: KeybindingPreset = {
  id: 'vscode',
  name: 'VSCode 风格',
  description: '类似 VSCode 的快捷键布局',
  keybindings: DEFAULT_KEYBINDINGS,
};

/**
 * Terminal 风格预设（类 iTerm2/Terminal.app）
 */
export const TERMINAL_PRESET: KeybindingPreset = {
  id: 'terminal',
  name: 'Terminal 风格',
  description: '类似 iTerm2/Terminal.app 的快捷键布局',
  keybindings: {
    ...DEFAULT_KEYBINDINGS,
    'terminal.newTab': { ctrl: true, alt: false, shift: false, key: 'KeyT' },
    'terminal.closeTab': { ctrl: true, alt: false, shift: false, key: 'KeyW' },
    'terminal.clear': { ctrl: true, alt: false, shift: false, key: 'KeyK' }, // Cmd+K in iTerm2
  },
};

/**
 * Vim 风格预设
 */
export const VIM_PRESET: KeybindingPreset = {
  id: 'vim',
  name: 'Vim 风格',
  description: '为 Vim 用户优化的快捷键布局',
  keybindings: {
    ...DEFAULT_KEYBINDINGS,
    'terminal.copy': { ctrl: true, alt: false, shift: false, key: 'KeyY' }, // yy
    'terminal.paste': { ctrl: true, alt: false, shift: false, key: 'KeyP' }, // p
    'terminal.find': { ctrl: true, alt: false, shift: false, key: 'Slash' }, // /
  },
};

/**
 * 所有可用的预设方案
 */
export const KEYBINDING_PRESETS: KeybindingPreset[] = [
  VSCODE_PRESET,
  TERMINAL_PRESET,
  VIM_PRESET,
];
