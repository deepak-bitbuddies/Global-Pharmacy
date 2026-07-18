"use client"

import { useState } from "react"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import {
  SIDEBAR_COLLAPSED_COOKIE,
  SIDEBAR_COLLAPSED_COOKIE_MAX_AGE,
} from "@/components/layout/sidebar-constants"

export function DashboardShell({
  children,
  defaultCollapsed,
}: {
  children: React.ReactNode
  defaultCollapsed: boolean
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${next}; path=/; max-age=${SIDEBAR_COLLAPSED_COOKIE_MAX_AGE}`
  }

  return (
    <div className="flex min-h-screen">
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

      <div className="relative flex min-w-0 flex-1 flex-col">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main>
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
