import type { PaginatedResult, Pagination } from '@micro/shared-types'

export interface PaginationQuery {
  page?: number | string
  limit?: number | string
}

/**
 * Normalize page/limit from query params
 */
export function normalizePagination(
  query: PaginationQuery,
  maxLimit = 100,
): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(query.page ?? 1), 10) || 1)
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(String(query.limit ?? 20), 10) || 20),
  )
  return { page, limit, skip: (page - 1) * limit }
}

/**
 * Build a PaginatedResult from raw data + total count
 */
export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit)
  const pagination: Pagination = { page, limit, total, totalPages }
  return { data, pagination }
}

/**
 * Build a flat pagination response (legacy format used in the app)
 */
export function buildFlatPagination<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}
