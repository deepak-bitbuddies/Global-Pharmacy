import { api } from "@/lib/axios"
import type { CursorPaginationParams, PaginatedResponse } from "@/types/pagination"
import type { PurchaseAnalysisFilters, PurchaseAnalysisImportBatch, PurchaseAnalysisRow, PurchaseAnalysisSummary, PurchaseAnalysisUploadAck } from "../types"

const BASE = "/admin/purchase-analysis"

export async function getPurchaseAnalysisLines(
  filters: PurchaseAnalysisFilters,
  pagination: CursorPaginationParams,
): Promise<PaginatedResponse<PurchaseAnalysisRow>> {
  const { data } = await api.get<PaginatedResponse<PurchaseAnalysisRow>>(BASE, { params: { ...filters, ...pagination } })
  return data
}

export async function getPurchaseAnalysisSummary(filters: PurchaseAnalysisFilters): Promise<PurchaseAnalysisSummary> {
  const { data } = await api.get<{ data: PurchaseAnalysisSummary }>(`${BASE}/summary`, { params: filters })
  return data.data
}

export async function getPurchaseAnalysisParties(): Promise<string[]> {
  const { data } = await api.get<{ data: string[] }>(`${BASE}/parties`)
  return data.data
}

export async function getPurchaseAnalysisItems(): Promise<string[]> {
  const { data } = await api.get<{ data: string[] }>(`${BASE}/items`)
  return data.data
}

export async function getPurchaseAnalysisCompanies(): Promise<string[]> {
  const { data } = await api.get<{ data: string[] }>(`${BASE}/companies`)
  return data.data
}

export async function getPurchaseAnalysisTypes(): Promise<string[]> {
  const { data } = await api.get<{ data: string[] }>(`${BASE}/types`)
  return data.data
}

export async function getPurchaseAnalysisAreas(): Promise<string[]> {
  const { data } = await api.get<{ data: string[] }>(`${BASE}/areas`)
  return data.data
}

export async function getPurchaseAnalysisRoutes(): Promise<string[]> {
  const { data } = await api.get<{ data: string[] }>(`${BASE}/routes`)
  return data.data
}

export async function uploadPurchaseAnalysisFile(file: File): Promise<PurchaseAnalysisUploadAck> {
  const formData = new FormData()
  formData.append("file", file)
  const { data } = await api.post<{ data: PurchaseAnalysisUploadAck }>(`${BASE}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data.data
}

export async function getPurchaseAnalysisBatches(): Promise<PurchaseAnalysisImportBatch[]> {
  const { data } = await api.get<{ data: PurchaseAnalysisImportBatch[] }>(`${BASE}/batches`)
  return data.data
}

export async function deletePurchaseAnalysisBatch(id: string): Promise<void> {
  await api.delete(`${BASE}/batches/${id}`)
}
