"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"

import { BuildingsIcon } from "@phosphor-icons/react"

import { ChipVariant, CustomChip, CustomEmptyState, CustomPageHeader, CustomSelect, CustomSpinner, CustomTabs } from "@/components/ui"
import { CustomColor, CustomSize } from "@/lib/types"
import { useAuthStore } from "@/providers"
import { formatDisplayDate } from "@/utils/formatting"
import { BulkUploadModal } from "../components/bulk-upload-modal"
import { UploadGuideCard } from "../components/upload-guide-card"
import { UploadTypePanel } from "../components/upload-type-panel"
import { useBranches } from "../hooks/use-reports"
import { useRunningImport, useUploadCycleStatus } from "../hooks/use-uploads"
import { ImportFileType, type Branch } from "../types"
import { getNextUploadStep } from "../utils/upload-guide"

const ALL_FILE_TYPES = Object.values(ImportFileType)

export function ImportPage() {
  const t = useTranslations("Import")
  const locale = useLocale()
  const tCommon = useTranslations("Common")
  const role = useAuthStore((state) => state.user?.role)
  const { data: branches, isLoading: isBranchesLoading } = useBranches()
  const [manualBranchId, setManualBranchId] = useState<string | undefined>(undefined)
  // Null until the user picks a tab (or starts an upload) — until then the page opens on whichever file is due next.
  const [manualTab, setManualTab] = useState<ImportFileType | null>(null)

  // Most accounts (branch_user) only ever have one branch to pick from — default to it instead of forcing an extra click, without fighting an explicit choice.
  const branchId = manualBranchId ?? (branches?.length === 1 ? branches[0].id : undefined)
  const selectedBranch = useMemo(() => branches?.find((branch) => branch.id === branchId), [branches, branchId])

  const { data: cycleStatus, isLoading: isCycleStatusLoading, refetch: refetchCycleStatus } = useUploadCycleStatus(branchId)
  const runningImport = useRunningImport(branchId)
  // Uploading is held until the page knows what's due next and whether a file is already importing.
  // `isLoading` is only true on the first fetch, so a failed request unlocks rather than blocking
  // uploads forever (the server still validates every file either way).
  const isCheckingStatus = isCycleStatusLoading || runningImport.isLoading
  const nextStep = cycleStatus ? getNextUploadStep(cycleStatus) : null
  const nextFileType = nextStep?.fileType ?? null
  const selectedTab = manualTab ?? nextFileType ?? ImportFileType.Stock

  // The socket normally refreshes the guide when an import finishes; this is the fallback for a
  // missed event, so "what's next" never lags behind a file that has just completed.
  const wasRunning = useRef(false)
  useEffect(() => {
    if (wasRunning.current && !runningImport.isRunning) void refetchCycleStatus()
    wasRunning.current = runningImport.isRunning
  }, [runningImport.isRunning, refetchCycleStatus])

  const fileTypes: { fileType: ImportFileType; title: string; description: string }[] = [
    { fileType: ImportFileType.Stock, title: t("stockRegister.title"), description: t("stockRegister.description") },
    { fileType: ImportFileType.Purchase, title: t("purchaseRegister.title"), description: t("purchaseRegister.description") },
    { fileType: ImportFileType.Sales, title: t("salesRegister.title"), description: t("salesRegister.description") },
    { fileType: ImportFileType.DayWiseSale, title: t("dayWiseSale.title"), description: t("dayWiseSale.description") },
  ]

  // Day-Wise Sale can go in any time. For the daily files only the one that's due gets an upload
  // box — unless the status couldn't be loaded at all, where every box stays available rather than
  // leaving the user with nothing to press (the server still rejects an out-of-order file).
  const isUploadShown = (fileType: ImportFileType): boolean =>
    fileType === ImportFileType.DayWiseSale || fileType === nextFileType || (!cycleStatus && !isCycleStatusLoading)

  const notDueMessage = nextStep
    ? nextStep.date
      ? t("guide.notDue", { fileType: t(`guide.fileTypes.${nextStep.fileType}`), date: formatDisplayDate(nextStep.date, locale) })
      : t("guide.notDueFirstStock")
    : undefined

  // While a file is importing, keep the user on the tab they're on (where its progress shows) and lock the rest.
  const disabledTabs = runningImport.isRunning ? ALL_FILE_TYPES.filter((fileType) => fileType !== selectedTab) : []

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <CustomPageHeader title={t("title")} description={t("description")} />
        {role === "super_admin" && branchId && <BulkUploadModal branchId={branchId} isDisabled={runningImport.isRunning || isCheckingStatus} />}
      </div>

      {isBranchesLoading ? (
        <div className="flex items-center justify-center py-16">
          <CustomSpinner />
        </div>
      ) : (
        <>
          {/* A branch_user only ever has one branch (already auto-selected above) — picking
              between branches only makes sense for roles that manage more than one. */}
          {role !== "branch_user" && (
            <CustomSelect<Branch>
              data={branches ?? []}
              value={selectedBranch}
              onChange={(value) => {
                const branch = Array.isArray(value) ? value[0] : value
                setManualBranchId(branch?.id)
                setManualTab(null)
              }}
              displayKey="name"
              idKey="id"
              label={tCommon("branch")}
              placeholder={t("branchPlaceholder")}
              isRequired
              fullWidth
            />
          )}

          {branchId ? (
            <>
              {cycleStatus && (
                <UploadGuideCard cycleStatus={cycleStatus} runningImport={runningImport} selectedTab={selectedTab} onGoToTab={setManualTab} />
              )}

              <CustomTabs
                selectedKey={selectedTab}
                onSelectionChange={(key) => setManualTab(key as ImportFileType)}
                disabledKeys={disabledTabs}
                items={fileTypes.map((slot) => ({
                  key: slot.fileType,
                  label: (
                    <span className="flex items-center gap-2">
                      {slot.title}
                      {slot.fileType === nextFileType && !runningImport.isRunning && (
                        <CustomChip size={CustomSize.sm} color={CustomColor.success} variant={ChipVariant.Primary}>
                          {t("guide.nextBadge")}
                        </CustomChip>
                      )}
                    </span>
                  ),
                  content: (
                    <UploadTypePanel
                      {...slot}
                      branchId={branchId}
                      isLocked={runningImport.isRunning}
                      isCheckingStatus={isCheckingStatus}
                      onUploadStart={() => setManualTab(slot.fileType)}
                      showUpload={isUploadShown(slot.fileType)}
                      notDueMessage={notDueMessage}
                    />
                  ),
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
