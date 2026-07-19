import type { ComponentType } from "react"
import type { IconProps } from "@phosphor-icons/react"
import { ChartLineUpIcon, HouseIcon, PackageIcon, UploadSimpleIcon } from "@phosphor-icons/react"

export interface NavItem {
  labelKey: string
  href: string
  icon: ComponentType<IconProps>
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
      { labelKey: "importData", href: "/import", icon: UploadSimpleIcon },
      { labelKey: "salesReport", href: "/reports/sales", icon: ChartLineUpIcon },
      { labelKey: "stockReport", href: "/reports/stock", icon: PackageIcon },
    ],
  },
]
