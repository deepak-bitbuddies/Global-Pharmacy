import { ForbiddenError, NotFoundError } from "../../../../shared/errors/index.js"
import { SystemRoleCode } from "../../../../shared/enums/index.js"
import { db, type DbOrTransaction } from "../../../../core/database/db.js"
import { emitImportBatchProgress, emitImportBatchUpdate } from "../../../../core/realtime/socket.js"
import { FileType, type FileTypeValue } from "./enums.js"
import { EmptyImportError, MissingDateError, MultiDayFileError, OutOfSequenceError, RevertBlockedError, WrongFileTypeError } from "./errors.js"
import type {
  BulkUploadAckDto,
  BulkUploadFileInputDto,
  ImportBatchListItemDto,
  UploadAckDto,
  UploadCycleStatusDto,
  UploadFileDto,
} from "./dto.js"
import { parseStockFile, type ParsedStockRow } from "./parsers/stock.parser.js"
import { parseSalesFile, type ParsedSalesRow } from "./parsers/sales.parser.js"
import { parsePurchaseFile, type ParsedPurchaseRow } from "./parsers/purchase.parser.js"
import { parseDaySalesFile, type ParsedDaySalesRow } from "./parsers/day-sales.parser.js"
import { detectReportKind, normalizeItemName, readWorkbookRows, type SheetRow } from "./parsers/parse-utils.js"
import type { BranchDocument, NewDailySalesSummaryDocument, NewPurchaseLineDocument, NewSalesLineDocument, NewStockSnapshotDocument } from "./model.js"
import {
  createImportBatch,
  deleteDailySalesSummaryByBatch,
  deleteImportBatch,
  deletePurchaseLinesByBatch,
  deleteSalesLinesByBatch,
  deleteStockSnapshotsByBatch,
  findBranchById,
  findImportBatch,
  findImportBatchByDate,
  findImportBatchById,
  findLatestBatchDate,
  hasBatchForDate,
  insertDailySalesSummary,
  insertPurchaseLines,
  insertSalesLines,
  insertStockSnapshots,
  listBranches,
  listImportBatches,
  resolveItemIdsByCode,
  resolveItemIdsByName,
  updateImportBatchStatus,
} from "./repository.js"

/** Branches are now registered explicitly (see `admin/branches`) — letterhead data is no longer used to resolve or create one, just looked up by the id the upload was made against. */
async function requireBranch(branchId: string): Promise<BranchDocument> {
  const branch = await findBranchById(branchId)
  if (!branch) throw new NotFoundError("Branch not found")
  return branch
}

/** Blocks a file from landing under the wrong section (e.g. a Purchase Register uploaded as Sales) by checking its own title row. A sniff that doesn't recognize the file at all (null) is let through — parsing continues under the caller's expected type regardless, on its own terms (e.g. `EmptyImportError`) rather than this guard blocking an unrecognized-but-possibly-valid format. */
function assertReportKind(rows: SheetRow[], expected: FileTypeValue): void {
  const detected = detectReportKind(rows)
  if (detected && detected !== expected) throw new WrongFileTypeError(expected, detected)
}

const FILE_TYPE_LABEL: Record<FileTypeValue, string> = {
  [FileType.Stock]: "Stock",
  [FileType.Sales]: "Sales",
  [FileType.Purchase]: "Purchase",
  [FileType.DayWiseSale]: "Day-Wise Sale",
}

/** Only a super admin may overwrite data that's already been imported — a `branch_user` re-uploading for a date/type (or filename, for Day-Wise Sale) that already has a batch gets blocked instead of silently replacing it. */
function assertReplaceAllowed(fileType: FileTypeValue, actorRole: SystemRoleCode, forLabel: string): void {
  if (actorRole === SystemRoleCode.SUPER_ADMIN) return
  throw new ForbiddenError(`A ${FILE_TYPE_LABEL[fileType]} file for ${forLabel} has already been imported — only a super admin can replace it.`)
}

