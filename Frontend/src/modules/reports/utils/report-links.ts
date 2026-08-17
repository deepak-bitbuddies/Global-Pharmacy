import type { ReportFilters } from "../types"

/**
 * Serializes a `ReportFilters` (partial — only the fields relevant to the destination page need
 * be passed) into a query string appended to `path`, for dashboard "View details" drill-down
 * links. The destination report page reads these back via `useInitialFiltersFromUrl`.
 */
export function buildReportUrl(path: string, filters: Partial<ReportFilters>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue
    params.set(key, String(value))
  }
  const query = params.toString()
  return query ? `${path}?${query}` : path
}
