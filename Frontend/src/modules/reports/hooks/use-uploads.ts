"use client"

import type { AxiosProgressEvent } from "axios"
import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { reportsMutationKeys, reportsQueryKeys } from "../constants/query-keys"
import { ImportBatchStatus, type ImportBatch, type ImportFileType } from "../types"
import { findRunningImport } from "../utils/upload-guide"
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
    refetchInterval: (query) => (query.state.data?.some((batch) => batch.status === ImportBatchStatus.Processing) ? 3000 : false),
  })
}

export function useUploadCycleStatus(branchId?: string) {
  return useQuery({
    queryKey: reportsQueryKeys.uploadCycleStatus(branchId),
    queryFn: () => getUploadCycleStatus(branchId!),
    enabled: !!branchId,
  })
}

export type RunningImport = {
  isRunning: boolean
  /** First load of the branch's import history still in flight — whether something is running isn't known yet. */
  isLoading: boolean
  /** The batch being processed on the server, if one is known yet — absent while a file is still being sent. */
  batch: ImportBatch | undefined
}

/**
 * Whether *any* file for this branch is still importing — being sent right now (a pending upload
 * mutation, single or bulk) or still processing on the server (any file type). The Import page
 * locks every other upload until this clears, so a user can't send the day's Purchase while its
 * Stock is still going in. Reuses the branch-wide history query, which already polls while
 * anything in it is processing.
 */
export function useRunningImport(branchId?: string): RunningImport {
  const { data: batches, isLoading } = useImportBatches(branchId)
  const sendingCount = useIsMutating({ mutationKey: reportsMutationKeys.uploadAny })
  // eslint-disable-next-line react-hooks/purity -- staleness check only needs to be as fresh as the last render; every poll re-renders anyway
  const batch = batches ? findRunningImport(batches, Date.now()) : undefined
  return { isRunning: sendingCount > 0 || !!batch, isLoading, batch }
}

export function useUploadFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: reportsMutationKeys.uploadFile,
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
    // Returned (awaited) so the mutation stays pending until that row is in the cache — otherwise
    // `useRunningImport` would briefly see neither a pending upload nor a processing row and unlock.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
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
    mutationKey: reportsMutationKeys.uploadBulk,
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
