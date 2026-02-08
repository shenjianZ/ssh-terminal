import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import type { SessionConfig, SessionInfo } from '@/types/ssh';
import { useAIStore } from './aiStore';

// 将前端扁平化的认证配置转换为后端 AuthMethod 枚举格式
function convertAuthMethod(config: SessionConfig) {
  if ('Password' in config.authMethod) {
    return config.authMethod;
  } else {
    return config.authMethod;
  }
}

interface SessionStore {
  sessions: SessionInfo[];
  isStorageLoaded: boolean; // 标记是否已从存储加载
  sessionConfigs: Map<string, SessionConfig>; // 缓存完整的会话配置

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
  getSessionConfig: (id: string) => SessionConfig | undefined; // 获取完整的会话配置
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      isStorageLoaded: false,
      sessionConfigs: new Map(),

      createTemporaryConnection: async (config) => {
        // 快速连接：直接创建临时连接，不保存到后端
        const sessionConfig = {
          name: config.name,
          host: config.host,
          port: config.port,
          username: config.username,
          authMethod: convertAuthMethod(config),
          terminalType: config.terminalType,
          columns: config.columns,
          rows: config.rows,
          strictHostKeyChecking: config.strictHostKeyChecking ?? true,
          group: config.group || '默认分组',
          keepAliveInterval: config.keepAliveInterval ?? 30,
        };

        const connectionId = await invoke<string>('session_create_temp', {
          config: sessionConfig,
        });

        console.log('Created temporary connection:', connectionId);

        // 更新 AI Store 的活跃连接列表
        const aiStore = useAIStore.getState();
        const currentActive = Array.from(aiStore.activeConnections);
        aiStore.updateActiveConnections([...currentActive, connectionId]);

        return connectionId;
      },

      createSession: async (config) => {
        // 创建持久化会话配置
        const sessionConfig = {
          name: config.name,
          host: config.host,
          port: config.port,
          username: config.username,
          authMethod: convertAuthMethod(config),
          terminalType: config.terminalType,
          columns: config.columns,
          rows: config.rows,
          strictHostKeyChecking: config.strictHostKeyChecking ?? true,
          group: config.group || '默认分组',
          keepAliveInterval: config.keepAliveInterval ?? 30,
        };

        // 直接创建并保存到存储
        const sessionId = await invoke<string>('storage_session_create', {
          config: sessionConfig,
        });

        // 同时在内存中创建（用于连接）
        try {
          await invoke('session_create_with_id', {
            id: sessionId,
            config: sessionConfig,
          });
        } catch (error) {
          console.error('Failed to create session in memory:', error);
        }

        // 缓存配置
        set((state) => {
          const newMap = new Map(state.sessionConfigs);
          newMap.set(sessionId, sessionConfig);
          return { sessionConfigs: newMap };
        });

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
        const connectionId = await invoke<string>('session_connect', { sessionId });

        // 重新加载sessions列表，包含新创建的连接实例
        const sessions = await invoke<SessionInfo[]>('session_list');
        set({ sessions });

        // 更新 AI Store 的活跃连接列表
        const aiStore = useAIStore.getState();
        const currentActive = Array.from(aiStore.activeConnections);
        aiStore.updateActiveConnections([...currentActive, connectionId]);

        return connectionId;
      },

