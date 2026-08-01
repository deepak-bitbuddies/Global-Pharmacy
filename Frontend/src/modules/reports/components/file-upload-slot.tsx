"use client"

import { useRef, useState } from "react"
import { CheckCircleIcon, UploadSimpleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { ButtonVariant, CustomButton, CustomCard, customToast } from "@/components/ui"
import type { ApiErrorPayload } from "@/lib/axios"
import { useUploadFile } from "../hooks/use-uploads"
import type { ImportFileType } from "../types"

type FileUploadSlotProps = {
  fileType: ImportFileType
  title: string
  description: string
  branchId?: string
}

export function FileUploadSlot({ fileType, title, description, branchId }: FileUploadSlotProps) {
  const t = useTranslations("Import")
  const inputRef = useRef<HTMLInputElement>(null)
  const [lastFileName, setLastFileName] = useState<string | null>(null)
  const { mutate, isPending } = useUploadFile()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = "" // allow re-selecting the same file later
    if (!file || !branchId) return

    mutate(
      { fileType, branchId, file },
      {
        onSuccess: (result) => {
          setLastFileName(result.fileName)
          customToast.success(
            t(result.replaced ? "importSuccessReplaced" : "importSuccess", { rowCount: String(result.rowCount), fileName: result.fileName }),
          )
        },
        onError: (error: ApiErrorPayload) => {
          customToast.danger(error.message || t("importFailed"))
        },
      },
    )
  }

  return (
    <CustomCard className="space-y-3 p-5">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <input ref={inputRef} type="file" accept=".xls,.xlsx" className="hidden" onChange={handleFileChange} disabled={!branchId} />
      <CustomButton
        variant={ButtonVariant.outline}
        loading={isPending}
        isDisabled={!branchId}
        onClick={() => inputRef.current?.click()}
        fullWidth
      >
        <UploadSimpleIcon className="size-4" />
        {isPending ? t("importing") : t("chooseFile")}
      </CustomButton>
      {lastFileName && !isPending && (
        <p className="flex items-center gap-1.5 text-xs text-success">
          <CheckCircleIcon className="size-4" />
          {lastFileName}
        </p>
      )}
    </CustomCard>
  )
}
