'use server'

import { getSupabaseAdmin, supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { clearServerAppSession, persistServerAppSession } from "@/lib/server-app-session"
import type { AppSession } from "@/lib/app-session"

async function ensureManagedAccount(userId: string, name: string, role: "admin" | "user") {
  const supabaseAdmin = getSupabaseAdmin()

  const { data: existingAccount, error: existingError } = await supabaseAdmin
    .from("managed_accounts")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle()

  if (existingError) {
    return { error: existingError.message, accountId: null as string | null }
  }

  if (existingAccount?.id) {
    return { accountId: existingAccount.id, error: null as string | null }
  }

  const { data: createdAccount, error: createError } = await supabaseAdmin
    .from("managed_accounts")
    .insert({
      profile_id: userId,
      name,
      fee_rate: role === "admin" ? 0 : 15,
      billing_cycle_days: 2,
      withdrawals_enabled: true,
      messenger_enabled: true,
      gateway_auto_payout_enabled: false,
      gateway_enabled: false,
      payment_mode: "manual",
      settlement_started_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (createError) {
    return { error: createError.message, accountId: null as string | null }
  }

  return { accountId: createdAccount.id, error: null as string | null }
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user?.id) {
    const ensured = await ensureManagedAccount(data.user.id, name, "user")
    if (ensured.error) {
      return { error: ensured.error }
    }
  }

  return { success: true }
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Check profile status through the admin client so the lookup
  // does not depend on the user session being propagated yet.
  const supabaseAdmin = getSupabaseAdmin()
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('status, role')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    return { error: 'Perfil não encontrado.' }
  }

  if (profile.status !== 'approved' && profile.role !== 'admin') {
    await supabase.auth.signOut()
    return { 
      error: 'Sua conta está aguardando aprovação administrativa.',
      status: profile.status 
    }
  }

  return { success: true }
}

export async function resolveLoginProfile(userId: string) {
  const supabaseAdmin = getSupabaseAdmin()

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, name, email, role, status")
    .eq("id", userId)
    .single()

  if (profileError || !profile) {
    return { error: "Perfil não encontrado." }
  }

  const ensuredAccount = await ensureManagedAccount(
    userId,
    profile.name || profile.email?.split("@")[0] || "Usuario",
    profile.role === "admin" ? "admin" : "user"
  )

  if (ensuredAccount.error) {
    return { error: ensuredAccount.error }
  }

  const { data: managedAccount } = await supabaseAdmin
    .from("managed_accounts")
    .select("id, whop_key, key_frozen, withdrawals_enabled, messenger_enabled, gateway_enabled")
    .eq("id", ensuredAccount.accountId)
    .maybeSingle()

  const { data: gatewaySettings } = await supabaseAdmin
    .from("platform_gateway_settings")
    .select("enabled")
    .eq("id", "default")
    .maybeSingle()

  return {
    success: true,
    session: {
      userId: profile.id,
      name: profile.name || profile.email?.split("@")[0] || "Usuário",
      email: profile.email,
      role: profile.role === "admin" ? "admin" : "user",
      accountId: managedAccount?.id ?? null,
      keyFrozen: Boolean(managedAccount?.key_frozen),
      withdrawalsEnabled: managedAccount?.withdrawals_enabled !== false,
      messengerEnabled: managedAccount?.messenger_enabled !== false,
      gatewayModeEnabled: gatewaySettings?.enabled === true,
      gatewayEnabled:
        profile.role === "admin" ? true : managedAccount?.gateway_enabled === true,
      status: profile.status,
    },
  }
}

export async function logout() {
  await clearServerAppSession()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function persistAuthenticatedAppSession(input: { accessToken: string }) {
  const accessToken = input.accessToken?.trim()
  if (!accessToken) {
    return { error: "Token de sessao ausente." }
  }

  const supabaseAdmin = getSupabaseAdmin()
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken)

  if (error || !user) {
    await clearServerAppSession()
    return { error: "Sessao invalida." }
  }

  const profileResult = await resolveLoginProfile(user.id)
  if (!profileResult.success || !profileResult.session) {
    await clearServerAppSession()
    return { error: profileResult.error || "Sessao invalida." }
  }

  const nextSession: AppSession = {
    userId: profileResult.session.userId,
    name: profileResult.session.name,
    email: profileResult.session.email,
    role: profileResult.session.role === "admin" ? "admin" : "user",
    accountId: profileResult.session.accountId,
    keyFrozen: profileResult.session.keyFrozen,
    withdrawalsEnabled: profileResult.session.withdrawalsEnabled,
    messengerEnabled: profileResult.session.messengerEnabled,
    gatewayModeEnabled: profileResult.session.gatewayModeEnabled === true,
    gatewayEnabled:
      profileResult.session.role === "admin"
        ? true
        : profileResult.session.gatewayEnabled === true,
  }

  await persistServerAppSession(nextSession)
  return { success: true, session: nextSession }
}

export async function clearAuthenticatedAppSession() {
  await clearServerAppSession()
  return { success: true }
}
