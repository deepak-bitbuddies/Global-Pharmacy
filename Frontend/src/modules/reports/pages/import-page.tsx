"use client"

import { CustomPageHeader, CustomSection, CustomTable } from "@/components/ui"
import { FileUploadSlot } from "../components/file-upload-slot"
import { useImportBatches } from "../hooks/use-uploads"
import type { ImportBatch } from "../types"

const FILE_SLOTS = [
  { fileType: "stock" as const, title: "Stock Register", description: "Item-wise current stock, batches, expiry, cost/sale price." },
  { fileType: "sales" as const, title: "Sales Register", description: "Party/item-wise sales for the period (Marg: Party/Item Wise Sale Summary)." },
  { fileType: "purchase" as const, title: "Purchase Register", description: "Supplier/item-wise purchases for the period." },
  { fileType: "day_wise_sale" as const, title: "Day-Wise Sale (Sales Book)", description: "Daily bill totals — feeds the collection trend." },
]

export function ImportPage() {
  const { data: batches, isLoading } = useImportBatches()

  return (
    <div className="space-y-4">
      <CustomPageHeader
        title="Import Data"
        description="Upload the daily Excel exports from Marg. Re-uploading a file replaces its previous import instead of duplicating rows."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FILE_SLOTS.map((slot) => (
          <FileUploadSlot key={slot.fileType} {...slot} />
        ))}
      </div>

      <CustomSection title="Import history">
        <CustomTable<ImportBatch>
          columns={[
            { key: "fileName", label: "File" },
            { key: "fileType", label: "Type" },
            { key: "rowCount", label: "Rows" },
            { key: "status", label: "Status" },
            { key: "importedAt", label: "Imported at" },
          ]}
          data={batches ?? []}
          loading={isLoading}
          rowKey="id"
          itemId="id"
          totalItems={batches?.length ?? 0}
          showPagination={false}
          emptyText="No imports yet"
          renderCustomCell={(batch, key) => {
            if (key === "fileType") return batch.fileType.replace(/_/g, " ")
            if (key === "importedAt") return new Date(batch.importedAt).toLocaleString()
            return batch[key]
          }}
        />
      </CustomSection>
    </div>
  )
}