/**
 * Day-Wise Sale is exempt from the dated pipeline (one row per day, inherently multi-day) — it
 * still replaces by exact filename, as every file type did before this pipeline existed.
 * `excludeBatchId` is this import's own placeholder batch (already created before this runs) —
 * without excluding it, a same-filename re-upload would match its own not-yet-finished row
 * instead of the prior completed one. Runs inside `runImportPipeline`'s transaction (`dbClient`
 * is `tx`), so the delete is atomic with the insert that follows it.
 */
async function replaceExistingBatchByFilename(
  branchId: string,
  fileType: FileTypeValue,
  fileName: string,
  actorRole: SystemRoleCode,
  excludeBatchId: string,
  dbClient: DbOrTransaction,
): Promise<boolean> {
  const existing = await findImportBatch(branchId, fileType, fileName, excludeBatchId, dbClient)
  if (!existing) return false
  assertReplaceAllowed(fileType, actorRole, fileName)

  await deleteDailySalesSummaryByBatch(existing.id, dbClient)
  await deleteImportBatch(existing.id, dbClient)
  return true
}

/** Stock/Sales/Purchase are single-day-per-upload — re-uploading for a date that already has a batch (whatever the filename) replaces it, so corrections never duplicate. Same `excludeBatchId`/transactional-`dbClient` notes as `replaceExistingBatchByFilename`. */
async function replaceExistingBatchByDate(
  branchId: string,
  fileType: FileTypeValue,
  date: string,
  actorRole: SystemRoleCode,
  excludeBatchId: string,
  dbClient: DbOrTransaction,
): Promise<boolean> {
  const existing = await findImportBatchByDate(branchId, fileType, date, excludeBatchId, dbClient)
  if (!existing) return false
  assertReplaceAllowed(fileType, actorRole, date)

  switch (fileType) {
    case FileType.Stock:
      await deleteStockSnapshotsByBatch(existing.id, dbClient)
      break
    case FileType.Sales:
      await deleteSalesLinesByBatch(existing.id, dbClient)
      break
    case FileType.Purchase:
      await deletePurchaseLinesByBatch(existing.id, dbClient)
      break
  }
  await deleteImportBatch(existing.id, dbClient)
  return true
}

/**
 * Enforces Stock -> Purchase -> Sales, one date at a time, per branch:
 * - Stock for a new date is blocked while the branch's current open date still has
 *   Purchase and/or Sales pending.
 * - Purchase/Sales for a date is blocked until Stock exists for that exact date.
 * Re-uploading for a date that already has a batch of that type is always a "correction"
 * and skips these checks entirely (handled by `replaceExistingBatchByDate` instead). Always reads
 * committed state (`db`, never a transaction) — by the time this runs for a given file, every
 * earlier file in the commit order has already fully committed or failed.
 */
async function assertUploadAllowed(branchId: string, fileType: FileTypeValue, date: string): Promise<void> {
  if (await hasBatchForDate(branchId, fileType, date)) return // correction to an existing date — always allowed

  if (fileType === FileType.Stock) {
    const openStockDate = await findLatestBatchDate(branchId, FileType.Stock)
    if (!openStockDate) return // first-ever upload for this branch

    const [purchaseDone, salesDone] = await Promise.all([
      hasBatchForDate(branchId, FileType.Purchase, openStockDate),
      hasBatchForDate(branchId, FileType.Sales, openStockDate),
    ])
    if (purchaseDone && salesDone) return // previous cycle closed — free to start a new date

    const pending = [!purchaseDone && "Purchase", !salesDone && "Sales"].filter(Boolean).join(" and ")
    throw new OutOfSequenceError(
      `${pending} for ${openStockDate} still pending — finish that before uploading Stock for a new date (${date}).`,
    )
  }

  // Purchase or Sales
  if (!(await hasBatchForDate(branchId, FileType.Stock, date))) {
    const label = fileType === FileType.Purchase ? "Purchase" : "Sales"
    throw new OutOfSequenceError(`Upload Stock for ${date} before ${label} for that date.`)
  }
}

// ---- Row-builders — pure, shared by every commit path ----

