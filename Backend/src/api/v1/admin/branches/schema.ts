import { z } from "zod"

export const createBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  address: z.string().optional(),
  gstin: z.string().optional(),
  phone: z.string().optional(),
  drugLicenseNo: z.string().optional(),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("A valid contact email is required"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const updateBranchSchema = createBranchSchema.partial()

export const branchIdParamSchema = z.object({
  id: z.string().uuid("Invalid branch id"),
})

export const listBranchesQuerySchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().positive().max(200).default(10),
})
