import type { ComponentType } from "react"
import type { IconProps } from "@phosphor-icons/react"
import {
  ArrowsCounterClockwiseIcon,
  BuildingsIcon,
  CalendarCheckIcon,
  ChartBarIcon,
  ChartLineUpIcon,
  HouseIcon,
  PackageIcon,
  ReceiptIcon,
  ScalesIcon,
  ShoppingCartIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react"

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
    headingKey: "setup",
    items: [
      { labelKey: "branches", href: "/branches", icon: BuildingsIcon, superAdminOnly: true },
      { labelKey: "importData", href: "/import", icon: UploadSimpleIcon },
    ],
  },
  {
    headingKey: "reports",
    items: [
      { labelKey: "salesReport", href: "/reports/sales", icon: ChartLineUpIcon },
      { labelKey: "purchaseReport", href: "/reports/purchase", icon: ShoppingCartIcon },
      { labelKey: "stockReport", href: "/reports/stock", icon: PackageIcon },
      { labelKey: "dayWiseSales", href: "/reports/day-wise-sales", icon: CalendarCheckIcon },
      { labelKey: "grossProfitReport", href: "/reports/gross-profit", icon: ScalesIcon },
      { labelKey: "nonMovingReport", href: "/reports/non-moving", icon: ArrowsCounterClockwiseIcon },
    ],
  },
  {
    headingKey: "operations",
    items: [{ labelKey: "expenseTracker", href: "/expenses", icon: ReceiptIcon }],
  },
  {
    headingKey: "analysis",
    items: [{ labelKey: "purchaseAnalysis", href: "/purchase-analysis", icon: ChartBarIcon, superAdminOnly: true }],
  },
]
