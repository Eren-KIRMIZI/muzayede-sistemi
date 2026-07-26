/**
 * Generic paginated query DTO interface.
 * Services use this as the shape of pagination query parameters.
 */
export interface PaginationQueryDto {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Build Prisma orderBy from sortBy / sortOrder
 */
export function buildOrderBy(
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc',
  defaultField = 'createdAt',
): Record<string, 'asc' | 'desc'> {
  return { [sortBy ?? defaultField]: sortOrder }
}
