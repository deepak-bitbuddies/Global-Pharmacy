"use client"

import { useEffect, useState } from "react"
import { ChartLineUpIcon, CurrencyInrIcon, PackageIcon, ScalesIcon, ShoppingCartIcon } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

const SECTIONS = [
  { id: "overview", icon: CurrencyInrIcon },
  { id: "sales", icon: ChartLineUpIcon },
  { id: "purchase", icon: ShoppingCartIcon },
  { id: "stock", icon: PackageIcon },
  { id: "finance", icon: ScalesIcon },
] as const

/**
 * Sticky jump-nav for the consolidated dashboard's 5 sections — icon-matched to each section's
 * own `SectionHeading` so the nav and the page agree visually, and tracks which section is
 * currently in view (via `IntersectionObserver`) so the active pill updates while scrolling, not
 * just on click.
 */
export function DashboardSectionNav({ labels }: { labels: Record<(typeof SECTIONS)[number]["id"], string> }) {
  const [active, setActive] = useState<string>(SECTIONS[0].id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length === 0) return
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b))
        setActive(topMost.target.id)
      },
      // Top offset clears the sticky nav itself; bottom cutoff keeps only sections near the top
      // of the viewport "active" instead of whatever merely happens to be scrolled into view.
      { rootMargin: "-96px 0px -65% 0px", threshold: 0 },
    )
    const elements = SECTIONS.map((section) => document.getElementById(section.id)).filter((el): el is HTMLElement => el !== null)
    for (const el of elements) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <nav className="sticky top-0 z-10 flex gap-1.5 overflow-x-auto rounded-app border border-border/60 bg-card/95 p-1.5 shadow-sm backdrop-blur">
      {SECTIONS.map(({ id, icon: Icon }) => {
        const isActive = active === id
        return (
          <a
            key={id}
            href={`#${id}`}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-app px-3 py-1.5 text-sm font-medium transition-colors",
              isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted-surface hover:text-foreground",
            )}
          >
            <Icon className="size-4" weight={isActive ? "fill" : "regular"} />
            {labels[id]}
          </a>
        )
      })}
    </nav>
  )
}
