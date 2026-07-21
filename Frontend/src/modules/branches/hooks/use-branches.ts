"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CursorPaginationParams } from "@/types/pagination"
import { createBranch, deleteBranch, getBranches, updateBranch } from "../api/branches-api"
import type { UpdateBranchInput } from "../types"

export const branchesQueryKeys = {
  all: ["branches"] as const,
  list: (pagination: CursorPaginationParams) => ["branches", "list", pagination] as const,
}

export function useBranches(pagination: CursorPaginationParams) {
  return useQuery({ queryKey: branchesQueryKeys.list(pagination), queryFn: () => getBranches(pagination) })
}

export function useCreateBranch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: ["reports"] })
    },
  })
}

export function useUpdateBranch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBranchInput }) => updateBranch(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: ["reports"] })
    },
  })
}

export function useDeleteBranch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: ["reports"] })
    },
  })
}
