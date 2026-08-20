"use client"

import type { AxiosProgressEvent } from "axios"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { reportsQueryKeys } from "../constants/query-keys"
import type { ImportFileType } from "../types"
import { bulkUploadFiles, getImportBatches, getUploadCycleStatus, revertImportBatch, uploadFile } from "../api/uploads-api"

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
    mutationFn: ({
      fileType,
      branchId,
      file,
      onUploadProgress,
    }: {
      fileType: ImportFileType
      branchId: string
      file: File
      onUploadProgress?: (event: AxiosProgressEvent) => void
    }) => uploadFile(fileType, branchId, file, onUploadProgress),
    // The batch already lands as a "processing" row by the time this ack comes back — worth a
    // refresh right away, on top of the live per-file refresh `useImportSocket` triggers as it finishes.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] })
    },
  })
}

export function useRevertImportBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: revertImportBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] })
    },
  })
}

export function useBulkUploadFiles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      branchId,
      files,
      onUploadProgress,
    }: {
      branchId: string
      files: File[]
      onUploadProgress?: (event: AxiosProgressEvent) => void
    }) => bulkUploadFiles(branchId, files, onUploadProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] })
    },
  })
}
