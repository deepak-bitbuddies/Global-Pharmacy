"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CustomStickyBarProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Pins its children to the top of the dashboard's scrollable content area
 * (see `DashboardShell`, which owns the actual scroll container) while
 * everything else on the page scrolls underneath — e.g. a page header +
 * filter bar that should stay visible above a long table. Matches
 * `DashboardShell`'s own compact `p-2` gutter, plus a bottom border/shadow/
 * blur so it reads as a docked toolbar rather than blending into the page.
 * Just wrap the part that should stick; nothing else about the page needs
 * to change.
 */
export function CustomStickyBar({ children, className }: CustomStickyBarProps) {
  return (
    <div className={cn("sticky top-0 z-20 space-y-2 border-b border-default bg-background/95 p-2 shadow-sm backdrop-blur-sm", className)}>
      {children}
    </div>
  );
}
