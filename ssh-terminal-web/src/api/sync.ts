import request from '@/utils/request'
import type { ApiResponse, SyncRequest, SyncResponse, ResolveConflictRequest, ResolveConflictResponse } from '@/types'

export function sync(data: SyncRequest): Promise<ApiResponse<SyncResponse>> {
  return request.post('/api/sync', data).then(res => res.data)
}

export function resolveConflict(data: ResolveConflictRequest): Promise<ApiResponse<ResolveConflictResponse>> {
  return request.post('/api/sync/resolve-conflict', data).then(res => res.data)
}