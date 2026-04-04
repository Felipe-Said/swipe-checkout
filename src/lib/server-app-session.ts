"use server"

import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

import type { AppSession } from "@/lib/app-session"
import { getSupabaseAdmin } from "@/lib/supabase"

const APP_SESSION_COOKIE_NAME = "swipe-server-session"
const APP_SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

function getSessionSecret() {
  return (
    process.env.APP_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  ).trim()
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url")
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url")
}

function serializeSession(session: AppSession) {
  const secret = getSessionSecret()
  if (!secret) {
    throw new Error("APP_SESSION_SECRET is missing")
  }

  const normalized: AppSession = {
    ...session,
    withdrawalsEnabled: session.withdrawalsEnabled !== false,
    messengerEnabled: session.messengerEnabled !== false,
    gatewayModeEnabled: session.gatewayModeEnabled === true,
    gatewayEnabled: session.gatewayEnabled === true,
  }

  const payload = toBase64Url(JSON.stringify(normalized))
  const signature = signPayload(payload, secret)
  return `${payload}.${signature}`
}

function deserializeSession(raw: string | undefined | null): AppSession | null {
  if (!raw) {
    return null
  }

  const secret = getSessionSecret()
  if (!secret) {
    return null
  }

  const [payload, signature] = raw.split(".")
  if (!payload || !signature) {
    return null
  }

  const expected = Buffer.from(signPayload(payload, secret), "utf8")
  const provided = Buffer.from(signature, "utf8")

  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return null
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as AppSession
    if (!parsed?.userId || !parsed?.email || !parsed?.role) {
      return null
    }

    return {
      ...parsed,
      withdrawalsEnabled: parsed.withdrawalsEnabled !== false,
      messengerEnabled: parsed.messengerEnabled !== false,
      gatewayModeEnabled: parsed.gatewayModeEnabled === true,
      gatewayEnabled: parsed.gatewayEnabled === true,
    }
  } catch {
    return null
  }
}

export async function persistServerAppSession(session: AppSession) {
  const cookieStore = await cookies()
  cookieStore.set(APP_SESSION_COOKIE_NAME, serializeSession(session), {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: APP_SESSION_COOKIE_MAX_AGE,
  })
}

export async function clearServerAppSession() {
  const cookieStore = await cookies()
  cookieStore.delete(APP_SESSION_COOKIE_NAME)
}

export async function readServerAppSession() {
  const cookieStore = await cookies()
  return deserializeSession(cookieStore.get(APP_SESSION_COOKIE_NAME)?.value)
}

export async function requireServerAppSession(expectedUserId?: string) {
  const session = await readServerAppSession()
  if (!session?.userId) {
    throw new Error("Sessao invalida.")
  }

  if (expectedUserId && session.userId !== expectedUserId) {
    throw new Error("Sessao invalida.")
  }

  return session
}

export async function requireServerAppSessionOrAccessToken(input: {
  userId?: string | null
  accessToken?: string | null
}) {
  const accessToken = input.accessToken?.trim()
  if (accessToken) {
    const supabaseAdmin = getSupabaseAdmin()
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken)

    if (error || !user) {
      throw new Error("Sessao invalida.")
    }

    if (input.userId && user.id !== input.userId) {
      throw new Error("Sessao invalida.")
    }

    return { userId: user.id }
  }

  return requireServerAppSession(input.userId ?? undefined)
}
