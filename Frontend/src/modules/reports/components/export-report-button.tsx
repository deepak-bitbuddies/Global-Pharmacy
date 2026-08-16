"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ClockCounterClockwiseIcon, DownloadSimpleIcon, ExportIcon } from "@phosphor-icons/react"

import {
  ButtonVariant,
  CustomButton,
  CustomPopover,
  CustomProgress,
  PopoverPlacementEnum,
  customToast,
  renderStatusCell,
  type StatusColorMap,
} from "@/components/ui"
import { CustomColor } from "@/lib/types"
import type { ApiErrorPayload } from "@/lib/axios"
import { useAuthStore } from "@/providers"
import { downloadBlob } from "@/utils/download"
import { formatNumber } from "@/utils/formatting"
import { downloadExportJob } from "../api/reports-api"
import { useExpiryTierOptions } from "./filters/expiry-tier-filter"
import { useSchemeTierOptions } from "./filters/scheme-tier-filter"
import { useImportProgressStore } from "../hooks/use-import-progress-store"
import { useBranches, useCreateExportJob, useExportJobs } from "../hooks/use-reports"
import type { ExportJob, ReportFilters, ReportType } from "../types"

type ExportJobStatus = "processing" | "completed" | "failed"

const STATUS_COLOR_MAP: StatusColorMap<ExportJobStatus> = {
  processing: CustomColor.warning,
  completed: CustomColor.success,
  failed: CustomColor.danger,
}

type ExportReportButtonProps = {
  reportType: ReportType
  filters: ReportFilters
}

/** "500 – 1000" when both bounds are set, "≥ 500" / "≤ 1000" when only one is — same shape as `filter-chips.tsx`'s helper, kept local since it's four lines and the two files don't otherwise share code. */
function rangeLabel(from: number | undefined, to: number | undefined): string {
  if (from !== undefined && to !== undefined) return `${from} – ${to}`
  if (from !== undefined) return `≥ ${from}`
  return `≤ ${to}`
}

/** Turns a job's saved filter snapshot into a short, readable line — so a past export is identifiable at a glance instead of just a timestamp. */
function formatFilterSummary(
  filters: ReportFilters,
  branchName: string | undefined,
  schemeTierOptions: { id: string; label: string }[],
  expiryTierOptions: { id: string; label: string }[],
): string[] {
  const parts: string[] = []
  if (filters.branchId) parts.push(branchName ?? filters.branchId)
  if (filters.dateFrom && filters.dateTo) parts.push(`${filters.dateFrom} – ${filters.dateTo}`)
  if (filters.item) parts.push(`"${filters.item}"`)
  if (filters.company) parts.push(filters.company)
  if (filters.supplier) parts.push(filters.supplier)
  if (filters.supplierGroup) parts.push(filters.supplierGroup)
  if (filters.schemeTier) parts.push(schemeTierOptions.find((option) => option.id === filters.schemeTier)?.label ?? filters.schemeTier)
  if (filters.expiryTier) parts.push(expiryTierOptions.find((option) => option.id === filters.expiryTier)?.label ?? filters.expiryTier)
  if (filters.stockFrom !== undefined || filters.stockTo !== undefined) parts.push(rangeLabel(filters.stockFrom, filters.stockTo))
  if (filters.amountFrom !== undefined || filters.amountTo !== undefined) parts.push(rangeLabel(filters.amountFrom, filters.amountTo))
  return parts
}

/**
 * Export, background-processed exactly like bulk upload: click -> instant ack (job row appears
 * "processing") -> real work (query + build the XLSX) happens server-side, status/progress pushed
 * live over the same socket `useImportSocket` already handles for imports. The history icon next
 * to the button opens a small popover listing this report's recent export jobs (scoped to the
 * currently-selected branch, same as the report itself), each showing what filters produced it,
 * its row count once done, and a Download link — or the failure reason, if it failed.
 */
export function ExportReportButton({ reportType, filters }: ExportReportButtonProps) {
  const t = useTranslations("Common")
  const role = useAuthStore((state) => state.user?.role)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const { mutate, isPending } = useCreateExportJob()
  const { data: jobs } = useExportJobs(reportType, filters.branchId)
  const { data: branches } = useBranches()
  const schemeTierOptions = useSchemeTierOptions()
  const expiryTierOptions = useExpiryTierOptions()
  const progressByJob = useImportProgressStore((state) => state.progress)

  // Export is an admin capability — a branch_user only ever has their own branch's data anyway,
  // so exporting "with filters applied" doesn't add anything they can't already see on screen.
  if (role === "branch_user") return null

  const handleExport = () => {
    mutate(
      { reportType, filters },
      {
        onSuccess: () => {
          customToast.success(t("exportStarted"))
          setIsHistoryOpen(true)
        },
        onError: (error: ApiErrorPayload) => {
          customToast.danger(error.message || t("exportStartFailed"))
        },
      },
    )
  }

  const handleDownload = async (job: ExportJob) => {
    try {
      const { blob, fileName } = await downloadExportJob(job.id)
      downloadBlob(blob, fileName ?? `${job.reportType}-report.xlsx`)
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
                const branchName = branches?.find((branch) => branch.id === job.filters.branchId)?.name
                const summary = formatFilterSummary(job.filters, branchName, schemeTierOptions, expiryTierOptions)

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
                        renderExportStatusChip(job, t)
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

function renderExportStatusChip(job: ExportJob, t: (key: string) => string) {
  return renderStatusCell<ExportJobStatus>(job.status, STATUS_COLOR_MAP, {
    processing: t("statusProcessing"),
    completed: t("statusCompleted"),
    failed: t("statusFailed"),
  })
}
