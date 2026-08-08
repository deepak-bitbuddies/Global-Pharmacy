"use client"

import { useRef, useState } from "react"
import type { AxiosProgressEvent } from "axios"
import { useTranslations } from "next-intl"
import { CloudArrowUpIcon, FileXlsIcon } from "@phosphor-icons/react"

import { ButtonVariant, CustomButton, CustomChip, CustomModal, CustomProgress, CustomTooltip, customToast, renderStatusCell, type StatusColorMap } from "@/components/ui"
import { CustomColor } from "@/lib/types"
import { cn } from "@/lib/utils"
import type { ApiErrorPayload } from "@/lib/axios"
import { useBulkUploadFiles } from "../hooks/use-uploads"
import { useImportProgressStore } from "../hooks/use-import-progress-store"
import { useImportStatusStore } from "../hooks/use-import-status-store"

type BulkUploadModalProps = {
  branchId: string
}

type FileStatus = "queued" | "processing" | "completed" | "failed"

const STATUS_COLOR_MAP: StatusColorMap<FileStatus> = {
  queued: CustomColor.default,
  processing: CustomColor.warning,
  completed: CustomColor.success,
  failed: CustomColor.danger,
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

/** Adds any new files to the selection, skipping ones already picked (by name + size). */
function mergeFiles(existing: File[], incoming: FileList | File[]): File[] {
  const merged = [...existing]
  for (const file of Array.from(incoming)) {
    if (!merged.some((f) => f.name === file.name && f.size === file.size)) merged.push(file)
  }
  return merged
}

/**
 * Super-admin-only multi-file upload: pick several sheets at once (Stock/Purchase/Sales/Day-Wise
 * Sale — each file's type is auto-detected server-side, no per-file picker). Nothing is validated
 * synchronously anymore — every file (parse, type/date validation, sequence gate, insert) is
 * processed in the background, in the correct Stock -> Purchase -> Sales commit order regardless
 * of what order they were attached in.
 *
 * Once submitted, the picker/dropzone is replaced by a live per-file status list — each file shows
 * "queued" until its `import-batch:update` "processing" event names a batch id, then a row-insert
 * progress bar (`useImportProgressStore`, keyed by that batch id) while it's actually inserting,
 * then a completed/failed chip. Correlating an event back to *this* file only works by filename
 * (`useImportStatusStore`) — the batch id isn't known until the background pipeline gets to it.
 */
export function BulkUploadModal({ branchId }: BulkUploadModalProps) {
  const t = useTranslations("Import")
  const inputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [transferProgress, setTransferProgress] = useState<number | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const { mutate, isPending } = useBulkUploadFiles()
  const statusByFileName = useImportStatusStore((state) => state.byFileName)
  const clearFileNames = useImportStatusStore((state) => state.clearFileNames)
  const progressByBatch = useImportProgressStore((state) => state.progress)

  const reset = () => {
    clearFileNames(files.map((file) => file.name))
    setFiles([])
    setTransferProgress(null)
    setIsDragOver(false)
    setHasSubmitted(false)
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = () => {
    if (files.length === 0 || !branchId) return
    setTransferProgress(0)
    const onUploadProgress = (progressEvent: AxiosProgressEvent) => {
      if (!progressEvent.total) return
      setTransferProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100))
    }

    mutate(
      { branchId, files, onUploadProgress },
      {
        onSuccess: (data) => {
          setTransferProgress(null)
          setHasSubmitted(true)
          customToast.success(t("bulkUploadProcessing", { count: String(data.receivedCount) }))
        },
        onError: (error: ApiErrorPayload) => {
          setTransferProgress(null)
          customToast.danger(error.message || t("importFailed"))
        },
      },
    )
  }

  return (
    <>
      <CustomButton variant={ButtonVariant.outline} startContent={<CloudArrowUpIcon className="size-4" />} onClick={() => setIsOpen(true)}>
        {t("bulkUpload")}
      </CustomButton>

      <CustomModal
        isOpen={isOpen}
        setIsOpen={(open) => {
          setIsOpen(open)
          if (!open) reset()
        }}
        title={t("bulkUploadTitle")}
        subTitle={t("bulkUploadSubtitle")}
        onNegativePress={() => setIsOpen(false)}
        positiveText={isPending ? t("importing") : t("bulkUploadSubmit")}
        onPositivePress={hasSubmitted ? undefined : handleUpload}
        loading={isPending}
      >
        <div className="space-y-4">
          {!hasSubmitted && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept=".xls,.xlsx"
                multiple
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) setFiles((prev) => mergeFiles(prev, event.target.files!))
                  event.target.value = ""
                }}
              />

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault()
                  setIsDragOver(true)
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setIsDragOver(false)
                  if (event.dataTransfer.files.length > 0) setFiles((prev) => mergeFiles(prev, event.dataTransfer.files))
                }}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-2 rounded-app border border-dashed px-6 py-8 text-center transition-colors",
                  isDragOver ? "border-primary bg-primary/5" : "border-default bg-muted-surface/30 hover:bg-muted-surface/50",
                )}
              >
                <CloudArrowUpIcon className={cn("size-8", isDragOver ? "text-primary" : "text-muted-foreground")} />
                <p className="text-sm font-medium text-foreground">{t("bulkUploadDropzoneTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("bulkUploadDropzoneHint")}</p>
              </button>

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{t("bulkUploadFilesSelected", { count: String(files.length) })}</p>
                  <div className="flex flex-wrap gap-2">
                    {files.map((file, index) => (
                      <CustomChip
                        key={`${file.name}-${file.size}-${index}`}
                        color={CustomColor.default}
                        startContent={<FileXlsIcon className="size-4 shrink-0 text-success" />}
                        onClose={() => removeFile(index)}
                      >
                        <span className="max-w-40 truncate">{file.name}</span>
                        <span className="ml-1 text-muted-foreground">{formatFileSize(file.size)}</span>
                      </CustomChip>
                    ))}
                  </div>
                </div>
              )}

              {/* Transfer progress — the POST body reaching the server. Everything after that
                  (parse/validate/insert) is backgrounded and tracked per file below once submitted. */}
              {transferProgress !== null && <CustomProgress progress={transferProgress} className="w-full" />}
            </>
          )}

          {hasSubmitted && (
            <div className="space-y-2">
              {files.map((file, index) => {
                const fileStatus = statusByFileName[file.name]
                const progress = fileStatus?.batchId ? progressByBatch[fileStatus.batchId] : undefined
                const status: FileStatus = fileStatus?.status ?? "queued"

                const chip = renderStatusCell<FileStatus>(status, STATUS_COLOR_MAP, {
                  queued: t("statusQueued"),
                  processing: t("statusProcessing"),
                  completed: t("statusCompleted"),
                  failed: t("statusFailed"),
                })

                return (
                  <div key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-app border border-default px-3 py-2">
                    <FileXlsIcon className="size-4 shrink-0 text-success" />
                    <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
                    {status === "processing" && progress ? (
                      <div className="w-32 shrink-0 space-y-1">
                        <CustomProgress progress={Math.round((progress.rowsProcessed / progress.totalRows) * 100)} className="w-full" />
                        <p className="text-right text-xs text-muted-foreground">
                          {progress.rowsProcessed}/{progress.totalRows}
                        </p>
                      </div>
                    ) : status === "failed" && fileStatus?.errorMessage ? (
                      <CustomTooltip trigger={chip}>
                        <p className="max-w-64 text-xs">{fileStatus.errorMessage}</p>
                      </CustomTooltip>
                    ) : (
                      chip
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CustomModal>
    </>
  )
}
