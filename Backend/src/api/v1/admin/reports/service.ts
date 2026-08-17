import ExcelJS from "exceljs"

import { NotFoundError } from "../../../../shared/errors/index.js"
import { emitExportJobProgress, emitExportJobUpdate } from "../../../../core/realtime/socket.js"
import { readExportFile, saveExportFile } from "../../../../core/storage/export-storage.js"
import { FileType, type FileTypeValue } from "../uploads/enums.js"
import { findBranchById } from "../uploads/repository.js"
import type { ExportJobDocument } from "./model.js"
import type {
  BranchSalesRowDto,
  CursorPaginationParams,
  DailyCollectionRowDto,
  DashboardSummaryDto,
  DaySalesDetailRowDto,
  ExpiryRowDto,
  ExportJobDto,
  GrossProfitRowDto,
  ItemWiseSalesRowDto,
  NonMovingDetailRowDto,
  NonMovingRowDto,
  PaginatedResult,
  PurchaseByCompanyRowDto,
  PurchaseDetailRowDto,
  PurchaseSummaryRowDto,
  ReportFilters,
  SalesByCompanyRowDto,
  SalesDetailRowDto,
  StockByCompanyRowDto,
  StockRowDto,
  StockSummaryDto,
  TopReturnRowDto,
  TopStockValueRowDto,
  ZeroOrderAlertRowDto,
} from "./dto.js"
import {
  createExportJob,
  exportDaySalesDetail,
  exportPurchaseDetail,
  exportSalesDetail,
  exportStockReport,
  findExportJob,
  getBranchSales,
  getDailyCollection,
  getDaySalesDetail,
  getExpiryReport,
  getGrossProfitByItem,
  getItemWiseSales,
  getNonMovingItems,
  getNonMovingItemsDetail,
  getPurchaseDetail,
  getPurchaseSummary,
  getPurchaseValueByCompany,
  getSalesDetail,
  getSalesValueByCompany,
  getStockReport,
  getStockSummary,
  getStockValueByCompany,
  getTopReturnsByItem,
  getTopStockItemsByValue,
  getTotalPurchaseValue,
  getTotalStockValue,
  getZeroOrderAlerts,
  listCompanies,
  listExportJobs,
  listSupplierGroups,
  listSuppliers,
  updateExportJobStatus,
} from "./repository.js"

const num = (value: string | number | null): number => Number(value ?? 0)

export async function itemWiseSales(filters: ReportFilters, pagination: CursorPaginationParams): Promise<PaginatedResult<ItemWiseSalesRowDto>> {
  const { rows, ...page } = await getItemWiseSales(filters, pagination)
  return {
    ...page,
    rows: rows.map((row) => ({
      itemNameRaw: row.itemNameRaw,
      company: row.company,
      branchId: row.branchId,
      branchName: row.branchName,
      totalQty: num(row.totalQty),
      totalAmount: num(row.totalAmount),
      returnQty: num(row.returnQty),
      returnAmount: num(row.returnAmount),
    })),
  }
}

export async function topReturnsByItem(filters: ReportFilters): Promise<TopReturnRowDto[]> {
  const rows = await getTopReturnsByItem(filters)
  return rows.map((row) => ({ itemNameRaw: row.itemNameRaw, returnAmount: num(row.returnAmount) }))
}

export async function salesValueByCompany(filters: ReportFilters): Promise<SalesByCompanyRowDto[]> {
  return getSalesValueByCompany(filters)
}

function toSalesDetailRowDto(row: Awaited<ReturnType<typeof getSalesDetail>>["rows"][number]): SalesDetailRowDto {
  return {
    id: row.id,
    partyGroup: row.partyGroup,
    itemNameRaw: row.itemNameRaw,
    packSizeRaw: row.packSizeRaw,
    qty: row.qty === null ? null : num(row.qty),
    unit: row.unit,
    rate: row.rate === null ? null : num(row.rate),
    amount: num(row.amount),
    company: row.company,
    branchId: row.branchId,
    branchName: row.branchName,
    date: row.date,
  }
}

export async function salesDetail(filters: ReportFilters, pagination: CursorPaginationParams): Promise<PaginatedResult<SalesDetailRowDto>> {
  const { rows, ...page } = await getSalesDetail(filters, pagination)
  return { ...page, rows: rows.map(toSalesDetailRowDto) }
}

