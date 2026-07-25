"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react"

import {
  ButtonVariant,
  ConfirmVariant,
  CustomButton,
  CustomModal,
  CustomPageHeader,
  CustomTable,
  customToast,
  FormInput,
  useConfirm,
} from "@/components/ui"
import type { ApiErrorPayload } from "@/lib/axios"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { useBranches, useCreateBranch, useUpdateBranch, useDeleteBranch } from "../hooks/use-branches"
import type { Branch } from "../types"

const branchFormSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  address: z.string().optional(),
  gstin: z.string().optional(),
  phone: z.string().optional(),
  drugLicenseNo: z.string().optional(),
  contactFirstName: z.string().min(1, "First name is required"),
  contactLastName: z.string().min(1, "Last name is required"),
  contactEmail: z.string().email("A valid email is required"),
  contactPhone: z.string().min(1, "Contact phone is required"),
})

type BranchFormValues = z.infer<typeof branchFormSchema>

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
        customToast.success("Branch updated")
      } else {
        await createBranch(values)
        customToast.success("Branch registered — the contact person can log in with the default account password")
      }
      setIsFormOpen(false)
    } catch (error) {
      customToast.danger((error as ApiErrorPayload).message || "Something went wrong")
    }
  })

  const handleDelete = async (branch: Branch) => {
    const confirmed = await confirm({
      title: `Delete ${branch.name}?`,
      description: "This also removes the branch's login account. Blocked if the branch already has imports on record.",
      variant: ConfirmVariant.danger,
      confirmLabel: "Delete",
    })
    if (!confirmed) return

    try {
      await deleteBranchMutation(branch.id)
      customToast.success("Branch deleted")
    } catch (error) {
      customToast.danger((error as ApiErrorPayload).message || "Could not delete this branch")
    }
  }

  return (
    <div className="space-y-4">
      <CustomPageHeader
        title="Branches"
        description="Register pharmacy branches. Each branch's contact person also becomes its login user."
        actions={
          <CustomButton onClick={openCreateForm}>
            <PlusIcon className="size-4" />
            Add Branch
          </CustomButton>
        }
      />

      <CustomTable<Branch>
        columns={[
          { key: "name", label: "Branch", sortable: true },
          { key: "gstin", label: "GSTIN" },
          { key: "contactFirstName", label: "Contact" },
          { key: "id", label: "Actions" },
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
        emptyText="No branches yet — register one to start importing data."
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
        title={editingBranch ? "Edit Branch" : "Register Branch"}
        subTitle={editingBranch ? undefined : "The contact person below also becomes this branch's login user, with the standard default password."}
        positiveText={editingBranch ? "Save" : "Register"}
        onPositivePress={onSubmit}
        negativeText="Cancel"
        onNegativePress={() => setIsFormOpen(false)}
        loading={isCreating || isUpdating}
        size="lg"
      >
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Branch Details</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormInput control={control} name="name" label="Branch Name" fullWidth />
              <FormInput control={control} name="gstin" label="GSTIN" fullWidth />
              <FormInput control={control} name="address" label="Address" fullWidth />
              <FormInput control={control} name="phone" label="Branch Phone" fullWidth />
              <FormInput control={control} name="drugLicenseNo" label="Drug License No." fullWidth />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact Person (also the login user)</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormInput control={control} name="contactFirstName" label="First Name" fullWidth />
              <FormInput control={control} name="contactLastName" label="Last Name" fullWidth />
              <FormInput control={control} name="contactEmail" label="Email" fullWidth />
              <FormInput control={control} name="contactPhone" label="Phone" fullWidth />
            </div>
          </div>
        </div>
      </CustomModal>
    </div>
  )
}
