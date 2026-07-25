"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { ButtonVariant, CustomButton, customToast, CustomTooltip, TooltipPlacement } from "@/components/ui"
import {
  CaretLineLeftIcon,
  CaretLineRightIcon,
  SignOutIcon,
  XIcon,
} from "@phosphor-icons/react"

import { cn } from "@/lib/utils"
import { useAuthStore } from "@/providers"
import { logout } from "@/modules/auth"
import { useMediaQuery } from "@/hooks/use-media-query"
import { navGroups, type NavItem } from "@/config/nav"
import {
  brandLogo,
  brandLogoHeight,
  brandLogoWidth,
  brandLogoIcon,
  brandLogoIconHeight,
  brandLogoIconWidth,
  brandName,
} from "@/config/brand"
import { SIDEBAR_DESKTOP_BREAKPOINT } from "./sidebar-constants"

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  collapsed: boolean
  onToggleCollapsed: () => void
}

function SidebarNavItem({
  item,
  pathname,
  collapsed,
  iconRail,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  collapsed: boolean
  iconRail: boolean
  onNavigate: () => void
}) {
  const t = useTranslations("Nav")
  const active = pathname === item.href
  const Icon = item.icon
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
        // collapsed && "xl:justify-center xl:px-2",
        active
          ? "bg-primary text-primary-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon weight={active ? "fill" : "regular"} size={18} />
      {!collapsed && <span
        className={cn(
          "overflow-hidden whitespace-nowrap transition-[width,opacity] duration-200",
          // collapsed ? "xl:w-0 xl:opacity-0" : "xl:opacity-100",
        )}
      >
        {t(item.labelKey)}
      </span>}
    </Link>
  )

  // Always mounted (never conditionally swapped for a bare `link`) so
  // toggling sidebar collapse doesn't force every nav item to unmount and
  // remount into a different wrapper — `isDisabled` just turns the actual
  // popover behavior on/off in place.
  return (
    <CustomTooltip trigger={link} placement={TooltipPlacement.right} isDisabled={!iconRail}>
      {t(item.labelKey)}
    </CustomTooltip>
  )
}

export function Sidebar({ sidebarOpen, setSidebarOpen, collapsed, onToggleCollapsed }: SidebarProps) {
  const t = useTranslations("Nav")
  const pathname = usePathname()
  const router = useRouter()
  const isDesktop = useMediaQuery(SIDEBAR_DESKTOP_BREAKPOINT)
  const iconRail = collapsed && isDesktop
  const setUser = useAuthStore((state) => state.setUser)
  const role = useAuthStore((state) => state.user?.role)
  const visibleNavGroups = navGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.superAdminOnly || role === "super_admin") }))
    .filter((group) => group.items.length > 0)
  const close = () => setSidebarOpen(false)
  const labelClassName = cn(
    "overflow-hidden whitespace-nowrap transition-[width,opacity] duration-200",
    collapsed ? "xl:w-0 xl:opacity-0" : "xl:opacity-100",
  )
  const { mutate: performLogout } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setUser(null)
      router.push("/login")
    },
    onError: () => customToast.danger(t("logoutError")),
  })
  const logoutButton = (
    <button
      type="button"
      onClick={() => performLogout()}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive",
        collapsed && "xl:justify-center xl:px-2",
      )}
    >
      <SignOutIcon className="size-4.5 shrink-0" />
      <span className={labelClassName}>{t("logout")}</span>
    </button>
  )

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm xl:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={close}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width,transform] xl:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "xl:w-17" : "xl:w-64",
        )}
      >
        <div className={cn("flex items-center justify-between p-3", collapsed && "xl:justify-center xl:px-2")}>
          <Link href="/" className="w-full flex items-center justify-center">
            <Image
              src={brandLogo}
              alt={brandName}
              width={brandLogoWidth}
              height={brandLogoHeight}
              className={cn("h-28 w-auto shrink-0", collapsed && "xl:hidden")}
              priority
            />
            <Image
              src={brandLogoIcon}
              alt={brandName}
              width={brandLogoIconWidth}
              height={brandLogoIconHeight}
              className={cn("hidden h-8 w-auto shrink-0", collapsed && "xl:block")}
              priority
            />
          </Link>
          <CustomButton variant={ButtonVariant.ghost} isIconOnly className="xl:hidden" onClick={close}>
            <XIcon className="size-4" />
            <span className="sr-only">{t("closeSidebar")}</span>
          </CustomButton>
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="absolute top-7 right-0 z-10 hidden size-6 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-md border bg-background xl:flex"
        >
          {collapsed ? <CaretLineRightIcon className="size-3.5" /> : <CaretLineLeftIcon className="size-3.5" />}
        </button>
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4">
          {visibleNavGroups.map((group) => (
            <div key={group.headingKey} className="flex flex-col gap-1">
              <span className={cn("px-3 pb-1 text-[10px] font-bold tracking-wide text-sidebar-foreground/50 uppercase", collapsed && "xl:hidden")}>
                {t(group.headingKey)}
              </span>
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  collapsed={collapsed}
                  iconRail={iconRail}
                  onNavigate={close}
                />
              ))}
            </div>
          ))}
        </nav>
        <div className={cn("border-t border-sidebar-border p-3", collapsed && "xl:px-2")}>
          <CustomTooltip trigger={logoutButton} placement={TooltipPlacement.right} isDisabled={!iconRail} triggerClassName="w-full">
            {t("logout")}
          </CustomTooltip>
        </div>
      </aside>
    </>
  )
}
