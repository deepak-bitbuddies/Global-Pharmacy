"use client"

import { useTransition } from "react"
import { useLocale } from "next-intl"
import { TranslateIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="cursor-pointer rounded-full"
            disabled={isPending}
          >
            <TranslateIcon weight="bold" className="size-4 text-sky-500" />
            <span className="sr-only">{label}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {availableLocales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            data-variant={loc === locale ? "default" : undefined}
            onClick={() => startTransition(() => setLocale(loc))}
          >
            {LOCALE_LABELS[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
