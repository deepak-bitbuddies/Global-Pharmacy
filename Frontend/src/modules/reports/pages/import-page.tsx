"use client"

import { useMemo, useState } from "react"

import { BuildingsIcon } from "@phosphor-icons/react"

import { CustomEmptyState, CustomPageHeader, CustomSection, CustomSelect, CustomSpinner, CustomTable } from "@/components/ui"
import { FileUploadSlot } from "../components/file-upload-slot"
import { useBranches } from "../hooks/use-reports"
import { useImportBatches } from "../hooks/use-uploads"
import type { Branch, ImportBatch } from "../types"

const FILE_SLOTS = [
  { fileType: "stock" as const, title: "Stock Register", description: "Item-wise current stock, batches, expiry, cost/sale price." },
  { fileType: "sales" as const, title: "Sales Register", description: "Party/item-wise sales for the period (Marg: Party/Item Wise Sale Summary)." },
  { fileType: "purchase" as const, title: "Purchase Register", description: "Supplier/item-wise purchases for the period." },
  { fileType: "day_wise_sale" as const, title: "Day-Wise Sale (Sales Book)", description: "Daily bill totals — feeds the collection trend." },
]

export function ImportPage() {
  const { data: branches, isLoading: isBranchesLoading } = useBranches()
  const [manualBranchId, setManualBranchId] = useState<string | undefined>(undefined)

  // Most accounts (branch_user) only ever have one branch to pick from — default to it instead of forcing an extra click, without fighting an explicit choice.
  const branchId = manualBranchId ?? (branches?.length === 1 ? branches[0].id : undefined)
  const selectedBranch = useMemo(() => branches?.find((branch) => branch.id === branchId), [branches, branchId])

  const { data: batches, isLoading: isBatchesLoading } = useImportBatches(branchId)

  return (
    <div className="space-y-4">
      <CustomPageHeader
        title="Import Data"
        description="Upload the daily Excel exports from Marg. Re-uploading a file replaces its previous import instead of duplicating rows."
      />

      {isBranchesLoading ? (
        <div className="flex items-center justify-center py-16">
          <CustomSpinner />
        </div>
      ) : (
        <>
          <CustomSelect<Branch>
            data={branches ?? []}
            value={selectedBranch}
            onChange={(value) => {
              const branch = Array.isArray(value) ? value[0] : value
              setManualBranchId(branch?.id)
            }}
            displayKey="name"
            idKey="id"
            label="Branch"
            placeholder="Select the branch to import against"
            isRequired
            fullWidth
          />

          {branchId ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {FILE_SLOTS.map((slot) => (
                  <FileUploadSlot key={slot.fileType} {...slot} branchId={branchId} />
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
                  loading={isBatchesLoading}
                  rowKey="id"
                  itemId="id"
                  totalItems={batches?.length ?? 0}
                  showPagination={false}
                  emptyText="No imports yet for this branch"
                  renderCustomCell={(batch, key) => {
                    if (key === "fileType") return batch.fileType.replace(/_/g, " ")
                    if (key === "importedAt") return new Date(batch.importedAt).toLocaleString()
                    return batch[key]
                  }}
                />
              </CustomSection>
            </>
          ) : (
            <CustomEmptyState icon={BuildingsIcon} title="Select a branch" description="Choose the branch above to start importing files against it." />
          )}
        </>
      )}
    </div>
  )
}
