import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  KeyCombination,
  KeybindingPreset,
  KeybindingConfig,
  ConflictInfo,
} from '@/types/keybinding';
import {
  checkConflict,
  comboToKey,
  serializeKeyBinding,
} from '@/lib/keybindingParser';
import {
  DEFAULT_KEYBINDINGS,
  KEYBINDING_PRESETS,
} from '@/config/defaultKeybindings';
import { KEYBINDING_ACTIONS } from '@/types/keybinding';
import * as Dialog from '@tauri-apps/plugin-dialog';

interface KeybindingStore {
  // 快捷键映射：actionId -> KeyCombination
  keybindings: Record<string, KeyCombination>;

  // 预设方案
  presets: KeybindingPreset[];

  // ========== 操作方法 ==========

  /**
   * 注册快捷键
   * @param actionId 动作ID
   * @param keys 快捷键组合
   * @param skipConflictCheck 是否跳过冲突检查（默认false）
   * @returns 是否成功（如果存在冲突且用户选择不覆盖则返回false）
   */
  registerKeybinding: (
    actionId: string,
    keys: KeyCombination,
    skipConflictCheck?: boolean
  ) => Promise<boolean>;

  /**
   * 批量注册快捷键
   */
  registerKeybindings: (bindings: Record<string, KeyCombination>) => Promise<void>;

  /**
   * 注销快捷键
   */
  unregisterKeybinding: (actionId: string) => void;

  /**
   * 检查快捷键冲突
   */
  checkConflict: (
    keys: KeyCombination,
    excludeActionId?: string
  ) => ConflictInfo | null;

  /**
   * 根据快捷键组合获取动作ID
   */
  getActionByKeys: (keys: KeyCombination) => string | null;

  /**
   * 根据动作ID获取快捷键组合
   */
  getKeysByAction: (actionId: string) => KeyCombination | undefined;

  /**
   * 加载预设方案
   */
  loadPreset: (presetId: string) => Promise<void>;

  /**
   * 将当前配置保存为预设
   */
  saveAsPreset: (name: string, description?: string) => Promise<void>;

  /**
   * 重置为默认配置
   */
  resetToDefault: () => Promise<void>;

  /**
   * 导出配置
   */
  exportConfig: () => Promise<string>;

  /**
   * 导入配置
   */
  importConfig: (configJson: string) => Promise<boolean>;

  /**
   * 初始化：加载默认配置
   */
  initialize: () => void;
}

