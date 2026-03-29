import { supabase } from "./supabase"

export type AppSession = {
  userId: string
  name: string
  email: string
  role: "admin" | "user"
  accountId: string | null
  keyFrozen: boolean
  withdrawalsEnabled: boolean
  messengerEnabled: boolean
  gatewayModeEnabled: boolean
}

const APP_SESSION_STORAGE_KEY = "swipe-app-session"

export function readAppSession(): AppSession | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const raw = window.localStorage.getItem(APP_SESSION_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const session = JSON.parse(raw) as AppSession
    if (!session?.userId || !session?.email || !session?.role) {
      return null
    }

    return {
      ...session,
      withdrawalsEnabled: session.withdrawalsEnabled !== false,
      messengerEnabled: session.messengerEnabled !== false,
      gatewayModeEnabled: session.gatewayModeEnabled === true,
    }
  } catch {
    return null
  }
}

export function writeAppSession(session: AppSession) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearAppSession() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(APP_SESSION_STORAGE_KEY)
}

export async function getCurrentAppSession(): Promise<AppSession | null> {
  const storedSession = readAppSession()
  if (storedSession) {
    return storedSession
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const [{ data: profile }, { data: managedAccount }] = await Promise.all([
    supabase.from("profiles").select("name, email, role").eq("id", user.id).single(),
    supabase
      .from("managed_accounts")
      .select("id, whop_key, key_frozen, withdrawals_enabled, messenger_enabled")
      .eq("profile_id", user.id)
      .maybeSingle(),
  ])

  const { data: gatewaySettings } = await supabase
    .from("platform_gateway_settings")
    .select("enabled")
    .eq("id", "default")
    .maybeSingle()

  const resolvedSession: AppSession = {
    userId: user.id,
    name: profile?.name || user.user_metadata?.name || user.email?.split("@")[0] || "Usuario",
    email: profile?.email || user.email || "",
    role: profile?.role === "admin" ? "admin" : "user",
    accountId: managedAccount?.id ?? null,
    keyFrozen: Boolean(managedAccount?.key_frozen),
    withdrawalsEnabled: managedAccount?.withdrawals_enabled !== false,
    messengerEnabled: managedAccount?.messenger_enabled !== false,
    gatewayModeEnabled: gatewaySettings?.enabled === true,
  }

  writeAppSession(resolvedSession)

  return resolvedSession
}
