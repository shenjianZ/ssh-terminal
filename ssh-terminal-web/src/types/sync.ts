// 同步相关类型
export interface SyncRequest {
  client_ver: number
  last_synced_at?: number
  changes?: SyncChange[]
}

export interface SyncResponse {
  server_ver: number
  conflicts?: Conflict[]
  pulled_changes?: SyncChange[]
}

export interface ResolveConflictRequest {
  conflict_id: string
  resolution: 'server' | 'client' | 'merge'
  merged_data?: any
}

export interface ResolveConflictResponse {
  success: boolean
  server_ver: number
}

export interface SyncChange {
  entity_type: 'ssh_session' | 'user_profile'
  entity_id: string
  change_type: 'create' | 'update' | 'delete'
  data: any
  client_ver: number
  timestamp: number
}

export interface Conflict {
  id: string
  entity_type: string
  entity_id: string
  server_data: any
  client_data: any
  timestamp: number
}