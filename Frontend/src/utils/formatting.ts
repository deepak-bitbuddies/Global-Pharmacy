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

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(undefined, options).format(value);
}

export function formatCurrency(value: number, currency = "INR"): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
}
