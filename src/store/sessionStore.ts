import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import type { SessionConfig, SessionInfo } from '@/types/ssh';

// 将前端扁平化的认证配置转换为后端 AuthMethod 枚举格式
function convertAuthMethod(config: SessionConfig) {
  if (config.auth_method === 'password') {
    return {
      Password: {
        password: config.password || '',
      },
    };
  } else {
    return {
      PublicKey: {
        private_key_path: config.privateKeyPath || '',
        passphrase: config.passphrase,
      },
    };
  }
}

interface SessionStore {
  sessions: SessionInfo[];
  activeSessionId: string | null;
  isStorageLoaded: boolean; // 标记是否已从存储加载

  // 操作
  addSession: (config: SessionConfig) => Promise<string>;
  createSession: (config: SessionConfig) => Promise<string>;
  updateSession: (id: string, config: Partial<SessionConfig>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  connectSession: (id: string) => Promise<void>;
  disconnectSession: (id: string) => Promise<void>;
  loadSessions: () => Promise<void>;
  loadSessionsFromStorage: () => Promise<void>;
  saveSessions: () => Promise<void>;

  // 查询
  getSession: (id: string) => SessionInfo | undefined;
  getActiveSession: () => SessionInfo | undefined;
  setActiveSession: (id: string) => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      isStorageLoaded: false,

      addSession: async (config) => {
        // 创建会话配置（persist=false 表示临时连接，不保存）
        const sessionConfig = {
          name: config.name,
          host: config.host,
          port: config.port,
          username: config.username,
          auth_method: convertAuthMethod(config),
          terminal_type: config.terminal_type,
          columns: config.columns,
          rows: config.rows,
          persist: false, // 标记为临时连接，不持久化
        };

        const sessionId = await invoke<string>('ssh_create_session', {
          config: sessionConfig,
        });

        console.log('addSession: Created session with ID:', sessionId);
        console.log('addSession: Config:', config);

        // 创建新的会话对象
        const newSession: SessionInfo = {
          id: sessionId,
          name: config.name,
          host: config.host,
          port: config.port,
          username: config.username,
          status: 'disconnected',
        };

        set((state) => {
          const updatedSessions = [...state.sessions, newSession];
          console.log('addSession: Updated sessions array:', updatedSessions);
          return {
            sessions: updatedSessions,
          };
        });

        console.log('addSession: Returning sessionId:', sessionId);
        return sessionId;
      },

      createSession: async (config) => {
        // 保存会话配置到存储（persist=true 表示需要持久化）
        const sessionConfig = {
          name: config.name,
          host: config.host,
          port: config.port,
          username: config.username,
          auth_method: convertAuthMethod(config),
          terminal_type: config.terminal_type,
          columns: config.columns,
          rows: config.rows,
          persist: true, // 标记为需要持久化保存
        };

        const sessionId = await invoke<string>('ssh_create_session', {
          config: sessionConfig,
        });

        // 保存到持久化存储
        try {
          await invoke('storage_save_sessions');
        } catch (error) {
          console.error('Failed to save sessions to storage:', error);
        }

        // 创建新的会话对象
        const newSession: SessionInfo = {
          id: sessionId,
          name: config.name,
          host: config.host,
          port: config.port,
          username: config.username,
          status: 'disconnected',
        };

        set((state) => ({
          sessions: [...state.sessions, newSession],
        }));

        return sessionId;
      },

      updateSession: async (id, config) => {
        // TODO: 实现更新会话配置
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...config } : s
          ),
        }));
      },

      deleteSession: async (id) => {
        await invoke('ssh_delete_session', { sessionId: id });
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
        }));
      },

      connectSession: async (id) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, status: 'connecting' } : s
          ),
        }));

        try {
          await invoke('ssh_connect', { sessionId: id });
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === id
                ? { ...s, status: 'connected', connectedAt: new Date().toISOString() }
                : s
            ),
          }));
        } catch (error) {
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === id
                ? { ...s, status: 'error', error: String(error) }
                : s
            ),
          }));
          throw error;
        }
      },

      disconnectSession: async (id) => {
        await invoke('ssh_disconnect', { sessionId: id });
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id
              ? { ...s, status: 'disconnected', connectedAt: undefined }
              : s
          ),
        }));
      },

      loadSessions: async () => {
        try {
          const sessions = await invoke<SessionInfo[]>('ssh_list_sessions');
          set({ sessions });
        } catch (error) {
          console.error('Failed to load sessions:', error);
        }
      },

      loadSessionsFromStorage: async () => {
        // 防止重复加载 - 立即设置标志
        if (get().isStorageLoaded) {
          console.log('Storage already loaded, skipping...');
          return;
        }

        // 立即标记为已加载，防止竞态条件
        set({ isStorageLoaded: true });

        try {
          // 1. 先检查后端是否已有会话
          const existingSessions = await invoke<SessionInfo[]>('ssh_list_sessions');
          console.log('Existing sessions in backend:', existingSessions.length);

          // 如果后端已有会话，直接使用，不从存储创建
          if (existingSessions.length > 0) {
            console.log('Backend has sessions, using existing sessions');
            set({ sessions: existingSessions });
            return;
          }

          // 2. 后端没有会话，从存储加载配置并创建
          console.log('Backend is empty, loading from storage...');
          const sessionConfigs = await invoke<SessionConfig[]>('storage_load_sessions');
          console.log('Loaded session configs from storage:', sessionConfigs.length);

          if (sessionConfigs.length === 0) {
            console.log('No saved sessions in storage');
            return;
          }

          // 3. 为每个配置创建会话实例
          for (const config of sessionConfigs) {
            try {
              await invoke<string>('ssh_create_session', {
                config: {
                  name: config.name,
                  host: config.host,
                  port: config.port,
                  username: config.username,
                  auth_method: config.auth_method,
                  terminal_type: config.terminal_type,
                  columns: config.columns,
                  rows: config.rows,
                  persist: true, // 从存储加载的会话都是持久化的
                },
              });
            } catch (error) {
              console.error(`Failed to create session for ${config.name}:`, error);
            }
          }

          // 4. 重新加载会话列表
          const sessions = await invoke<SessionInfo[]>('ssh_list_sessions');
          set({ sessions });
          console.log('Created and loaded sessions:', sessions);
        } catch (error) {
          console.error('Failed to load sessions from storage:', error);
          // 如果加载失败，重置标志，允许重试
          set({ isStorageLoaded: false });
        }
      },

      saveSessions: async () => {
        try {
          await invoke('storage_save_sessions');
        } catch (error) {
          console.error('Failed to save sessions:', error);
          throw error;
        }
      },

      getSession: (id) => {
        return get().sessions.find((s) => s.id === id);
      },

      getActiveSession: () => {
        const { activeSessionId, sessions } = get();
        return activeSessionId ? sessions.find((s) => s.id === activeSessionId) : undefined;
      },

      setActiveSession: (id) => {
        set({ activeSessionId: id });
      },
    }),
    {
      name: 'ssh-sessions-storage',
      partialize: (state) => ({
        // 只持久化 activeSessionId，不持久化 sessions
        // sessions 应该始终从后端获取
        activeSessionId: state.activeSessionId,
      }),
    }
  )
);
