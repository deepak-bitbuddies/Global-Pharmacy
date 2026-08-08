import type { AxiosProgressEvent } from "axios"

import { api } from "@/lib/axios"
import type { BulkUploadAck, ImportBatch, ImportFileType, UploadAck, UploadCycleStatus } from "../types"

export async function uploadFile(
  fileType: ImportFileType,
  branchId: string,
  file: File,
  onUploadProgress?: (event: AxiosProgressEvent) => void,
): Promise<UploadAck> {
  const formData = new FormData()
  formData.append("fileType", fileType)
  formData.append("branchId", branchId)
  formData.append("file", file)

  const { data } = await api.post<{ data: UploadAck }>("/admin/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  })
  return data.data
}

/** Multi-file bulk import (super_admin only) — each file's type is auto-detected server-side, no per-file `fileType` field. */
export async function bulkUploadFiles(
  branchId: string,
  files: File[],
  onUploadProgress?: (event: AxiosProgressEvent) => void,
): Promise<BulkUploadAck> {
  const formData = new FormData()
  formData.append("branchId", branchId)
  for (const file of files) formData.append("files", file)

  const { data } = await api.post<{ data: BulkUploadAck }>("/admin/uploads/bulk", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  })
  return data.data
}

export async function getImportBatches(branchId?: string, fileType?: ImportFileType): Promise<ImportBatch[]> {
  const { data } = await api.get<{ data: ImportBatch[] }>("/admin/uploads", { params: { branchId, fileType } })
  return data.data
}

export async function getUploadCycleStatus(branchId: string): Promise<UploadCycleStatus> {
  const { data } = await api.get<{ data: UploadCycleStatus }>("/admin/uploads/cycle-status", { params: { branchId } })
  return data.data
}