export const useKeybindingStore = create<KeybindingStore>()(
  persist(
    (set, get) => ({
      // 初始状态：使用默认配置
      keybindings: DEFAULT_KEYBINDINGS,
      presets: KEYBINDING_PRESETS,

      // 注册单个快捷键
      registerKeybinding: async (actionId, keys, skipConflictCheck = false) => {
        const { keybindings } = get();

        // 检查冲突
        if (!skipConflictCheck) {
          const conflict = checkConflict(keys, keybindings, actionId);
          if (conflict) {
            const conflictAction = KEYBINDING_ACTIONS.find(
              (action) => action.id === conflict.actionId
            );
            const message = `快捷键 ${serializeKeyBinding(
              keys
            )} 已被 "${conflictAction?.name || conflict.actionId}" 使用。是否覆盖？`;

            const result = await Dialog.confirm(message, {
              title: '快捷键冲突',
              kind: 'warning',
            });

            if (!result) {
              return false; // 用户选择不覆盖
            }
          }
        }

        // 保存新的快捷键
        set({
          keybindings: {
            ...keybindings,
            [actionId]: keys,
          },
        });

        return true;
      },

      // 批量注册快捷键
      registerKeybindings: async (bindings) => {
        set((state) => ({
          keybindings: {
            ...state.keybindings,
            ...bindings,
          },
        }));
      },

      // 注销快捷键
      unregisterKeybinding: (actionId) => {
        set((state) => {
          const newBindings = { ...state.keybindings };
          delete newBindings[actionId];
          return { keybindings: newBindings };
        });
      },

      // 检查冲突
      checkConflict: (keys, excludeActionId) => {
        const { keybindings } = get();
        return checkConflict(keys, keybindings, excludeActionId);
      },

      // 根据快捷键获取动作ID
      getActionByKeys: (keys) => {
        const { keybindings } = get();
        const key = comboToKey(keys);

        for (const [actionId, combo] of Object.entries(keybindings)) {
          if (comboToKey(combo) === key) {
            return actionId;
          }
        }

        return null;
      },

      // 根据动作ID获取快捷键
      getKeysByAction: (actionId) => {
        const { keybindings } = get();
        return keybindings[actionId];
      },

      // 加载预设方案
      loadPreset: async (presetId) => {
        const { presets } = get();
        const preset = presets.find((p) => p.id === presetId);

        if (!preset) {
          await Dialog.message(`未找到预设方案: ${presetId}`, {
            title: '错误',
            kind: 'error',
          });
          return;
        }

        const confirmed = await Dialog.confirm(
          `确定要加载预设方案 "${preset.name}" 吗？这将覆盖当前的快捷键配置。`,
          {
            title: '确认加载预设',
            kind: 'warning',
          }
        );

        if (confirmed) {
          set({ keybindings: preset.keybindings });
        }
      },

      // 保存为预设
      saveAsPreset: async (name, description = '') => {
        const { keybindings, presets } = get();

        // 检查名称是否已存在
        const existingPreset = presets.find((p) => p.name === name);
        if (existingPreset) {
          const confirmed = await Dialog.confirm(
            `预设 "${name}" 已存在。是否覆盖？`,
            {
              title: '预设已存在',
              kind: 'warning',
            }
          );

          if (!confirmed) {
            return;
          }
        }

        const newPreset: KeybindingPreset = {
          id: `custom-${Date.now()}`,
          name,
          description,
          keybindings: { ...keybindings },
        };

        set((state) => ({
          presets: existingPreset
            ? state.presets.map((p) => (p.id === existingPreset.id ? newPreset : p))
            : [...state.presets, newPreset],
        }));
      },

      // 重置为默认配置
      resetToDefault: async () => {
        const confirmed = await Dialog.confirm(
          '确定要重置为默认快捷键配置吗？这将清除所有自定义配置。',
          {
            title: '确认重置',
            kind: 'warning',
          }
        );

        if (confirmed) {
          set({ keybindings: DEFAULT_KEYBINDINGS });
        }
      },

      // 导出配置
      exportConfig: async () => {
        const { keybindings } = get();
        const config: KeybindingConfig = {
          version: '1.0',
          keybindings,
        };

        return JSON.stringify(config, null, 2);
      },

      // 导入配置
      importConfig: async (configJson) => {
        try {
          const config: KeybindingConfig = JSON.parse(configJson);

          // 验证配置格式
          if (!config.version || !config.keybindings) {
            throw new Error('配置格式无效');
          }

          const confirmed = await Dialog.confirm(
            '导入快捷键配置将覆盖当前的快捷键设置。是否继续？',
            {
              title: '确认导入',
              kind: 'warning',
            }
          );

          if (confirmed) {
            set({ keybindings: config.keybindings });
            return true;
          }

          return false;
        } catch (error) {
          await Dialog.message(`导入失败: ${error}`, {
            title: '导入错误',
            kind: 'error',
          });
          return false;
        }
      },

      // 初始化
      initialize: () => {
        // 从持久化存储中加载配置，如果没有则使用默认配置
        const { keybindings } = get();

        if (Object.keys(keybindings).length === 0) {
          set({ keybindings: DEFAULT_KEYBINDINGS });
        } else {
          // 清理已删除的快捷键配置
          const cleanedKeybindings = { ...keybindings };
          let hasChanges = false;

          // 删除 'terminal.copy' - Ctrl+C 有特殊的中断信号含义
          if ('terminal.copy' in cleanedKeybindings) {
            delete cleanedKeybindings['terminal.copy'];
            hasChanges = true;
            console.log('[KeybindingStore] Removed deprecated keybinding: terminal.copy');
          }

          // 更新 'sftp.refresh' 为 F5 - 避免与 Ctrl+R 冲突
          if ('sftp.refresh' in cleanedKeybindings) {
            const oldBinding = cleanedKeybindings['sftp.refresh'];
            // 检查是否是旧的 Ctrl+R 配置
            if (oldBinding.ctrl && !oldBinding.alt && !oldBinding.shift && oldBinding.key === 'KeyR') {
              cleanedKeybindings['sftp.refresh'] = { ctrl: false, alt: false, shift: false, key: 'F5' };
              hasChanges = true;
              console.log('[KeybindingStore] Updated sftp.refresh from Ctrl+R to F5');
            }
          }

          // 删除 'session.disconnect' - 不再需要此快捷键
          if ('session.disconnect' in cleanedKeybindings) {
            delete cleanedKeybindings['session.disconnect'];
            hasChanges = true;
            console.log('[KeybindingStore] Removed session.disconnect keybinding');
          }

          // 删除 'session.reconnect' - 不再需要此快捷键
          if ('session.reconnect' in cleanedKeybindings) {
            delete cleanedKeybindings['session.reconnect'];
            hasChanges = true;
            console.log('[KeybindingStore] Removed session.reconnect keybinding');
          }

          if (hasChanges) {
            set({ keybindings: cleanedKeybindings });
          }
        }
      },
    }),
    {
      name: 'keybinding-storage',
      // 只持久化快捷键配置和自定义预设
      partialize: (state) => ({
        keybindings: state.keybindings,
        presets: state.presets,
      }),
    }
  )
);

// 初始化快捷键配置
useKeybindingStore.getState().initialize();
