"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { getCurrentAppSession, type AppSession } from "@/lib/app-session"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { MainSidebar } from "./main-sidebar"
import { MainHeader } from "./main-header"

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = React.useState<AppSession | null>(null)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    async function loadSession() {
      const nextSession = await getCurrentAppSession()
      if (!nextSession) {
        router.replace("/login")
        return
      }

      if (nextSession.role !== "admin" && pathname === "/app/customers") {
        router.replace("/app/messenger")
        return
      }

      setSession(nextSession)
      setReady(true)
    }

    loadSession()
  }, [pathname, router])

  if (!ready || !session) {
    return null
  }

  return (
    <SidebarProvider>
      <MainSidebar session={session} />
      <SidebarInset className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <MainHeader session={session} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