      updateSession: async (id, config) => {
        // 直接更新存储中的会话
        await invoke('storage_session_update', {
          sessionId: id,
          updates: {
            name: config.name,
            host: config.host,
            port: config.port,
            username: config.username,
            group: config.group || '默认分组',
            authMethod: config.authMethod,
            terminalType: config.terminalType,
            columns: config.columns,
            rows: config.rows,
            strictHostKeyChecking: config.strictHostKeyChecking ?? true,
            keepAliveInterval: config.keepAliveInterval ?? 30,
          }
        });

        // 同时更新内存中的会话
        try {
          await invoke('session_update', {
            sessionId: id,
            updates: {
              name: config.name,
              host: config.host,
              port: config.port,
              username: config.username,
              group: config.group || '默认分组',
              authMethod: config.authMethod,
              terminalType: config.terminalType,
              columns: config.columns,
              rows: config.rows,
              strictHostKeyChecking: config.strictHostKeyChecking ?? true,
              keepAliveInterval: config.keepAliveInterval ?? 30,
            }
          });
        } catch (error) {
          console.error('Failed to update session in memory:', error);
        }

        // 更新缓存中的配置
        if (config.authMethod) {
          set((state) => {
            const newMap = new Map(state.sessionConfigs);
            const existingConfig = newMap.get(id);
            if (existingConfig) {
              newMap.set(id, {
                ...existingConfig,
                ...config,
              });
            }
            return { sessionConfigs: newMap };
          });
        }

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...config } : s
          ),
        }));
      },

      deleteSession: async (id) => {
        // 直接从存储中删除会话
        await invoke('storage_session_delete', { sessionId: id });

        // 同时从内存中删除
        try {
          await invoke('session_delete', { sessionId: id });
        } catch (error) {
          console.error('Failed to delete session from memory:', error);
        }

        // 从缓存中删除配置
        set((state) => {
          const newMap = new Map(state.sessionConfigs);
          newMap.delete(id);
          return { sessionConfigs: newMap };
        });

        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        }));
      },

      connectSession: async (id) => {
        console.log(`[sessionStore] Connecting to session: ${id}`);
        // 调用后端connect，现在返回connectionId
        const connectionId = await invoke<string>('session_connect', { sessionId: id });
        console.log(`[sessionStore] Created connection: ${connectionId}`);

        // 重新加载sessions列表，包含新创建的连接实例
        const sessions = await invoke<SessionInfo[]>('session_list');
        console.log(`[sessionStore] Loaded sessions:`, sessions);
        set({ sessions });

        // 更新 AI Store 的活跃连接列表
        const aiStore = useAIStore.getState();
        const currentActive = Array.from(aiStore.activeConnections);
        aiStore.updateActiveConnections([...currentActive, connectionId]);

        return connectionId;
      },

      disconnectSession: async (id) => {
        await invoke('session_disconnect', { sessionId: id });

        // 检查是否是临时连接（通过connectionSessionId判断）
        const session = get().sessions.find(s => s.id === id);

        // 如果是临时连接（有connectionSessionId），删除它
        if (session && session.connectionSessionId) {
          await invoke('session_delete', { sessionId: id });
        }

        // 重新加载sessions列表
        const sessions = await invoke<SessionInfo[]>('session_list');
        set({ sessions });

        // 更新 AI Store 的活跃连接列表
        // 注意：这里需要找到对应的 connectionId 并移除
        // 暂时简化处理，直接重新加载所有活跃连接
        const activeConnectionIds = sessions
          .filter(s => s.status === 'connected')
          .map(s => s.connectionId)
          .filter((id): id is string => id !== undefined);

        const aiStore = useAIStore.getState();
        aiStore.updateActiveConnections(activeConnectionIds);
      },

      loadSessions: async () => {
        try {
          const sessions = await invoke<SessionInfo[]>('session_list');
          set({ sessions });

          // 初始化 AI Store 的活跃连接列表
          const activeConnectionIds = sessions
            .filter(s => s.status === 'connected')
            .map(s => s.connectionId)
            .filter((id): id is string => id !== undefined);

          const aiStore = useAIStore.getState();
          aiStore.updateActiveConnections(activeConnectionIds);
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
          const existingSessions = await invoke<SessionInfo[]>('session_list');
          console.log('[sessionStore] Existing sessions from backend:', existingSessions.length);

          // 2. 从存储加载配置及其ID
          const sessionConfigs = await invoke<[string, SessionConfig][]>('storage_sessions_load');
          console.log('[sessionStore] Loaded session configs from storage:', sessionConfigs.length);

          // 3. 缓存所有会话配置到 Map
          const configMap = new Map<string, SessionConfig>();
          for (const [id, config] of sessionConfigs) {
            configMap.set(id, config);
          }
          set({ sessionConfigs: configMap });

          if (sessionConfigs.length === 0) {
            console.log('[sessionStore] No session configs in storage, skipping creation');
            // 重新加载会话列表
            const sessions = await invoke<SessionInfo[]>('session_list');
            set({ sessions });
            return;
          }

          // 4. 为每个配置创建session（使用保存的ID）
          let createdCount = 0;
          let skippedCount = 0;
          for (const [id, config] of sessionConfigs) {
            // 检查是否已存在（通过ID匹配）
            const alreadyExists = existingSessions.some(s => s.id === id);

            if (!alreadyExists) {
              try {
                // 使用保存的ID创建session
                await invoke('session_create_with_id', {
                  id: id,
                  config: config,
                });
                createdCount++;
                console.log(`[sessionStore] Created new session with saved ID: ${id} (${config.name})`);
              } catch (error) {
                console.log(`[sessionStore] Failed to create session ${config.name}:`, error);
              }
            } else {
              skippedCount++;
              console.log(`[sessionStore] Session already exists, skipping creation: ${id} (${config.name})`);
            }
          }

          console.log(`[sessionStore] Session creation summary: ${createdCount} created, ${skippedCount} skipped`);

          // 5. 重新加载会话列表
          const sessions = await invoke<SessionInfo[]>('session_list');
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
          await invoke('storage_sessions_save');
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

      getSessionConfig: (id: string) => {
        return get().sessionConfigs.get(id);
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
