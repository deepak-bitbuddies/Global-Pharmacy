"use client"

import type { AxiosProgressEvent } from "axios"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { reportsQueryKeys } from "../constants/query-keys"
import type { ImportFileType } from "../types"
import { bulkUploadFiles, getImportBatches, getUploadCycleStatus, revertImportBatch, uploadFile } from "../api/uploads-api"

/**
 * Kept live by `useImportSocket`'s `import-batch:update` listener invalidating `["reports"]`.
 * `refetchInterval` is a safety net on top of that: a small/fast file can finish processing before
 * the socket's own handshake completes (same race documented on `useExpensesExportJobs`), which
 * would otherwise leave this list stuck showing "Processing" — and never picking up the row at all,
 * for a file whose placeholder didn't arrive before the missed event — until the page is manually
 * refreshed. Only polls while a batch in the current result is actually still processing.
 */
export function useImportBatches(branchId?: string, fileType?: ImportFileType) {
  return useQuery({
    queryKey: reportsQueryKeys.importBatches(branchId, fileType),
    queryFn: () => getImportBatches(branchId, fileType),
    enabled: !!branchId,
    refetchInterval: (query) => (query.state.data?.some((batch) => batch.status === "processing") ? 3000 : false),
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
