"use client"

import { useEffect, useMemo } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"

import { ButtonType, ButtonVariant, CustomButton, CustomDatePicker, CustomInput, CustomModal, CustomSelect, customToast, FormInput, InputTypes } from "@/components/ui"
import type { ApiErrorPayload } from "@/lib/axios"
import { CustomSize } from "@/lib/types"
import { useAuthStore } from "@/providers"
import { useBranches } from "@/modules/reports/hooks/use-reports"
import { useCreateExpense, useUpdateExpense } from "../hooks/use-expenses"
import { EXPENSE_CATEGORY_PRESETS } from "../constants/categories"
import type { Expense } from "../types"

type ExpenseFormValues = {
  branchId: string | undefined
  category: string
  amount: string
  expenseDate: string
  description?: string
}

const todayIso = () => new Date().toISOString().slice(0, 10)

const EMPTY_FORM: ExpenseFormValues = {
  branchId: undefined,
  category: "",
  amount: "",
  expenseDate: todayIso(),
  description: "",
}

type ExpenseFormModalProps = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  editingExpense: Expense | null
}

export function ExpenseFormModal({ isOpen, setIsOpen, editingExpense }: ExpenseFormModalProps) {
  const t = useTranslations("ExpenseTracker")
  const role = useAuthStore((state) => state.user?.role)
  const isSuperAdmin = role === "super_admin"

  const { data: branches, isLoading: isBranchesLoading } = useBranches()
  const { mutateAsync: createExpense, isPending: isCreating } = useCreateExpense()
  const { mutateAsync: updateExpenseMutation, isPending: isUpdating } = useUpdateExpense()

  const schema = useMemo(
    () =>
      z.object({
        branchId: isSuperAdmin && !editingExpense ? z.string().min(1, t("branchRequired")) : z.string().optional(),
        category: z.string().min(1, t("categoryRequired")),
        amount: z.string().min(1, t("amountRequired")).refine((value) => Number(value) > 0, t("amountPositive")),
        expenseDate: z.string().min(1, t("dateRequired")),
        description: z.string().optional(),
      }),
    [isSuperAdmin, editingExpense, t],
  )

  const { control, handleSubmit, reset, setValue, watch } = useForm<ExpenseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_FORM,
  })

  const category = watch("category")

  useEffect(() => {
    if (!isOpen) return
    if (editingExpense) {
      reset({
        branchId: editingExpense.branchId,
        category: editingExpense.category,
        amount: String(editingExpense.amount),
        expenseDate: editingExpense.expenseDate,
        description: editingExpense.description ?? "",
      })
    } else {
      reset(EMPTY_FORM)
    }
  }, [isOpen, editingExpense, reset])

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editingExpense) {
        await updateExpenseMutation({
          id: editingExpense.id,
          input: { category: values.category, amount: Number(values.amount), expenseDate: values.expenseDate, description: values.description || undefined },
        })
        customToast.success(t("expenseUpdated"))
      } else {
        await createExpense({
          branchId: values.branchId,
          category: values.category,
          amount: Number(values.amount),
          expenseDate: values.expenseDate,
          description: values.description || undefined,
        })
        customToast.success(t("expenseCreated"))
      }
      setIsOpen(false)
    } catch (error) {
      customToast.danger((error as ApiErrorPayload).message || t("somethingWentWrong"))
    }
  })

  return (
    <CustomModal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title={editingExpense ? t("editExpense") : t("addExpense")}
      positiveText={editingExpense ? t("save") : t("add")}
      onPositivePress={onSubmit}
      negativeText={t("cancel")}
      onNegativePress={() => setIsOpen(false)}
      loading={isCreating || isUpdating}
      size="lg"
    >
      <div className="space-y-4">
        {isSuperAdmin &&
          (editingExpense ? (
            <CustomInput value={editingExpense.branchName} onChange={() => {}} isReadOnly isDisabled label={t("branch")} fullWidth />
          ) : (
            <Controller
              control={control}
              name="branchId"
              render={({ field, fieldState }) => (
                <CustomSelect
                  data={branches ?? []}
                  value={branches?.find((branch) => branch.id === field.value)}
                  onChange={(item) => field.onChange(Array.isArray(item) ? undefined : item.id)}
                  displayKey="name"
                  idKey="id"
                  label={t("branch")}
                  placeholder={t("branchPlaceholder")}
                  isLoading={isBranchesLoading}
                  isInvalid={!!fieldState.error}
                  errorMsg={fieldState.error?.message}
                  fullWidth
                />
              )}
            />
          ))}

        <div className="space-y-2">
          <FormInput control={control} name="category" label={t("category")} placeholder={t("categoryPlaceholder")} fullWidth />
          <div className="flex flex-wrap gap-1.5">
            {EXPENSE_CATEGORY_PRESETS.map((preset) => (
              <CustomButton
                key={preset}
                type={ButtonType.button}
                size={CustomSize.sm}
                variant={category === preset ? ButtonVariant.primary : ButtonVariant.outline}
                onClick={() => setValue("category", preset, { shouldValidate: true })}
              >
                {preset}
              </CustomButton>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormInput control={control} name="amount" label={t("amount")} type={InputTypes.number} placeholder={t("amountPlaceholder")} fullWidth />
          <Controller
            control={control}
            name="expenseDate"
            render={({ field, fieldState }) => (
              <CustomDatePicker date={field.value} onChange={(value) => field.onChange(value ?? "")} label={t("date")} maxDate={todayIso()} isInvalid={!!fieldState.error} errorMsg={fieldState.error?.message} />
            )}
          />
        </div>

        <FormInput control={control} name="description" label={t("description")} placeholder={t("descriptionPlaceholder")} fullWidth />
      </div>
    </CustomModal>
  )
}
