"use client"

import { useRef, useState } from "react"
import type { AxiosProgressEvent } from "axios"
import { UploadSimpleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { ButtonVariant, CustomButton, CustomCard, CustomProgress, CustomTooltip, customToast, renderStatusCell, type StatusColorMap } from "@/components/ui"
import { CustomColor, CustomSize } from "@/lib/types"
import type { ApiErrorPayload } from "@/lib/axios"
import { useUploadFile } from "../hooks/use-uploads"
import { useImportProgressStore } from "../hooks/use-import-progress-store"
import { useImportStatusStore } from "../hooks/use-import-status-store"
import { ImportBatchStatus, type ImportFileType } from "../types"

type FileUploadSlotProps = {
  fileType: ImportFileType
  title: string
  description: string
  branchId?: string
  /** Another file for this branch is still importing — choosing a new file is blocked until it finishes. */
  isLocked?: boolean
  /** The page is still loading what's due next / whether something is importing — uploading waits for that. */
  isCheckingStatus?: boolean
  onUploadStart?: () => void
}

const STATUS_COLOR_MAP: StatusColorMap<ImportBatchStatus> = {
  [ImportBatchStatus.Processing]: CustomColor.warning,
  [ImportBatchStatus.Completed]: CustomColor.success,
  [ImportBatchStatus.Failed]: CustomColor.danger,
}

export function FileUploadSlot({ fileType, title, description, branchId, isLocked = false, isCheckingStatus = false, onUploadStart }: FileUploadSlotProps) {
  const isDisabled = !branchId || isLocked || isCheckingStatus
  const t = useTranslations("Import")
  const inputRef = useRef<HTMLInputElement>(null)
  const [transferProgress, setTransferProgress] = useState<number | null>(null)
  const [active, setActive] = useState<{ batchId: string; fileName: string } | null>(null)
  const { mutate, isPending } = useUploadFile()
  const statusByFileName = useImportStatusStore((state) => state.byFileName)
  const progressByBatch = useImportProgressStore((state) => state.progress)

  // Only trust a status/progress entry once it actually names *this* upload's batch id — a stale
  // entry can otherwise linger under the same filename from an earlier, already-finished upload.
  const activeStatus = active && statusByFileName[active.fileName]?.batchId === active.batchId ? statusByFileName[active.fileName] : undefined
  const activeProgress = active ? progressByBatch[active.batchId] : undefined

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = "" // allow re-selecting the same file later
    if (!file || !branchId || isDisabled) return

    onUploadStart?.()
    setActive(null)
    setTransferProgress(0)
    const onUploadProgress = (progressEvent: AxiosProgressEvent) => {
      if (!progressEvent.total) return
      setTransferProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100))
    }

    mutate(
      { fileType, branchId, file, onUploadProgress },
      {
        onSuccess: (result) => {
          setTransferProgress(null)
          setActive({ batchId: result.batchId, fileName: result.fileName })
          customToast.success(t("importReceived", { fileName: result.fileName }))
        },
        onError: (error: ApiErrorPayload) => {
          setTransferProgress(null)
          customToast.danger(error.message || t("importFailed"))
        },
      },
    )
  }

  return (
    <CustomCard className="space-y-2 px-4 py-3">
      {/* The tab already shows the file's name, so only its description is repeated here. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{description}</p>
          {isLocked && !isPending && <p className="text-xs text-warning">{t("guide.lockedHint")}</p>}
        </div>
        <input ref={inputRef} type="file" accept=".xls,.xlsx" className="hidden" onChange={handleFileChange} disabled={isDisabled} aria-label={title} />
        <CustomButton
          className="shrink-0"
          variant={ButtonVariant.outline}
          size={CustomSize.sm}
          loading={isPending}
          isDisabled={isDisabled}
          onClick={() => inputRef.current?.click()}
          startContent={<UploadSimpleIcon className="size-4" />}
        >
          {isPending ? t("importing") : t("chooseFile")}
        </CustomButton>
      </div>

      {/* Transfer progress — the POST body reaching the server. */}
      {transferProgress !== null && <CustomProgress progress={transferProgress} className="w-full" />}

      {/* Row-insert progress / final outcome for the file just submitted — same live data the
          history table below reads, surfaced right here too so it's not easy to miss. */}
      {active && (
        <div className="flex items-center gap-2 rounded-app border border-default px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{active.fileName}</span>
          {(activeStatus?.status ?? ImportBatchStatus.Processing) === ImportBatchStatus.Processing && activeProgress ? (
            <div className="w-28 shrink-0 space-y-1">
              <CustomProgress progress={Math.round((activeProgress.rowsProcessed / activeProgress.totalRows) * 100)} className="w-full" />
              <p className="text-right text-xs text-muted-foreground">
                {activeProgress.rowsProcessed}/{activeProgress.totalRows}
              </p>
            </div>
          ) : (
            (() => {
              const status = activeStatus?.status ?? ImportBatchStatus.Processing
              const chip = renderStatusCell(status, STATUS_COLOR_MAP, {
                [ImportBatchStatus.Processing]: t("statusProcessing"),
                [ImportBatchStatus.Completed]: t("statusCompleted"),
                [ImportBatchStatus.Failed]: t("statusFailed"),
              })
              return status === ImportBatchStatus.Failed && activeStatus?.errorMessage ? (
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
