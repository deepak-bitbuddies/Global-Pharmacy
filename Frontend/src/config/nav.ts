import type { ComponentType } from "react"
import type { IconProps } from "@phosphor-icons/react"
import { HouseIcon } from "@phosphor-icons/react"

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
]
