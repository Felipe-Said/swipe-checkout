"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { usePathname, useRouter } from "next/navigation"
import {
  clearAuthenticatedAppSession,
  persistAuthenticatedAppSession,
  resolveLoginProfile,
} from "@/app/auth/actions"
import {
  clearAppSession,
  readAppSession,
  type AppSession,
  writeAppSession,
} from "@/lib/app-session"
import { buildEmbeddedPath } from "@/lib/shopify-embedded"
import { supabase } from "@/lib/supabase"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { MainSidebar } from "./main-sidebar"
import { MainHeader } from "./main-header"

const SidebarShaderBackground = dynamic(
  () =>
    import("./sidebar-shader-background").then((module) => module.SidebarShaderBackground),
  { ssr: false }
)

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = React.useState<AppSession | null>(() => readAppSession())
  const [ready, setReady] = React.useState(() => Boolean(readAppSession()))

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

  const forceBlockedLogout = React.useCallback(async () => {
    clearAppSession()
    await clearAuthenticatedAppSession()
    await supabase.auth.signOut()
    router.replace(withEmbeddedContext("/login?message=blocked"))
  }, [router, withEmbeddedContext])

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
      const {
        data: { session: supabaseSession },
      } = await supabase.auth.getSession()
      const user = supabaseSession?.user ?? null

      if (user) {
        const resolvedProfile = await resolveLoginProfile(user.id)
        if (resolvedProfile?.session && !cancelled) {
          if (
            resolvedProfile.session.status === "blocked" &&
            resolvedProfile.session.role !== "admin"
          ) {
            await forceBlockedLogout()
            return
          }

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
          const persistResult = await persistAuthenticatedAppSession({
            accessToken: supabaseSession?.access_token || "",
          })

          if (persistResult?.error) {
            await forceBlockedLogout()
            return
          }

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

      clearAppSession()
      await clearAuthenticatedAppSession()
      router.replace(withEmbeddedContext("/login"))
    }

    void loadSession()

    return () => {
      cancelled = true
    }
  }, [forceBlockedLogout, pathname, router, shouldRedirectRestrictedRoute, withEmbeddedContext])

  React.useEffect(() => {
    if (!session?.userId || session.role === "admin") {
      return
    }

    const profileChannel = supabase
      .channel(`profile-block-${session.userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${session.userId}`,
        },
        async (payload) => {
          const nextStatus =
            payload.new && typeof payload.new === "object"
              ? String((payload.new as { status?: unknown }).status ?? "")
              : ""

          if (nextStatus === "blocked") {
            await forceBlockedLogout()
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(profileChannel)
    }
  }, [forceBlockedLogout, session?.role, session?.userId])

  if (!ready || !session) {
    return null
  }

  return (
    <SidebarProvider className="relative overflow-hidden has-[[data-variant=inset]]:bg-transparent">
      <div className="pointer-events-none absolute inset-0">
        <SidebarShaderBackground
          className="-inset-16 rounded-none"
          canvasClassName="scale-[1.18]"
        />
      </div>
      <MainSidebar session={session} />
      <SidebarInset className="z-10 flex flex-1 flex-col gap-4 p-4 pt-0">
        <MainHeader session={session} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
