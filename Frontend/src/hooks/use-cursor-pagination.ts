"use client"

import { useCallback, useState } from "react"

/**
 * Client-side state for keyset/cursor-paginated tables. Keyset pagination is
 * naturally forward-only (a cursor only knows how to seek "next"), so
 * "Previous" is implemented by keeping a stack of every cursor seen so far
 * and stepping back through it — no backend "previous page" query needed,
 * and revisited pages are usually served straight from the query cache.
 */
export function useCursorPagination(initialPageSize = 10) {
  const [stack, setStack] = useState<(string | undefined)[]>([undefined])
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSizeState] = useState(initialPageSize)

  const reset = useCallback(() => {
    setStack([undefined])
    setPageIndex(0)
  }, [])

  const goNext = useCallback(
    (nextCursor: string | null) => {
      if (!nextCursor) return
      setStack((prev) => (prev[pageIndex + 1] === nextCursor ? prev : [...prev.slice(0, pageIndex + 1), nextCursor]))
      setPageIndex((i) => i + 1)
    },
    [pageIndex],
  )

  const goPrevious = useCallback(() => setPageIndex((i) => Math.max(0, i - 1)), [])

  const setPageSize = useCallback(
    (size: number) => {
      setPageSizeState(size)
      reset()
    },
    [reset],
  )

  return {
    cursor: stack[pageIndex],
    page: pageIndex + 1,
    pageSize,
    setPageSize,
    goNext,
    goPrevious,
    reset,
  }
}
