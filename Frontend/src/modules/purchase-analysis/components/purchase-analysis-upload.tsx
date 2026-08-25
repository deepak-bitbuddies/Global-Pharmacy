"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { UploadSimpleIcon } from "@phosphor-icons/react"

import { ButtonVariant, CustomButton, CustomCard, CustomProgress, CustomTooltip, customToast, renderStatusCell, type StatusColorMap } from "@/components/ui"
import { CustomColor } from "@/lib/types"
import type { ApiErrorPayload } from "@/lib/axios"
import { useImportProgressStore } from "@/modules/reports/hooks/use-import-progress-store"
import { useUploadPurchaseAnalysisFile } from "../hooks/use-purchase-analysis"
import { usePurchaseAnalysisImportStatusStore } from "../hooks/use-purchase-analysis-import-status-store"

type FileStatus = "processing" | "completed" | "failed"

const STATUS_COLOR_MAP: StatusColorMap<FileStatus> = {
  processing: CustomColor.warning,
  completed: CustomColor.success,
  failed: CustomColor.danger,
}

/**
 * File pick + instant ack — the actual parse/insert runs as a background job on the server (see
 * `purchase-analysis/service.ts`), with live status/progress streamed back over the same socket
 * every other import in this app uses. Not tied to a branch (this report isn't scoped that way).
 */
export function PurchaseAnalysisUpload() {
  const t = useTranslations("PurchaseAnalysis")
  const [file, setFile] = useState<File | null>(null)
  const [transferProgress, setTransferProgress] = useState<number | null>(null)
  const [active, setActive] = useState<{ batchId: string; fileName: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate, isPending } = useUploadPurchaseAnalysisFile()
  const statusByFileName = usePurchaseAnalysisImportStatusStore((state) => state.byFileName)
  const progressByBatch = useImportProgressStore((state) => state.progress)

  const activeStatus = active && statusByFileName[active.fileName]?.batchId === active.batchId ? statusByFileName[active.fileName] : undefined
  const activeProgress = active ? progressByBatch[active.batchId] : undefined

  const handleImport = () => {
    if (!file) return
    setActive(null)
    setTransferProgress(0)
    mutate(file, {
      onSuccess: (ack) => {
        setTransferProgress(null)
        setActive({ batchId: ack.batchId, fileName: ack.fileName })
        setFile(null)
        customToast.success(t("importReceived", { fileName: ack.fileName }))
      },
      onError: (error: ApiErrorPayload) => {
        setTransferProgress(null)
        customToast.danger(error.message || t("importFailed"))
      },
    })
  }

  return (
    <CustomCard className="space-y-3 p-5">
      <div>
        <p className="font-semibold">{t("importTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("importDescription")}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xls,.xlsx"
        className="hidden"
        onChange={(event) => {
          const picked = event.target.files?.[0]
          event.target.value = ""
          if (picked) setFile(picked)
        }}
      />

      <div className="flex items-center gap-2">
        <CustomButton variant={ButtonVariant.outline} onClick={() => inputRef.current?.click()} isDisabled={isPending} fullWidth>
          <UploadSimpleIcon className="size-4" />
          {file ? file.name : t("chooseFile")}
        </CustomButton>
      </div>

      <CustomButton variant={ButtonVariant.primary} loading={isPending} isDisabled={!file} onClick={handleImport} fullWidth>
        {isPending ? t("importing") : t("importButton")}
      </CustomButton>

      {transferProgress !== null && <CustomProgress progress={transferProgress} className="w-full" />}

      {active && (
        <div className="flex items-center gap-2 rounded-app border border-default px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{active.fileName}</span>
          {(activeStatus?.status ?? "processing") === "processing" && activeProgress ? (
            <div className="w-28 shrink-0 space-y-1">
              <CustomProgress progress={Math.round((activeProgress.rowsProcessed / activeProgress.totalRows) * 100)} className="w-full" />
              <p className="text-right text-xs text-muted-foreground">
                {activeProgress.rowsProcessed}/{activeProgress.totalRows}
              </p>
            </div>
          ) : (
            (() => {
              const status = activeStatus?.status ?? "processing"
              const chip = renderStatusCell(status, STATUS_COLOR_MAP, {
                processing: t("statusProcessing"),
                completed: t("statusCompleted"),
                failed: t("statusFailed"),
              })
              return status === "failed" && activeStatus?.errorMessage ? (
                <CustomTooltip trigger={chip}>
                  <p className="max-w-64 text-xs">{activeStatus.errorMessage}</p>
                </CustomTooltip>
              ) : (
                chip
              )
            })()
          )}
        </div>
      )}
    </CustomCard>
  )
}
