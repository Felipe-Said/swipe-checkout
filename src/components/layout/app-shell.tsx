"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { resolveLoginProfile } from "@/app/auth/actions"
import {
  getCurrentAppSession,
  readAppSession,
  type AppSession,
  writeAppSession,
} from "@/lib/app-session"
import { supabase } from "@/lib/supabase"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { MainSidebar } from "./main-sidebar"
import { MainHeader } from "./main-header"

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = React.useState<AppSession | null>(null)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false

    async function loadSession() {
      const storedSession = readAppSession()
      if (storedSession && !cancelled) {
        setSession(storedSession)
        setReady(true)
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const resolvedProfile = await resolveLoginProfile(user.id)
        if (resolvedProfile?.session && !cancelled) {
          const syncedSession: AppSession = {
            userId: resolvedProfile.session.userId,
            name: resolvedProfile.session.name,
            email: resolvedProfile.session.email,
            role: resolvedProfile.session.role === "admin" ? "admin" : "user",
            accountId: resolvedProfile.session.accountId,
            keyFrozen: resolvedProfile.session.keyFrozen,
            withdrawalsEnabled: resolvedProfile.session.withdrawalsEnabled,
            messengerEnabled: resolvedProfile.session.messengerEnabled,
          }

          writeAppSession(syncedSession)

          if (syncedSession.role !== "admin" && pathname === "/app/customers") {
            router.replace(syncedSession.messengerEnabled ? "/app/messenger" : "/app")
            return
          }

          if (syncedSession.role !== "admin" && !syncedSession.messengerEnabled && pathname === "/app/messenger") {
            router.replace("/app")
            return
          }

          if (syncedSession.role !== "admin" && !syncedSession.withdrawalsEnabled && pathname === "/app/withdrawals") {
            router.replace("/app")
            return
          }

          setSession(syncedSession)
          setReady(true)
          return
        }
      }

      const nextSession = await getCurrentAppSession()
      if (!nextSession) {
        router.replace("/login")
        return
      }

      if (nextSession.role !== "admin" && pathname === "/app/customers") {
        router.replace(nextSession.messengerEnabled ? "/app/messenger" : "/app")
        return
      }

      if (nextSession.role !== "admin" && !nextSession.messengerEnabled && pathname === "/app/messenger") {
        router.replace("/app")
        return
      }

      if (nextSession.role !== "admin" && !nextSession.withdrawalsEnabled && pathname === "/app/withdrawals") {
        router.replace("/app")
        return
      }

      if (!cancelled) {
        setSession(nextSession)
        setReady(true)
      }
    }

    loadSession()

    return () => {
      cancelled = true
    }
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
