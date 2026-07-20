import { api } from "@/lib/axios"
import type { CursorPaginationParams, PaginatedResponse } from "@/types/pagination"
import type { Branch, CreateBranchInput, UpdateBranchInput } from "../types"

const BASE = "/admin/branches"

export async function getBranches(pagination: CursorPaginationParams): Promise<PaginatedResponse<Branch>> {
  const { data } = await api.get<PaginatedResponse<Branch>>(BASE, { params: pagination })
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