function buildStockSnapshotRows(
  rows: ParsedStockRow[],
  branchId: string,
  batchId: string,
  asOfDate: string,
  itemIdByCode: Map<string, string>,
): NewStockSnapshotDocument[] {
  return rows.map((row) => ({
    branchId,
    itemId: itemIdByCode.get(row.itemCode) ?? null,
    importBatchId: batchId,
    asOfDate,
    itemCode: row.itemCode,
    itemName: row.itemName,
    unit: row.unit,
    currentStock: row.currentStock,
    costPrice: row.costPrice,
    value: row.value,
    mrp: row.mrp,
    purchasePrice: row.purchasePrice,
    salesPrice: row.salesPrice,
    company: row.company,
    manufacturer: row.manufacturer,
    batch: row.batch,
    mfgDateRaw: row.mfgDateRaw,
    expDate: row.expDate,
    supplier: row.supplier,
    invNo: row.invNo,
    invDate: row.invDate,
    rackNo: row.rackNo,
    salesSchemeDeal: row.salesSchemeDeal,
    salesSchemeFree: row.salesSchemeFree,
    purcSchemeDeal: row.purcSchemeDeal,
    purcSchemeFree: row.purcSchemeFree,
    recDate: row.recDate,
  }))
}

function buildSalesLineRows(
  rows: ParsedSalesRow[],
  branchId: string,
  batchId: string,
  reportDateFrom: string,
  reportDateTo: string,
  itemIdByName: Map<string, string>,
): NewSalesLineDocument[] {
  return rows.map((row) => ({
    branchId,
    itemId: itemIdByName.get(normalizeItemName(row.itemNameRaw)) ?? null,
    importBatchId: batchId,
    reportDateFrom,
    reportDateTo,
    partyGroup: row.partyGroup,
    itemNameRaw: row.itemNameRaw,
    packSizeRaw: row.packSizeRaw,
    qty: row.qty,
    unit: row.unit,
    rate: row.rate,
    amount: row.amount,
    pctContribution: row.pctContribution,
  }))
}

function buildPurchaseLineRows(
  rows: ParsedPurchaseRow[],
  branchId: string,
  batchId: string,
  reportDateFrom: string,
  reportDateTo: string,
  itemIdByName: Map<string, string>,
): NewPurchaseLineDocument[] {
  return rows.map((row) => ({
    branchId,
    itemId: itemIdByName.get(normalizeItemName(row.itemNameRaw)) ?? null,
    importBatchId: batchId,
    reportDateFrom,
    reportDateTo,
    supplierGroup: row.supplierGroup,
    itemNameRaw: row.itemNameRaw,
    packSizeRaw: row.packSizeRaw,
    qty: row.qty,
    freeQty: row.freeQty,
    rate: row.rate,
    amount: row.amount,
    pctContribution: row.pctContribution,
    schemePct: row.schemePct,
  }))
}

function buildDailySalesSummaryRows(rows: ParsedDaySalesRow[], branchId: string, batchId: string): NewDailySalesSummaryDocument[] {
  return rows.map((row) => ({
    branchId,
    importBatchId: batchId,
    date: row.date,
    billNoRange: row.billNoRange,
    billValue: row.billValue,
    taxable: row.taxable,
    taxPayable: row.taxPayable,
    taxFree: row.taxFree,
    exempted: row.exempted,
    roundOff: row.roundOff,
  }))
}

/** Inserts in chunks (rather than one statement) purely to report live progress — all chunks still run inside the caller's transaction, so atomicity is unaffected: either every chunk lands or (on any failure) none do. */
const INSERT_CHUNK_SIZE = 500

async function insertRowsWithProgress<T>(
  rows: T[],
  chunkSize: number,
  insertChunk: (chunk: T[]) => Promise<number>,
  onProgress: (processed: number, total: number) => void,
): Promise<number> {
  let processed = 0
  for (let i = 0; i < rows.length; i += chunkSize) {
    processed += await insertChunk(rows.slice(i, i + chunkSize))
    onProgress(processed, rows.length)
  }
  return processed
}

// ---- Shared pipeline: an already-parsed, already-structurally-valid file, ready to commit ----

