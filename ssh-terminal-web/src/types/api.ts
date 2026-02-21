// 统一 API 响应格式
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
}