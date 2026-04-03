"use server"

import { getSupabaseAdmin } from "@/lib/supabase"
import { requireServerAppSession } from "@/lib/server-app-session"

type LoginEventRow = {
  id: string
  device: string
  location: string | null
  logged_at: string
}

async function resolveLoginEventActor(input: { userId: string; accessToken?: string | null }) {
  const accessToken = input.accessToken?.trim()
  if (accessToken) {
    const supabaseAdmin = getSupabaseAdmin()
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken)

    if (error || !user || user.id !== input.userId) {
      throw new Error("Sessao invalida.")
    }

    return { userId: user.id }
  }

  return requireServerAppSession(input.userId)
}

export async function loadSettingsForSession(input: {
  userId: string
  accountId?: string | null
}) {
  const actor = await requireServerAppSession(input.userId)
  const supabaseAdmin = getSupabaseAdmin()

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, name, email, role, photo_url")
    .eq("id", actor.userId)
    .single()

  if (profileError || !profile) {
    return { error: "Perfil nao encontrado." }
  }

  const isAdmin = profile.role === "admin"

  const ordersQuery = supabaseAdmin
    .from("orders")
    .select("amount, status, account_id")

  const { data: orders, error: ordersError } = isAdmin
    ? await ordersQuery
    : await ordersQuery.eq("account_id", input.accountId ?? "")

  const totalRevenue = (orders ?? []).reduce((sum, order) => {
    if (order.status !== "Pago") {
      return sum
    }

    return sum + Number(order.amount ?? 0)
  }, 0)

  const { data: loginEvents, error: loginEventsError } = await supabaseAdmin
    .from("login_events")
    .select("id, device, location, logged_at")
    .eq("user_id", actor.userId)
    .order("logged_at", { ascending: false })
    .limit(10)

  return {
    profile: {
      name: profile.name || profile.email?.split("@")[0] || "Usuario",
      email: profile.email || "",
      role: profile.role === "admin" ? "admin" : "user",
      photoUrl: profile.photo_url || undefined,
    },
    totalRevenue,
    loginHistory: (loginEvents ?? []) as LoginEventRow[],
    warnings: {
      orders: ordersError?.message ?? null,
      loginEvents: loginEventsError?.message ?? null,
    },
  }
}

export async function saveSettingsProfile(input: {
  userId: string
  name: string
  email: string
  photoUrl?: string | null
}) {
  const actor = await requireServerAppSession(input.userId)
  const supabaseAdmin = getSupabaseAdmin()
  const nextName = input.name.trim()
  const nextEmail = input.email.trim()

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(actor.userId, {
    email: nextEmail,
    user_metadata: {
      name: nextName,
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      name: nextName,
      email: nextEmail,
      photo_url: input.photoUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", actor.userId)

  if (error) {
    return { error: error.message }
  }

  const { error: accountError } = await supabaseAdmin
    .from("managed_accounts")
    .update({
      name: nextName,
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", actor.userId)

  if (accountError) {
    return { error: accountError.message }
  }

  return { success: true }
}

export async function recordLoginEvent(input: {
  userId: string
  accountId?: string | null
  device: string
  location?: string | null
  accessToken?: string | null
}) {
  const actor = await resolveLoginEventActor({
    userId: input.userId,
    accessToken: input.accessToken,
  })
  const supabaseAdmin = getSupabaseAdmin()

  const { error } = await supabaseAdmin.from("login_events").insert({
    user_id: actor.userId,
    account_id: input.accountId || null,
    device: input.device,
    location: input.location || null,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function loadProfilePhoto(input: { userId: string }) {
  const actor = await requireServerAppSession(input.userId)
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("photo_url")
    .eq("id", actor.userId)
    .maybeSingle()

  if (error) {
    return { error: error.message, photoUrl: "" }
  }

  return {
    photoUrl: data?.photo_url || "",
  }
}