type PreparedImport =
  | { kind: typeof FileType.Stock; batchId: string; branchId: string; fileName: string; asOfDate: string; rows: ParsedStockRow[] }
  | { kind: typeof FileType.Sales; batchId: string; branchId: string; fileName: string; reportDateFrom: string; reportDateTo: string; rows: ParsedSalesRow[] }
  | { kind: typeof FileType.Purchase; batchId: string; branchId: string; fileName: string; reportDateFrom: string; reportDateTo: string; rows: ParsedPurchaseRow[] }
  | { kind: typeof FileType.DayWiseSale; batchId: string; branchId: string; fileName: string; rows: ParsedDaySalesRow[] }

type ValidatedParse =
  | { kind: typeof FileType.Stock; asOfDate: string; rows: ParsedStockRow[] }
  | { kind: typeof FileType.Sales; reportDateFrom: string; reportDateTo: string; rows: ParsedSalesRow[] }
  | { kind: typeof FileType.Purchase; reportDateFrom: string; reportDateTo: string; rows: ParsedPurchaseRow[] }
  | { kind: typeof FileType.DayWiseSale; rows: ParsedDaySalesRow[] }

/** Parses the already-loaded rows under a known type and runs the per-type structural checks (row count, date presence, single-day) every upload path needs — throws the same pre-existing error classes either way. */
function parseAndValidate(kind: FileTypeValue, rows: SheetRow[]): ValidatedParse {
  if (kind === FileType.Stock) {
    const parsed = parseStockFile(rows)
    if (parsed.rows.length === 0) throw new EmptyImportError(FileType.Stock)
    if (!parsed.asOfDate) throw new MissingDateError(FileType.Stock)
    return { kind: FileType.Stock, asOfDate: parsed.asOfDate, rows: parsed.rows }
  }

  if (kind === FileType.Sales) {
    const parsed = parseSalesFile(rows)
    if (parsed.rows.length === 0) throw new EmptyImportError(FileType.Sales)
    if (!parsed.reportDateFrom || !parsed.reportDateTo) throw new MissingDateError(FileType.Sales)
    if (parsed.reportDateFrom !== parsed.reportDateTo) throw new MultiDayFileError(parsed.reportDateFrom, parsed.reportDateTo)
    return { kind: FileType.Sales, reportDateFrom: parsed.reportDateFrom, reportDateTo: parsed.reportDateTo, rows: parsed.rows }
  }

  if (kind === FileType.Purchase) {
    const parsed = parsePurchaseFile(rows)
    if (parsed.rows.length === 0) throw new EmptyImportError(FileType.Purchase)
    if (!parsed.reportDateFrom || !parsed.reportDateTo) throw new MissingDateError(FileType.Purchase)
    if (parsed.reportDateFrom !== parsed.reportDateTo) throw new MultiDayFileError(parsed.reportDateFrom, parsed.reportDateTo)
    return { kind: FileType.Purchase, reportDateFrom: parsed.reportDateFrom, reportDateTo: parsed.reportDateTo, rows: parsed.rows }
  }

  // Day-Wise Sale
  const parsed = parseDaySalesFile(rows)
  if (parsed.rows.length === 0) throw new EmptyImportError(FileType.DayWiseSale)
  return { kind: FileType.DayWiseSale, rows: parsed.rows }
}

function toPreparedImport(validated: ValidatedParse, branchId: string, batchId: string, fileName: string): PreparedImport {
  switch (validated.kind) {
    case FileType.Stock:
      return { kind: FileType.Stock, batchId, branchId, fileName, asOfDate: validated.asOfDate, rows: validated.rows }
    case FileType.Sales:
      return { kind: FileType.Sales, batchId, branchId, fileName, reportDateFrom: validated.reportDateFrom, reportDateTo: validated.reportDateTo, rows: validated.rows }
    case FileType.Purchase:
      return { kind: FileType.Purchase, batchId, branchId, fileName, reportDateFrom: validated.reportDateFrom, reportDateTo: validated.reportDateTo, rows: validated.rows }
    case FileType.DayWiseSale:
      return { kind: FileType.DayWiseSale, batchId, branchId, fileName, rows: validated.rows }
  }
}

function preparedDate(prepared: PreparedImport): string | null {
  if (prepared.kind === FileType.Stock) return prepared.asOfDate
  if (prepared.kind === FileType.DayWiseSale) return null
  return prepared.reportDateFrom
}

