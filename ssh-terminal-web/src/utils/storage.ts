// 本地存储工具
const PREFIX = 'ssh_terminal:'
const ACCESS_TOKEN_KEY = `${PREFIX}access_token`
const REFRESH_TOKEN_KEY = `${PREFIX}refresh_token`
const DEVICE_ID_PREFIX = `${PREFIX}device_id:`

export const storage = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  },

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },

  // 获取当前用户的 device_id
  getDeviceId(userId: string | null): string | null {
    if (!userId) return null
    return localStorage.getItem(`${DEVICE_ID_PREFIX}${userId}`)
  },

  // 设置当前用户的 device_id
  setDeviceId(userId: string, deviceId: string): void {
    localStorage.setItem(`${DEVICE_ID_PREFIX}${userId}`, deviceId)
  },

  // 删除当前用户的 device_id
  removeDeviceId(userId: string): void {
    localStorage.removeItem(`${DEVICE_ID_PREFIX}${userId}`)
  },

  // 清除所有数据
  clearAll(): void {
    localStorage.clear()
  }
}