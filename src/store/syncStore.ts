import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import type { SyncStatus, SyncReport, ConflictInfo, ConflictStrategy } from '@/types/sync';

interface SyncState {
  lastSyncAt: number | null;
  pendingCount: number;
  conflictCount: number;
  conflicts: ConflictInfo[];
  isSyncing: boolean;
  isResolving: boolean;
  error: string | null;

  // Actions
  syncNow: () => Promise<void>;
  getStatus: () => Promise<void>;
  resolveConflict: (conflictId: string, strategy: ConflictStrategy) => Promise<void>;
  clearError: () => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  lastSyncAt: null,
  pendingCount: 0,
  conflictCount: 0,
  conflicts: [],
  isSyncing: false,
  isResolving: false,
  error: null,

  syncNow: async () => {
    set({ isSyncing: true, error: null });
    try {
      const report = await invoke<SyncReport>('sync_now');

      set({
        lastSyncAt: report.lastSyncAt,
        pendingCount: 0, // 同步完成后清零
        conflictCount: report.conflictCount,
        error: report.error || null,
      });

      // 根据是否有冲突显示不同的提示
      if (report.conflictCount > 0 && report.message) {
        // 有冲突：显示冲突消息
        toast.warning('同步冲突', {
          description: report.message,
          duration: 5000,
        });
      } else if (report.message) {
        // 无冲突：显示成功消息
        toast.success('同步成功', {
          description: report.message,
          duration: 3000,
        });
      }
    } catch (error) {
      const errorMessage = error as string;
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isSyncing: false });
    }
  },
  getStatus: async () => {
    try {
      const status = await invoke<SyncStatus>('sync_get_status');
      set(status);
    } catch (error) {
      console.error('Failed to get sync status:', error);
    }
  },

  resolveConflict: async (conflictId: string, strategy: ConflictStrategy) => {
    set({ isResolving: true, error: null });
    try {
      const report = await invoke<SyncReport>('sync_resolve_conflict', { conflictId, strategy });

      set({
        lastSyncAt: report.lastSyncAt,
        conflictCount: report.conflictCount,
        // 从 conflicts 中移除已解决的冲突
        conflicts: get().conflicts.filter(c => c.id !== conflictId),
        error: null,
      });
    } catch (error) {
      const errorMessage = error as string;
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isResolving: false });
    }
  },

  clearError: () => set({ error: null }),
}));