/**
 * Commits an already-parsed, already-structurally-valid file — the one place that does the "slow"
 * work (sequence gate, replace-if-existing, item resolution, row insert), called once it's this
 * file's turn in the commit order. Never throws: every outcome (success or failure) is written to
 * the batch row and pushed over the socket, since nothing is awaiting this beyond a background loop.
 */
async function runImportPipeline(prepared: PreparedImport, actorRole: SystemRoleCode): Promise<void> {
  try {
    const date = preparedDate(prepared)
    if (date) await assertUploadAllowed(prepared.branchId, prepared.kind, date)

    let rowCount = 0
    await db.transaction(async (tx) => {
      if (prepared.kind === FileType.DayWiseSale) {
        await replaceExistingBatchByFilename(prepared.branchId, prepared.kind, prepared.fileName, actorRole, prepared.batchId, tx)
      } else {
        await replaceExistingBatchByDate(prepared.branchId, prepared.kind, date!, actorRole, prepared.batchId, tx)
      }

      const onProgress = (processed: number, total: number) =>
        emitImportBatchProgress({ batchId: prepared.batchId, branchId: prepared.branchId, fileType: prepared.kind, rowsProcessed: processed, totalRows: total })

      switch (prepared.kind) {
        case FileType.Stock: {
          const itemIdByCode = await resolveItemIdsByCode(
            prepared.rows.map((row) => ({ code: row.itemCode, name: row.itemName, unit: row.unit, company: row.company, manufacturer: row.manufacturer })),
            tx,
          )
          rowCount = await insertRowsWithProgress(
            buildStockSnapshotRows(prepared.rows, prepared.branchId, prepared.batchId, prepared.asOfDate, itemIdByCode),
            INSERT_CHUNK_SIZE,
            (chunk) => insertStockSnapshots(chunk, tx),
            onProgress,
          )
          break
        }
        case FileType.Sales: {
          const itemIdByName = await resolveItemIdsByName(prepared.rows.map((row) => row.itemNameRaw), tx)
          rowCount = await insertRowsWithProgress(
            buildSalesLineRows(prepared.rows, prepared.branchId, prepared.batchId, prepared.reportDateFrom, prepared.reportDateTo, itemIdByName),
            INSERT_CHUNK_SIZE,
            (chunk) => insertSalesLines(chunk, tx),
            onProgress,
          )
          break
        }
        case FileType.Purchase: {
          const itemIdByName = await resolveItemIdsByName(prepared.rows.map((row) => row.itemNameRaw), tx)
          rowCount = await insertRowsWithProgress(
            buildPurchaseLineRows(prepared.rows, prepared.branchId, prepared.batchId, prepared.reportDateFrom, prepared.reportDateTo, itemIdByName),
            INSERT_CHUNK_SIZE,
            (chunk) => insertPurchaseLines(chunk, tx),
            onProgress,
          )
          break
        }
        case FileType.DayWiseSale:
          rowCount = await insertRowsWithProgress(
            buildDailySalesSummaryRows(prepared.rows, prepared.branchId, prepared.batchId),
            INSERT_CHUNK_SIZE,
            (chunk) => insertDailySalesSummary(chunk, tx),
            onProgress,
          )
          break
      }
    })

    await updateImportBatchStatus(prepared.batchId, { status: "completed", date, rowCount })
    emitImportBatchUpdate({ batchId: prepared.batchId, branchId: prepared.branchId, fileType: prepared.kind, fileName: prepared.fileName, status: "completed", rowCount })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error while importing this file"
    await updateImportBatchStatus(prepared.batchId, { status: "failed", errorMessage })
    emitImportBatchUpdate({ batchId: prepared.batchId, branchId: prepared.branchId, fileType: prepared.kind, fileName: prepared.fileName, status: "failed", errorMessage })
  }
}

// ---- Single-file upload — instant ack, background pipeline ----

