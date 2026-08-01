"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { reportsQueryKeys } from "../constants/query-keys"
import type { ImportFileType } from "../types"
import { getImportBatches, getUploadCycleStatus, uploadFile } from "../api/uploads-api"

export function useImportBatches(branchId?: string, fileType?: ImportFileType) {
  return useQuery({
    queryKey: reportsQueryKeys.importBatches(branchId, fileType),
    queryFn: () => getImportBatches(branchId, fileType),
    enabled: !!branchId,
  })
}

export function useUploadCycleStatus(branchId?: string) {
  return useQuery({
    queryKey: reportsQueryKeys.uploadCycleStatus(branchId),
    queryFn: () => getUploadCycleStatus(branchId!),
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
