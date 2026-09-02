import { or, sql, type AnyColumn, type SQL } from "drizzle-orm"

/**
 * A single free-text "search anything" box across an entire table — ORs an `ILIKE '%term%'`
 * across every given column, casting each to text first so numeric/date columns (amount, qty,
 * billDate, ...) match too, not just the text ones. Returns `undefined` for a blank term so
 * callers can push the result straight into their clause list unconditionally.
 */
export function anyColumnSearch(columns: AnyColumn[], term: string | undefined): SQL | undefined {
  const trimmed = term?.trim()
  if (!trimmed) return undefined
  const pattern = `%${trimmed}%`
  return or(...columns.map((column) => sql`${column}::text ilike ${pattern}`)) as SQL
}
