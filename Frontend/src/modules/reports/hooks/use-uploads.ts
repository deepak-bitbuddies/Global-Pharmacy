"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { reportsQueryKeys } from "../constants/query-keys"
import type { ImportFileType } from "../types"
import { getImportBatches, uploadFile } from "../api/uploads-api"

export function useImportBatches(branchId?: string) {
  return useQuery({
    queryKey: reportsQueryKeys.importBatches(branchId),
    queryFn: () => getImportBatches(branchId),
    enabled: !!branchId,
  })
}

export function useUploadFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fileType, branchId, file }: { fileType: ImportFileType; branchId: string; file: File }) => uploadFile(fileType, branchId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] })
    },
  })
}
