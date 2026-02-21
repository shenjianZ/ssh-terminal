import request from '@/utils/request'
import type { ApiResponse, UserProfileResult, UpdateProfileRequest } from '@/types'

export function getProfile(): Promise<ApiResponse<UserProfileResult>> {
  return request.get('/api/user/profile').then(res => res.data)
}

export function updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserProfileResult>> {
  return request.put('/api/user/profile', data).then(res => res.data)
}

export function deleteProfile(): Promise<ApiResponse<void>> {
  return request.delete('/api/user/profile').then(res => res.data)
}