export async function importFile(input: UploadFileDto): Promise<UploadAckDto> {
  const branch = await requireBranch(input.branchId)
  const batch = await createImportBatch({ branchId: branch.id, fileType: input.fileType, fileName: input.fileName, rowCount: 0, status: "processing" })
  emitImportBatchUpdate({ batchId: batch.id, branchId: branch.id, fileType: input.fileType, fileName: input.fileName, status: "processing" })

  // Not awaited — see `processBulkFilesInBackground` below for why this is safe/expected.
  void processSingleFileInBackground(branch, input, batch.id)

  return { batchId: batch.id, branchId: branch.id, branchName: branch.name, fileType: input.fileType, fileName: input.fileName }
}

async function processSingleFileInBackground(branch: BranchDocument, input: UploadFileDto, batchId: string): Promise<void> {
  try {
    const rows = readWorkbookRows(input.buffer)
    assertReportKind(rows, input.fileType)
    const validated = parseAndValidate(input.fileType, rows)
    const prepared = toPreparedImport(validated, branch.id, batchId, input.fileName)
    await runImportPipeline(prepared, input.actorRole)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error while importing this file"
    await updateImportBatchStatus(batchId, { status: "failed", errorMessage })
    emitImportBatchUpdate({ batchId, branchId: branch.id, fileType: input.fileType, fileName: input.fileName, status: "failed", errorMessage })
  }
}

// ---- Bulk upload — instant ack, background two-phase pipeline (super_admin only, enforced at the route) ----

const TYPE_PRIORITY: Record<FileTypeValue, number> = {
  [FileType.Stock]: 0,
  [FileType.Purchase]: 1,
  [FileType.Sales]: 2,
  [FileType.DayWiseSale]: 3,
}

/** Day-Wise Sale has no date — sort it after every dated file; order among multiple Day-Wise Sale files doesn't matter. */
function commitDateKey(prepared: PreparedImport): string {
  return preparedDate(prepared) ?? "9999-12-31"
}

/** Turns whatever order the user attached files in into the order they must actually commit in: date ascending, then Stock -> Purchase -> Sales within a date. */
function compareCommitOrder(a: PreparedImport, b: PreparedImport): number {
  const dateCompare = commitDateKey(a).localeCompare(commitDateKey(b))
  return dateCompare !== 0 ? dateCompare : TYPE_PRIORITY[a.kind] - TYPE_PRIORITY[b.kind]
}

/** Phase A per file: detect type, create its placeholder row immediately (so the table fills in fast), parse + structurally validate. Returns null if the file couldn't be handled at all (unrecognized type, or a structural failure) — either way the failure is already recorded/emitted, nothing left for the caller to do with it. */
async function prepareBulkFile(branch: BranchDocument, fileName: string, buffer: Buffer): Promise<PreparedImport | null> {
  const rows = readWorkbookRows(buffer)
  const kind = detectReportKind(rows)
  if (!kind) {
    emitImportBatchUpdate({
      batchId: null,
      branchId: branch.id,
      fileType: null,
      fileName,
      status: "failed",
      errorMessage: "Could not identify this file's report type from its content — check the file format.",
    })
    return null
  }

  const batch = await createImportBatch({ branchId: branch.id, fileType: kind, fileName, rowCount: 0, status: "processing" })
  emitImportBatchUpdate({ batchId: batch.id, branchId: branch.id, fileType: kind, fileName, status: "processing" })

  try {
    const validated = parseAndValidate(kind, rows)
    return toPreparedImport(validated, branch.id, batch.id, fileName)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error while reading this file"
    await updateImportBatchStatus(batch.id, { status: "failed", errorMessage })
    emitImportBatchUpdate({ batchId: batch.id, branchId: branch.id, fileType: kind, fileName, status: "failed", errorMessage })
    return null
  }
}

async function processBulkFilesInBackground(branch: BranchDocument, files: BulkUploadFileInputDto[]): Promise<void> {
  // Phase A — parse & structurally validate every file; order doesn't matter yet.
  const ready: PreparedImport[] = []
  for (const file of files) {
    const prepared = await prepareBulkFile(branch, file.fileName, file.buffer)
    if (prepared) ready.push(prepared)
  }

  // Phase B — commit in pipeline order, sequentially (required for the Stock-before-Purchase/Sales
  // gate — each file's transaction fully commits or fails before the next one starts).
  const sorted = [...ready].sort(compareCommitOrder)
  for (const prepared of sorted) {
    await runImportPipeline(prepared, SystemRoleCode.SUPER_ADMIN)
  }
}

