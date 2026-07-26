export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: Pagination
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  statusCode: number
  timestamp: string
  requestId?: string
}

export interface JwtPayload {
  sub: string
  email: string
  role: string
  jti?: string
  iat?: number
  exp?: number
}

export interface ServiceError {
  code: string
  message: string
  details?: Record<string, unknown>
}
