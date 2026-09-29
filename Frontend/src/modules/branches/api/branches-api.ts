import { api } from "@/lib/axios"
import type { CursorPaginationParams, PaginatedResponse } from "@/types/pagination"
import type { Branch, CreateBranchInput, UpdateBranchInput } from "../types"

const BASE = "/admin/branches"

export async function getBranches(pagination: CursorPaginationParams, search?: string): Promise<PaginatedResponse<Branch>> {
  const { data } = await api.get<PaginatedResponse<Branch>>(BASE, { params: { ...pagination, search } })
  return data
}

export async function createBranch(input: CreateBranchInput): Promise<Branch> {
  const { data } = await api.post<{ data: Branch }>(BASE, input)
  return data.data
}

export async function updateBranch(id: string, input: UpdateBranchInput): Promise<Branch> {
  const { data } = await api.patch<{ data: Branch }>(`${BASE}/${id}`, input)
  return data.data
}

export async function deleteBranch(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`)
}

/** Decrypted on demand server-side — `null` when this branch's password was set before this feature existed and has never been changed since. Deliberately not part of `getBranches`/a single `getBranch` — a separate, explicit fetch so viewing it is a deliberate action. */
export async function getBranchPassword(id: string): Promise<string | null> {
  const { data } = await api.get<{ data: { password: string | null } }>(`${BASE}/${id}/password`)
  return data.data.password
}
