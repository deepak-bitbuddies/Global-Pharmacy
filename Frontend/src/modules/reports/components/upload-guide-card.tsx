"use client"

import { Fragment } from "react"
import { useLocale, useTranslations } from "next-intl"
import { ArrowRightIcon, CaretRightIcon, CheckIcon } from "@phosphor-icons/react"

import { ButtonVariant, CustomButton, CustomCard, CustomSpinner } from "@/components/ui"
import { CustomSize } from "@/lib/types"
import { formatDisplayDate } from "@/utils/formatting"
import { DAILY_UPLOAD_SEQUENCE } from "../constants/import"
import type { RunningImport } from "../hooks/use-uploads"
import type { ImportFileType, UploadCycleStatus } from "../types"
import { getNextUploadStep, isFileTypeDoneForOpenDay } from "../utils/upload-guide"

type UploadGuideCardProps = {
  cycleStatus: UploadCycleStatus
  runningImport: RunningImport
  selectedTab: ImportFileType
  onGoToTab: (fileType: ImportFileType) => void
}

/** Tells branch staff, in one line, exactly which file to upload next and for which day — or to wait while a file is importing. */
export function UploadGuideCard({ cycleStatus, runningImport, selectedTab, onGoToTab }: UploadGuideCardProps) {
  const t = useTranslations("Import.guide")
  const locale = useLocale()

  if (runningImport.isRunning) {
    return (
      <CustomCard className="flex items-center gap-2 border-warning/40! bg-warning/10! px-4 py-3">
        <CustomSpinner size={CustomSize.sm} className="shrink-0" />
        <p className="text-sm" role="status" aria-live="polite">
          <span className="font-semibold">{t("importingTitle")}</span>{" "}
          {runningImport.batch ? t("importingFile", { fileName: runningImport.batch.fileName }) : t("importingSending")}
        </p>
      </CustomCard>
    )
  }

  const next = getNextUploadStep(cycleStatus)
  const nextName = t(`fileTypes.${next.fileType}`)
  const date = next.date ? formatDisplayDate(next.date, locale) : null
  const isNewDay = next.completedDate !== null || next.date === null

  return (
    <CustomCard className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-primary/40! bg-primary/5! px-4 py-3">
      <div className="min-w-0 space-y-0.5" role="status" aria-live="polite">
        <p className="text-sm">
          <span className="font-semibold text-primary">{t("nextStep")}:</span>{" "}
          {date ? t.rich("uploadFileForDate", { fileType: nextName, date, b: (chunks) => <span className="font-semibold">{chunks}</span> }) : t("uploadFirstStock")}
        </p>
        <p className="text-xs text-muted-foreground">
          {date ? t("checkDateHint", { date }) : t("firstStockHint")}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {date && (
          <ol className="flex items-center gap-1 text-xs" aria-label={t("stepsLabel")}>
            {DAILY_UPLOAD_SEQUENCE.map((fileType, index) => {
              const done = !isNewDay && isFileTypeDoneForOpenDay(cycleStatus, fileType)
              const isNext = fileType === next.fileType
              return (
                <Fragment key={fileType}>
                  {index > 0 && <CaretRightIcon className="size-3 text-muted-foreground" aria-hidden />}
                  <li className={`flex items-center gap-0.5 ${done ? "text-success" : isNext ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                    {done && <CheckIcon className="size-3" weight="bold" aria-hidden />}
                    {t(`fileTypes.${fileType}`)}
                  </li>
                </Fragment>
              )
            })}
          </ol>
        )}

        {selectedTab !== next.fileType && (
          <CustomButton
            variant={ButtonVariant.ghost}
            size={CustomSize.sm}
            className="h-7 shrink-0 px-2 text-xs font-semibold text-primary"
            onClick={() => onGoToTab(next.fileType)}
            endContent={<ArrowRightIcon className="size-3" aria-hidden />}
          >
            {t("goToTab", { fileType: nextName })}
          </CustomButton>
        )}
      </div>
    </CustomCard>
  )
}
