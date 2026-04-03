import { createHmac, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

import { getShopifyEmbeddedAppConfigs } from "@/lib/shopify-embedded"

export const runtime = "nodejs"

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4))
  return Buffer.from(`${normalized}${padding}`, "base64")
}

function encodeBase64Url(buffer: Buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function verifyTokenSignature(token: string, secret: string) {
  const [header, payload, signature] = token.split(".")
  if (!header || !payload || !signature) {
    return null
  }

  const expectedSignature = encodeBase64Url(
    createHmac("sha256", secret).update(`${header}.${payload}`).digest()
  )

  const provided = Buffer.from(signature, "utf8")
  const expected = Buffer.from(expectedSignature, "utf8")

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null
  }

  const headerPayload = JSON.parse(decodeBase64Url(header).toString("utf8")) as {
    alg?: string
  }

  if (headerPayload.alg !== "HS256") {
    return null
  }

  return JSON.parse(decodeBase64Url(payload).toString("utf8")) as {
    aud?: string
    dest?: string
    exp?: number
    iss?: string
    nbf?: number
    sub?: string
  }
}

export async function POST(request: Request) {
  const appConfigs = getShopifyEmbeddedAppConfigs().filter((config) => config.secret)
  const authHeader = request.headers.get("authorization") || ""

  if (appConfigs.length === 0) {
    return NextResponse.json({ error: "Shopify embedded auth not configured." }, { status: 500 })
  }

  if (!authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing bearer token." }, { status: 401 })
  }

  const token = authHeader.slice("Bearer ".length).trim()
  const matched = appConfigs.find((config) => {
    const claims = verifyTokenSignature(token, config.secret)
    return claims?.aud === config.apiKey
  })
  const claims = matched ? verifyTokenSignature(token, matched.secret) : null

  if (!claims) {
    return NextResponse.json({ error: "Invalid session token signature." }, { status: 401 })
  }

  const now = Math.floor(Date.now() / 1000)
  if ((claims.nbf && claims.nbf > now) || !claims.exp || claims.exp <= now) {
    return NextResponse.json({ error: "Expired session token." }, { status: 401 })
  }

  return NextResponse.json(
    {
      ok: true,
      shop: claims.dest ?? null,
      subject: claims.sub ?? null,
      slot: matched?.slot ?? "1",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
}
