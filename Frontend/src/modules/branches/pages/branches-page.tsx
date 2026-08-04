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
  CustomStickyBar,
  CustomTable,
  customToast,
  FormInput,
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
  contactFirstName: string
  contactLastName: string
  contactEmail: string
  contactPhone: string
}

const EMPTY_FORM: BranchFormValues = {
  name: "",
  address: "",
  gstin: "",
  phone: "",
  drugLicenseNo: "",
  contactFirstName: "",
  contactLastName: "",
  contactEmail: "",
  contactPhone: "",
}

export function BranchesPage() {
  const t = useTranslations("Branches")
  const tCommon = useTranslations("Common")

  const branchFormSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("nameRequired")),
        address: z.string().optional(),
        gstin: z.string().optional(),
        phone: z.string().optional(),
        drugLicenseNo: z.string().optional(),
        contactFirstName: z.string().min(1, t("firstNameRequired")),
        contactLastName: z.string().min(1, t("lastNameRequired")),
        contactEmail: z.string().email(t("validEmailRequired")),
        contactPhone: z.string().min(1, t("contactPhoneRequired")),
      }),
    [t],
  )

  const pagination = useCursorPagination()
  const { data: branches, isLoading } = useBranches({ cursor: pagination.cursor, pageSize: pagination.pageSize })
  const { mutateAsync: createBranch, isPending: isCreating } = useCreateBranch()
  const { mutateAsync: updateBranchMutation, isPending: isUpdating } = useUpdateBranch()
  const { mutateAsync: deleteBranchMutation } = useDeleteBranch()
  const confirm = useConfirm()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)

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
      contactFirstName: branch.contactFirstName,
      contactLastName: branch.contactLastName,
      contactEmail: branch.contactEmail,
      contactPhone: branch.contactPhone,
    })
    setIsFormOpen(true)
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editingBranch) {
        await updateBranchMutation({ id: editingBranch.id, input: values })
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
    <div className="space-y-4">
      <CustomStickyBar>
        <CustomPageHeader
          title={t("title")}
          description={t("description")}
          actions={
            <CustomButton onClick={openCreateForm}>
              <PlusIcon className="size-4" />
              {t("addBranch")}
            </CustomButton>
          }
        />
      </CustomStickyBar>

      <CustomTable<Branch>
        columns={[
          { key: "name", label: tCommon("branch"), sortable: true },
          { key: "gstin", label: t("gstin") },
          { key: "contactFirstName", label: t("contact") },
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
          if (key === "contactFirstName") {
            return (
              <div className="flex flex-col">
                <span>{`${branch.contactFirstName} ${branch.contactLastName}`}</span>
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
              <FormInput control={control} name="name" label={t("branchName")} fullWidth />
              <FormInput control={control} name="gstin" label={t("gstin")} fullWidth />
              <FormInput control={control} name="address" label={t("address")} fullWidth />
              <FormInput control={control} name="phone" label={t("branchPhone")} fullWidth />
              <FormInput control={control} name="drugLicenseNo" label={t("drugLicenseNo")} fullWidth />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("contactPerson")}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormInput control={control} name="contactFirstName" label={t("firstName")} fullWidth />
              <FormInput control={control} name="contactLastName" label={t("lastName")} fullWidth />
              <FormInput control={control} name="contactEmail" label={t("email")} fullWidth />
              <FormInput control={control} name="contactPhone" label={t("phone")} fullWidth />
            </div>
          </div>
        </div>
      </CustomModal>
    </div>
  )
}
