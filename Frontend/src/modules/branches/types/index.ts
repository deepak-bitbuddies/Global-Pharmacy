export type Branch = {
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
  createdAt: string
  updatedAt: string
}

export type CreateBranchInput = {
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

export type UpdateBranchInput = Partial<CreateBranchInput>
