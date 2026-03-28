"use server"

import { getSupabaseAdmin } from "@/lib/supabase"

type LoginEventRow = {
  id: string
  device: string
  location: string | null
  logged_at: string
}

export async function loadSettingsForSession(input: {
  userId: string
  accountId?: string | null
}) {
  const supabaseAdmin = getSupabaseAdmin()

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, name, email, role, photo_url")
    .eq("id", input.userId)
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

  if (ordersError) {
    return { error: ordersError.message }
  }

  const totalRevenue = (orders ?? []).reduce((sum, order) => {
    if (order.status !== "Pago") {
      return sum
    }

    return sum + Number(order.amount ?? 0)
  }, 0)

  const { data: loginEvents, error: loginEventsError } = await supabaseAdmin
    .from("login_events")
    .select("id, device, location, logged_at")
    .eq("user_id", input.userId)
    .order("logged_at", { ascending: false })
    .limit(10)

  if (loginEventsError) {
    return { error: loginEventsError.message }
  }

  return {
    profile: {
      name: profile.name || profile.email?.split("@")[0] || "Usuario",
      email: profile.email || "",
      role: profile.role === "admin" ? "admin" : "user",
      photoUrl: profile.photo_url || undefined,
    },
    totalRevenue,
    loginHistory: (loginEvents ?? []) as LoginEventRow[],
  }
}

export async function saveSettingsProfile(input: {
  userId: string
  name: string
  email: string
  photoUrl?: string | null
}) {
  const supabaseAdmin = getSupabaseAdmin()

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      name: input.name.trim(),
      email: input.email.trim(),
      photo_url: input.photoUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.userId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function recordLoginEvent(input: {
  userId: string
  accountId?: string | null
  device: string
  location?: string | null
}) {
  const supabaseAdmin = getSupabaseAdmin()

  const { error } = await supabaseAdmin.from("login_events").insert({
    user_id: input.userId,
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
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("photo_url")
    .eq("id", input.userId)
    .maybeSingle()

  if (error) {
    return { error: error.message, photoUrl: "" }
  }

  return {
    photoUrl: data?.photo_url || "",
  }
}
