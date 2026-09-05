export type CreateBranchDto = {
  name: string
  address?: string
  // `null` means "explicitly cleared"; `undefined` means "left untouched" — only meaningfully
  // distinct on update, see `schema.ts`'s `nullableGstin`.
  gstin?: string | null
  phone?: string
  drugLicenseNo?: string
  contactName: string
  contactEmail: string
  contactPhone: string
  password: string
}

export type UpdateBranchDto = Partial<CreateBranchDto>

/** The read-facing shape — never carries a password. */
export type BranchDto = {
  id: string
  name: string
  address: string | null
  gstin: string | null
  phone: string | null
  drugLicenseNo: string | null
  contactName: string
  contactEmail: string
  contactPhone: string
  createdAt: Date
  updatedAt: Date
}
