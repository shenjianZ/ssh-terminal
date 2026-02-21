import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { UserProfile, UpdateProfileRequest } from '@/types/userProfile';

interface UserProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  loadProfile: () => Promise<void>;
  updateProfile: (req: UpdateProfileRequest) => Promise<UserProfile>;
  syncProfile: () => Promise<UserProfile>;
  clearProfile: () => void; // 清除用户资料
  clearError: () => void;
}

export const useUserProfileStore = create<UserProfileState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  loadProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await invoke<UserProfile>('user_profile_get');
      set({ profile, isLoading: false });
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error : '获取资料失败';
      console.error('[userProfileStore] 获取资料失败:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateProfile: async (req) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await invoke<UserProfile>('user_profile_update', { req });
      set({ profile, isLoading: false });
      return profile;
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error : '更新资料失败';
      console.error('[userProfileStore] 更新资料失败:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  syncProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await invoke<UserProfile>('user_profile_sync');
      set({ profile, isLoading: false });
      return profile;
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error : '同步资料失败';
      console.error('[userProfileStore] 同步资料失败:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  clearProfile: () => set({ profile: null }),
}));
