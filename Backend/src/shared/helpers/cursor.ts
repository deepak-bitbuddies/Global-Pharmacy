/**
 * Opaque keyset-pagination cursors — base64 of a small JSON object holding
 * the last-seen sort key(s). Not meant to be human-edited; callers pass
 * whatever `nextCursor` the previous response gave them back as `cursor`.
 */
export function encodeCursor(value: Record<string, string | number>): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url")
}

export function decodeCursor<T extends Record<string, string | number>>(cursor: string | undefined): T | null {
  if (!cursor) return null
  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as T
  } catch {
    return null
  }
}

/**
 * Trims a `pageSize + 1`-row keyset fetch down to a real page: the extra row
 * (if present) means there's a next page, and is used only to confirm that —
 * never returned to the caller.
 */
export function buildPage<T, C extends Record<string, string | number>>(
  rows: T[],
  pageSize: number,
  cursorFor: (lastRow: T) => C,
): { rows: T[]; hasNextPage: boolean; nextCursor: string | null } {
  const hasNextPage = rows.length > pageSize
  const page = hasNextPage ? rows.slice(0, pageSize) : rows
  const last = page[page.length - 1]
  const nextCursor = hasNextPage && last ? encodeCursor(cursorFor(last)) : null
  return { rows: page, hasNextPage, nextCursor }
}
