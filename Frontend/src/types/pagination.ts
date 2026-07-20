export type PaginationMeta = {
  nextCursor: string | null
  hasNextPage: boolean
  total: number
  totalPages: number
}

export type CursorPaginationParams = {
  cursor?: string
  pageSize?: number
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: PaginationMeta
}
