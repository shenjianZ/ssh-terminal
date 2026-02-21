import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserProfileResult, UpdateProfileRequest } from '@/types'
import * as userApi from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfileResult | null>(null)
  const loading = ref(false)

  // 获取用户资料
  async function fetchProfile() {
    loading.value = true
    try {
      const response = await userApi.getProfile()
      profile.value = response.data
      // 同时更新 authStore 中的用户信息
      const { useAuthStore } = await import('./auth')
      const authStore = useAuthStore()
      if (authStore.user) {
        // 更新 user_id 和 email
        authStore.user.id = response.data.user_id
        authStore.user.email = response.data.email
      } else {
        // 如果 authStore.user 不存在，创建新的
        authStore.setUserInfo(response.data.user_id, response.data.email, response.data.email)
      }
      return response
    } finally {
      loading.value = false
    }
  }

  // 更新用户资料
  async function updateProfile(data: UpdateProfileRequest) {
    loading.value = true
    try {
      const response = await userApi.updateProfile(data)
      profile.value = response.data
      return response
    } finally {
      loading.value = false
    }
  }

  // 删除用户资料
  async function deleteProfile() {
    loading.value = true
    try {
      const response = await userApi.deleteProfile()
      profile.value = null
      return response
    } finally {
      loading.value = false
    }
  }

  return {
    profile,
    loading,
    fetchProfile,
    updateProfile,
    deleteProfile
  }
})