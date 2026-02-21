import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import type { SessionConfig, SessionInfo } from '@/types/ssh';
import { useAIStore } from './aiStore';

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
  reloadSessions: () => Promise<void>; // 强制重新加载会话和配置缓存
  saveSessions: () => Promise<void>;
  clearSessions: () => void; // 清除所有会话数据

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
          authMethod: config.authMethod,
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
        // 使用数据库命令创建持久化会话
        const sessionConfig = {
          name: config.name,
          host: config.host,
          port: config.port,
          username: config.username,
          authMethod: config.authMethod,
          terminalType: config.terminalType,
          columns: config.columns,
          rows: config.rows,
          strictHostKeyChecking: config.strictHostKeyChecking ?? true,
          group: config.group || '默认分组',
          keepAliveInterval: config.keepAliveInterval ?? 30,
        };

        console.log('[sessionStore] Creating session with config:', sessionConfig);

        // 调用数据库命令创建session
        const sessionId = await invoke<string>('db_ssh_session_create', {
          config: sessionConfig,
        });

        console.log('[sessionStore] Session created with ID:', sessionId);

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
        const startTime = performance.now();

        // 优先使用缓存的 session 配置
        const sessionConfig = get().sessionConfigs.get(sessionId);

        if (!sessionConfig) {
          console.warn(`[sessionStore] ⚠️  Cache miss, loading from database: ${sessionId}`);
          const sessionData = await invoke<any>('db_ssh_session_get_by_id', { sessionId });
          if (!sessionData) {
            throw new Error(`Session not found: ${sessionId}`);
          }

          // 转换为 session 配置格式
          const config = {
            id: sessionId,
            name: sessionData.name,
            host: sessionData.host,
            port: sessionData.port,
            username: sessionData.username,
            authMethod: sessionData.authMethod,
            terminalType: sessionData.terminalType,
            columns: sessionData.columns,
            rows: sessionData.rows,
            strictHostKeyChecking: sessionData.strictHostKeyChecking ?? true,
            group: sessionData.groupName,
            keepAliveInterval: sessionData.keepAliveInterval ?? 30,
          };

          // 缓存配置
          set((state) => {
            const newMap = new Map(state.sessionConfigs);
            newMap.set(sessionId, config);
            return { sessionConfigs: newMap };
          });

          await invoke('session_create_with_id', {
            id: sessionId,
            config: config,
          });
        } else {
          console.log(`[sessionStore] ✅ Cache hit: ${sessionConfig.name} (${sessionConfig.username}@${sessionConfig.host}:${sessionConfig.port})`);

          await invoke('session_create_with_id', {
            id: sessionId,
            config: sessionConfig,
          });
        }

        const connectionId = await invoke<string>('session_connect', { sessionId });

        // 重新加载sessions列表
        await get().loadSessions();

        // 更新 AI Store 的活跃连接列表
        const aiStore = useAIStore.getState();
        const currentActive = Array.from(aiStore.activeConnections);
        aiStore.updateActiveConnections([...currentActive, connectionId]);

        const totalTime = performance.now() - startTime;
        console.log(`[sessionStore] ✅ createConnection complete in ${totalTime.toFixed(0)}ms`);

        return connectionId;
      },

      updateSession: async (id, config) => {
        // 使用数据库命令更新会话
        const updates: any = {};
        if (config.name !== undefined) updates.name = config.name;
        if (config.host !== undefined) updates.host = config.host;
        if (config.port !== undefined) updates.port = config.port;
        if (config.username !== undefined) updates.username = config.username;
        if (config.group !== undefined) updates.group = config.group || '默认分组';
        if (config.authMethod !== undefined) updates.authMethod = config.authMethod;
        if (config.terminalType !== undefined) updates.terminalType = config.terminalType;
        if (config.columns !== undefined) updates.columns = config.columns;
        if (config.rows !== undefined) updates.rows = config.rows;
        if (config.strictHostKeyChecking !== undefined) updates.strictHostKeyChecking = config.strictHostKeyChecking;
        if (config.keepAliveInterval !== undefined) updates.keepAliveInterval = config.keepAliveInterval;

        await invoke('db_ssh_session_update', {
          sessionId: id,
          updates,
        });

        console.log('[sessionStore] Session updated:', id);

        // 更新缓存中的配置
        if (config.authMethod || config.name || config.host || config.port || config.username) {
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
        // 使用数据库命令删除会话
        await invoke('db_ssh_session_delete', { sessionId: id });

        console.log('[sessionStore] Session deleted:', id);

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
        const startTime = performance.now();

        // 确保 session 配置在内存中
        const sessionConfig = get().sessionConfigs.get(id);

        if (sessionConfig) {
          console.log(`[sessionStore] ✅ Cache hit: ${sessionConfig.name}`);
          await invoke('session_create_with_id', {
            id: id,
            config: sessionConfig,
          });
        }

        const connectionId = await invoke<string>('session_connect', { sessionId: id });

        // 重新加载sessions列表，包含新创建的连接实例
        await get().loadSessions();

        // 更新 AI Store 的活跃连接列表
        const aiStore = useAIStore.getState();
        const currentActive = Array.from(aiStore.activeConnections);
        aiStore.updateActiveConnections([...currentActive, connectionId]);

        const totalTime = performance.now() - startTime;
        console.log(`[sessionStore] ✅ connectSession complete in ${totalTime.toFixed(0)}ms`);

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

        // 重新加载sessions列表（包含内存和数据库会话）
        await get().loadSessions();

        // 更新 AI Store 的活跃连接列表
        const activeConnectionIds = get().sessions
          .filter(s => s.status === 'connected')
          .map(s => s.connectionId)
          .filter((id): id is string => id !== undefined);

        const aiStore = useAIStore.getState();
        aiStore.updateActiveConnections(activeConnectionIds);
      },

      loadSessions: async () => {
        try {
          // 合并内存会话和数据库会话
          const memorySessions = await invoke<SessionInfo[]>('session_list');
          const dbSessions = await invoke<any[]>('db_ssh_session_list');

          // 转换数据库会话为 SessionInfo 格式
          const dbSessionInfos: SessionInfo[] = dbSessions.map((s: any) => ({
            id: s.id,
            name: s.name,
            host: s.host,
            port: s.port,
            username: s.username,
            status: 'disconnected',
            group: s.groupName,
          }));

          // 合并会话：内存会话（优先）+ 数据库会话配置（没有内存实例的）
          const memoryIds = new Set(memorySessions.map(s => s.id));
          const mergedSessions = [
            ...memorySessions,
            ...dbSessionInfos.filter(db => !memoryIds.has(db.id))
          ];

          set({ sessions: mergedSessions });

          // 初始化 AI Store 的活跃连接列表
          const activeConnectionIds = mergedSessions
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

        console.log('[sessionStore] Starting to load sessions from database...');
        // 立即标记为已加载（防止并发调用）
        set({ isStorageLoaded: true });

        try {
          // 1. 从数据库加载所有会话
          const dbSessions = await invoke<any[]>('db_ssh_session_list');
          console.log('[sessionStore] Loaded sessions from database:', dbSessions.length);

          // 转换为SessionInfo格式
          const sessionInfos: SessionInfo[] = dbSessions.map((s: any) => ({
            id: s.id,
            name: s.name,
            host: s.host,
            port: s.port,
            username: s.username,
            status: 'disconnected',
            group: s.groupName,
          }));

          // 2. 缓存会话配置
          const configMap = new Map<string, SessionConfig>();
          for (const dbSession of dbSessions) {
            // 获取完整的session配置（包含认证信息）
            try {
              const fullConfig = await invoke<any>('db_ssh_session_get_by_id', { sessionId: dbSession.id });
              if (fullConfig) {
                configMap.set(dbSession.id, {
                  id: dbSession.id,
                  name: fullConfig.name,
                  host: fullConfig.host,
                  port: fullConfig.port,
                  username: fullConfig.username,
                  authMethod: fullConfig.authMethod,
                  terminalType: fullConfig.terminalType,
                  columns: fullConfig.columns,
                  rows: fullConfig.rows,
                  strictHostKeyChecking: fullConfig.strictHostKeyChecking ?? true,
                  group: fullConfig.groupName,
                  keepAliveInterval: fullConfig.keepAliveInterval ?? 30,
                });
              }
            } catch (error) {
              console.error(`[sessionStore] Failed to load config for session ${dbSession.id}:`, error);
            }
          }
          set({ sessionConfigs: configMap, sessions: sessionInfos });

          console.log('[sessionStore] Final loaded sessions:', sessionInfos.length);
        } catch (error) {
          console.error('[sessionStore] Failed to load sessions from database:', error);
          // 如果加载失败，重置标志，允许重试
          set({ isStorageLoaded: false });
        }
      },

      saveSessions: async () => {
        // 数据库会话会自动保存，无需手动保存
        console.log('[sessionStore] saveSessions is a no-op for database sessions');
      },

      reloadSessions: async () => {
        // 强制重新加载会话和配置缓存（忽略 isStorageLoaded 标志）
        console.log('[sessionStore] Force reloading sessions from database...');

        try {
          // 1. 从数据库加载所有会话
          const dbSessions = await invoke<any[]>('db_ssh_session_list');
          console.log('[sessionStore] Reloaded sessions from database:', dbSessions.length);

          // 转换为SessionInfo格式
          const sessionInfos: SessionInfo[] = dbSessions.map((s: any) => ({
            id: s.id,
            name: s.name,
            host: s.host,
            port: s.port,
            username: s.username,
            status: 'disconnected',
            group: s.groupName,
          }));

          // 2. 重新缓存会话配置
          const configMap = new Map<string, SessionConfig>();
          for (const dbSession of dbSessions) {
            // 获取完整的session配置（包含认证信息）
            try {
              const fullConfig = await invoke<any>('db_ssh_session_get_by_id', { sessionId: dbSession.id });
              if (fullConfig) {
                configMap.set(dbSession.id, {
                  id: dbSession.id,
                  name: fullConfig.name,
                  host: fullConfig.host,
                  port: fullConfig.port,
                  username: fullConfig.username,
                  authMethod: fullConfig.authMethod,
                  terminalType: fullConfig.terminalType,
                  columns: fullConfig.columns,
                  rows: fullConfig.rows,
                  strictHostKeyChecking: fullConfig.strictHostKeyChecking ?? true,
                  group: fullConfig.groupName,
                  keepAliveInterval: fullConfig.keepAliveInterval ?? 30,
                });
              }
            } catch (error) {
              console.error(`[sessionStore] Failed to reload config for session ${dbSession.id}:`, error);
            }
          }
          set({ sessionConfigs: configMap, sessions: sessionInfos, isStorageLoaded: true });

          console.log('[sessionStore] Reload completed:', sessionInfos.length);
        } catch (error) {
          console.error('[sessionStore] Failed to reload sessions:', error);
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

      clearSessions: () => {
        set({ sessions: [], sessionConfigs: new Map(), isStorageLoaded: false });
        console.log('[sessionStore] Sessions cleared');
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
