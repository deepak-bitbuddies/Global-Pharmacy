"use client"

import { useState } from "react"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import {
  SIDEBAR_COLLAPSED_COOKIE,
  SIDEBAR_COLLAPSED_COOKIE_MAX_AGE,
} from "@/components/layout/sidebar-constants"
import { useImportSocket } from "@/modules/reports/hooks/use-import-socket"

export function DashboardShell({
  children,
  defaultCollapsed,
}: {
  children: React.ReactNode
  defaultCollapsed: boolean
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  // Wraps every authenticated dashboard route already — mounting the socket listener here (rather
  // than per-page) means bulk-import status refreshes land regardless of which screen is open.
  useImportSocket()

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${next}; path=/; max-age=${SIDEBAR_COLLAPSED_COOKIE_MAX_AGE}`
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Spacer: reserves sidebar width in flow so content gets the correct remaining width */}
      <div
        className={
          collapsed
            ? "hidden shrink-0 transition-[width] duration-200 ease-in-out xl:block xl:w-16"
            : "hidden shrink-0 transition-[width] duration-200 ease-in-out xl:block xl:w-64"
        }
      />

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* The one scroll container for all dashboard page content. `h-full` on the inner wrapper
            gives pages a real height to fill: one that opts into `CustomTable`'s `fillHeight` can
            size itself to exactly this space and scroll its own body, instead of the whole page
            scrolling — pages that don't opt in are unaffected, since actual overflow (and this
            `overflow-y-auto`) is driven by rendered content size, not the declared height. */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto h-full max-w-screen-2xl px-4 pt-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
