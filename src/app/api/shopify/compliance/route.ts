import { createHmac, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

import { getShopifyEmbeddedAppConfigs } from "@/lib/shopify-embedded"

export const runtime = "nodejs"

function verifyShopifyWebhookHmac(rawBody: Buffer, providedHmac: string, secret: string) {
  if (!providedHmac || !secret) {
    return false
  }

  const digest = createHmac("sha256", secret).update(rawBody).digest("base64")

  const provided = Buffer.from(providedHmac, "utf8")
  const expected = Buffer.from(digest, "utf8")

  if (provided.length !== expected.length) {
    return false
  }

  return timingSafeEqual(provided, expected)
}

export async function POST(request: Request) {
  const secrets = getShopifyEmbeddedAppConfigs()
    .map((config) => config.secret)
    .filter(Boolean)
  if (secrets.length === 0) {
    return NextResponse.json(
      { error: "Shopify app secret not configured." },
      { status: 500 }
    )
  }

  const rawBody = Buffer.from(await request.arrayBuffer())
  const providedHmac = request.headers.get("x-shopify-hmac-sha256") || ""

  const isValid = secrets.some((secret) => verifyShopifyWebhookHmac(rawBody, providedHmac, secret))

  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
