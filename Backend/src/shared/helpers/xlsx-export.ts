import ExcelJS from "exceljs"

const THIN_BORDER = {
  top: { style: "thin" as const },
  bottom: { style: "thin" as const },
  left: { style: "thin" as const },
  right: { style: "thin" as const },
}

/**
 * Builds a styled export workbook: "Global Pharmacy" branding + a filters/date-range description
 * + a generated-at/row-count line, then a few blank spacer rows, then the bordered data table
 * (header row bold+bordered, every data cell bordered too). `xlsx` (used elsewhere for parsing
 * uploads) can't write cell styles at all in its free edition — confirmed by inspecting a test
 * file's xl/styles.xml, which came back with empty <borders> despite setting `.s.border` — so
 * this write path uses `exceljs` instead, which supports real styled/bordered output. Shared
 * across every module with a background export (Reports, Purchase Analysis) rather than each
 * duplicating this formatting.
 */
export async function buildStyledXlsxBuffer(
  reportLabel: string,
  filterSummary: string,
  columns: { key: string; label: string }[],
  rows: Record<string, unknown>[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(reportLabel)
  const lastCol = columns.length

  const titleRow = sheet.addRow(["Global Pharmacy"])
  titleRow.getCell(1).font = { bold: true, size: 14 }
  sheet.mergeCells(titleRow.number, 1, titleRow.number, lastCol)

  const reportRow = sheet.addRow([`${reportLabel} Report`])
  reportRow.getCell(1).font = { bold: true }
  sheet.mergeCells(reportRow.number, 1, reportRow.number, lastCol)

  sheet.addRow([`Filters: ${filterSummary}`])
  sheet.addRow([`Generated: ${new Date().toLocaleString()} | Rows: ${rows.length}`])

  sheet.addRow([])
  sheet.addRow([])
  sheet.addRow([])

  const headerRow = sheet.addRow(columns.map((column) => column.label))
  headerRow.eachCell((cell) => {
    cell.font = { bold: true }
    cell.border = THIN_BORDER
  })

  for (const row of rows) {
    const dataRow = sheet.addRow(columns.map((column) => row[column.key] ?? ""))
    dataRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = THIN_BORDER
    })
  }

  sheet.columns.forEach((column, index) => {
    column.width = Math.min(30, Math.max(10, columns[index].label.length + 2))
  })

  return Buffer.from(await workbook.xlsx.writeBuffer())
}
