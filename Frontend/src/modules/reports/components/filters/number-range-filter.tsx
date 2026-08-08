"use client"

import { CustomInput, InputTypes } from "@/components/ui"

type NumberRangeFilterProps = {
  from?: number
  to?: number
  onChange: (range: { from?: number; to?: number }) => void
  fromLabel: string
  toLabel: string
}

function parseNumberInput(value: string): number | undefined {
  if (value.trim() === "") return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** Shared min/max range filter — two plain number inputs, used for Stock's current-stock range and Purchase/Sales' amount range. */
export function NumberRangeFilter({ from, to, onChange, fromLabel, toLabel }: NumberRangeFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <CustomInput
        type={InputTypes.number}
        value={from === undefined ? "" : String(from)}
        onChange={(value) => onChange({ from: parseNumberInput(value), to })}
        placeholder={fromLabel}
        ariaLabel={fromLabel}
        fullWidth
      />
      <span className="shrink-0 text-muted-foreground">–</span>
      <CustomInput
        type={InputTypes.number}
        value={to === undefined ? "" : String(to)}
        onChange={(value) => onChange({ from, to: parseNumberInput(value) })}
        placeholder={toLabel}
        ariaLabel={toLabel}
        fullWidth
      />
    </div>
  )
}