export async function branchSales(filters: ReportFilters): Promise<BranchSalesRowDto[]> {
  const rows = await getBranchSales(filters)
  return rows.map((row) => ({ branchId: row.branchId, branchName: row.branchName, totalAmount: num(row.totalAmount) }))
}

function toGrossProfitRowDto(row: Awaited<ReturnType<typeof getGrossProfitByItem>>["rows"][number]): GrossProfitRowDto {
  const salesQty = num(row.salesQty)
  const salesAmount = num(row.salesAmount)
  const avgCostPrice = row.avgCostPrice === null ? null : num(row.avgCostPrice)
  const estimatedCost = avgCostPrice === null ? null : avgCostPrice * salesQty
  const estimatedGp = estimatedCost === null ? null : salesAmount - estimatedCost
  const estimatedGpPct = estimatedGp === null || salesAmount === 0 ? null : (estimatedGp / salesAmount) * 100

  return { itemName: row.itemName, salesAmount, salesQty, avgCostPrice, estimatedCost, estimatedGp, estimatedGpPct }
}

export async function grossProfitByItem(filters: ReportFilters, pagination: CursorPaginationParams): Promise<PaginatedResult<GrossProfitRowDto>> {
  const { rows, ...page } = await getGrossProfitByItem(filters, pagination)
  return { ...page, rows: rows.map(toGrossProfitRowDto) }
}

/**
 * Top 8 items by GP %, not GP amount — re-ranks the top 200 items by sales amount (the same
 * data `grossProfitByItem` already fetches a page of) rather than scanning every item's %, so a
 * near-zero-sales item with a distorted percentage can't dominate the list.
 */
export async function topGrossProfitPercentItems(filters: ReportFilters): Promise<GrossProfitRowDto[]> {
  const { rows } = await getGrossProfitByItem(filters, { pageSize: 200 })
  return rows
    .map(toGrossProfitRowDto)
    .filter((row) => row.estimatedGpPct !== null)
    .sort((a, b) => (b.estimatedGpPct as number) - (a.estimatedGpPct as number))
    .slice(0, 8)
}

export async function purchaseSummary(filters: ReportFilters, pagination: CursorPaginationParams): Promise<PaginatedResult<PurchaseSummaryRowDto>> {
  const { rows, ...page } = await getPurchaseSummary(filters, pagination)
  return {
    ...page,
    rows: rows.map((row) => ({
      supplierGroup: row.supplierGroup,
      totalAmount: num(row.totalAmount),
      totalQty: num(row.totalQty),
      totalFreeQty: num(row.totalFreeQty),
    })),
  }
}

function toPurchaseDetailRowDto(row: Awaited<ReturnType<typeof getPurchaseDetail>>["rows"][number]): PurchaseDetailRowDto {
  return {
    id: row.id,
    supplierGroup: row.supplierGroup,
    itemNameRaw: row.itemNameRaw,
    packSizeRaw: row.packSizeRaw,
    qty: row.qty === null ? null : num(row.qty),
    freeQty: row.freeQty === null ? null : num(row.freeQty),
    rate: row.rate === null ? null : num(row.rate),
    amount: num(row.amount),
    schemePct: row.schemePct === null ? null : num(row.schemePct),
    company: row.company,
    branchId: row.branchId,
    branchName: row.branchName,
    date: row.date,
  }
}

export async function purchaseDetail(filters: ReportFilters, pagination: CursorPaginationParams): Promise<PaginatedResult<PurchaseDetailRowDto>> {
  const { rows, ...page } = await getPurchaseDetail(filters, pagination)
  return { ...page, rows: rows.map(toPurchaseDetailRowDto) }
}

export async function purchaseValueByCompany(filters: ReportFilters): Promise<PurchaseByCompanyRowDto[]> {
  return getPurchaseValueByCompany(filters)
}

