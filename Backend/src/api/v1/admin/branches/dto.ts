export type CreateBranchDto = {
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

export type UpdateBranchDto = Partial<CreateBranchDto>

export type BranchDto = {
  id: string
  name: string
  address: string | null
  gstin: string | null
  phone: string | null
  drugLicenseNo: string | null
  contactFirstName: string
  contactLastName: string
  contactEmail: string
  contactPhone: string
  createdAt: Date
  updatedAt: Date
}
