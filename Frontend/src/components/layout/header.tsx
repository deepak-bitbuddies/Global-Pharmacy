"use client"

import { useTranslations } from "next-intl"
import { ListIcon, XIcon } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle, LanguageSwitcher } from "@/components/common"

interface HeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const t = useTranslations("Nav")

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="relative xl:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <ListIcon
          className={cn(
            "size-5 transition-all duration-200 ease-in-out",
            sidebarOpen ? "rotate-45 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100",
          )}
        />
        <XIcon
          className={cn(
            "absolute size-5 transition-all duration-200 ease-in-out",
            sidebarOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-45 scale-0 opacity-0",
          )}
        />
        <span className="sr-only">
          {sidebarOpen ? t("closeSidebar") : t("openSidebar")}
        </span>
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher label={t("language")} />
        <ThemeToggle label={t("toggleTheme")} />
      </div>
    </header>
  )
}
