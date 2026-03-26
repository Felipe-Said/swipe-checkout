'use server'

import { cookies } from 'next/headers'
import { getSupabaseAdmin, supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'

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

  const { data: managedAccount } = await supabaseAdmin
    .from("managed_accounts")
    .select("id, whop_key")
    .eq("profile_id", userId)
    .maybeSingle()

  return {
    success: true,
    session: {
      userId: profile.id,
      name: profile.name || profile.email?.split("@")[0] || "Usuário",
      email: profile.email,
      role: profile.role === "admin" ? "admin" : "user",
      accountId: managedAccount?.id ?? null,
      keyFrozen: false,
      status: profile.status,
    },
  }
}

export async function logout() {
  await supabase.auth.signOut()
  redirect('/login')
}
