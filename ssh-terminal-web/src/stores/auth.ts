import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '@/utils'
import type { LoginResult, RegisterResult } from '@/types'
import * as authApi from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: string; email: string } | null>(null)
  const accessToken = ref<string | null>(storage.getAccessToken())
  const refreshToken = ref<string | null>(storage.getRefreshToken())
  const deviceId = ref<string | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!accessToken.value)

  // 设置 Token
  function setTokens(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
    storage.setAccessToken(access)
    storage.setRefreshToken(refresh)
  }

  // 清除 Token
  function clearTokens() {
    const userId = user.value?.id
    if (userId) {
      storage.removeDeviceId(userId)
    }
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    deviceId.value = null
    storage.clearTokens()
  }

  // 注册
  async function register(email: string, password: string) {
    loading.value = true
    try {
      const response = await authApi.register(email, password)
      const data = response.data as RegisterResult
      setTokens(data.access_token, data.refresh_token)
      user.value = { id: data.user_id, email: data.email }
      // 使用服务器返回的 device_id
      deviceId.value = data.device_id
      // 存储 device_id
      storage.setDeviceId(data.user_id, data.device_id)
      return response
    } finally {
      loading.value = false
    }
  }

  // 登录
  async function login(email: string, password: string) {
    loading.value = true
    try {
      const response = await authApi.login(email, password)
      const data = response.data as LoginResult
      setTokens(data.access_token, data.refresh_token)

      // 使用服务器返回的 device_id
      deviceId.value = data.device_id

      // 获取用户信息
      const userApi = await import('@/api/user')
      const profileResponse = await userApi.getProfile()
      const profile = profileResponse.data

      user.value = { id: profile.user_id, email }
      // 存储 device_id
      storage.setDeviceId(profile.user_id, data.device_id)

      return response
    } finally {
      loading.value = false
    }
  }

  // 登出
  async function logout() {
    try {
      await authApi.deleteRefreshToken()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearTokens()
    }
  }

  // 刷新 Token
  async function refreshTokens() {
    if (!refreshToken.value) {
      throw new Error('No refresh token')
    }
    const response = await authApi.refresh(refreshToken.value)
    const data = response.data
    setTokens(data.access_token, data.refresh_token)
    return response
  }

  // 初始化（从 localStorage 恢复）
  async function init() {
    const access = storage.getAccessToken()
    const refresh = storage.getRefreshToken()
    if (access && refresh) {
      accessToken.value = access
      refreshToken.value = refresh

      // 1. 先从 localStorage 快速恢复 user_id 和 deviceId
      // 格式: ssh_terminal:device_id:{user_id} = {device_id}
      const deviceIdKeyPrefix = 'ssh_terminal:device_id:'
      let userId: string | null = null
      let storedDeviceId: string | null = null
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(deviceIdKeyPrefix)) {
          userId = key.substring(deviceIdKeyPrefix.length)
          storedDeviceId = localStorage.getItem(key)
          break
        }
      }

      if (userId && storedDeviceId) {
        user.value = { id: userId, email: '' } // email 通过 API 获取
        deviceId.value = storedDeviceId

        // 2. 调用 API 获取 email
        try {
          const userApi = await import('@/api/user')
          const profileResponse = await userApi.getProfile()
          const profile = profileResponse.data
          user.value = { id: userId, email: profile.email }
        } catch (error) {
          console.error('Failed to fetch user email:', error)
          // email 获取失败不影响核心功能，deviceId 已经恢复
        }
      }
    }
  }

  // 设置用户信息（用于从服务器获取用户信息后调用）
  function setUserInfo(userId: string, email: string, deviceIdParam?: string) {
    user.value = { id: userId, email }
    // 使用传入的 deviceId 或从 storage 恢复
    const targetDeviceId = deviceIdParam || storage.getDeviceId(userId)
    if (targetDeviceId) {
      deviceId.value = targetDeviceId
      storage.setDeviceId(userId, targetDeviceId)
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    deviceId,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
    refreshTokens,
    init,
    setUserInfo,
    deleteAccount: authApi.deleteAccount
  }
})