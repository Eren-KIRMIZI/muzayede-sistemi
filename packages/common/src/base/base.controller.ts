import type { ApiResponse } from '@micro/shared-types'

/**
 * Build a standard success API response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  statusCode = 200,
  requestId?: string,
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    requestId,
  }
}

/**
 * Build a standard error API response
 */
export function errorResponse(
  error: string,
  statusCode = 500,
  requestId?: string,
): ApiResponse<never> {
  return {
    success: false,
    error,
    statusCode,
    timestamp: new Date().toISOString(),
    requestId,
  }
}
