import { api } from "@/lib/axios"
import type { ImportBatch, ImportFileType, UploadCycleStatus, UploadResult } from "../types"

export async function uploadFile(fileType: ImportFileType, branchId: string, file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append("fileType", fileType)
  formData.append("branchId", branchId)
  formData.append("file", file)

  const { data } = await api.post<{ data: UploadResult }>("/admin/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
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
