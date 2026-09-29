"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CursorPaginationParams } from "@/types/pagination"
import { createBranch, deleteBranch, getBranchPassword, getBranches, updateBranch } from "../api/branches-api"
import type { UpdateBranchInput } from "../types"

export const branchesQueryKeys = {
  all: ["branches"] as const,
  list: (pagination: CursorPaginationParams, search?: string) => ["branches", "list", pagination, search] as const,
}

export function useBranches(pagination: CursorPaginationParams, search?: string) {
  return useQuery({
    queryKey: branchesQueryKeys.list(pagination, search),
    queryFn: () => getBranches(pagination, search),
    // Keeps the current page's rows on screen (with `isFetching` true)
    // while a page/page-size change is in flight, instead of the table
    // blanking out on every pagination interaction.
    placeholderData: keepPreviousData,
  })
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

/** On-demand fetch (a mutation, not a query) — viewing a branch's password is a deliberate click, not something that should auto-fire/cache/refetch in the background the way a `useQuery` would. */
export function useBranchPassword() {
  return useMutation({ mutationFn: getBranchPassword })
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