function toStockRowDto(row: Awaited<ReturnType<typeof getStockReport>>["rows"][number]): StockRowDto {
  return {
    id: row.id,
    itemCode: row.itemCode,
    itemName: row.itemName,
    unit: row.unit,
    currentStock: num(row.currentStock),
    costPrice: row.costPrice === null ? null : num(row.costPrice),
    value: row.value === null ? null : num(row.value),
    mrp: row.mrp === null ? null : num(row.mrp),
    purchasePrice: row.purchasePrice === null ? null : num(row.purchasePrice),
    salesPrice: row.salesPrice === null ? null : num(row.salesPrice),
    company: row.company,
    manufacturer: row.manufacturer,
    batch: row.batch,
    mfgDateRaw: row.mfgDateRaw,
    expDate: row.expDate,
    supplier: row.supplier,
    invNo: row.invNo,
    invDate: row.invDate,
    rackNo: row.rackNo,
    salesSchemeDeal: row.salesSchemeDeal === null ? null : num(row.salesSchemeDeal),
    salesSchemeFree: row.salesSchemeFree === null ? null : num(row.salesSchemeFree),
    purcSchemeDeal: row.purcSchemeDeal === null ? null : num(row.purcSchemeDeal),
    purcSchemeFree: row.purcSchemeFree === null ? null : num(row.purcSchemeFree),
    recDate: row.recDate,
    asOfDate: row.asOfDate,
    daysToExpiry: row.daysToExpiry,
    branchId: row.branchId,
    branchName: row.branchName,
  }
}

export async function stockReport(filters: ReportFilters, pagination: CursorPaginationParams): Promise<PaginatedResult<StockRowDto>> {
  const { rows, ...page } = await getStockReport(filters, pagination)
  return { ...page, rows: rows.map(toStockRowDto) }
}

export async function stockSummary(filters: ReportFilters): Promise<StockSummaryDto> {
  return getStockSummary(filters)
}

export async function stockValueByCompany(filters: ReportFilters): Promise<StockByCompanyRowDto[]> {
  return getStockValueByCompany(filters)
}

export async function topStockItemsByValue(filters: ReportFilters): Promise<TopStockValueRowDto[]> {
  return getTopStockItemsByValue(filters)
}

export async function zeroOrderAlerts(filters: ReportFilters): Promise<ZeroOrderAlertRowDto[]> {
  const rows = await getZeroOrderAlerts(filters)
  return rows.map((row) => ({ itemName: row.itemName, currentStock: num(row.currentStock), soldQtyInPeriod: num(row.soldQtyInPeriod) }))
}

export async function expiryReport(filters: ReportFilters, withinDays: number): Promise<ExpiryRowDto[]> {
  const rows = await getExpiryReport(filters, withinDays)
  return rows.map((row) => ({
    itemName: row.itemName,
    batch: row.batch,
    currentStock: num(row.currentStock),
    expDate: row.expDate as unknown as string,
    daysToExpiry: row.daysToExpiry,
    value: row.value === null ? null : num(row.value),
  }))
}

export async function nonMovingItems(filters: ReportFilters): Promise<NonMovingRowDto[]> {
  const rows = await getNonMovingItems(filters)
  return rows.map((row) => ({ itemName: row.itemName, currentStock: num(row.currentStock), value: row.value === null ? null : num(row.value), lastSoldDate: null }))
}

export async function nonMovingDetail(filters: ReportFilters, pagination: CursorPaginationParams): Promise<PaginatedResult<NonMovingDetailRowDto>> {
  const { rows, ...page } = await getNonMovingItemsDetail(filters, pagination)
  return {
    ...page,
    rows: rows.map((row) => ({
      id: row.id,
      itemName: row.itemName,
      currentStock: num(row.currentStock),
      value: row.value === null ? null : num(row.value),
      company: row.company,
      batch: row.batch,
      branchId: row.branchId,
      branchName: row.branchName,
    })),
  }
}

export async function dailyCollection(filters: ReportFilters): Promise<DailyCollectionRowDto[]> {
  const rows = await getDailyCollection(filters)
  return rows.map((row) => ({ date: row.date, billValue: num(row.billValue) }))
}

function toDaySalesDetailRowDto(row: Awaited<ReturnType<typeof getDaySalesDetail>>["rows"][number]): DaySalesDetailRowDto {
  return {
    id: row.id,
    date: row.date,
    billNoRange: row.billNoRange,
    billValue: num(row.billValue),
    taxable: row.taxable === null ? null : num(row.taxable),
    taxPayable: row.taxPayable === null ? null : num(row.taxPayable),
    taxFree: row.taxFree === null ? null : num(row.taxFree),
    exempted: row.exempted === null ? null : num(row.exempted),
    roundOff: row.roundOff === null ? null : num(row.roundOff),
    branchId: row.branchId,
    branchName: row.branchName,
  }
}

