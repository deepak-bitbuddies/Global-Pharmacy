"use client"

import { useTranslations } from "next-intl"

import { CustomColor } from "@/lib/types"
import { CustomSection, CustomTable, CustomTooltip, renderStatusCell, type StatusColorMap } from "@/components/ui"
import { FileUploadSlot } from "./file-upload-slot"
import { useImportBatches } from "../hooks/use-uploads"
import type { ImportBatch, ImportFileType } from "../types"

type BatchStatus = "processing" | "completed" | "failed"

const STATUS_COLOR_MAP: StatusColorMap<BatchStatus> = {
  processing: CustomColor.warning,
  completed: CustomColor.success,
  failed: CustomColor.danger,
}

type UploadTypePanelProps = {
  fileType: ImportFileType
  title: string
  description: string
  branchId: string
}

/** One tab's content on the Import page: the upload slot for this file type, plus its own history — never mixed with the other file types' history. */
export function UploadTypePanel({ fileType, title, description, branchId }: UploadTypePanelProps) {
  const t = useTranslations("Import")
  const { data: batches, isLoading } = useImportBatches(branchId, fileType)

  return (
    <div className="space-y-4">
      <FileUploadSlot fileType={fileType} title={title} description={description} branchId={branchId} />

      <CustomSection title={`${title} ${t("historySuffix")}`}>
        <CustomTable<ImportBatch>
          columns={[
            { key: "fileName", label: t("file") },
            { key: "rowCount", label: t("rows") },
            { key: "status", label: t("status") },
            { key: "importedAt", label: t("importedAt") },
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
              const status = batch.status as BatchStatus
              const chip = renderStatusCell(status, STATUS_COLOR_MAP, {
                processing: t("statusProcessing"),
                completed: t("statusCompleted"),
                failed: t("statusFailed"),
              })
              if (status !== "failed" || !batch.errorMessage) return chip
              return (
                <CustomTooltip trigger={chip}>
                  <p className="max-w-64 text-xs">{batch.errorMessage}</p>
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
