"use client"

import { useTranslations } from "next-intl"

import { CustomSection, CustomTable } from "@/components/ui"
import { FileUploadSlot } from "./file-upload-slot"
import { useImportBatches } from "../hooks/use-uploads"
import type { ImportBatch, ImportFileType } from "../types"

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
            return batch[key]
          }}
        />
      </CustomSection>
    </div>
  )
}
