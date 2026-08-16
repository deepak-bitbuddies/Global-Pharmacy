import { hash } from "bcryptjs"

import { db } from "../../../../core/database/db.js"
import { BCRYPT_SALT_ROUNDS } from "../../../../shared/constants/auth.constants.js"
import { ConflictError, NotFoundError } from "../../../../shared/errors/index.js"
import { rethrowUniqueViolation } from "../../../../shared/helpers/db-errors.js"
import { SystemRoleCode } from "../../../../shared/enums/index.js"
import { createAuthUser, deleteAuthUserByBranchId, findAuthUserByEmail, updateAuthUserPasswordByBranchId } from "../auth/index.js"
import {
  countImportBatchesForBranch,
  createBranch as createBranchRow,
  deleteBranch as deleteBranchRow,
  findBranchById,
  listBranchesPaginated,
  updateBranch as updateBranchRow,
  type BranchDocument,
} from "../uploads/index.js"
import type { CursorPaginationParams, PaginatedResult } from "../../../../shared/types/pagination.js"
import type { BranchDto, CreateBranchDto, UpdateBranchDto } from "./dto.js"

function toBranchDto(branch: BranchDocument): BranchDto {
  return branch
}

const UNIQUE_CONSTRAINT_MESSAGES = {
  branches_gstin_unique: "A branch with this GSTIN already exists",
  users_email_unique: "A user with this email already exists",
}

export async function getBranches(pagination: CursorPaginationParams): Promise<PaginatedResult<BranchDto>> {
  const { rows, ...page } = await listBranchesPaginated(pagination)
  return { ...page, rows: rows.map(toBranchDto) }
}

export async function getBranch(branchId: string): Promise<BranchDto> {
  const branch = await findBranchById(branchId)
  if (!branch) throw new NotFoundError("Branch not found")
  return toBranchDto(branch)
}

/**
 * Registers a branch and its linked login account (the contact person) in
 * one atomic operation — a branch is only meaningful with someone who can
 * log in for it, and a half-created pair (branch with no user, or vice
 * versa) would be a confusing dangling record.
 */
export async function createBranch(input: CreateBranchDto): Promise<BranchDto> {
  const contactEmail = input.contactEmail.toLowerCase()

  const existingUser = await findAuthUserByEmail(contactEmail)
  if (existingUser) throw new ConflictError("A user with this email already exists")

  const passwordHash = await hash(input.password, BCRYPT_SALT_ROUNDS)

  try {
    const branch = await db.transaction(async (tx) => {
      const createdBranch = await createBranchRow(
        {
          name: input.name,
          address: input.address ?? null,
          gstin: input.gstin ?? null,
          phone: input.phone ?? null,
          drugLicenseNo: input.drugLicenseNo ?? null,
          contactName: input.contactName,
          contactEmail,
          contactPhone: input.contactPhone,
        },
        tx,
      )

      await createAuthUser(
        {
          name: input.contactName.trim(),
          email: contactEmail,
          passwordHash,
          role: SystemRoleCode.BRANCH_USER,
          branchId: createdBranch.id,
        },
        tx,
      )

      return createdBranch
    })

    return toBranchDto(branch)
  } catch (error) {
    rethrowUniqueViolation(error, UNIQUE_CONSTRAINT_MESSAGES)
  }
}

export async function updateBranch(branchId: string, input: UpdateBranchDto): Promise<BranchDto> {
  const existing = await findBranchById(branchId)
  if (!existing) throw new NotFoundError("Branch not found")

  let updated
  try {
    updated = await updateBranchRow(branchId, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.gstin !== undefined && { gstin: input.gstin }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.drugLicenseNo !== undefined && { drugLicenseNo: input.drugLicenseNo }),
      ...(input.contactName !== undefined && { contactName: input.contactName }),
      ...(input.contactEmail !== undefined && { contactEmail: input.contactEmail.toLowerCase() }),
      ...(input.contactPhone !== undefined && { contactPhone: input.contactPhone }),
    })
  } catch (error) {
    rethrowUniqueViolation(error, UNIQUE_CONSTRAINT_MESSAGES)
  }
  if (!updated) throw new NotFoundError("Branch not found")

  // Blank/omitted password means "leave it unchanged" — only touch the linked login user's
  // password when the admin actually typed a new one.
  if (input.password) {
    const passwordHash = await hash(input.password, BCRYPT_SALT_ROUNDS)
    await updateAuthUserPasswordByBranchId(branchId, passwordHash)
  }

  return toBranchDto(updated)
}

/** Deletes a branch and its linked login account together — blocked if the branch already has imports on record. */
export async function deleteBranch(branchId: string): Promise<void> {
  const existing = await findBranchById(branchId)
  if (!existing) throw new NotFoundError("Branch not found")

  const importCount = await countImportBatchesForBranch(branchId)
  if (importCount > 0) {
    throw new ConflictError(`This branch has ${importCount} import(s) on record and can't be deleted`)
  }

  await db.transaction(async (tx) => {
    await deleteAuthUserByBranchId(branchId, tx)
    await deleteBranchRow(branchId, tx)
  })
}
