"use client"

import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import {
  ButtonVariant,
  ConfirmVariant,
  CustomButton,
  CustomModal,
  CustomPageHeader,
  CustomTable,
  customToast,
  FormInput,
  InputTypes,
  useConfirm,
} from "@/components/ui"
import type { ApiErrorPayload } from "@/lib/axios"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { useBranches, useCreateBranch, useUpdateBranch, useDeleteBranch } from "../hooks/use-branches"
import type { Branch } from "../types"

type BranchFormValues = {
  name: string
  address?: string
  gstin?: string
  phone?: string
  drugLicenseNo?: string
  contactName: string
  contactEmail: string
  contactPhone: string
  // Only ever required/rendered on create (see the conditional validation below and the form
  // JSX) — on edit this just stays "" and the backend's update handler never reads it anyway.
  password: string
}

const EMPTY_FORM: BranchFormValues = {
  name: "",
  address: "",
  gstin: "",
  phone: "",
  drugLicenseNo: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  password: "",
}

export function BranchesPage() {
  const t = useTranslations("Branches")
  const tCommon = useTranslations("Common")

  const pagination = useCursorPagination()
  const { data: branches, isLoading, isError } = useBranches({ cursor: pagination.cursor, pageSize: pagination.pageSize })
  const { mutateAsync: createBranch, isPending: isCreating } = useCreateBranch()
  const { mutateAsync: updateBranchMutation, isPending: isUpdating } = useUpdateBranch()
  const { mutateAsync: deleteBranchMutation } = useDeleteBranch()
  const confirm = useConfirm()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)

  const branchFormSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("nameRequired")),
        address: z.string().optional(),
        gstin: z.string().optional(),
        phone: z.string().optional(),
        drugLicenseNo: z.string().optional(),
        contactName: z.string().min(1, t("contactNameRequired")),
        contactEmail: z.string().email(t("validEmailRequired")),
        contactPhone: z.string().min(1, t("contactPhoneRequired")),
        // Required on create. On edit it's optional — blank means "leave the password
        // unchanged" (stripped out of the submitted payload below), but a non-blank value must
        // still meet the same minimum length.
        password: editingBranch
          ? z.string().refine((value) => value.length === 0 || value.length >= 6, t("passwordRequired"))
          : z.string().min(6, t("passwordRequired")),
      }),
    [t, editingBranch],
  )

  const { control, handleSubmit, reset } = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: EMPTY_FORM,
  })

  const openCreateForm = () => {
    setEditingBranch(null)
    reset(EMPTY_FORM)
    setIsFormOpen(true)
  }

  const openEditForm = (branch: Branch) => {
    setEditingBranch(branch)
    reset({
      name: branch.name,
      address: branch.address ?? "",
      gstin: branch.gstin ?? "",
      phone: branch.phone ?? "",
      drugLicenseNo: branch.drugLicenseNo ?? "",
      contactName: branch.contactName,
      contactEmail: branch.contactEmail,
      contactPhone: branch.contactPhone,
      password: "",
    })
    setIsFormOpen(true)
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editingBranch) {
        // Blank password means "don't change it" — omit the key entirely rather than sending ""
        // (which would fail the backend's min-length check on a field meant to be optional).
        const { password, ...rest } = values
        const input = password ? { ...rest, password } : rest
        await updateBranchMutation({ id: editingBranch.id, input })
        customToast.success(t("branchUpdated"))
      } else {
        await createBranch(values)
        customToast.success(t("branchRegistered"))
      }
      setIsFormOpen(false)
    } catch (error) {
      customToast.danger((error as ApiErrorPayload).message || t("somethingWentWrong"))
    }
  })

  const handleDelete = async (branch: Branch) => {
    const confirmed = await confirm({
      title: t("deleteTitle", { name: branch.name }),
      description: t("deleteDescription"),
      variant: ConfirmVariant.danger,
      confirmLabel: t("delete"),
    })
    if (!confirmed) return

    try {
      await deleteBranchMutation(branch.id)
      customToast.success(t("branchDeleted"))
    } catch (error) {
      customToast.danger((error as ApiErrorPayload).message || t("couldNotDelete"))
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <CustomPageHeader
        className="shrink-0"
        title={t("title")}
        description={t("description")}
        actions={
          <CustomButton onClick={openCreateForm}>
            <PlusIcon className="size-4" />
            {t("addBranch")}
          </CustomButton>
        }
      />

      <CustomTable<Branch>
        fillHeight
        isError={isError}
        columns={[
          { key: "name", label: tCommon("branch"), sortable: true },
          { key: "gstin", label: t("gstin") },
          { key: "contactName", label: t("contact") },
          { key: "id", label: t("actions") },
        ]}
        data={branches?.data ?? []}
        loading={isLoading}
        rowKey="id"
        itemId="id"
        totalItems={branches?.meta?.total ?? 0}
        onRowsPerPageChange={pagination.setPageSize}
        cursorPagination={{
          page: pagination.page,
          totalPages: branches?.meta?.totalPages,
          hasNextPage: branches?.meta?.hasNextPage ?? false,
          hasPreviousPage: pagination.page > 1,
          onNext: () => pagination.goNext(branches?.meta?.nextCursor ?? null),
          onPrevious: pagination.goPrevious,
        }}
        emptyText={t("emptyText")}
        renderCustomCell={(branch, key) => {
          if (key === "gstin") return branch.gstin ?? "-"
          if (key === "contactName") {
            return (
              <div className="flex flex-col">
                <span>{branch.contactName}</span>
                <span className="text-xs text-muted-foreground">{branch.contactEmail}</span>
              </div>
            )
          }
          if (key === "id") {
            return (
              <div className="flex items-center gap-2">
                <CustomButton variant={ButtonVariant.ghost} isIconOnly onClick={() => openEditForm(branch)}>
                  <PencilSimpleIcon className="size-4" />
                </CustomButton>
                <CustomButton variant={ButtonVariant.ghost} isIconOnly onClick={() => handleDelete(branch)}>
                  <TrashIcon className="size-4 text-danger" />
                </CustomButton>
              </div>
            )
          }
          return branch[key]
        }}
      />

      <CustomModal
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        title={editingBranch ? t("editBranch") : t("registerBranch")}
        subTitle={editingBranch ? undefined : t("registerSubtitle")}
        positiveText={editingBranch ? t("save") : t("register")}
        onPositivePress={onSubmit}
        negativeText={t("cancel")}
        onNegativePress={() => setIsFormOpen(false)}
        loading={isCreating || isUpdating}
        size="lg"
      >
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("branchDetails")}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormInput control={control} name="name" label={t("branchName")} placeholder={t("namePlaceholder")} fullWidth />
              <FormInput control={control} name="gstin" label={t("gstin")} placeholder={t("gstinPlaceholder")} fullWidth />
              <FormInput control={control} name="address" label={t("address")} placeholder={t("addressPlaceholder")} fullWidth />
              <FormInput control={control} name="phone" label={t("branchPhone")} placeholder={t("branchPhonePlaceholder")} fullWidth />
              <FormInput control={control} name="drugLicenseNo" label={t("drugLicenseNo")} placeholder={t("drugLicenseNoPlaceholder")} fullWidth />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("contactPerson")}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormInput control={control} name="contactName" label={t("contactName")} placeholder={t("contactNamePlaceholder")} fullWidth />
              <FormInput control={control} name="contactEmail" label={t("email")} placeholder={t("emailPlaceholder")} fullWidth />
              <FormInput control={control} name="contactPhone" label={t("phone")} placeholder={t("phonePlaceholder")} fullWidth />
              <FormInput
                control={control}
                name="password"
                label={t("password")}
                type={InputTypes.password}
                placeholder={editingBranch ? t("passwordEditPlaceholder") : t("passwordPlaceholder")}
                fullWidth
              />
            </div>
          </div>
        </div>
      </CustomModal>
    </div>
  )
}
