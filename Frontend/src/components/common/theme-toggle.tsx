"use client"

import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from "@phosphor-icons/react"

import { ButtonVariant, CustomButton } from "@/components/ui"

export function ThemeToggle({ label }: { label: string }) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <CustomButton
      variant={ButtonVariant.outline}
      isIconOnly
      className="cursor-pointer rounded-full"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunIcon
        weight="bold"
        className="size-4 rotate-0 scale-100 text-amber-500 opacity-100 transition-all duration-300 ease-in-out dark:-rotate-90 dark:scale-0 dark:opacity-0"
      />
      <MoonIcon
        weight="bold"
        className="absolute size-4 rotate-90 scale-0 text-indigo-400 opacity-0 transition-all duration-300 ease-in-out dark:rotate-0 dark:scale-100 dark:opacity-100"
      />
      <span className="sr-only">{label}</span>
    </CustomButton>
  )
}
