"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  Settings,
  MessageSquare,
  Users,
  Globe,
  Store,
  Landmark,
  KeyRound,
  Wallet,
  MousePointerClick,
  ChevronRight,
  Truck,
} from "lucide-react"
import type { AppSession } from "@/lib/app-session"
import { useI18n } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"

import {
  clearMessengerUnreadCount,
  incrementMessengerUnreadCount,
  readMessengerUnreadCount,
  subscribeToMessengerUnreadCount,
} from "@/lib/messenger-notifications"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export function MainSidebar({
  session,
  ...props
}: React.ComponentProps<typeof Sidebar> & { session: AppSession }) {
  const { t } = useI18n()
  const pathname = usePathname()
  const shouldShowWhopForUser = session.role === "user" ? !session.keyFrozen : false
  const shouldShowMessenger = session.role === "admin" || session.messengerEnabled
  const shouldShowWithdrawals = session.role === "admin" || session.withdrawalsEnabled
  const [messengerUnreadCount, setMessengerUnreadCount] = React.useState(0)
  const activeItemClassName =
    "!bg-white !text-[var(--color-sidebar)] ring-1 ring-white/80 hover:!bg-white hover:!text-[var(--color-sidebar)] [&>svg]:!text-[var(--color-sidebar)]"

  React.useEffect(() => {
    setMessengerUnreadCount(readMessengerUnreadCount(session))

    return subscribeToMessengerUnreadCount(session, setMessengerUnreadCount)
  }, [session])

  React.useEffect(() => {
    const isChatRouteActive =
      (session.role === "admin" && pathname === "/app/customers") ||
      (session.role === "user" && pathname === "/app/messenger")

    if (isChatRouteActive) {
      clearMessengerUnreadCount(session)
      setMessengerUnreadCount(0)
    }
  }, [pathname, session])

  React.useEffect(() => {
    if (!shouldShowMessenger) {
      return
    }

    const realtimeConfig = {
      event: "INSERT" as const,
      schema: "public",
      table: "support_messages",
      ...(session.role !== "admin" && session.accountId
        ? { filter: `account_id=eq.${session.accountId}` }
        : {}),
    }

    const channel = supabase
      .channel(`sidebar-messenger-${session.role}-${session.userId}`)
      .on("postgres_changes", realtimeConfig, (payload) => {
          const row =
            payload.new && typeof payload.new === "object"
              ? (payload.new as { from_role?: string })
              : null

          if (!row) {
            return
          }

          const isIncoming =
            session.role === "admin" ? row.from_role === "user" : row.from_role === "admin"

          if (isIncoming) {
            const nextCount = incrementMessengerUnreadCount(session)
            setMessengerUnreadCount(nextCount)
          }
        })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [session, shouldShowMessenger])

  const isRouteActive = React.useCallback(
    (url: string) => {
      if (url === "/app") {
        return pathname === "/app"
      }

      return pathname === url || pathname.startsWith(`${url}/`)
    },
    [pathname]
  )

  const navMain = [
    {
      title: t("nav.dashboard"),
      url: "/app",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: t("nav.checkouts"),
      url: "/app/checkouts",
      icon: MousePointerClick,
      items: [
        {
          title: t("nav.all_checkouts"),
          url: "/app/checkouts",
        },
        {
          title: t("nav.create_new"),
          url: "/app/checkouts/new/editor",
        },
      ],
    },
    {
      title: t("nav.orders"),
      url: "/app/orders",
      icon: ShoppingCart,
    },
    {
      title: t("nav.shipping"),
      url: "/app/shipping",
      icon: Truck,
    },
    ...(session.role === "admin"
      ? [
          {
            title: t("nav.customers"),
            url: "/app/customers",
            icon: Users,
          },
        ]
      : shouldShowMessenger
        ? [
            {
              title: t("nav.messenger"),
              url: "/app/messenger",
              icon: MessageSquare,
            },
          ]
        : []),
    {
      title: t("nav.domains"),
      url: "/app/domains",
      icon: Globe,
    },
    {
      title: t("nav.stores"),
      url: "/app/stores",
      icon: Store,
    },
    ...(shouldShowWithdrawals
      ? [
          {
            title: t("nav.withdrawals"),
            url: "/app/withdrawals",
            icon: Landmark,
          },
        ]
      : []),
    {
      title: t("nav.settings"),
      url: "/app/settings",
      icon: Settings,
    },
    ...(session.role === "admin" || shouldShowWhopForUser
      ? [
          {
            title: t("nav.whop"),
            url: "/app/whop",
            icon: KeyRound,
          },
        ]
      : []),
    ...((session.role === "admin" && session.gatewayModeEnabled) ||
    (session.role === "user" && session.gatewayModeEnabled && session.gatewayEnabled)
      ? [
          {
            title: session.role === "admin" ? t("nav.gateway_mode") : t("nav.gateway"),
            url: "/app/gateway",
            icon: Wallet,
          },
        ]
      : []),
  ]

  return (
    <Sidebar variant="inset" {...props}>
        <div className="flex h-full min-h-0 flex-col">
          <SidebarHeader>
            <div className="px-3 py-3">
              <img
                src="/swipe-logo-white.svg"
                alt="Swipe"
                className="h-8 w-auto max-w-[140px]"
              />
            </div>
          </SidebarHeader>
        <SidebarContent className="min-h-0 flex-1">
          <SidebarGroup>
            <SidebarMenu>
              {navMain.map((item) => {
                const isItemActive = item.items
                  ? item.items.some((subItem) => isRouteActive(subItem.url)) || isRouteActive(item.url)
                  : isRouteActive(item.url)
                const shouldShowBadge =
                  messengerUnreadCount > 0 &&
                  ((session.role === "admin" && item.url === "/app/customers") ||
                    (session.role === "user" && item.url === "/app/messenger"))

                return (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible asChild defaultOpen={isItemActive} className="group/collapsible">
                      <div>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={isItemActive}
                            className={isItemActive ? activeItemClassName : undefined}
                          >
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isRouteActive(subItem.url)}
                                  className={isRouteActive(subItem.url) ? activeItemClassName : undefined}
                                >
                                  <a href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </a>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isItemActive}
                      className={isItemActive ? activeItemClassName : undefined}
                    >
                      <a href={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        {shouldShowBadge ? (
                          <span className="ml-auto inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                            {messengerUnreadCount > 99 ? "99+" : messengerUnreadCount}
                          </span>
                        ) : null}
                      </a>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              )})}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </div>
    </Sidebar>
  )
}
