"use client"

export type CheckoutBehaviorEventType =
  | "checkout_viewed"
  | "contact_started"
  | "delivery_started"
  | "payment_viewed"
  | "payment_started"
  | "order_completed"

type TrackCheckoutBehaviorInput = {
  checkoutId: string
  eventType: CheckoutBehaviorEventType
  metadata?: Record<string, string | number | boolean | null>
}

const SESSION_PREFIX = "swipe:checkout-session"
const EVENT_PREFIX = "swipe:checkout-event"

function getSessionStorage() {
  if (typeof window === "undefined") return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function generateSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function getOrCreateCheckoutSessionId(checkoutId: string) {
  const storage = getSessionStorage()
  const key = `${SESSION_PREFIX}:${checkoutId}`

  const existing = storage?.getItem(key)
  if (existing) {
    return existing
  }

  const created = generateSessionId()
  storage?.setItem(key, created)
  return created
}

function hasTrackedEvent(checkoutId: string, sessionId: string, eventType: CheckoutBehaviorEventType) {
  const storage = getSessionStorage()
  const key = `${EVENT_PREFIX}:${checkoutId}:${sessionId}:${eventType}`
  return storage?.getItem(key) === "1"
}

function markTrackedEvent(checkoutId: string, sessionId: string, eventType: CheckoutBehaviorEventType) {
  const storage = getSessionStorage()
  const key = `${EVENT_PREFIX}:${checkoutId}:${sessionId}:${eventType}`
  storage?.setItem(key, "1")
}

export async function trackCheckoutBehaviorEvent(input: TrackCheckoutBehaviorInput) {
  const sessionId = getOrCreateCheckoutSessionId(input.checkoutId)
  if (hasTrackedEvent(input.checkoutId, sessionId, input.eventType)) {
    return
  }

  const payload = JSON.stringify({
    checkoutId: input.checkoutId,
    sessionId,
    eventType: input.eventType,
    metadata: input.metadata ?? {},
  })

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const accepted = navigator.sendBeacon(
        "/api/checkout/events",
        new Blob([payload], { type: "application/json" })
      )

      if (accepted) {
        markTrackedEvent(input.checkoutId, sessionId, input.eventType)
        return
      }
    } catch {
      // Fall back to fetch when beacon is unavailable.
    }
  }

  try {
    const response = await fetch("/api/checkout/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
    })

    if (!response.ok) {
      return
    }

    markTrackedEvent(input.checkoutId, sessionId, input.eventType)
  } catch {
    // Ignore transient tracking failures in the public checkout.
  }
}
