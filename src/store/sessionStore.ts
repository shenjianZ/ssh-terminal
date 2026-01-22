import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import type { SessionConfig, SessionInfo } from '@/types/ssh';

// 将前端扁平化的认证配置转换为后端 AuthMethod 枚举格式
function convertAuthMethod(config: SessionConfig) {
  if ('Password' in config.auth_method) {
    return config.auth_method;
  } else {
    return config.auth_method;
  }
}

interface SessionStore {
  sessions: SessionInfo[];
  isStorageLoaded: boolean; // 标记是否已从存储加载

  // 操作
  createTemporaryConnection: (config: SessionConfig) => Promise<string>; // 快速连接，不保存
  createSession: (config: SessionConfig) => Promise<string>; // 创建持久化会话
  createConnection: (sessionId: string) => Promise<string>; // 基于现有会话创建新连接实例
  updateSession: (id: string, config: Partial<SessionConfig>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  connectSession: (id: string) => Promise<string>; // 现在返回connectionId
  disconnectSession: (id: string) => Promise<void>;
  loadSessions: () => Promise<void>;
  loadSessionsFromStorage: () => Promise<void>;
  saveSessions: () => Promise<void>;

  // 查询
  getSession: (id: string) => SessionInfo | undefined;
  getActiveSession: () => SessionInfo | undefined;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      isStorageLoaded: false,

      createTemporaryConnection: async (config) => {
        // 快速连接：直接创建临时连接，不保存到后端
        const sessionConfig = {
          name: config.name,
          host: config.host,
          port: config.port,
          username: config.username,
          auth_method: convertAuthMethod(config),
          terminal_type: config.terminal_type,
          columns: config.columns,
          rows: config.rows,
          strict_host_key_checking: config.strict_host_key_checking ?? true,
          group: config.group || '默认分组',
          keep_alive_interval: config.keepAliveInterval ?? 30,
        };

        const connectionId = await invoke<string>('ssh_create_temporary_connection', {
          config: sessionConfig,
        });

        console.log('Created temporary connection:', connectionId);

        return connectionId;
      },

      createSession: async (config) => {
        // 创建持久化会话配置
        const sessionConfig = {
          name: config.name,
          host: config.host,
          port: config.port,
          username: config.username,
          auth_method: convertAuthMethod(config),
          terminal_type: config.terminal_type,
          columns: config.columns,
          rows: config.rows,
          strict_host_key_checking: config.strict_host_key_checking ?? true,
          group: config.group || '默认分组',
          keep_alive_interval: config.keepAliveInterval ?? 30,
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
          group: config.group || '默认分组',
        };

        set((state) => ({
          sessions: [...state.sessions, newSession],
        }));

        return sessionId;
      },

      createConnection: async (sessionId) => {
        // 直接调用connect_session创建新的连接实例
        const connectionId = await invoke<string>('ssh_connect', { sessionId });

        // 重新加载sessions列表，包含新创建的连接实例
        const sessions = await invoke<SessionInfo[]>('ssh_list_sessions');
        set({ sessions });

        return connectionId;
      },

      updateSession: async (id, config) => {
        // 更新会话配置
        await invoke('ssh_update_session', {
          sessionId: id,
          updates: {
            name: config.name,
            host: config.host,
            port: config.port,
            username: config.username,
            group: config.group || '默认分组',
            auth_method: config.auth_method,
            terminal_type: config.terminal_type,
            columns: config.columns,
            rows: config.rows,
            strict_host_key_checking: config.strict_host_key_checking ?? true,
            keep_alive_interval: config.keepAliveInterval ?? 30,
          }
        });

        // 保存到持久化存储
        try {
          await invoke('storage_save_sessions');
        } catch (error) {
          console.error('Failed to save sessions to storage:', error);
        }

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
        }));
      },

      connectSession: async (id) => {
        console.log(`[sessionStore] Connecting to session: ${id}`);
        // 调用后端connect，现在返回connectionId
        const connectionId = await invoke<string>('ssh_connect', { sessionId: id });
        console.log(`[sessionStore] Created connection: ${connectionId}`);

        // 重新加载sessions列表，包含新创建的连接实例
        const sessions = await invoke<SessionInfo[]>('ssh_list_sessions');
        console.log(`[sessionStore] Loaded sessions:`, sessions);
        set({ sessions });

        return connectionId;
      },

      disconnectSession: async (id) => {
        await invoke('ssh_disconnect', { sessionId: id });

        // 检查是否是临时连接（通过connectionSessionId判断）
        const session = get().sessions.find(s => s.id === id);

        // 如果是临时连接（有connectionSessionId），删除它
        if (session && session.connectionSessionId) {
          await invoke('ssh_delete_session', { sessionId: id });
        }

        // 重新加载sessions列表
        const sessions = await invoke<SessionInfo[]>('ssh_list_sessions');
        set({ sessions });
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
        // 防止重复加载
        if (get().isStorageLoaded) {
          console.log('[sessionStore] Storage already loaded, skipping...');
          return;
        }

        console.log('[sessionStore] Starting to load sessions from storage...');
        // 立即标记为已加载（防止并发调用）
        set({ isStorageLoaded: true });

        try {
          // 1. 先从后端加载所有已存在的会话
          const existingSessions = await invoke<SessionInfo[]>('ssh_list_sessions');
          console.log('[sessionStore] Existing sessions from backend:', existingSessions.length);

          // 2. 从存储加载配置
          const sessionConfigs = await invoke<SessionConfig[]>('storage_load_sessions');
          console.log('[sessionStore] Loaded session configs from storage:', sessionConfigs.length);

          if (sessionConfigs.length === 0) {
            console.log('[sessionStore] No session configs in storage, skipping creation');
            // 重新加载会话列表
            const sessions = await invoke<SessionInfo[]>('ssh_list_sessions');
            set({ sessions });
            return;
          }

          // 3. 为每个配置创建session（只创建不存在的）
          let createdCount = 0;
          let skippedCount = 0;
          for (const config of sessionConfigs) {
            // 检查是否已存在（通过 name, host, port, username 匹配）
            const alreadyExists = existingSessions.some(s =>
              s.name === config.name &&
              s.host === config.host &&
              s.port === config.port &&
              s.username === config.username &&
              !s.connectionSessionId // 只匹配会话配置，不包括连接实例
            );

            if (!alreadyExists) {
              try {
                await invoke('ssh_create_session', {
                  config: config,
                });
                createdCount++;
                console.log(`[sessionStore] Created new session: ${config.name}`);
              } catch (error) {
                console.log(`[sessionStore] Failed to create session ${config.name}:`, error);
              }
            } else {
              skippedCount++;
              console.log(`[sessionStore] Session already exists, skipping creation: ${config.name}`);
            }
          }

          console.log(`[sessionStore] Session creation summary: ${createdCount} created, ${skippedCount} skipped`);

          // 4. 重新加载会话列表
          const sessions = await invoke<SessionInfo[]>('ssh_list_sessions');
          set({ sessions });
          console.log('[sessionStore] Final loaded sessions:', sessions.length);
        } catch (error) {
          console.error('[sessionStore] Failed to load sessions from storage:', error);
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
        const { sessions } = get();
        // 返回第一个已连接的会话，如果没有则返回undefined
        return sessions.find((s) => s.status === 'connected');
      },
    }),
    {
      name: 'ssh-sessions-storage',
      partialize: () => ({
        // 不持久化任何字段，sessions 应该始终从后端获取
      }),
    }
  )
);
