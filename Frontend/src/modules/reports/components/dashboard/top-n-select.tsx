"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { ArrowDownIcon, ArrowUpIcon } from "@phosphor-icons/react"

import { TopNDirection, type TopNSelection } from "../../types"

const MIN_COUNT = 1
const MAX_COUNT = 500

type TopNSelectProps = {
  value: TopNSelection
  onChange: (value: TopNSelection) => void
}

/**
 * One cohesive pill instead of two separate boxes: a Top/Bottom segmented toggle (icon + label,
 * active side filled with the primary color) fused directly to a free-entry count field, sharing
 * one border/rounded-corner so it reads as a single control at a glance. The count only commits
 * (and triggers a refetch) on blur or Enter, not on every keystroke, so "top 25" doesn't fire a
 * query after just the "2".
 */
export function TopNSelect({ value, onChange }: TopNSelectProps) {
  const t = useTranslations("Dashboard.topN")

  const [countText, setCountText] = useState(String(value.limit))
  useEffect(() => setCountText(String(value.limit)), [value.limit])

  const commitCount = () => {
    const parsed = Math.trunc(Number(countText))
    if (Number.isFinite(parsed) && parsed >= MIN_COUNT) {
      const clamped = Math.min(parsed, MAX_COUNT)
      setCountText(String(clamped))
      if (clamped !== value.limit) onChange({ ...value, limit: clamped })
    } else {
      setCountText(String(value.limit))
    }
  }

  const segmentClass = (active: boolean) =>
    `flex h-full items-center gap-1 px-2.5 text-xs font-medium transition-colors ${
      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted-surface"
    }`

  return (
    <div className="flex h-8 items-stretch overflow-hidden rounded-app border border-default" role="group" aria-label={t("label")}>
      <button
        type="button"
        className={`${segmentClass(value.direction === TopNDirection.Top)} rounded-l-app`}
        onClick={() => onChange({ ...value, direction: TopNDirection.Top })}
        aria-pressed={value.direction === TopNDirection.Top}
      >
        <ArrowUpIcon className="size-3.5" weight="bold" />
        {t("top")}
      </button>
      <button
        type="button"
        className={segmentClass(value.direction === TopNDirection.Bottom)}
        onClick={() => onChange({ ...value, direction: TopNDirection.Bottom })}
        aria-pressed={value.direction === TopNDirection.Bottom}
      >
        <ArrowDownIcon className="size-3.5" weight="bold" />
        {t("bottom")}
      </button>
      <input
        type="number"
        min={MIN_COUNT}
        max={MAX_COUNT}
        value={countText}
        onChange={(e) => setCountText(e.target.value)}
        onBlur={commitCount}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
        }}
        aria-label={t("countLabel")}
        className="h-full w-12 border-l border-default bg-card px-1.5 text-center text-xs font-medium text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    </div>
  )
}