export async function bulkImportFiles(branchId: string, files: BulkUploadFileInputDto[]): Promise<BulkUploadAckDto> {
  const branch = await requireBranch(branchId)

  // Not awaited — this keeps running after `bulkImportFiles` returns (plain Node async execution,
  // no queue/worker needed). The whole point: the caller gets an instant ack, and every file's
  // status (processing -> completed/failed) shows up live via socket + the history table instead.
  void processBulkFilesInBackground(branch, files)

  return { receivedCount: files.length }
}

export async function getImportBatches(branchId?: string, fileType?: FileTypeValue): Promise<ImportBatchListItemDto[]> {
  const [batches, branches] = await Promise.all([listImportBatches(branchId, fileType), listBranches()])
  const branchNameById = new Map(branches.map((branch) => [branch.id, branch.name]))

  return batches.map((batch) => ({
    id: batch.id,
    branchId: batch.branchId,
    branchName: branchNameById.get(batch.branchId) ?? "",
    fileType: batch.fileType as FileTypeValue,
    fileName: batch.fileName,
    rowCount: batch.rowCount,
    status: batch.status,
    errorMessage: batch.errorMessage,
    importedAt: batch.importedAt,
  }))
}

/**
 * Deletes an import batch and every row it inserted — super_admin only (enforced at the route).
 * Reuses the exact same per-type `deleteXByBatch` primitives the replace-on-reupload flow already
 * calls (see `replaceExistingBatchByDate`/`replaceExistingBatchByFilename` above), just from a new
 * entry point instead of as part of a re-upload. A Stock batch whose date already has a completed
 * Purchase and/or Sales batch is blocked — those depend on Stock existing for that date, and
 * reverting Stock out from under them would leave them referencing a date with no Stock on record.
 */
export async function revertImportBatch(batchId: string): Promise<void> {
  const batch = await findImportBatchById(batchId)
  if (!batch) throw new NotFoundError("Import batch not found")

  if (batch.fileType === FileType.Stock && batch.date) {
    const [purchaseDone, salesDone] = await Promise.all([
      hasBatchForDate(batch.branchId, FileType.Purchase, batch.date),
      hasBatchForDate(batch.branchId, FileType.Sales, batch.date),
    ])
    const blockingLabel = [purchaseDone && "Purchase", salesDone && "Sales"].filter(Boolean).join(" and ")
    if (blockingLabel) throw new RevertBlockedError(blockingLabel, batch.date)
  }

  await db.transaction(async (tx) => {
    switch (batch.fileType) {
      case FileType.Stock:
        await deleteStockSnapshotsByBatch(batch.id, tx)
        break
      case FileType.Sales:
        await deleteSalesLinesByBatch(batch.id, tx)
        break
      case FileType.Purchase:
        await deletePurchaseLinesByBatch(batch.id, tx)
        break
      case FileType.DayWiseSale:
        await deleteDailySalesSummaryByBatch(batch.id, tx)
        break
    }
    await deleteImportBatch(batch.id, tx)
  })
}

/**
 * Drives the Import page's "what do I upload next" guidance from the same source of truth the
 * upload gate itself checks (`assertUploadAllowed`) — `openDate` is the branch's latest Stock
 * date, whether or not its Purchase/Sales are done yet; null means no Stock has ever been uploaded.
 */
export async function getUploadCycleStatus(branchId: string): Promise<UploadCycleStatusDto> {
  const openDate = await findLatestBatchDate(branchId, FileType.Stock)
  if (!openDate) return { openDate: null, stockDone: false, purchaseDone: false, salesDone: false }

  const [purchaseDone, salesDone] = await Promise.all([
    hasBatchForDate(branchId, FileType.Purchase, openDate),
    hasBatchForDate(branchId, FileType.Sales, openDate),
  ])

  return { openDate, stockDone: true, purchaseDone, salesDone }
}
