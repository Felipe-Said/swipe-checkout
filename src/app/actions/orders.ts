"use server"

import { getSupabaseAdmin } from "@/lib/supabase"
import { requireServerAppSessionOrAccessToken } from "@/lib/server-app-session"

type RealOrderRow = {
  id: string
  customer_name: string | null
  amount: number | null
  currency: string | null
  status: string | null
  date: string | null
}

export async function loadOrdersForSession(input: {
  userId: string
  accountId?: string | null
  accessToken?: string | null
}) {
  const actor = await requireServerAppSessionOrAccessToken(input)
  const supabaseAdmin = getSupabaseAdmin()

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", actor.userId)
    .maybeSingle()

  const isAdmin = profile?.role === "admin"

  let query = supabaseAdmin
    .from("orders")
    .select("id, customer_name, amount, currency, status, date")
    .order("date", { ascending: false })

  if (!isAdmin) {
    if (!input.accountId) {
      return { orders: [] as RealOrderRow[] }
    }

    query = query.eq("account_id", input.accountId)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message, orders: [] as RealOrderRow[] }
  }

  return {
    orders: (data ?? []) as RealOrderRow[],
  }
}
