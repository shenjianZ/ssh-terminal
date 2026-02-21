// 用户资料相关类型
export interface UserProfileResult {
  id: number
  user_id: string
  email: string
  username?: string
  phone?: string
  qq?: string
  wechat?: string
  bio?: string
  avatar_data?: string
  avatar_mime_type?: string
  server_ver: number
  created_at: number
  updated_at: number
}

export interface UpdateProfileRequest {
  username?: string
  phone?: string
  qq?: string
  wechat?: string
  bio?: string
  avatar_data?: string
  avatar_mime_type?: string
}