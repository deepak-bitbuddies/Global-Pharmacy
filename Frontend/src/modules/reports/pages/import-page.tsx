"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"

import { BuildingsIcon, CheckCircleIcon, InfoIcon } from "@phosphor-icons/react"

import { CustomCard, CustomEmptyState, CustomPageHeader, CustomSelect, CustomSpinner, CustomStickyBar, CustomTabs } from "@/components/ui"
import { useAuthStore } from "@/providers"
import { BulkUploadModal } from "../components/bulk-upload-modal"
import { UploadTypePanel } from "../components/upload-type-panel"
import { useBranches } from "../hooks/use-reports"
import { useUploadCycleStatus } from "../hooks/use-uploads"
import type { Branch, ImportFileType, UploadCycleStatus } from "../types"

/** Describes what the branch needs uploaded next, from the same source of truth the backend gate itself checks. */
function cycleMessage(status: UploadCycleStatus, t: (key: string, values?: Record<string, string>) => string): { text: string; done: boolean } {
  if (!status.openDate) return { text: t("getStarted"), done: false }
  if (status.purchaseDone && status.salesDone) return { text: t("cycleComplete", { date: status.openDate }), done: true }

  const pending = [!status.purchaseDone && t("purchaseWord"), !status.salesDone && t("salesWord")].filter(Boolean).join(` ${t("andWord")} `)
  return { text: t("cyclePending", { date: status.openDate, pending }), done: false }
}

export function ImportPage() {
  const t = useTranslations("Import")
  const tCommon = useTranslations("Common")
  const role = useAuthStore((state) => state.user?.role)
  const { data: branches, isLoading: isBranchesLoading } = useBranches()
  const [manualBranchId, setManualBranchId] = useState<string | undefined>(undefined)

  // Most accounts (branch_user) only ever have one branch to pick from — default to it instead of forcing an extra click, without fighting an explicit choice.
  const branchId = manualBranchId ?? (branches?.length === 1 ? branches[0].id : undefined)
  const selectedBranch = useMemo(() => branches?.find((branch) => branch.id === branchId), [branches, branchId])

  const { data: cycleStatus } = useUploadCycleStatus(branchId)
  const message = cycleStatus ? cycleMessage(cycleStatus, t) : null

  const fileTypes: { fileType: ImportFileType; title: string; description: string }[] = [
    { fileType: "stock", title: t("stockRegister.title"), description: t("stockRegister.description") },
    { fileType: "purchase", title: t("purchaseRegister.title"), description: t("purchaseRegister.description") },
    { fileType: "sales", title: t("salesRegister.title"), description: t("salesRegister.description") },
    { fileType: "day_wise_sale", title: t("dayWiseSale.title"), description: t("dayWiseSale.description") },
  ]

  return (
    <div className="space-y-4">
      <CustomStickyBar>
        <div className="flex items-start justify-between gap-4">
          <CustomPageHeader title={t("title")} description={t("description")} />
          {role === "super_admin" && branchId && <BulkUploadModal branchId={branchId} />}
        </div>
      </CustomStickyBar>

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
            label={tCommon("branch")}
            placeholder={t("branchPlaceholder")}
            isRequired
            fullWidth
          />

          {branchId ? (
            <>
              {message && (
                <CustomCard className={`flex items-center gap-2 p-4 ${message.done ? "border-success/40! bg-success/5!" : "border-primary/40! bg-primary/5!"}`}>
                  {message.done ? <CheckCircleIcon className="size-5 shrink-0 text-success" /> : <InfoIcon className="size-5 shrink-0 text-primary" />}
                  <p className="text-sm font-medium text-foreground">{message.text}</p>
                </CustomCard>
              )}

              <CustomTabs
                items={fileTypes.map((slot) => ({
                  key: slot.fileType,
                  label: slot.title,
                  content: <UploadTypePanel {...slot} branchId={branchId} />,
                }))}
              />
            </>
          ) : (
            <CustomEmptyState icon={BuildingsIcon} title={t("selectBranchTitle")} description={t("selectBranchDescription")} />
          )}
        </>
      )}
    </div>
  )
}