export async function daySalesDetail(filters: ReportFilters, pagination: CursorPaginationParams): Promise<PaginatedResult<DaySalesDetailRowDto>> {
  const { rows, ...page } = await getDaySalesDetail(filters, pagination)
  return { ...page, rows: rows.map(toDaySalesDetailRowDto) }
}

export async function dashboardSummary(filters: ReportFilters): Promise<DashboardSummaryDto> {
  const [sales, totalPurchase, stockValue, collection, expiry, nonMoving] = await Promise.all([
    getBranchSales(filters),
    getTotalPurchaseValue(filters),
    getTotalStockValue(filters),
    getDailyCollection(filters),
    getExpiryReport(filters, 30),
    getNonMovingItems(filters),
  ])

  return {
    totalSales: sales.reduce((sum, row) => sum + num(row.totalAmount), 0),
    totalPurchase,
    totalStockValue: stockValue,
    totalCollection: collection.reduce((sum, row) => sum + num(row.billValue), 0),
    nearExpiryCount: expiry.length,
    nonMovingCount: nonMoving.length,
  }
}

// ---- Background exports — mirrors uploads/service.ts's runImportPipeline shape: an instant ack
// (job row created, "processing"), the real work happens fire-and-forget after returning.

const EXPORT_CHUNK_SIZE = 2000

const REPORT_LABEL: Record<FileTypeValue, string> = {
  [FileType.Stock]: "Stock",
  [FileType.Sales]: "Sales",
  [FileType.Purchase]: "Purchase",
  [FileType.DayWiseSale]: "Day-Wise Sale",
}

// The exact columns shown on each report's frontend table, in the same order — kept as the
// single source of truth for exports so a downloaded file never carries fields (id, branchId,
// raw codes, ...) the user never sees on screen. Labels mirror the on-screen column headers
// (Frontend/src/modules/reports/pages/*.tsx + messages/en.json), duplicated here in plain
// English since exports aren't locale-aware.
const EXPORT_COLUMNS: Record<FileTypeValue, { key: string; label: string }[]> = {
  [FileType.Stock]: [
    { key: "asOfDate", label: "Date" },
    { key: "branchName", label: "Branch" },
    { key: "itemCode", label: "Code" },
    { key: "itemName", label: "Item" },
    { key: "currentStock", label: "Stock" },
    { key: "unit", label: "Unit" },
    { key: "value", label: "Value" },
    { key: "expDate", label: "Expiry" },
    { key: "daysToExpiry", label: "Expires In" },
    { key: "company", label: "Company" },
    { key: "batch", label: "Batch" },
    { key: "costPrice", label: "Cost Price" },
    { key: "mrp", label: "M.R.P." },
    { key: "purchasePrice", label: "Purchase Price" },
    { key: "salesPrice", label: "Sales Price" },
    { key: "manufacturer", label: "Manufacturer" },
    { key: "mfgDateRaw", label: "Mfg. Date" },
    { key: "supplier", label: "Supplier" },
    { key: "invNo", label: "Inv. No." },
    { key: "invDate", label: "Inv. Date" },
    { key: "rackNo", label: "Rack No." },
    { key: "salesSchemeDeal", label: "Sales Scheme Deal" },
    { key: "salesSchemeFree", label: "Sales Scheme Free" },
    { key: "purcSchemeDeal", label: "Purc. Scheme Deal" },
    { key: "purcSchemeFree", label: "Purc. Scheme Free" },
    { key: "recDate", label: "Rec. Date" },
  ],
  [FileType.Purchase]: [
    { key: "date", label: "Date" },
    { key: "branchName", label: "Branch" },
    { key: "itemNameRaw", label: "Item" },
    { key: "supplierGroup", label: "Supplier" },
    { key: "company", label: "Company" },
    { key: "qty", label: "Qty" },
    { key: "freeQty", label: "Free Qty" },
    { key: "rate", label: "Rate" },
    { key: "amount", label: "Amount" },
    { key: "schemePct", label: "Scheme %" },
  ],
  [FileType.Sales]: [
    { key: "date", label: "Date" },
    { key: "branchName", label: "Branch" },
    { key: "itemNameRaw", label: "Item" },
    { key: "company", label: "Company" },
    { key: "qty", label: "Qty" },
    { key: "unit", label: "Unit" },
    { key: "rate", label: "Rate" },
    { key: "amount", label: "Amount" },
  ],
  [FileType.DayWiseSale]: [
    { key: "date", label: "Date" },
    { key: "branchName", label: "Branch" },
    { key: "billNoRange", label: "Bill No. Range" },
    { key: "billValue", label: "Bill Value" },
    { key: "taxable", label: "Taxable" },
    { key: "taxPayable", label: "Tax Payable" },
    { key: "taxFree", label: "Tax Free" },
    { key: "exempted", label: "Exempted" },
    { key: "roundOff", label: "Round Off" },
  ],
}

