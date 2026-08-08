"use client"

import { useRef, useState } from "react"
import type { AxiosProgressEvent } from "axios"
import { UploadSimpleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { ButtonVariant, CustomButton, CustomCard, CustomProgress, CustomTooltip, customToast, renderStatusCell, type StatusColorMap } from "@/components/ui"
import { CustomColor } from "@/lib/types"
import type { ApiErrorPayload } from "@/lib/axios"
import { useUploadFile } from "../hooks/use-uploads"
import { useImportProgressStore } from "../hooks/use-import-progress-store"
import { useImportStatusStore } from "../hooks/use-import-status-store"
import type { ImportFileType } from "../types"

type FileUploadSlotProps = {
  fileType: ImportFileType
  title: string
  description: string
  branchId?: string
}

type FileStatus = "processing" | "completed" | "failed"

const STATUS_COLOR_MAP: StatusColorMap<FileStatus> = {
  processing: CustomColor.warning,
  completed: CustomColor.success,
  failed: CustomColor.danger,
}

export function FileUploadSlot({ fileType, title, description, branchId }: FileUploadSlotProps) {
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
    if (!file || !branchId) return

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
    <CustomCard className="space-y-3 p-5">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <input ref={inputRef} type="file" accept=".xls,.xlsx" className="hidden" onChange={handleFileChange} disabled={!branchId} />
      <CustomButton
        variant={ButtonVariant.outline}
        loading={isPending}
        isDisabled={!branchId}
        onClick={() => inputRef.current?.click()}
        fullWidth
      >
        <UploadSimpleIcon className="size-4" />
        {isPending ? t("importing") : t("chooseFile")}
      </CustomButton>

      {/* Transfer progress — the POST body reaching the server. */}
      {transferProgress !== null && <CustomProgress progress={transferProgress} className="w-full" />}

      {/* Row-insert progress / final outcome for the file just submitted — same live data the
          history table below reads, surfaced right here too so it's not easy to miss. */}
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
