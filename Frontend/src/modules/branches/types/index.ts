export type Branch = {
  id: string
  name: string
  address: string | null
  gstin: string | null
  phone: string | null
  drugLicenseNo: string | null
  contactName: string
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
  contactName: string
  contactEmail: string
  contactPhone: string
  password: string
}

export type UpdateBranchInput = Partial<CreateBranchInput>
