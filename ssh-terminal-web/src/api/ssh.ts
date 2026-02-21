import request from '@/utils/request'
import type { ApiResponse, SshSessionVO, CreateSshSessionRequest, UpdateSshSessionRequest, PaginatedSshSessions } from '@/types'

export function listSessions(page = 1, pageSize = 20): Promise<ApiResponse<PaginatedSshSessions>> {
  return request.get('/api/ssh/sessions', { params: { page, page_size: pageSize } }).then(res => res.data)
}

export function getSession(id: string): Promise<ApiResponse<SshSessionVO>> {
  return request.get(`/api/ssh/sessions/${id}`).then(res => res.data)
}

export function createSession(data: CreateSshSessionRequest): Promise<ApiResponse<SshSessionVO>> {
  return request.post('/api/ssh/sessions', data).then(res => res.data)
}

export function updateSession(id: string, data: UpdateSshSessionRequest): Promise<ApiResponse<SshSessionVO>> {
  return request.put(`/api/ssh/sessions/${id}`, data).then(res => res.data)
}

export function deleteSession(id: string): Promise<ApiResponse<void>> {
  return request.delete(`/api/ssh/sessions/${id}`).then(res => res.data)
}