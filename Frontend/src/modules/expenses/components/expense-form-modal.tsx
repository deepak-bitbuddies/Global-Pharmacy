"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { PaperclipIcon } from "@phosphor-icons/react"

import { ButtonType, ButtonVariant, CustomButton, CustomDatePicker, CustomInput, CustomModal, CustomSelect, customToast, FormInput, InputTypes } from "@/components/ui"
import type { ApiErrorPayload } from "@/lib/axios"
import { CustomSize } from "@/lib/types"
import { useAuthStore } from "@/providers"
import { useBranches } from "@/modules/reports/hooks/use-reports"
import { useCreateExpense, useUpdateExpense, useUploadExpenseProof } from "../hooks/use-expenses"
import { EXPENSE_CATEGORY_PRESETS } from "../constants/categories"
import { ExpenseType } from "../types"
import type { Expense } from "../types"

type ExpenseFormValues = {
  type: ExpenseType
  branchId: string | undefined
  category?: string
  recipient?: string
  amount: string
  expenseDate: string
  description?: string
}

const todayIso = () => new Date().toISOString().slice(0, 10)

const EMPTY_FORM: ExpenseFormValues = {
  type: ExpenseType.Expense,
  branchId: undefined,
  category: "",
  recipient: "",
  amount: "",
  expenseDate: todayIso(),
  description: "",
}

const HANDOVER_TYPES = new Set<ExpenseType>([ExpenseType.HandoverCash, ExpenseType.HandoverBank])

type ExpenseTypeOption = { id: ExpenseType; label: string }

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
  const { mutateAsync: uploadProof, isPending: isUploadingProof } = useUploadExpenseProof()

  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofError, setProofError] = useState<string | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const typeOptions: ExpenseTypeOption[] = [
    { id: ExpenseType.Expense, label: t("typeExpense") },
    { id: ExpenseType.Credit, label: t("typeCredit") },
    { id: ExpenseType.HandoverCash, label: t("typeHandoverCash") },
    { id: ExpenseType.HandoverBank, label: t("typeHandoverBank") },
  ]

  const schema = useMemo(
    () =>
      z
        .object({
          type: z.nativeEnum(ExpenseType),
          branchId: isSuperAdmin && !editingExpense ? z.string().min(1, t("branchRequired")) : z.string().optional(),
          category: z.string().optional(),
          recipient: z.string().optional(),
          amount: z.string().min(1, t("amountRequired")).refine((value) => Number(value) > 0, t("amountPositive")),
          expenseDate: z.string().min(1, t("dateRequired")),
          description: z.string().optional(),
        })
        .superRefine((values, ctx) => {
          if (values.type === ExpenseType.Expense && !values.category) {
            ctx.addIssue({ code: "custom", path: ["category"], message: t("categoryRequired") })
          }
          if (HANDOVER_TYPES.has(values.type) && !values.recipient) {
            ctx.addIssue({ code: "custom", path: ["recipient"], message: t("recipientRequired") })
          }
        }),
    [isSuperAdmin, editingExpense, t],
  )

  const { control, handleSubmit, reset, setValue, watch } = useForm<ExpenseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_FORM,
  })

  const type = watch("type")
  const category = watch("category")
  const isHandover = HANDOVER_TYPES.has(type)

  useEffect(() => {
    if (!isOpen) return
    setProofFile(null)
    setProofError(undefined)
    if (editingExpense) {
      reset({
        type: editingExpense.type,
        branchId: editingExpense.branchId,
        category: editingExpense.category ?? "",
        recipient: editingExpense.recipient ?? "",
        amount: String(editingExpense.amount),
        expenseDate: editingExpense.expenseDate,
        description: editingExpense.description ?? "",
      })
    } else {
      reset(EMPTY_FORM)
    }
  }, [isOpen, editingExpense, reset])

  const onSubmit = handleSubmit(async (values) => {
    if (!editingExpense && HANDOVER_TYPES.has(values.type) && !proofFile) {
      setProofError(t("proofRequired"))
      return
    }
    setProofError(undefined)

    try {
      if (editingExpense) {
        await updateExpenseMutation({
          id: editingExpense.id,
          input: {
            category: values.type === ExpenseType.Expense ? values.category : undefined,
            recipient: HANDOVER_TYPES.has(values.type) ? values.recipient : undefined,
            amount: Number(values.amount),
            expenseDate: values.expenseDate,
            description: values.description || undefined,
          },
        })
        customToast.success(t("expenseUpdated"))
      } else {
        // `category`/`recipient` are guaranteed present by the schema's superRefine once the
        // matching `type` is selected — the `!` just tells TS what validation already ensured.
        const created =
          values.type === ExpenseType.Expense
            ? await createExpense({ type: ExpenseType.Expense, branchId: values.branchId, category: values.category!, amount: Number(values.amount), expenseDate: values.expenseDate, description: values.description || undefined })
            : values.type === ExpenseType.Credit
              ? await createExpense({ type: ExpenseType.Credit, branchId: values.branchId, amount: Number(values.amount), expenseDate: values.expenseDate, description: values.description || undefined })
              : await createExpense({
                  type: values.type,
                  branchId: values.branchId,
                  recipient: values.recipient!,
                  amount: Number(values.amount),
                  expenseDate: values.expenseDate,
                  description: values.description || undefined,
                })

        if (proofFile && HANDOVER_TYPES.has(values.type)) {
          try {
            await uploadProof({ id: created.id, file: proofFile })
          } catch (error) {
            customToast.danger((error as ApiErrorPayload).message || t("proofUploadFailed"))
            setIsOpen(false)
            return
          }
        }
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
      loading={isCreating || isUpdating || isUploadingProof}
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

        {editingExpense ? (
          <CustomInput value={typeOptions.find((option) => option.id === editingExpense.type)?.label ?? editingExpense.type} onChange={() => {}} isReadOnly isDisabled label={t("type")} fullWidth />
        ) : (
          // Plain `FormInput`'s select path forwards the raw scalar RHF value straight into
          // `CustomSelect`, which needs the whole option *object* to resolve a selection — same
          // id<->object translation as the branch field above, done by hand via `Controller`.
          <Controller
            control={control}
            name="type"
            render={({ field, fieldState }) => (
              <CustomSelect
                data={typeOptions}
                value={typeOptions.find((option) => option.id === field.value)}
                onChange={(item) => field.onChange(Array.isArray(item) ? ExpenseType.Expense : item.id)}
                displayKey="label"
                idKey="id"
                label={t("type")}
                isInvalid={!!fieldState.error}
                errorMsg={fieldState.error?.message}
                fullWidth
              />
            )}
          />
        )}

        {type === ExpenseType.Expense && (
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
        )}

        {isHandover && <FormInput control={control} name="recipient" label={t("recipient")} placeholder={t("recipientPlaceholder")} fullWidth />}

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

        {isHandover && !editingExpense && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">{t("proofDocument")}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(event) => {
                setProofFile(event.target.files?.[0] ?? null)
                setProofError(undefined)
              }}
            />
            <CustomButton variant={ButtonVariant.outline} type={ButtonType.button} onClick={() => fileInputRef.current?.click()} fullWidth>
              <PaperclipIcon className="size-4" />
              {proofFile ? proofFile.name : t("attachProof")}
            </CustomButton>
            {proofError && <p className="text-xs text-danger">{proofError}</p>}
            <p className="text-xs text-muted-foreground">{t("proofHint")}</p>
          </div>
        )}
      </div>
    </CustomModal>
  )
}
