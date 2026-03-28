'use server'

import { cookies } from 'next/headers'
import { getSupabaseAdmin, supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'

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
    .select("id, whop_key, key_frozen, withdrawals_enabled, messenger_enabled")
    .eq("id", ensuredAccount.accountId)
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
      status: profile.status,
    },
  }
}

export async function logout() {
  await supabase.auth.signOut()
  redirect('/login')
}