const SCHEME_TIER_LABEL: Record<string, string> = {
  none: "No Scheme",
  lt5: "< 5%",
  "5to10": "5% – 10%",
  "10to20": "10% – 20%",
  "20to30": "20% – 30%",
  "30to50": "30% – 50%",
  "50to100": "50% – 100%",
  gte100: "100%+",
}

const EXPIRY_TIER_LABEL: Record<string, string> = {
  expired: "Already expired",
  lte30: "Within 30 days",
  "31to60": "31 – 60 days",
  "61to90": "61 – 90 days",
  gt90: "90+ days",
  none: "No expiry set",
  custom: "Custom range",
}

function rangeLabel(from: number | undefined, to: number | undefined): string {
  if (from !== undefined && to !== undefined) return `${from} – ${to}`
  if (from !== undefined) return `≥ ${from}`
  return `≤ ${to}`
}

/** Human-readable one-line summary of which filters produced an export — mirrors the frontend's `formatFilterSummary` (export-report-button.tsx), rebuilt server-side since exports have no access to the UI's i18n/branch-list state. */
function describeFilters(filters: ReportFilters, branchName: string | null): string {
  const parts: string[] = []
  if (filters.branchId) parts.push(branchName ?? filters.branchId)
  if (filters.dateFrom && filters.dateTo) parts.push(`${filters.dateFrom} – ${filters.dateTo}`)
  if (filters.item) parts.push(`"${filters.item}"`)
  if (filters.company) parts.push(filters.company)
  if (filters.supplier) parts.push(filters.supplier)
  if (filters.supplierGroup) parts.push(filters.supplierGroup)
  if (filters.schemeTier) parts.push(SCHEME_TIER_LABEL[filters.schemeTier] ?? filters.schemeTier)
  if (filters.expiryTier) parts.push(EXPIRY_TIER_LABEL[filters.expiryTier] ?? filters.expiryTier)
  if (filters.stockFrom !== undefined || filters.stockTo !== undefined) parts.push(`Stock ${rangeLabel(filters.stockFrom, filters.stockTo)}`)
  if (filters.amountFrom !== undefined || filters.amountTo !== undefined) parts.push(`Amount ${rangeLabel(filters.amountFrom, filters.amountTo)}`)
  return parts.length > 0 ? parts.join(" | ") : "All records — no filters applied"
}

function toExportJobDto(job: ExportJobDocument): ExportJobDto {
  return {
    id: job.id,
    reportType: job.reportType,
    branchId: job.branchId,
    filters: job.filters,
    status: job.status,
    rowCount: job.rowCount,
    fileName: job.fileName,
    errorMessage: job.errorMessage,
    requestedAt: job.requestedAt,
    completedAt: job.completedAt,
  }
}

const THIN_BORDER = {
  top: { style: "thin" as const },
  bottom: { style: "thin" as const },
  left: { style: "thin" as const },
  right: { style: "thin" as const },
}

/**
 * Builds the actual export file: "Global Pharmacy" branding + a filters/date-range description
 * + a generated-at/row-count line, then a few blank spacer rows, then the bordered data table
 * (header row bold+bordered, every data cell bordered too). `xlsx` (used elsewhere for parsing
 * uploads) can't write cell styles at all in its free edition — confirmed by inspecting a test
 * file's xl/styles.xml, which came back with empty <borders> despite setting `.s.border` — so
 * this write path uses `exceljs` instead, which supports real styled/bordered output.
 */
