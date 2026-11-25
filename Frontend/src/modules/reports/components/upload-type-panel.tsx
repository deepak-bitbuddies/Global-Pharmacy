"use client"

import { useTranslations } from "next-intl"
import { ArrowCounterClockwiseIcon, InfoIcon } from "@phosphor-icons/react"

import { CustomColor } from "@/lib/types"
import {
  ButtonVariant,
  ConfirmVariant,
  CustomButton,
  CustomCard,
  CustomProgress,
  CustomSection,
  CustomTable,
  CustomTooltip,
  customToast,
  renderStatusCell,
  useConfirm,
  type StatusColorMap,
} from "@/components/ui"
import type { ApiErrorPayload } from "@/lib/axios"
import { useAuthStore } from "@/providers"
import { FileUploadSlot } from "./file-upload-slot"
import { useImportBatches, useRevertImportBatch } from "../hooks/use-uploads"
import { useImportProgressStore } from "../hooks/use-import-progress-store"
import { ImportBatchStatus, type ImportBatch, type ImportFileType } from "../types"

const STATUS_COLOR_MAP: StatusColorMap<ImportBatchStatus> = {
  [ImportBatchStatus.Processing]: CustomColor.warning,
  [ImportBatchStatus.Completed]: CustomColor.success,
  [ImportBatchStatus.Failed]: CustomColor.danger,
}

type UploadTypePanelProps = {
  fileType: ImportFileType
  title: string
  description: string
  branchId: string
  isLocked: boolean
  isCheckingStatus: boolean
  onUploadStart: () => void
  /** Only the file that's due next (and Day-Wise Sale) gets an upload box — every other tab just shows its history, so there's never a wrong "Choose file" button to press. */
  showUpload: boolean
  /** One short line telling the user what's due instead, shown in place of the upload box. */
  notDueMessage?: string
}

/** One tab's content on the Import page: the upload slot for this file type, plus its own history — never mixed with the other file types' history. */
export function UploadTypePanel({ fileType, title, description, branchId, isLocked, isCheckingStatus, onUploadStart, showUpload, notDueMessage }: UploadTypePanelProps) {
  const t = useTranslations("Import")
  const role = useAuthStore((state) => state.user?.role)
  const isSuperAdmin = role === "super_admin"
  const { data: batches, isLoading } = useImportBatches(branchId, fileType)
  const progressByBatch = useImportProgressStore((state) => state.progress)
  const { mutateAsync: revertBatch, isPending: isReverting } = useRevertImportBatch()
  const confirm = useConfirm()

  const handleRevert = async (batch: ImportBatch) => {
    const confirmed = await confirm({
      title: t("revertTitle", { fileName: batch.fileName }),
      description: t("revertDescription"),
      variant: ConfirmVariant.danger,
      confirmLabel: t("revert"),
    })
    if (!confirmed) return

    try {
      await revertBatch(batch.id)
      customToast.success(t("reverted"))
    } catch (error) {
      customToast.danger((error as ApiErrorPayload).message || t("revertFailed"))
    }
  }

  return (
    <div className="space-y-4">
      {showUpload ? (
        <FileUploadSlot fileType={fileType} title={title} description={description} branchId={branchId} isLocked={isLocked} isCheckingStatus={isCheckingStatus} onUploadStart={onUploadStart} />
      ) : (
        notDueMessage && (
          <CustomCard className="flex-row! items-center justify-center gap-2 border-dashed px-4 py-3 text-center">
            <InfoIcon className="size-4 shrink-0 text-foreground" aria-hidden />
            <p className="text-sm text-foreground">{notDueMessage}</p>
          </CustomCard>
        )
      )}

      <CustomSection title={`${title} ${t("historySuffix")}`}>
        <CustomTable<ImportBatch>
          columns={[
            { key: "fileName", label: t("file") },
            { key: "rowCount", label: t("rows") },
            { key: "status", label: t("status") },
            { key: "importedAt", label: t("importedAt") },
            ...(isSuperAdmin ? [{ key: "id", label: t("actions") }] : []),
          ]}
          data={batches ?? []}
          loading={isLoading}
          rowKey="id"
          itemId="id"
          totalItems={batches?.length ?? 0}
          showPagination={false}
          emptyText={t("noImportsYet", { title })}
          renderCustomCell={(batch, key) => {
            if (key === "importedAt") return new Date(batch.importedAt).toLocaleString()
            if (key === "status") {
              const status = batch.status
              const progress = progressByBatch[batch.id]
              if (status === ImportBatchStatus.Processing && progress) {
                return (
                  <div className="w-32 space-y-1">
                    <CustomProgress progress={Math.round((progress.rowsProcessed / progress.totalRows) * 100)} className="w-full" />
                    <p className="text-xs text-muted-foreground">
                      {progress.rowsProcessed}/{progress.totalRows}
                    </p>
                  </div>
                )
              }

              const chip = renderStatusCell(status, STATUS_COLOR_MAP, {
                [ImportBatchStatus.Processing]: t("statusProcessing"),
                [ImportBatchStatus.Completed]: t("statusCompleted"),
                [ImportBatchStatus.Failed]: t("statusFailed"),
              })
              if (status !== ImportBatchStatus.Failed || !batch.errorMessage) return chip
              return (
                <CustomTooltip trigger={chip}>
                  <p className="max-w-64 text-xs">{batch.errorMessage}</p>
                </CustomTooltip>
              )
            }
            if (key === "id") {
              if (batch.status !== ImportBatchStatus.Completed) return null
              return (
                <CustomTooltip trigger={
                  <CustomButton variant={ButtonVariant.ghost} isIconOnly loading={isReverting} onClick={() => handleRevert(batch)}>
                    <ArrowCounterClockwiseIcon className="size-4 text-danger" />
                  </CustomButton>
                }>
                  <p className="text-xs">{t("revert")}</p>
                </CustomTooltip>
              )
            }
            return batch[key]
          }}
        />
      </CustomSection>
    </div>
  )
}
