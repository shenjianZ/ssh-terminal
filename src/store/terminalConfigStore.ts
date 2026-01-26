import { create } from 'zustand';
import type { TerminalConfig, TerminalTheme } from '@/types/terminal';
import { DEFAULT_TERMINAL_CONFIG, TERMINAL_THEMES } from '@/config/themes';
import { invoke } from '@tauri-apps/api/core';

interface TerminalConfigStore {
  config: TerminalConfig;
  isLoading: boolean;

  // 操作
  setConfig: (config: Partial<TerminalConfig>) => Promise<void>;
  setTheme: (themeId: string) => Promise<void>;
  resetConfig: () => Promise<void>;
  loadConfig: () => Promise<void>;

  // 查询
  getCurrentTheme: () => TerminalTheme;
}

export const useTerminalConfigStore = create<TerminalConfigStore>((set, get) => ({
  config: DEFAULT_TERMINAL_CONFIG,
  isLoading: false,

  setConfig: async (partialConfig) => {
    const newConfig = { ...get().config, ...partialConfig };
    set({ config: newConfig });
    await invoke('storage_config_save', {
      config: {
        themeId: newConfig.themeId,
        fontSize: newConfig.fontSize,
        fontFamily: newConfig.fontFamily,
        fontWeight: newConfig.fontWeight,
        lineHeight: newConfig.lineHeight,
        cursorStyle: newConfig.cursorStyle,
        cursorBlink: newConfig.cursorBlink,
        letterSpacing: newConfig.letterSpacing,
        padding: newConfig.padding,
        scrollback: newConfig.scrollback,
        keepAliveInterval: newConfig.keepAliveInterval,
        notificationsEnabled: newConfig.notificationsEnabled,
        soundEffectsEnabled: newConfig.soundEffectsEnabled,
      },
    });
  },

  setTheme: async (themeId) => {
    await get().setConfig({ themeId });
  },

  resetConfig: async () => {
    await invoke('storage_config_save', {
      config: DEFAULT_TERMINAL_CONFIG,
    });
    set({ config: DEFAULT_TERMINAL_CONFIG });
  },

  loadConfig: async () => {
    set({ isLoading: true });
    try {
      const savedConfig = await invoke<TerminalConfig | null>('storage_config_load');
      if (savedConfig) {
        set({ config: savedConfig });
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  getCurrentTheme: () => {
    const { config } = get();
    return TERMINAL_THEMES[config.themeId] || TERMINAL_THEMES['one-dark'];
  },
}));
