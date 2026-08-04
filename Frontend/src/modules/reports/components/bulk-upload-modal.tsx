"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { CloudArrowUpIcon, FileXlsIcon } from "@phosphor-icons/react"

import { ButtonVariant, CustomButton, CustomChip, CustomModal, customToast } from "@/components/ui"
import { CustomColor } from "@/lib/types"
import { cn } from "@/lib/utils"
import type { ApiErrorPayload } from "@/lib/axios"
import { useBulkUploadFiles } from "../hooks/use-uploads"
import type { BulkUploadResult } from "../types"

type BulkUploadModalProps = {
  branchId: string
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
 * Sale — each file's type is auto-detected server-side, no per-file picker). Obviously-bad files
 * (wrong type, multi-day) come back rejected immediately in the response; accepted files land as
 * "processing" rows that flip to completed/failed live via `useImportSocket`, visible in the
 * per-type history tables below rather than in this modal.
 */
export function BulkUploadModal({ branchId }: BulkUploadModalProps) {
  const t = useTranslations("Import")
  const inputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<BulkUploadResult | null>(null)
  const { mutate, isPending } = useBulkUploadFiles()

  const reset = () => {
    setFiles([])
    setResult(null)
    setIsDragOver(false)
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = () => {
    if (files.length === 0 || !branchId) return
    mutate(
      { branchId, files },
      {
        onSuccess: (data) => {
          setResult(data)
          setFiles([])
          if (data.rejected.length === 0) {
            customToast.success(t("bulkUploadAllAccepted", { count: String(data.accepted.length) }))
          } else {
            customToast.danger(t("bulkUploadSomeRejected", { accepted: String(data.accepted.length), rejected: String(data.rejected.length) }))
          }
        },
        onError: (error: ApiErrorPayload) => {
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
        onPositivePress={handleUpload}
        loading={isPending}
      >
        <div className="space-y-4">
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

          {result && (
            <div className="space-y-3">
              {result.accepted.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-success">{t("bulkUploadAcceptedHeading", { count: String(result.accepted.length) })}</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                    {result.accepted.map((item) => (
                      <li key={item.batchId}>
                        {item.fileName}
                        {item.date ? ` — ${item.date}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.rejected.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-danger">{t("bulkUploadRejectedHeading", { count: String(result.rejected.length) })}</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-danger">
                    {result.rejected.map((item, index) => (
                      <li key={`${item.fileName}-${index}`}>
                        {item.fileName}: {item.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </CustomModal>
    </>
  )
}
