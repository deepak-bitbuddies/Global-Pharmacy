"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ClockCounterClockwiseIcon, DownloadSimpleIcon, ExportIcon } from "@phosphor-icons/react"

import { ButtonVariant, CustomButton, CustomPopover, CustomProgress, PopoverPlacementEnum, customToast, renderStatusCell, type StatusColorMap } from "@/components/ui"
import { CustomColor } from "@/lib/types"
import type { ApiErrorPayload } from "@/lib/axios"
import { downloadBlob } from "@/utils/download"
import { formatNumber } from "@/utils/formatting"
import { useImportProgressStore } from "@/modules/reports/hooks/use-import-progress-store"
import { downloadPurchaseAnalysisExportJob } from "../api/purchase-analysis-api"
import { useCreatePurchaseAnalysisExportJob, usePurchaseAnalysisExportJobs } from "../hooks/use-purchase-analysis"
import type { PurchaseAnalysisExportJob, PurchaseAnalysisFilters } from "../types"

type ExportJobStatus = "processing" | "completed" | "failed"

const STATUS_COLOR_MAP: StatusColorMap<ExportJobStatus> = {
  processing: CustomColor.warning,
  completed: CustomColor.success,
  failed: CustomColor.danger,
}

/** "500 – 1000" when both bounds are set, "≥ 500" / "≤ 1000" when only one is — same shape as Reports' `export-report-button.tsx`'s helper. */
function rangeLabel(from: number | undefined, to: number | undefined): string {
  if (from !== undefined && to !== undefined) return `${from} – ${to}`
  if (from !== undefined) return `≥ ${from}`
  return `≤ ${to}`
}

/** Turns a job's saved filter snapshot into a short, readable line — same purpose as Reports' `formatFilterSummary`, just this module's own filter shape (no `branchId`-style FK scoping — `branch` here is a free-text distinct value like `company`). */
function formatFilterSummary(filters: PurchaseAnalysisFilters): string[] {
  const parts: string[] = []
  if (filters.dateFrom && filters.dateTo) parts.push(`${filters.dateFrom} – ${filters.dateTo}`)
  if (filters.partyName?.length) parts.push(filters.partyName.join(", "))
  if (filters.itemName?.length) parts.push(filters.itemName.map((name) => `"${name}"`).join(", "))
  if (filters.company?.length) parts.push(filters.company.join(", "))
  if (filters.branch?.length) parts.push(filters.branch.join(", "))
  if (filters.type?.length) parts.push(filters.type.join(", "))
  if (filters.area?.length) parts.push(filters.area.join(", "))
  if (filters.route?.length) parts.push(filters.route.join(", "))
  if (filters.search) parts.push(`"${filters.search}"`)
  if (filters.amountFrom !== undefined || filters.amountTo !== undefined) parts.push(rangeLabel(filters.amountFrom, filters.amountTo))
  if (filters.qtyFrom !== undefined || filters.qtyTo !== undefined) parts.push(rangeLabel(filters.qtyFrom, filters.qtyTo))
  return parts
}

/**
 * Party Wise Analysis' own export button — same background-job UX as Reports' `ExportReportButton`
 * (click -> instant ack -> live status/progress over the shared `export-job:*` socket events ->
 * history popover with a Download link), reusing the exact same `export_jobs` table/CRUD server-side
 * (see `reports/model.ts`) rather than a parallel implementation. Simpler than Reports' version since
 * this module isn't branch-scoped and has no scheme/expiry-tier filters to describe.
 */
export function PurchaseAnalysisExportButton({ filters }: { filters: PurchaseAnalysisFilters }) {
  const t = useTranslations("Common")
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const { mutate, isPending } = useCreatePurchaseAnalysisExportJob()
  const { data: jobs } = usePurchaseAnalysisExportJobs()
  const progressByJob = useImportProgressStore((state) => state.progress)

  const handleExport = () => {
    mutate(filters, {
      onSuccess: () => {
        customToast.success(t("exportStarted"))
        setIsHistoryOpen(true)
      },
      onError: (error: ApiErrorPayload) => {
        customToast.danger(error.message || t("exportStartFailed"))
      },
    })
  }

  const handleDownload = async (job: PurchaseAnalysisExportJob) => {
    try {
      const { blob, fileName } = await downloadPurchaseAnalysisExportJob(job.id)
      downloadBlob(blob, fileName ?? "party-wise-analysis.xlsx")
    } catch (error) {
      customToast.danger((error as ApiErrorPayload).message || t("downloadFailed"))
    }
  }

  return (
    <div className="flex items-center gap-1">
      <CustomButton variant={ButtonVariant.outline} loading={isPending} onClick={handleExport} startContent={<ExportIcon className="size-4" />}>
        {isPending ? t("exporting") : t("export")}
      </CustomButton>

      <CustomPopover
        isOpen={isHistoryOpen}
        setIsOpen={setIsHistoryOpen}
        ariaLabel={t("exportHistory")}
        placement={PopoverPlacementEnum.bottom}
        trigger={
          <CustomButton variant={ButtonVariant.ghost} isIconOnly>
            <ClockCounterClockwiseIcon className="size-4" />
          </CustomButton>
        }
      >
        <div className="w-96 space-y-2 p-2">
          <p className="text-xs font-semibold text-muted-foreground">{t("exportHistory")}</p>
          {!jobs || jobs.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">{t("noExports")}</p>
          ) : (
            <div className="max-h-72 space-y-1.5 overflow-y-auto">
              {jobs.map((job) => {
                const progress = progressByJob[job.id]
                const summary = formatFilterSummary(job.filters)

                return (
                  <div key={job.id} className="space-y-1 rounded-app border border-default px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{new Date(job.requestedAt).toLocaleString()}</span>
                      {job.status === "processing" && progress ? (
                        <div className="w-20 shrink-0 space-y-0.5">
                          <CustomProgress progress={Math.round((progress.rowsProcessed / progress.totalRows) * 100)} className="w-full" />
                          <p className="text-right text-[10px] text-muted-foreground">
                            {progress.rowsProcessed}/{progress.totalRows}
                          </p>
                        </div>
                      ) : job.status === "completed" ? (
                        <CustomButton variant={ButtonVariant.ghost} className="h-7 shrink-0 px-2 text-xs" onClick={() => handleDownload(job)}>
                          <DownloadSimpleIcon className="size-3.5" />
                          {t("download")}
                        </CustomButton>
                      ) : (
                        renderStatusCell<ExportJobStatus>(job.status, STATUS_COLOR_MAP, {
                          processing: t("statusProcessing"),
                          completed: t("statusCompleted"),
                          failed: t("statusFailed"),
                        })
                      )}
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {summary.length > 0 ? summary.join(" · ") : t("allData")}
                      {job.status === "completed" && ` · ${formatNumber(job.rowCount)} ${t("rows")}`}
                    </p>
                    {job.status === "failed" && job.errorMessage && <p className="text-[11px] text-danger">{job.errorMessage}</p>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CustomPopover>
    </div>
  )
}
