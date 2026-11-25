type FormatDateArgs = {
  date: Date;
  /** Only "YYYY-MM-DD" is currently supported. */
  returnFormat: "YYYY-MM-DD";
};

export function formatDate({ date }: FormatDateArgs): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * "2026-10-14" -> "Tue, 14 Oct 2026" (per `locale`). Built from the date parts rather than
 * `new Date("2026-10-14")`, which parses as UTC midnight and can show the previous day in
 * timezones behind UTC.
 */
export function formatDisplayDate(isoDate: string, locale?: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(year, month - 1, day));
}

/** "2026-10-14" -> "2026-10-15", using UTC arithmetic so the server's/browser's timezone can't shift it. */
export function addDaysToIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(undefined, options).format(value);
}

export function formatCurrency(value: number, currency = "INR"): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
}
