import Whop from "@whop/sdk"
import { NextResponse } from "next/server"

import { getSupabaseAdmin } from "@/lib/supabase"

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin()
  const rawBody = await request.text()

  let payload: any

  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 })
  }

  const companyId = payload?.company_id ?? null

  if (!companyId) {
    return NextResponse.json({ received: true })
  }

  const { data: account } = await supabaseAdmin
    .from("managed_accounts")
    .select("id, whop_key")
    .eq("whop_company_id", companyId)
    .maybeSingle()

  if (!account) {
    return NextResponse.json({ received: true })
  }

  let event: any = payload

  if (account.whop_key) {
    try {
      const client = new Whop({ apiKey: account.whop_key })
      event = client.webhooks.unwrap(rawBody, {
        headers: {
          "webhook-id": request.headers.get("webhook-id") || "",
          "webhook-timestamp": request.headers.get("webhook-timestamp") || "",
          "webhook-signature": request.headers.get("webhook-signature") || "",
        },
      })
    } catch {
      event = payload
    }
  }

  if (!["payment.succeeded", "payment.pending", "payment.failed"].includes(event?.type)) {
    return NextResponse.json({ received: true })
  }

  const payment = event.data ?? {}
  const status =
    event.type === "payment.succeeded"
      ? "Pago"
      : event.type === "payment.pending"
        ? "Pendente"
        : "Falha"

  const amount =
    typeof payment.total === "number"
      ? payment.total
      : typeof payment.amount_after_fees === "number"
        ? payment.amount_after_fees
        : 0

  await supabaseAdmin.from("orders").upsert(
    {
      id: String(payment.id || event.id),
      account_id: account.id,
      customer_name:
        payment.user?.name ||
        payment.billing_address?.name ||
        "Cliente",
      amount,
      currency: String(payment.currency || "brl").toUpperCase(),
      status,
      date: payment.paid_at || payment.created_at || new Date().toISOString(),
    },
    {
      onConflict: "id",
    }
  )

  return NextResponse.json({ received: true })
}
