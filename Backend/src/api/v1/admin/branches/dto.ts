export type CreateBranchDto = {
  name: string
  address?: string
  gstin?: string
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
