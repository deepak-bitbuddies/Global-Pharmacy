import { cookies } from "next/headers"

import { DashboardShell } from "@/components/layout/dashboard-shell"
import { SIDEBAR_COLLAPSED_COOKIE } from "@/components/layout/sidebar-constants"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const defaultCollapsed =
    cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value === "true"

  return <DashboardShell defaultCollapsed={defaultCollapsed}>{children}</DashboardShell>
}
