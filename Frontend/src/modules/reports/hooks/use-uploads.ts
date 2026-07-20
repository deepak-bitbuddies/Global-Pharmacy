"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { reportsQueryKeys } from "../constants/query-keys"
import type { ImportFileType } from "../types"
import { getImportBatches, uploadFile } from "../api/uploads-api"

export function useImportBatches() {
  return useQuery({ queryKey: reportsQueryKeys.importBatches, queryFn: getImportBatches })
}

export function useUploadFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fileType, file }: { fileType: ImportFileType; file: File }) => uploadFile(fileType, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] })
    },
  })
}
