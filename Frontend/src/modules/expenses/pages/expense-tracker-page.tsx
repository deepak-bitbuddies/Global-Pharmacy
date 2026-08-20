"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { CheckIcon, EyeIcon, PencilSimpleIcon, PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react"

import {
  ButtonVariant,
  ConfirmVariant,
  CustomButton,
  CustomChip,
  CustomInput,
  CustomModal,
  CustomPageHeader,
  CustomSearchFilter,
  CustomTable,
  customToast,
  renderActionsCell,
  renderStatusCell,
  useConfirm,
  type RowAction,
  type StatusColorMap,
} from "@/components/ui"
import type { ApiErrorPayload } from "@/lib/axios"
import { CustomColor as CustomChipColor } from "@/lib/types"
import { formatCurrency } from "@/utils/formatting"
import { useAuthStore } from "@/providers"
import { useBranches } from "@/modules/reports/hooks/use-reports"
import { useDeleteExpense, useExpenseLedger, useReviewExpense } from "../hooks/use-expenses"
import { getExpenseProofUrl } from "../api/expenses-api"
import { ExpenseFilterModal } from "../components/expense-filter-modal"
import { ExpenseFormModal } from "../components/expense-form-modal"
import { ExpenseSummary } from "../components/expense-summary"
import { ExpenseStatus, ExpenseType, ReviewAction } from "../types"
import type { Expense, ExpenseFilters, ExpenseLedgerRow } from "../types"

const HANDOVER_TYPES = new Set<ExpenseType>([ExpenseType.HandoverCash, ExpenseType.HandoverBank])
const EDITABLE_STATUSES = new Set<ExpenseStatus>([ExpenseStatus.Posted, ExpenseStatus.Pending])
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"])

function isImageFile(fileName: string): boolean {
  const dot = fileName.lastIndexOf(".")
  return dot !== -1 && IMAGE_EXTENSIONS.has(fileName.slice(dot).toLowerCase())
}

