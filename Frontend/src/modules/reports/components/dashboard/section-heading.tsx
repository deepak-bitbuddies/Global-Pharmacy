"use client"

import type { ReactNode } from "react"

/** Shared section header for the consolidated dashboard — one per section (Overview/Sales/Purchase/Stock/Finance) so each is clearly demarcated while scrolling, instead of a small muted label easy to miss. */
export function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: ReactNode
}) {
  return (
    <div className="flex items-center gap-2 border-b-2 border-primary/20 pb-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4.5" />
      </div>
      <h2 className="text-lg font-bold tracking-tight text-foreground">{children}</h2>
    </div>
  )
}
