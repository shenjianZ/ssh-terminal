/**
 * SFTP 状态管理
 *
 * 使用 Zustand 管理 SFTP 文件管理器状态
 */

import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type {
  SftpFileInfo,
  TransferProgress,
} from '@/types/sftp';

interface SftpStore {
  // 当前活动的连接 ID
  activeConnectionId: string | null;
  setActiveConnection: (id: string | null) => void;

  // 本地面板
  localPath: string;
  setLocalPath: (path: string) => void;
  localFiles: SftpFileInfo[];
  setLocalFiles: (files: SftpFileInfo[]) => void;

  // 远程面板
  remotePath: string;
  setRemotePath: (path: string) => void;
  remoteFiles: SftpFileInfo[];
  setRemoteFiles: (files: SftpFileInfo[]) => void;

  // 文件选择
  selectedLocalFiles: SftpFileInfo[];
  selectedRemoteFiles: SftpFileInfo[];
  setSelectedLocalFiles: (files: SftpFileInfo[]) => void;
  setSelectedRemoteFiles: (files: SftpFileInfo[]) => void;

  // 加载状态
  isLoadingLocal: boolean;
  isLoadingRemote: boolean;
  setIsLoadingLocal: (loading: boolean) => void;
  setIsLoadingRemote: (loading: boolean) => void;

  // 错误状态
  localError: string | null;
  remoteError: string | null;
  setLocalError: (error: string | null) => void;
  setRemoteError: (error: string | null) => void;

  // 传输队列
  transfers: TransferProgress[];
  addTransfer: (transfer: TransferProgress) => void;
  updateTransfer: (id: string, updates: Partial<TransferProgress>) => void;
  removeTransfer: (id: string) => void;
  clearCompleted: () => void;

  // 缓存管理
  cache: Map<string, { files: SftpFileInfo[]; timestamp: number }>;
  getCache: (connectionId: string, path: string) => SftpFileInfo[] | null;
  setCache: (connectionId: string, path: string, files: SftpFileInfo[]) => void;
  clearCache: (connectionId?: string) => void;

  // 初始化方法
  initializeLocalPath: () => Promise<void>;

  // SFTP 操作方法
  listDir: (connectionId: string, path: string) => Promise<SftpFileInfo[]>;
  createDir: (connectionId: string, path: string, recursive?: boolean) => Promise<void>;
  removeFile: (connectionId: string, path: string) => Promise<void>;
  removeDir: (connectionId: string, path: string, recursive?: boolean) => Promise<void>;
  rename: (connectionId: string, oldPath: string, newPath: string) => Promise<void>;
  chmod: (connectionId: string, path: string, mode: number) => Promise<void>;
  readFile: (connectionId: string, path: string) => Promise<number[]>;
  writeFile: (connectionId: string, path: string, content: number[]) => Promise<void>;
  downloadFile: (
    connectionId: string,
    remotePath: string,
    localPath: string
  ) => Promise<string>;
  uploadFile: (
    connectionId: string,
    localPath: string,
    remotePath: string
  ) => Promise<string>;
}

const CACHE_TTL = 30000; // 30秒缓存

