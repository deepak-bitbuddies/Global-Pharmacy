"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react"

import {
  ButtonVariant,
  ConfirmVariant,
  CustomButton,
  CustomChip,
  CustomDateRangePicker,
  CustomPageHeader,
  CustomSearchFilter,
  CustomSelect,
  CustomTable,
  customToast,
  useConfirm,
} from "@/components/ui"
import type { ApiErrorPayload } from "@/lib/axios"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { useAuthStore } from "@/providers"
import { formatCurrency } from "@/utils/formatting"
import { useBranches } from "@/modules/reports/hooks/use-reports"
import { useDeleteExpense, useExpenses } from "../hooks/use-expenses"
import { ExpenseFormModal } from "../components/expense-form-modal"
import { ExpenseSummary } from "../components/expense-summary"
import type { Expense, ExpenseFilters } from "../types"

export function ExpenseTrackerPage() {
  const t = useTranslations("ExpenseTracker")
  const tRoot = useTranslations()
  const role = useAuthStore((state) => state.user?.role)
  const isSuperAdmin = role === "super_admin"

  const [filters, setFilters] = useState<ExpenseFilters>({})
  const pagination = useCursorPagination()
  const { data: branches } = useBranches()
  const { data: expenses, isLoading, isError } = useExpenses(filters, { cursor: pagination.cursor, pageSize: pagination.pageSize })
  const { mutateAsync: deleteExpenseMutation } = useDeleteExpense()
  const confirm = useConfirm()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  const updateFilters = (updater: (prev: ExpenseFilters) => ExpenseFilters) => {
    setFilters(updater)
    pagination.reset()
  }

  const filterChips: { key: string; label: string; onRemove: () => void }[] = []
  if (filters.search) {
    filterChips.push({
      key: "search",
      label: `${t("search")}: ${filters.search}`,
      onRemove: () => updateFilters((prev) => ({ ...prev, search: undefined })),
    })
  }
  if (isSuperAdmin && filters.branchId) {
    const branchName = branches?.find((branch) => branch.id === filters.branchId)?.name ?? filters.branchId
    filterChips.push({
      key: "branch",
      label: `${t("branch")}: ${branchName}`,
      onRemove: () => updateFilters((prev) => ({ ...prev, branchId: undefined })),
    })
  }
  if (filters.dateFrom && filters.dateTo) {
    filterChips.push({
      key: "dateRange",
      label: `${t("date")}: ${filters.dateFrom} – ${filters.dateTo}`,
      onRemove: () => updateFilters((prev) => ({ ...prev, dateFrom: undefined, dateTo: undefined })),
    })
  }

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
      title: t("deleteTitle", { category: expense.category }),
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
        {isSuperAdmin && (
          <CustomSelect
            data={branches ?? []}
            value={branches?.find((branch) => branch.id === filters.branchId)}
            onChange={(item) => updateFilters((prev) => ({ ...prev, branchId: Array.isArray(item) ? undefined : item.id }))}
            displayKey="name"
            idKey="id"
            placeholder={t("filterByBranch")}
            showClear
            className="w-52"
          />
        )}
        <CustomDateRangePicker
          value={filters.dateFrom && filters.dateTo ? { start: filters.dateFrom, end: filters.dateTo } : undefined}
          onChange={(range) => updateFilters((prev) => ({ ...prev, dateFrom: range?.start, dateTo: range?.end }))}
          placeholder={t("filterByDate")}
        />
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

      <CustomTable<Expense>
        fillHeight
        isError={isError}
        columns={[
          { key: "expenseDate", label: t("date"), sortable: true },
          { key: "category", label: t("category") },
          ...(isSuperAdmin ? [{ key: "branchName", label: t("branch") }] : []),
          { key: "amount", label: t("amount") },
          { key: "description", label: t("description") },
          { key: "id", label: t("actions") },
        ]}
        data={expenses?.data ?? []}
        loading={isLoading}
        rowKey="id"
        itemId="id"
        totalItems={expenses?.meta?.total ?? 0}
        onRowsPerPageChange={pagination.setPageSize}
        cursorPagination={{
          page: pagination.page,
          totalPages: expenses?.meta?.totalPages,
          hasNextPage: expenses?.meta?.hasNextPage ?? false,
          hasPreviousPage: pagination.page > 1,
          onNext: () => pagination.goNext(expenses?.meta?.nextCursor ?? null),
          onPrevious: pagination.goPrevious,
        }}
        emptyText={t("emptyText")}
        renderCustomCell={(expense, key) => {
          if (key === "amount") return formatCurrency(expense.amount)
          if (key === "description") return expense.description ?? "-"
          if (key === "id") {
            return (
              <div className="flex items-center gap-2">
                <CustomButton variant={ButtonVariant.ghost} isIconOnly onClick={() => openEditForm(expense)}>
                  <PencilSimpleIcon className="size-4" />
                </CustomButton>
                <CustomButton variant={ButtonVariant.ghost} isIconOnly onClick={() => handleDelete(expense)}>
                  <TrashIcon className="size-4 text-danger" />
                </CustomButton>
              </div>
            )
          }
          return expense[key]
        }}
      />

      <ExpenseFormModal isOpen={isFormOpen} setIsOpen={setIsFormOpen} editingExpense={editingExpense} />
    </div>
  )
}
