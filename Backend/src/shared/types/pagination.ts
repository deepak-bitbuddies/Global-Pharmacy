export type CursorPaginationParams = {
  cursor?: string
  pageSize: number
}

export type PaginatedResult<T> = {
  rows: T[]
  hasNextPage: boolean
  nextCursor: string | null
  total: number
}
