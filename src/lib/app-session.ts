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

export async function getCurrentAppSession(): Promise<AppSession | null> {
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
      .select("id, whop_key")
      .eq("profile_id", user.id)
      .maybeSingle(),
  ])

  return {
    userId: user.id,
    name: profile?.name || user.user_metadata?.name || user.email?.split("@")[0] || "Usuário",
    email: profile?.email || user.email || "",
    role: profile?.role === "admin" ? "admin" : "user",
    accountId: managedAccount?.id ?? null,
    keyFrozen: false,
  }
}
