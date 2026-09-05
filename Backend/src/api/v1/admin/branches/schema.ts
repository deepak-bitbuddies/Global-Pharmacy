import { z } from "zod"

// Blank/omitted stays `undefined` (leave unchanged on update, store null on create); an explicitly
// blanked-out field on update ("I typed something in, then cleared it") comes through as `null` so
// it actually clears the stored value — distinct from never having touched the field at all. Empty
// string is never stored as-is: `gstin` has a unique constraint, and Postgres does enforce
// uniqueness across empty strings (unlike NULLs, which are always distinct from one another) — a
// second branch with a blank GSTIN would otherwise collide with the first.
const nullableGstin = z
  .string()
  .optional()
  .transform((value) => (value === undefined ? undefined : value.trim() === "" ? null : value.trim()))

export const createBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  address: z.string().optional(),
  gstin: nullableGstin,
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
  search: z.string().optional(),
})
