"use client"

import { useTranslations } from "next-intl"
import { TrashIcon } from "@phosphor-icons/react"

import {
  ButtonVariant,
  ConfirmVariant,
  CustomButton,
  CustomSection,
  CustomTable,
  CustomTooltip,
  customToast,
  renderStatusCell,
  useConfirm,
  type StatusColorMap,
} from "@/components/ui"
import { CustomColor } from "@/lib/types"
import type { ApiErrorPayload } from "@/lib/axios"
import { useImportProgressStore } from "@/modules/reports/hooks/use-import-progress-store"
import { useDeletePurchaseAnalysisBatch, usePurchaseAnalysisBatches } from "../hooks/use-purchase-analysis"
import type { PurchaseAnalysisImportBatch } from "../types"

type BatchStatus = "processing" | "completed" | "failed"

const STATUS_COLOR_MAP: StatusColorMap<BatchStatus> = {
  processing: CustomColor.warning,
  completed: CustomColor.success,
  failed: CustomColor.danger,
}

export function PurchaseAnalysisBatchHistory() {
  const t = useTranslations("PurchaseAnalysis")
  const { data: batches, isLoading } = usePurchaseAnalysisBatches()
  const { mutateAsync: deleteBatch, isPending: isDeleting } = useDeletePurchaseAnalysisBatch()
  const progressByBatch = useImportProgressStore((state) => state.progress)
  const confirm = useConfirm()

  const handleDelete = async (batch: PurchaseAnalysisImportBatch) => {
    const confirmed = await confirm({
      title: t("deleteBatchTitle", { fileName: batch.fileName }),
      description: t("deleteBatchDescription", { count: batch.rowCount }),
      variant: ConfirmVariant.danger,
      confirmLabel: t("delete"),
    })
    if (!confirmed) return

    try {
      await deleteBatch(batch.id)
      customToast.success(t("batchDeleted"))
    } catch (error) {
      customToast.danger((error as ApiErrorPayload).message || t("batchDeleteFailed"))
    }
  }

  return (
    <CustomSection title={t("importHistory")}>
      <CustomTable<PurchaseAnalysisImportBatch>
        columns={[
          { key: "fileName", label: t("file") },
          { key: "status", label: t("status") },
          { key: "rowCount", label: t("rows") },
          { key: "periodFrom", label: t("period") },
          { key: "importedAt", label: t("importedAt") },
          { key: "id", label: t("actions") },
        ]}
        data={batches ?? []}
        loading={isLoading}
        rowKey="id"
        itemId="id"
        totalItems={batches?.length ?? 0}
        showPagination={false}
        emptyText={t("noImportsYet")}
        renderCustomCell={(batch, key) => {
          if (key === "importedAt") return new Date(batch.importedAt).toLocaleString()
          if (key === "periodFrom") return batch.periodFrom && batch.periodTo ? `${batch.periodFrom} – ${batch.periodTo}` : "-"
          if (key === "status") {
            const status = batch.status as BatchStatus
            const progress = progressByBatch[batch.id]
            if (status === "processing" && progress) {
              return (
                <div className="w-28 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {progress.rowsProcessed}/{progress.totalRows}
                  </p>
                </div>
              )
            }
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
          if (key === "id") {
            if (batch.status === "processing") return null
            return (
              <CustomTooltip trigger={
                <CustomButton variant={ButtonVariant.ghost} isIconOnly loading={isDeleting} onClick={() => handleDelete(batch)}>
                  <TrashIcon className="size-4 text-danger" />
                </CustomButton>
              }>
                <p className="text-xs">{t("delete")}</p>
              </CustomTooltip>
            )
          }
          return batch[key as keyof PurchaseAnalysisImportBatch]
        }}
      />
    </CustomSection>
  )
}