export function ExpenseTrackerPage() {
  const t = useTranslations("ExpenseTracker")
  const tRoot = useTranslations()
  const role = useAuthStore((state) => state.user?.role)
  const isSuperAdmin = role === "super_admin"

  const TYPE_LABEL: Record<ExpenseType, string> = {
    [ExpenseType.Expense]: t("typeExpense"),
    [ExpenseType.Credit]: t("typeCredit"),
    [ExpenseType.HandoverCash]: t("typeHandoverCash"),
    [ExpenseType.HandoverBank]: t("typeHandoverBank"),
  }
  const TYPE_COLOR: Record<ExpenseType, CustomChipColor> = {
    [ExpenseType.Expense]: CustomChipColor.danger,
    [ExpenseType.Credit]: CustomChipColor.success,
    [ExpenseType.HandoverCash]: CustomChipColor.warning,
    [ExpenseType.HandoverBank]: CustomChipColor.warning,
  }
  const STATUS_COLOR_MAP: StatusColorMap<ExpenseStatus> = {
    [ExpenseStatus.Posted]: CustomChipColor.default,
    [ExpenseStatus.Pending]: CustomChipColor.warning,
    [ExpenseStatus.Approved]: CustomChipColor.success,
    [ExpenseStatus.Rejected]: CustomChipColor.danger,
  }
  const STATUS_LABEL: Record<ExpenseStatus, string> = {
    [ExpenseStatus.Posted]: t("statusPosted"),
    [ExpenseStatus.Pending]: t("statusPending"),
    [ExpenseStatus.Approved]: t("statusApproved"),
    [ExpenseStatus.Rejected]: t("statusRejected"),
  }

  const [filters, setFilters] = useState<ExpenseFilters>({})
  const { data: branches } = useBranches()
  const { data: ledger, isLoading, isError } = useExpenseLedger(filters)
  const { mutateAsync: deleteExpenseMutation } = useDeleteExpense()
  const { mutateAsync: reviewExpenseMutation, isPending: isReviewing } = useReviewExpense()
  const confirm = useConfirm()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [rejectingExpense, setRejectingExpense] = useState<Expense | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [proofPreview, setProofPreview] = useState<{ url: string; fileName: string; isImage: boolean } | null>(null)

  const updateFilters = (updater: (prev: ExpenseFilters) => ExpenseFilters) => setFilters(updater)

  /** Removes a single value from an array filter — clears the key entirely once the array empties, instead of leaving a stray `[]`. Same pattern as the Reports module's `FilterChips`. */
  function removeFromArray(key: "branchId" | "type", value: string) {
    updateFilters((prev) => {
      const next = ((prev[key] ?? []) as string[]).filter((v) => v !== value)
      return { ...prev, [key]: next.length > 0 ? next : undefined }
    })
  }

  const filterChips: { key: string; label: string; onRemove: () => void }[] = []
  if (filters.search) {
    filterChips.push({ key: "search", label: `${t("search")}: ${filters.search}`, onRemove: () => updateFilters((prev) => ({ ...prev, search: undefined })) })
  }
  if (isSuperAdmin) {
    for (const branchId of filters.branchId ?? []) {
      const branchName = branches?.find((branch) => branch.id === branchId)?.name ?? branchId
      filterChips.push({ key: `branch:${branchId}`, label: `${t("branch")}: ${branchName}`, onRemove: () => removeFromArray("branchId", branchId) })
    }
  }
  for (const type of filters.type ?? []) {
    filterChips.push({ key: `type:${type}`, label: `${t("type")}: ${TYPE_LABEL[type]}`, onRemove: () => removeFromArray("type", type) })
  }
  if (filters.dateFrom && filters.dateTo) {
    filterChips.push({ key: "dateRange", label: `${t("date")}: ${filters.dateFrom} – ${filters.dateTo}`, onRemove: () => updateFilters((prev) => ({ ...prev, dateFrom: undefined, dateTo: undefined })) })
  }

  const activeFilterCount = [
    isSuperAdmin && filters.branchId?.length,
    filters.type?.length,
    filters.dateFrom && filters.dateTo,
  ].filter(Boolean).length

  const openCreateForm = () => {
    setEditingExpense(null)
    setIsFormOpen(true)
  }

  const openEditForm = (expense: Expense) => {
    setEditingExpense(expense)
    setIsFormOpen(true)
  }

  const handleDelete = async (expense: Expense) => {
    const confirmed = await confirm({
      title: t("deleteTitle", { type: TYPE_LABEL[expense.type] }),
      description: t("deleteDescription"),
      variant: ConfirmVariant.danger,
      confirmLabel: t("delete"),
    })
    if (!confirmed) return

    try {
      await deleteExpenseMutation(expense.id)
      customToast.success(t("expenseDeleted"))
    } catch (error) {
      customToast.danger((error as ApiErrorPayload).message || t("somethingWentWrong"))
    }
  }

  const handleViewProof = (expense: Expense) => {
    const fileName = expense.proofDocumentName ?? "proof"
    setProofPreview({ url: getExpenseProofUrl(expense.id), fileName, isImage: isImageFile(fileName) })
  }

  const handleDownloadProof = () => {
    if (!proofPreview) return
    const link = document.createElement("a")
    link.href = proofPreview.url
    link.download = proofPreview.fileName
    link.click()
  }

  const handleApprove = async (expense: Expense) => {
    const confirmed = await confirm({ title: t("approveTitle"), description: t("approveDescription"), confirmLabel: t("approve") })
    if (!confirmed) return

    try {
      await reviewExpenseMutation({ id: expense.id, action: ReviewAction.Approve })
      customToast.success(t("expenseApproved"))
    } catch (error) {
      customToast.danger((error as ApiErrorPayload).message || t("somethingWentWrong"))
    }
  }

  const openRejectModal = (expense: Expense) => {
    setRejectionReason("")
    setRejectingExpense(expense)
  }

  const handleReject = async () => {
    if (!rejectingExpense) return
    if (!rejectionReason.trim()) {
      customToast.danger(t("rejectionReasonRequired"))
      return
    }
    try {
      await reviewExpenseMutation({ id: rejectingExpense.id, action: ReviewAction.Reject, rejectionReason: rejectionReason.trim() })
      customToast.success(t("expenseRejected"))
      setRejectingExpense(null)
    } catch (error) {
      customToast.danger((error as ApiErrorPayload).message || t("somethingWentWrong"))
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <CustomPageHeader
        className="shrink-0"
        title={t("title")}
        description={t("description")}
        actions={
          <CustomButton onClick={openCreateForm}>
            <PlusIcon className="size-4" />
            {t("addExpense")}
          </CustomButton>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-52 flex-1">
          <CustomSearchFilter
            value={filters.search}
            onChange={(value) => updateFilters((prev) => ({ ...prev, search: value || undefined }))}
            placeholder={t("searchPlaceholder")}
            wrapperClassName="rounded-app border border-default bg-card"
          />
        </div>
        <ExpenseFilterModal filters={filters} onFiltersChange={updateFilters} isSuperAdmin={isSuperAdmin} activeCount={activeFilterCount} />
      </div>

      {filterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filterChips.map((chip) => (
            <CustomChip key={chip.key} onClose={chip.onRemove}>
              {chip.label}
            </CustomChip>
          ))}
          <CustomButton variant={ButtonVariant.ghost} className="h-8 px-2 text-xs" onClick={() => updateFilters(() => ({}))}>
            {tRoot("ClearAllFilters")}
          </CustomButton>
        </div>
      )}

      <ExpenseSummary filters={filters} />

      <CustomTable<ExpenseLedgerRow>
        fillHeight
        isError={isError}
        showPagination={false}
        columns={[
          { key: "expenseDate", label: t("date"), sortable: true },
          { key: "type", label: t("type") },
          { key: "description", label: t("details") },
          ...(isSuperAdmin ? [{ key: "branchName" as const, label: t("branch") }] : []),
          { key: "amount", label: t("amount") },
          { key: "balanceAfter", label: t("balance") },
          { key: "status", label: t("status") },
          { key: "proofDocumentName", label: t("proof") },
          { key: "id", label: t("actions") },
        ]}
        data={ledger ?? []}
        loading={isLoading}
        rowKey="id"
        itemId="id"
        totalItems={ledger?.length ?? 0}
        emptyText={t("emptyText")}
        renderCustomCell={(entry, key) => {
          if (key === "type") return <CustomChip color={TYPE_COLOR[entry.type]}>{TYPE_LABEL[entry.type]}</CustomChip>
          if (key === "description") {
            const detail = entry.type === ExpenseType.Expense ? entry.category : HANDOVER_TYPES.has(entry.type) ? entry.recipient : null
            return (
              <div className="flex flex-col">
                {detail && <span>{detail}</span>}
                {entry.description && <span className="text-xs text-muted-foreground">{entry.description}</span>}
                {entry.status === ExpenseStatus.Rejected && entry.rejectionReason && <span className="text-xs text-danger">{t("rejectedReasonPrefix")}: {entry.rejectionReason}</span>}
              </div>
            )
          }
          if (key === "amount") {
            const isCredit = entry.type === ExpenseType.Credit
            return <span className={isCredit ? "text-success" : "text-danger"}>{isCredit ? "+" : "-"}{formatCurrency(entry.amount)}</span>
          }
          if (key === "balanceAfter") return formatCurrency(entry.balanceAfter)
          if (key === "status") {
            if (!HANDOVER_TYPES.has(entry.type)) return "-"
            return renderStatusCell(entry.status, STATUS_COLOR_MAP, STATUS_LABEL)
          }
          if (key === "proofDocumentName") {
            if (!HANDOVER_TYPES.has(entry.type)) return "-"
            if (!entry.proofDocumentName) return <span className="text-xs text-muted-foreground">{t("noProof")}</span>
            return (
              <CustomButton variant={ButtonVariant.ghost} isIconOnly onClick={() => handleViewProof(entry)}>
                <EyeIcon className="size-4" />
              </CustomButton>
            )
          }
          if (key === "id") {
            const actions: RowAction<ExpenseLedgerRow>[] = []
            if (EDITABLE_STATUSES.has(entry.status)) {
              actions.push({ key: "edit", label: t("edit"), icon: <PencilSimpleIcon className="size-4" />, onSelect: openEditForm })
              actions.push({ key: "delete", label: t("delete"), icon: <TrashIcon className="size-4" />, tone: "danger", onSelect: handleDelete })
            }
            if (isSuperAdmin && entry.status === ExpenseStatus.Pending) {
              actions.push({ key: "approve", label: t("approve"), icon: <CheckIcon className="size-4" />, onSelect: handleApprove })
              actions.push({ key: "reject", label: t("reject"), icon: <XIcon className="size-4" />, tone: "danger", onSelect: openRejectModal })
            }
            return actions.length > 0 ? renderActionsCell(entry, actions) : "-"
          }
          return entry[key]
        }}
      />

      <ExpenseFormModal isOpen={isFormOpen} setIsOpen={setIsFormOpen} editingExpense={editingExpense} />

      <CustomModal
        isOpen={!!rejectingExpense}
        setIsOpen={(open) => !open && setRejectingExpense(null)}
        title={t("rejectTitle")}
        positiveText={t("reject")}
        onPositivePress={handleReject}
        negativeText={t("cancel")}
        onNegativePress={() => setRejectingExpense(null)}
        loading={isReviewing}
      >
        <CustomInput value={rejectionReason} onChange={setRejectionReason} label={t("rejectionReason")} placeholder={t("rejectionReasonPlaceholder")} fullWidth />
      </CustomModal>

      <CustomModal
        isOpen={!!proofPreview}
        setIsOpen={(open) => !open && setProofPreview(null)}
        title={t("proofDocument")}
        subTitle={proofPreview?.fileName}
        positiveText={t("download")}
        onPositivePress={handleDownloadProof}
        negativeText={tRoot("Close")}
        onNegativePress={() => setProofPreview(null)}
        size="lg"
      >
        {proofPreview &&
          (proofPreview.isImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- an authenticated proxy URL, not something next/image can optimize
            <img src={proofPreview.url} alt={proofPreview.fileName} className="max-h-[70vh] w-full rounded-app object-contain" />
          ) : (
            <iframe src={proofPreview.url} title={proofPreview.fileName} className="h-[70vh] w-full rounded-app border border-default" />
          ))}
      </CustomModal>
    </div>
  )
}
