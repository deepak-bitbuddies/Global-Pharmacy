"use client"

import { useRef, useState } from "react"
import { CheckCircleIcon, UploadSimpleIcon } from "@phosphor-icons/react"

import { ButtonVariant, CustomButton, CustomCard, customToast } from "@/components/ui"
import type { ApiErrorPayload } from "@/lib/axios"
import { useUploadFile } from "../hooks/use-uploads"
import type { ImportFileType } from "../types"

type FileUploadSlotProps = {
  fileType: ImportFileType
  title: string
  description: string
}

export function FileUploadSlot({ fileType, title, description }: FileUploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [lastFileName, setLastFileName] = useState<string | null>(null)
  const { mutate, isPending } = useUploadFile()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = "" // allow re-selecting the same file later
    if (!file) return

    mutate(
      { fileType, file },
      {
        onSuccess: (result) => {
          setLastFileName(result.fileName)
          customToast.success(
            `Imported ${result.rowCount} rows from ${result.fileName}${result.replaced ? " (replaced previous import)" : ""}`,
          )
        },
        onError: (error: ApiErrorPayload) => {
          customToast.danger(error.message || "Import failed")
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
      <input ref={inputRef} type="file" accept=".xls,.xlsx" className="hidden" onChange={handleFileChange} />
      <CustomButton variant={ButtonVariant.outline} loading={isPending} onClick={() => inputRef.current?.click()} fullWidth>
        <UploadSimpleIcon className="size-4" />
        {isPending ? "Importing..." : "Choose file"}
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
