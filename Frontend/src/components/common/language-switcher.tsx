"use client"

import { useTransition } from "react"
import { useLocale } from "next-intl"
import { TranslateIcon } from "@phosphor-icons/react"

import { CustomDropdown, SelectionModeEnum } from "@/components/ui"
import { setLocale } from "@/i18n/actions"
import { locales, type AppLocale } from "@/i18n/locales"

const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  hi: "हिन्दी",
}

export function LanguageSwitcher({ label }: { label: string }) {
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()
  const availableLocales = locales

  if (availableLocales.length <= 1) {
    return null
  }

  const items = availableLocales.map((loc) => ({ id: loc, name: LOCALE_LABELS[loc] }))

  return (
    <CustomDropdown
      data={items}
      itemKey="id"
      itemLabel="name"
      selectionMode={SelectionModeEnum.single}
      selectedKeys={new Set([locale])}
      itemIcon={() => <TranslateIcon weight="bold" className="size-4" />}
      onSelectionChange={(keys) => {
        if (keys === "all") return
        const [key] = Array.from(keys)
        if (key) startTransition(() => setLocale(key as AppLocale))
      }}
    >
      <span
        className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-border text-sky-500 transition-colors hover:bg-muted-surface disabled:pointer-events-none disabled:opacity-50"
        aria-label={label}
        aria-disabled={isPending}
      >
        <TranslateIcon weight="bold" className="size-4" />
      </span>
    </CustomDropdown>
  )
}
