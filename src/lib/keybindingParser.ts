import type { KeyCombination, ConflictInfo } from '@/types/keybinding';

/**
 * 检测是否为 Mac 平台
 */
export function isMac(): boolean {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

/**
 * 标准化键盘事件为快捷键组合
 * 使用 KeyboardEvent.code 以支持键盘布局无关
 */
export function normalizeKeyCombo(event: KeyboardEvent): KeyCombination {
  return {
    ctrl: event.ctrlKey || event.metaKey, // Mac 上 metaKey 就是 Cmd 键
    alt: event.altKey,
    shift: event.shiftKey,
    key: event.code, // 使用 code 而不是 key（保持原始大小写）
  };
}

/**
 * 序列化快捷键组合为字符串
 * 例如: "Ctrl+Shift+K" 或 "Cmd+K" (Mac)
 */
export function serializeKeyBinding(combo: KeyCombination): string {
  const parts: string[] = [];

  if (combo.ctrl) {
    parts.push(isMac() ? '⌘' : 'Ctrl');
  }
  if (combo.alt) {
    parts.push(isMac() ? '⌥' : 'Alt');
  }
  if (combo.shift) {
    parts.push(isMac() ? '⇧' : 'Shift');
  }

  // 格式化按键名称
  parts.push(formatKey(combo.key));

  return parts.join(isMac() ? '' : '+');
}

/**
 * 格式化按键名称为可读格式
 */
function formatKey(code: string): string {
  // 移除常见的代码前缀
  const keyMap: Record<string, string> = {
    'Key': '',
    'Digit': '',
    'Arrow': '↑', // 简化处理，实际应该根据方向键区分
    'Space': 'Space',
    'Enter': 'Enter',
    'Tab': 'Tab',
    'Escape': 'Esc',
    'Backspace': '⌫',
    'Delete': 'Del',
    'Insert': 'Ins',
    'Home': 'Home',
    'End': 'End',
    'PageUp': 'PgUp',
    'PageDown': 'PgDn',
    'Equal': '=',
    'Minus': '-',
    'BracketLeft': '[',
    'BracketRight': ']',
    'Semicolon': ';',
    'Quote': "'",
    'Backslash': '\\',
    'Comma': ',',
    'Period': '.',
    'Slash': '/',
    'Backquote': '`',
  };

  // 处理方向键
  if (code === 'ArrowUp') return '↑';
  if (code === 'ArrowDown') return '↓';
  if (code === 'ArrowLeft') return '←';
  if (code === 'ArrowRight') return '→';

  // 处理功能键
  if (code.startsWith('F')) {
    return code;
  }

  // 处理带前缀的键
  for (const [prefix, replacement] of Object.entries(keyMap)) {
    if (code.startsWith(prefix)) {
      const suffix = code.substring(prefix.length);
      return replacement || suffix.toUpperCase();
    }
  }

  return code.toUpperCase();
}

/**
 * 反序列化字符串为快捷键组合
 * 例如: "Ctrl+Shift+K" -> { ctrl: true, alt: false, shift: true, key: 'keyk' }
 */
export function deserializeKeyBinding(str: string): KeyCombination {
  const parts = str.split('+').map(p => p.trim().toLowerCase());

  return {
    ctrl: parts.some(p => p === 'ctrl' || p === 'cmd' || p === '⌘'),
    alt: parts.some(p => p === 'alt' || p === 'option' || p === '⌥'),
    shift: parts.some(p => p === 'shift' || p === '⇧'),
    key: parts[parts.length - 1].toLowerCase(), // 最后一部分是主键
  };
}

/**
 * 判断两个快捷键组合是否相同
 */
export function isSameCombination(a: KeyCombination, b: KeyCombination): boolean {
  return (
    a.ctrl === b.ctrl &&
    a.alt === b.alt &&
    a.shift === b.shift &&
    a.key === b.key
  );
}

/**
 * 检查快捷键组合 a 是否是 b 的前缀
 * 例如: Ctrl+K 是 Ctrl+Shift+K 的前缀
 */
export function isPrefixOf(a: KeyCombination, b: KeyCombination): boolean {
  return (
    a.ctrl === b.ctrl &&
    a.alt === b.alt &&
    a.shift === b.shift &&
    // 前缀的键可以不同，但这里简化为相同
    a.key === b.key
  );
}

/**
 * 检查快捷键冲突
 * @param newKeys 新的快捷键组合
 * @param existingBindings 现有的快捷键映射
 * @param excludeActionId 排除的动作ID（用于编辑时排除自己）
 * @returns 冲突信息，如果没有冲突则返回 null
 */
export function checkConflict(
  newKeys: KeyCombination,
  existingBindings: Record<string, KeyCombination>,
  excludeActionId?: string
): ConflictInfo | null {
  for (const [actionId, keys] of Object.entries(existingBindings)) {
    if (actionId === excludeActionId) continue;

    // 检查是否完全匹配
    if (isSameCombination(newKeys, keys)) {
      return { type: 'exact', actionId, keys };
    }

    // 检查是否是前缀冲突 (如 Ctrl+K vs Ctrl+Shift+K)
    if (isPrefixOf(newKeys, keys) || isPrefixOf(keys, newKeys)) {
      return { type: 'prefix', actionId, keys };
    }
  }

  return null;
}

/**
 * 将快捷键组合转换为唯一键（用于Map查找）
 */
export function comboToKey(combo: KeyCombination): string {
  return `${combo.ctrl ? 'c' : ''}${combo.alt ? 'a' : ''}${combo.shift ? 's' : ''}${combo.key}`;
}

/**
 * 从唯一键转换为快捷键组合
 */
export function keyToCombo(key: string): KeyCombination {
  const hasCtrl = key.includes('c');
  const hasAlt = key.includes('a');
  const hasShift = key.includes('s');
  const mainKey = key.replace(/[cas]/g, '');

  return {
    ctrl: hasCtrl,
    alt: hasAlt,
    shift: hasShift,
    key: mainKey,
  };
}
