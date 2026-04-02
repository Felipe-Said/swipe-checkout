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

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_EVENTS = 30
const EVENT_SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]{8,120}$/
const eventRateLimitStore = new Map<string, { count: number; resetAt: number }>()

function getRateLimitKey(request: Request, checkoutId: string) {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? ""
  const ip = forwardedFor.split(",")[0]?.trim() || "unknown"
  return `${ip}:${checkoutId}`
}

function isRateLimited(key: string) {
  const now = Date.now()
  const current = eventRateLimitStore.get(key)

  if (!current || current.resetAt <= now) {
    eventRateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    })
    return false
  }

  if (current.count >= RATE_LIMIT_MAX_EVENTS) {
    return true
  }

  current.count += 1
  eventRateLimitStore.set(key, current)
  return false
}

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
    const metadata =
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? body.metadata
        : {}

    if (!checkoutId || !sessionId || !eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
      return NextResponse.json({ error: "Payload invalido." }, { status: 400 })
    }

    if (!EVENT_SESSION_ID_PATTERN.test(sessionId)) {
      return NextResponse.json({ error: "Sessao invalida." }, { status: 400 })
    }

    if (JSON.stringify(metadata).length > 2048) {
      return NextResponse.json({ error: "Metadata excede o limite permitido." }, { status: 400 })
    }

    if (isRateLimited(getRateLimitKey(request, checkoutId))) {
      return NextResponse.json({ error: "Muitas tentativas. Tente novamente em instantes." }, { status: 429 })
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
        metadata,
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