async function buildStyledXlsxBuffer(
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

/** Maps in chunks purely to emit progress ticks (`export-job:progress`) on the way — same reason `uploads/service.ts` chunks its inserts, just for a read+transform here instead of a write. */
function mapWithProgress<TRow, TMapped>(rows: TRow[], mapRow: (row: TRow) => TMapped, job: ExportJobDto, reportType: FileTypeValue): TMapped[] {
  const mapped: TMapped[] = []
  const total = rows.length
  for (let i = 0; i < total; i += EXPORT_CHUNK_SIZE) {
    for (const row of rows.slice(i, i + EXPORT_CHUNK_SIZE)) mapped.push(mapRow(row))
    emitExportJobProgress({ id: job.id, reportType, branchId: job.branchId, rowsProcessed: mapped.length, totalRows: total })
  }
  if (total === 0) emitExportJobProgress({ id: job.id, reportType, branchId: job.branchId, rowsProcessed: 0, totalRows: 0 })
  return mapped
}

async function runExportPipeline(job: ExportJobDto, reportType: FileTypeValue, filters: ReportFilters): Promise<void> {
  try {
    let mappedRows: Record<string, unknown>[]
    switch (reportType) {
      case FileType.Stock:
        mappedRows = mapWithProgress(await exportStockReport(filters), toStockRowDto, job, reportType)
        break
      case FileType.Purchase:
        mappedRows = mapWithProgress(await exportPurchaseDetail(filters), toPurchaseDetailRowDto, job, reportType)
        break
      case FileType.Sales:
        mappedRows = mapWithProgress(await exportSalesDetail(filters), toSalesDetailRowDto, job, reportType)
        break
      case FileType.DayWiseSale:
        mappedRows = mapWithProgress(await exportDaySalesDetail(filters), toDaySalesDetailRowDto, job, reportType)
        break
    }

    const branch = filters.branchId ? await findBranchById(filters.branchId) : null
    const filterSummary = describeFilters(filters, branch?.name ?? null)
    const buffer = await buildStyledXlsxBuffer(REPORT_LABEL[reportType], filterSummary, EXPORT_COLUMNS[reportType], mappedRows)
    const fileName = `${reportType}-report-${new Date().toISOString().slice(0, 10)}.xlsx`
    const { storageKey } = await saveExportFile(job.id, buffer)

    await updateExportJobStatus(job.id, { status: "completed", rowCount: mappedRows.length, fileName, storageKey })
    emitExportJobUpdate({ id: job.id, reportType, branchId: job.branchId, status: "completed", rowCount: mappedRows.length })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error while generating this export"
    await updateExportJobStatus(job.id, { status: "failed", errorMessage })
    emitExportJobUpdate({ id: job.id, reportType, branchId: job.branchId, status: "failed", errorMessage })
  }
}

export async function createExport(reportType: FileTypeValue, filters: ReportFilters, branchId: string | null): Promise<ExportJobDto> {
  // `export_jobs.branch_id` has a real FK constraint (unlike a report query's plain filter, which
  // just matches zero rows for a bogus id) — check up front so a bad id 404s cleanly instead of
  // surfacing as an opaque 500 from the insert below.
  if (branchId && !(await findBranchById(branchId))) {
    throw new NotFoundError("Branch not found")
  }

  const job = toExportJobDto(await createExportJob({ reportType, branchId, filters }))
  emitExportJobUpdate({ id: job.id, reportType, branchId: job.branchId, status: "processing" })

  // Not awaited — same fire-and-forget shape as `bulkImportFiles`; the caller already has its ack.
  void runExportPipeline(job, reportType, filters)

  return job
}

export async function listExports(branchId?: string, reportType?: string): Promise<ExportJobDto[]> {
  const jobs = await listExportJobs(branchId, reportType)
  return jobs.map(toExportJobDto)
}

export async function getExportFileForDownload(id: string): Promise<{ buffer: Buffer; fileName: string }> {
  const job = await findExportJob(id)
  if (!job || job.status !== "completed" || !job.storageKey || !job.fileName) {
    throw new NotFoundError("Export not found, or it isn't ready to download yet")
  }
  return { buffer: await readExportFile(job.storageKey), fileName: job.fileName }
}

export async function companies(): Promise<string[]> {
  return listCompanies()
}

export async function suppliers(): Promise<string[]> {
  return listSuppliers()
}

export async function supplierGroups(): Promise<string[]> {
  return listSupplierGroups()
}
