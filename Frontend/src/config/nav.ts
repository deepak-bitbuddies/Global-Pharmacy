import type { ComponentType } from "react"
import type { IconProps } from "@phosphor-icons/react"
import { BuildingsIcon, CalendarCheckIcon, ChartLineUpIcon, HouseIcon, PackageIcon, ShoppingCartIcon, UploadSimpleIcon } from "@phosphor-icons/react"

export interface NavItem {
  labelKey: string
  href: string
  icon: ComponentType<IconProps>
  /** Hidden from the sidebar for anyone but super_admin (the backend enforces this regardless — this only controls visibility). */
  superAdminOnly?: boolean
}

export interface NavGroup {
  headingKey: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    headingKey: "dashboard",
    items: [{ labelKey: "dashboard", href: "/", icon: HouseIcon }],
  },
  {
    headingKey: "gprs",
    items: [
      { labelKey: "branches", href: "/branches", icon: BuildingsIcon, superAdminOnly: true },
      { labelKey: "importData", href: "/import", icon: UploadSimpleIcon },
      { labelKey: "salesReport", href: "/reports/sales", icon: ChartLineUpIcon },
      { labelKey: "purchaseReport", href: "/reports/purchase", icon: ShoppingCartIcon },
      { labelKey: "stockReport", href: "/reports/stock", icon: PackageIcon },
      { labelKey: "dayWiseSales", href: "/reports/day-wise-sales", icon: CalendarCheckIcon },
    ],
  },
]
