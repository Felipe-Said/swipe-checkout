import { readDemoSession } from "./demo-auth"
import { supabase } from "./supabase"

export type AppSession = {
  userId: string
  name: string
  email: string
  role: "admin" | "user"
  accountId: string | null
  keyFrozen: boolean
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

    return session
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const demoSession = readDemoSession()
    if (demoSession) {
      return {
        userId: demoSession.email,
        name: demoSession.name,
        email: demoSession.email,
        role: demoSession.role,
        accountId: null,
        keyFrozen: false,
      }
    }

    return null
  }

  const [{ data: profile }, { data: managedAccount }] = await Promise.all([
    supabase.from("profiles").select("name, email, role").eq("id", user.id).single(),
    supabase
      .from("managed_accounts")
      .select("id, whop_key")
      .eq("profile_id", user.id)
      .maybeSingle(),
  ])

  const resolvedSession: AppSession = {
    userId: user.id,
    name: profile?.name || user.user_metadata?.name || user.email?.split("@")[0] || "Usuario",
    email: profile?.email || user.email || "",
    role: profile?.role === "admin" ? "admin" : "user",
    accountId: managedAccount?.id ?? null,
    keyFrozen: false,
  }

  writeAppSession(resolvedSession)

  return resolvedSession
}
