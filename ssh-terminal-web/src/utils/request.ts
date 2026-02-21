import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { storage } from './storage'
import type { ApiResponse } from '@/types'

// API 基础 URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 添加 Access Token 到请求头
    const token = storage.getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // 处理 401 错误（Token 过期）
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = storage.getRefreshToken()
        if (!refreshToken) {
          // 没有 Refresh Token，跳转登录页
          storage.clearTokens()
          window.location.href = '/login'
          return Promise.reject(error)
        }

        // 刷新 Token
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken
        })

        const { access_token, refresh_token } = response.data.data

        // 更新 Token
        storage.setAccessToken(access_token)
        storage.setRefreshToken(refresh_token)

        // 重试原请求
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`
        }
        return request(originalRequest)
      } catch (refreshError) {
        // 刷新失败，清除 Token 并跳转登录页
        storage.clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // 返回错误信息
    const errorMessage = error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(errorMessage))
  }
)

export default request