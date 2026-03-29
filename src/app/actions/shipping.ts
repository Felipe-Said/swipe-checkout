"use server"

import { getSupabaseAdmin } from "@/lib/supabase"
import { type ShippingMethod } from "@/lib/shipping-data"

type ShippingMethodRow = {
  id: string
  account_id: string
  name: string
  description: string
  price: number | string
  eta: string
  active: boolean | null
  created_at?: string | null
}

function mapShippingMethod(row: ShippingMethodRow): ShippingMethod {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    description: row.description,
    price: Number(row.price ?? 0),
    eta: row.eta,
    active: row.active !== false,
  }
}

async function resolveAuthorizedAccount(accountId: string, userId: string) {
  const supabaseAdmin = getSupabaseAdmin()

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle()

  let accountQuery = supabaseAdmin
    .from("managed_accounts")
    .select("id")
    .eq("id", accountId)

  if (profile?.role !== "admin") {
    accountQuery = accountQuery.eq("profile_id", userId)
  }

  const { data: account, error } = await accountQuery.maybeSingle()

  if (error || !account) {
    return null
  }

  return account.id
}

export async function loadShippingMethodsForSession(input: {
  accountId?: string | null
  userId?: string | null
}) {
  if (!input.accountId || !input.userId) {
    return { methods: [] as ShippingMethod[] }
  }

  const authorizedAccountId = await resolveAuthorizedAccount(input.accountId, input.userId)
  if (!authorizedAccountId) {
    return { methods: [] as ShippingMethod[] }
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from("shipping_methods")
    .select("id, account_id, name, description, price, eta, active, created_at")
    .eq("account_id", authorizedAccountId)
    .order("created_at", { ascending: true })

  if (error) {
    return { error: error.message, methods: [] as ShippingMethod[] }
  }

  return {
    methods: (data ?? []).map((row) => mapShippingMethod(row as ShippingMethodRow)),
  }
}

export async function createShippingMethodForSession(input: {
  accountId?: string | null
  userId?: string | null
  name: string
  description: string
  price: number
  eta: string
}) {
  const name = input.name.trim()
  const description = input.description.trim()
  const eta = input.eta.trim()
  const price = Number(input.price)

  if (!input.accountId || !input.userId) {
    return { error: "Sessao invalida." }
  }

  if (!name || !description || !eta || !Number.isFinite(price) || price < 0) {
    return { error: "Preencha nome, descricao, valor e prazo corretamente." }
  }

  const authorizedAccountId = await resolveAuthorizedAccount(input.accountId, input.userId)
  if (!authorizedAccountId) {
    return { error: "Conta operacional nao encontrada." }
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from("shipping_methods")
    .insert({
      account_id: authorizedAccountId,
      name,
      description,
      price,
      eta,
      active: true,
    })
    .select("id, account_id, name, description, price, eta, active, created_at")
    .single()

  if (error || !data) {
    return { error: error?.message || "Nao foi possivel criar o frete." }
  }

  return {
    method: mapShippingMethod(data as ShippingMethodRow),
  }
}

export async function updateShippingMethodStatusForSession(input: {
  accountId?: string | null
  userId?: string | null
  shippingId: string
  active: boolean
}) {
  if (!input.accountId || !input.userId || !input.shippingId) {
    return { error: "Frete invalido." }
  }

  const authorizedAccountId = await resolveAuthorizedAccount(input.accountId, input.userId)
  if (!authorizedAccountId) {
    return { error: "Conta operacional nao encontrada." }
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from("shipping_methods")
    .update({
      active: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.shippingId)
    .eq("account_id", authorizedAccountId)
    .select("id, account_id, name, description, price, eta, active, created_at")
    .single()

  if (error || !data) {
    return { error: error?.message || "Nao foi possivel atualizar o frete." }
  }

  return {
    method: mapShippingMethod(data as ShippingMethodRow),
  }
}

export async function loadShippingMethodsForCheckout(input: {
  accountId?: string | null
  shippingMethodIds?: string[] | null
}) {
  if (!input.accountId) {
    return { methods: [] as ShippingMethod[] }
  }

  const supabaseAdmin = getSupabaseAdmin()
  let query = supabaseAdmin
    .from("shipping_methods")
    .select("id, account_id, name, description, price, eta, active, created_at")
    .eq("account_id", input.accountId)
    .eq("active", true)
    .order("created_at", { ascending: true })

  if (Array.isArray(input.shippingMethodIds) && input.shippingMethodIds.length > 0) {
    query = query.in("id", input.shippingMethodIds)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message, methods: [] as ShippingMethod[] }
  }

  return {
    methods: (data ?? []).map((row) => mapShippingMethod(row as ShippingMethodRow)),
  }
}
