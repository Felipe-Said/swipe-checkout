"use client"

import * as React from "react"
import {
  LayoutDashboard,
  ShoppingCart,
  Settings,
  MessageSquare,
  Users,
  CreditCard,
  Globe,
  Store,
  Landmark,
  KeyRound,
  MousePointerClick,
  ChevronRight,
  Truck,
} from "lucide-react"
import type { DemoSession } from "@/lib/demo-auth"
import { useI18n } from "@/lib/i18n"

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
}: React.ComponentProps<typeof Sidebar> & { session: DemoSession }) {
  const { t } = useI18n()
  
  const accounts = React.useMemo(() => {
    try {
      if (typeof window === "undefined") {
        return []
      }
      const raw = window.localStorage.getItem("swipe-managed-accounts")
      return raw ? (JSON.parse(raw) as Array<{ email: string; keyFrozen?: boolean }>) : []
    } catch {
      return []
    }
  }, [])

  const currentAccount = accounts.find((account) => account.email === session.email)
  const shouldShowWhopForUser = session.role === "user" ? !currentAccount?.keyFrozen : false

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
      : [
          {
            title: t("nav.messenger"),
            url: "/app/messenger",
            icon: MessageSquare,
          },
        ]),
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
    {
      title: t("nav.withdrawals"),
      url: "/app/withdrawals",
      icon: Landmark,
    },
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
  ]

  return (
    <Sidebar variant="inset" {...props}>
      <div className="flex h-full min-h-0 flex-col">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CreditCard className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold tracking-tight">Swipe</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="min-h-0 flex-1">
          <SidebarGroup>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible asChild defaultOpen={item.isActive} className="group/collapsible">
                      <div>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
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
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <a href={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </div>
    </Sidebar>
  )
}
