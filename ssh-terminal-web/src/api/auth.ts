import request from '@/utils/request'
import type { ApiResponse, RegisterRequest, RegisterResult, LoginRequest, LoginResult, RefreshRequest, RefreshResult, SendVerifyCodeRequest, SendVerifyCodeResult } from '@/types'

export function register(email: string, password: string, verifyCode?: string): Promise<ApiResponse<RegisterResult>> {
  return request.post('/auth/register', { email, password, verify_code: verifyCode }).then(res => res.data)
}

export function sendVerifyCode(email: string): Promise<ApiResponse<SendVerifyCodeResult>> {
  return request.post('/api/email/send-verify-code-sync', { email }).then(res => res.data)
}

export function login(email: string, password: string): Promise<ApiResponse<LoginResult>> {
  return request.post('/auth/login', { email, password }).then(res => res.data)
}

export function refresh(refreshToken: string): Promise<ApiResponse<RefreshResult>> {
  return request.post('/auth/refresh', { refresh_token: refreshToken }).then(res => res.data)
}

export function deleteAccount(userId: string, password: string): Promise<ApiResponse<void>> {
  return request.post('/auth/delete', { user_id: userId, password }).then(res => res.data)
}

export function deleteRefreshToken(): Promise<ApiResponse<void>> {
  return request.post('/auth/delete-refresh-token').then(res => res.data)
}