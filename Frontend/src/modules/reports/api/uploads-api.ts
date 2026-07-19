import { api } from "@/lib/axios"
import type { ImportBatch, ImportFileType, UploadResult } from "../types"

export async function uploadFile(fileType: ImportFileType, file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append("fileType", fileType)
  formData.append("file", file)

  const { data } = await api.post<{ data: UploadResult }>("/admin/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data.data
}

export async function getImportBatches(): Promise<ImportBatch[]> {
  const { data } = await api.get<{ data: ImportBatch[] }>("/admin/uploads")
  return data.data
}
