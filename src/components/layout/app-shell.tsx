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
import { buildEmbeddedPath } from "@/lib/shopify-embedded"
import { supabase } from "@/lib/supabase"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { MainSidebar } from "./main-sidebar"
import { MainHeader } from "./main-header"

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = React.useState<AppSession | null>(null)
  const [ready, setReady] = React.useState(false)

  const withEmbeddedContext = React.useCallback(
    (targetPath: string) => {
      const params =
        typeof window === "undefined"
          ? null
          : new URLSearchParams(window.location.search)

      return buildEmbeddedPath(targetPath, params)
    },
    []
  )

  const shouldRedirectRestrictedRoute = React.useCallback(
    (nextSession: AppSession) => {
      if (nextSession.role === "admin") {
        return null
      }

      if (pathname === "/app/customers") {
        return nextSession.messengerEnabled
          ? withEmbeddedContext("/app/messenger")
          : withEmbeddedContext("/app")
      }

      if (!nextSession.messengerEnabled && pathname === "/app/messenger") {
        return withEmbeddedContext("/app")
      }

      if (!nextSession.withdrawalsEnabled && pathname === "/app/withdrawals") {
        return withEmbeddedContext("/app")
      }

      if (nextSession.keyFrozen && pathname === "/app/whop") {
        return withEmbeddedContext("/app")
      }

      if (!nextSession.gatewayModeEnabled && pathname === "/app/gateway") {
        return withEmbeddedContext("/app")
      }

      if (!nextSession.gatewayEnabled && pathname === "/app/gateway") {
        return withEmbeddedContext("/app")
      }

      return null
    },
    [pathname, withEmbeddedContext]
  )

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
            gatewayModeEnabled: resolvedProfile.session.gatewayModeEnabled === true,
            gatewayEnabled:
              resolvedProfile.session.role === "admin"
                ? true
                : resolvedProfile.session.gatewayEnabled === true,
          }

          writeAppSession(syncedSession)

          const restrictedRedirect = shouldRedirectRestrictedRoute(syncedSession)
          if (restrictedRedirect) {
            router.replace(restrictedRedirect)
            return
          }

          setSession(syncedSession)
          setReady(true)
          return
        }
      }

      const nextSession = await getCurrentAppSession()
      if (!nextSession) {
        router.replace(withEmbeddedContext("/login"))
        return
      }

      const restrictedRedirect = shouldRedirectRestrictedRoute(nextSession)
      if (restrictedRedirect) {
        router.replace(restrictedRedirect)
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
  }, [pathname, router, shouldRedirectRestrictedRoute, withEmbeddedContext])

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