export const useSftpStore = create<SftpStore>((set, get) => ({
  // 初始状态
  activeConnectionId: null,
  localPath: 'C:\\', // Windows 默认路径，会在初始化时更新
  remotePath: '/',
  localFiles: [],
  remoteFiles: [],
  selectedLocalFiles: [],
  selectedRemoteFiles: [],
  isLoadingLocal: false,
  isLoadingRemote: false,
  localError: null,
  remoteError: null,
  transfers: [],
  cache: new Map(),

  // 初始化本地路径
  initializeLocalPath: async () => {
    try {
      const homeDir = await invoke<string>('local_home_dir');
      set({ localPath: homeDir });
      console.log('Local home directory initialized:', homeDir);
    } catch (error) {
      console.error('Failed to get home directory:', error);
      // 如果获取失败，保持默认路径
    }
  },

  // 基本操作
  setActiveConnection: (id) => set({ activeConnectionId: id }),

  setLocalPath: (path) => set({ localPath: path }),
  setRemotePath: (path) => set({ remotePath: path }),

  setLocalFiles: (files) => set({ localFiles: files }),
  setRemoteFiles: (files) => set({ remoteFiles: files }),

  setSelectedLocalFiles: (files) => set({ selectedLocalFiles: files }),
  setSelectedRemoteFiles: (files) => set({ selectedRemoteFiles: files }),

  setIsLoadingLocal: (loading) => set({ isLoadingLocal: loading }),
  setIsLoadingRemote: (loading) => set({ isLoadingRemote: loading }),

  setLocalError: (error) => set({ localError: error }),
  setRemoteError: (error) => set({ remoteError: error }),

  // 传输管理
  addTransfer: (transfer) =>
    set((state) => ({
      transfers: [...state.transfers, transfer],
    })),

  updateTransfer: (id, updates) =>
    set((state) => ({
      transfers: state.transfers.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  removeTransfer: (id) =>
    set((state) => ({
      transfers: state.transfers.filter((t) => t.id !== id),
    })),

  clearCompleted: () =>
    set((state) => ({
      transfers: state.transfers.filter(
        (t) => t.status !== 'completed' && t.status !== 'cancelled'
      ),
    })),

  // 缓存管理
  getCache: (connectionId, path) => {
    const key = `${connectionId}:${path}`;
    const cached = get().cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.files;
    }
    return null;
  },

  setCache: (connectionId, path, files) => {
    const key = `${connectionId}:${path}`;
    set((state) => {
      const newCache = new Map(state.cache);
      newCache.set(key, { files, timestamp: Date.now() });
      return { cache: newCache };
    });
  },

  clearCache: (connectionId) =>
    set((state) => {
      const newCache = new Map(state.cache);
      if (connectionId) {
        // 清除特定连接的缓存
        for (const key of newCache.keys()) {
          if (key.startsWith(`${connectionId}:`)) {
            newCache.delete(key);
          }
        }
      } else {
        // 清除所有缓存
        newCache.clear();
      }
      return { cache: newCache };
    }),

  // SFTP 操作方法
  listDir: async (connectionId, path) => {
    // 检查缓存
    const cached = get().getCache(connectionId, path);
    if (cached) {
      return cached;
    }

    try {
      const files: SftpFileInfo[] = await invoke('sftp_list_dir', {
        connectionId,
        path,
      });

      // 缓存结果
      get().setCache(connectionId, path, files);

      return files;
    } catch (error) {
      console.error('Failed to list directory:', error);
      throw error;
    }
  },

  createDir: async (connectionId, path, recursive = false) => {
    try {
      await invoke('sftp_create_dir', {
        connectionId,
        path,
        recursive,
      });

      // 清除缓存
      get().clearCache(connectionId);
    } catch (error) {
      console.error('Failed to create directory:', error);
      throw error;
    }
  },

  removeFile: async (connectionId, path) => {
    try {
      await invoke('sftp_remove_file', {
        connectionId,
        path,
      });

      // 清除缓存
      get().clearCache(connectionId);
    } catch (error) {
      console.error('Failed to remove file:', error);
      throw error;
    }
  },

  removeDir: async (connectionId, path, recursive = false) => {
    try {
      await invoke('sftp_remove_dir', {
        connectionId,
        path,
        recursive,
      });

      // 清除缓存
      get().clearCache(connectionId);
    } catch (error) {
      console.error('Failed to remove directory:', error);
      throw error;
    }
  },

  rename: async (connectionId, oldPath, newPath) => {
    try {
      await invoke('sftp_rename', {
        connectionId,
        oldPath,
        newPath,
      });

      // 清除缓存
      get().clearCache(connectionId);
    } catch (error) {
      console.error('Failed to rename:', error);
      throw error;
    }
  },

  chmod: async (connectionId, path, mode) => {
    try {
      await invoke('sftp_chmod', {
        connectionId,
        path,
        mode,
      });

      // 清除缓存
      get().clearCache(connectionId);
    } catch (error) {
      console.error('Failed to change permissions:', error);
      throw error;
    }
  },

  readFile: async (connectionId, path) => {
    try {
      const data: number[] = await invoke('sftp_read_file', {
        connectionId,
        path,
      });
      return data;
    } catch (error) {
      console.error('Failed to read file:', error);
      throw error;
    }
  },

  writeFile: async (connectionId, path, content) => {
    try {
      await invoke('sftp_write_file', {
        connectionId,
        path,
        content,
      });

      // 清除缓存
      get().clearCache(connectionId);
    } catch (error) {
      console.error('Failed to write file:', error);
      throw error;
    }
  },

  downloadFile: async (connectionId, remotePath, localPath) => {
    try {
      const transferId: string = await invoke('sftp_download_file', {
        connectionId,
        remotePath,
        localPath,
      });

      // 添加到传输队列
      get().addTransfer({
        id: transferId,
        operation: 'download',
        source: { type: 'remote', connection_id: connectionId, path: remotePath },
        destination: { type: 'local', path: localPath },
        file_size: 0,
        transferred: 0,
        speed: 0,
        status: 'pending',
      });

      return transferId;
    } catch (error) {
      console.error('Failed to download file:', error);
      throw error;
    }
  },

  uploadFile: async (connectionId, localPath, remotePath) => {
    try {
      const transferId: string = await invoke('sftp_upload_file', {
        connectionId,
        localPath,
        remotePath,
      });

      // 添加到传输队列
      get().addTransfer({
        id: transferId,
        operation: 'upload',
        source: { type: 'local', path: localPath },
        destination: { type: 'remote', connection_id: connectionId, path: remotePath },
        file_size: 0,
        transferred: 0,
        speed: 0,
        status: 'pending',
      });

      return transferId;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  },
}));
