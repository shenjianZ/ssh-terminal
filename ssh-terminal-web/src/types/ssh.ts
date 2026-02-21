// SSH 会话相关类型
export interface SshSessionVO {
  id: string
  user_id: string
  name: string
  host: string
  port: number
  username: string
  group_name?: string
  terminal_type?: string
  columns?: number
  rows?: number
  auth_method_encrypted: string
  auth_nonce: string
  auth_key_salt?: string
  server_ver: number
  client_ver: number
  last_synced_at?: number
  created_at: number
  updated_at: number
  deleted_at?: number
}

export interface CreateSshSessionRequest {
  name: string
  host: string
  port: number
  username: string
  group_name?: string
  terminal_type?: string
  columns?: number
  rows?: number
  auth_method_encrypted: string
  auth_nonce: string
  auth_key_salt?: string
}

export interface UpdateSshSessionRequest {
  name?: string
  host?: string
  port?: number
  username?: string
  group_name?: string
  terminal_type?: string
  columns?: number
  rows?: number
  auth_method_encrypted?: string
  auth_nonce?: string
  auth_key_salt?: string
}

export interface ListSshSessionsRequest {
  page?: number
  page_size?: number
}

export interface PaginatedSshSessions {
  data: SshSessionVO[]
  total: number
  page: number
  page_size: number
}