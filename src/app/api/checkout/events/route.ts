import { NextResponse } from "next/server"

import { getSupabaseAdmin } from "@/lib/supabase"

type CheckoutBehaviorEventType =
  | "checkout_viewed"
  | "contact_started"
  | "delivery_started"
  | "payment_viewed"
  | "payment_started"
  | "order_completed"

const ALLOWED_EVENT_TYPES = new Set<CheckoutBehaviorEventType>([
  "checkout_viewed",
  "contact_started",
  "delivery_started",
  "payment_viewed",
  "payment_started",
  "order_completed",
])

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      checkoutId?: string
      sessionId?: string
      eventType?: CheckoutBehaviorEventType
      metadata?: Record<string, string | number | boolean | null>
    }

    const checkoutId = body.checkoutId?.trim()
    const sessionId = body.sessionId?.trim()
    const eventType = body.eventType

    if (!checkoutId || !sessionId || !eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
      return NextResponse.json({ error: "Payload invalido." }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: checkout, error: checkoutError } = await supabaseAdmin
      .from("checkouts")
      .select("id, account_id")
      .eq("id", checkoutId)
      .maybeSingle()

    if (checkoutError || !checkout) {
      return NextResponse.json({ error: "Checkout nao encontrado." }, { status: 404 })
    }

    const now = new Date().toISOString()
    const { error: upsertError } = await supabaseAdmin.from("checkout_behavior_events").upsert(
      {
        checkout_id: checkout.id,
        account_id: checkout.account_id,
        session_id: sessionId,
        event_type: eventType,
        metadata: body.metadata ?? {},
        last_seen_at: now,
        updated_at: now,
      },
      {
        onConflict: "checkout_id,session_id,event_type",
        ignoreDuplicates: false,
      }
    )

    if (upsertError) {
      console.error("Checkout behavior event upsert failed", {
        checkoutId,
        sessionId,
        eventType,
        error: upsertError.message,
      })
      return NextResponse.json({ error: "Nao foi possivel registrar o evento." }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Checkout behavior event route failed", error)
    return NextResponse.json({ error: "Erro interno." }, { status: 500 })
  }
}
