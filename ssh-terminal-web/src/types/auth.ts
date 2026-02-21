// 认证相关类型
export interface RegisterRequest {
  email: string
  password: string
}

export interface RegisterResult {
  user_id: string
  email: string
  created_at: string
  device_id: string
  access_token: string
  refresh_token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResult {
  device_id: string
  access_token: string
  refresh_token: string
}

export interface RefreshRequest {
  refresh_token: string
}

export interface RefreshResult {
  access_token: string
  refresh_token: string
}

export interface DeleteUserRequest {
  user_id: string
  password: string
}