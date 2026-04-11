import { NextResponse } from "next/server"

import { getSupabaseAdmin } from "@/lib/supabase"

type VercelProjectDomainResponse = {
  verified?: boolean
}

function buildCorsHeaders(request: Request) {
  const origin = request.headers.get("origin")?.trim()

  return origin
    ? {
        "Access-Control-Allow-Origin": origin,
        Vary: "Origin",
      }
    : undefined
}

function getAppBaseUrl(request: Request) {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL

  if (explicit) {
    return explicit.replace(/\/$/, "")
  }

  return new URL(request.url).origin
}

function getOriginHost(request: Request) {
  const originHeader = request.headers.get("origin")?.trim()
  if (!originHeader) {
    return ""
  }

  try {
    return new URL(originHeader).host.replace(/:\d+$/, "").toLowerCase()
  } catch {
    return ""
  }
}

function resolveShopifyAppClientId(slot: string | null) {
  if (slot === "2") {
    return (
      process.env.NEXT_PUBLIC_SHOPIFY_API_KEY_2 ||
      process.env.SHOPIFY_API_KEY_2 ||
      ""
    ).trim()
  }

  return (
    process.env.NEXT_PUBLIC_SHOPIFY_API_KEY ||
    process.env.SHOPIFY_API_KEY ||
    ""
  ).trim()
}

function getVercelDomainCheckConfig() {
  const token = process.env.VERCEL_API_TOKEN
  const project = process.env.VERCEL_PROJECT_ID_OR_NAME || process.env.VERCEL_PROJECT_ID
  const teamId = process.env.VERCEL_TEAM_ID
  const slug = process.env.VERCEL_TEAM_SLUG

  if (!token || !project) {
    return null
  }

  const params = new URLSearchParams()
  if (teamId) params.set("teamId", teamId)
  if (slug) params.set("slug", slug)
  const query = params.toString()

  return {
    token,
    project,
    suffix: query ? `?${query}` : "",
  }
}

async function isVercelDomainVerified(host: string) {
  const config = getVercelDomainCheckConfig()
  if (!config) return false

  try {
    const response = await fetch(
      `https://api.vercel.com/v9/projects/${config.project}/domains/${host}${config.suffix}`,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    )

    if (!response.ok) {
      return false
    }

    const body = (await response.json()) as VercelProjectDomainResponse
    return Boolean(body.verified)
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const shop = searchParams.get("shop")?.trim().toLowerCase()
  const shopifyAppSlot = searchParams.get("shopify_app")?.trim() || null
  const corsHeaders = buildCorsHeaders(request)
  const originHost = getOriginHost(request)

  if (!shop) {
    return NextResponse.json(
      { error: "Parametro shop ausente." },
      {
        status: 400,
        headers: corsHeaders,
      }
    )
  }

  const supabaseAdmin = getSupabaseAdmin()
  const preferredClientId = resolveShopifyAppClientId(shopifyAppSlot)
  const { data: stores } = await supabaseAdmin
    .from("shopify_stores")
    .select("id, client_id, default_checkout_id, skip_cart_redirect, updated_at")
    .eq("shop_domain", shop)
    .in("status", ["Pronta", "Conectada"])
    .order("updated_at", { ascending: false })

  const allCandidateStores = Array.isArray(stores) ? stores : []
  const candidateStores =
    preferredClientId &&
    allCandidateStores.some(
      (candidate) => String(candidate.client_id || "").trim() === preferredClientId
    )
      ? allCandidateStores.filter(
          (candidate) => String(candidate.client_id || "").trim() === preferredClientId
        )
      : allCandidateStores
  const activeCheckoutIds = candidateStores
    .map((store) => String(store.default_checkout_id || "").trim())
    .filter(Boolean)

  const { data: activeCheckouts } = activeCheckoutIds.length
    ? await supabaseAdmin
        .from("checkouts")
        .select("id, config")
        .in("id", activeCheckoutIds)
        .eq("status", "Ativo")
    : { data: [] as Array<{ id: string; config: unknown }> }

  const activeCheckoutById = new Map(
    (activeCheckouts ?? []).map((checkout) => [checkout.id, checkout])
  )

  const store =
    candidateStores.find((candidate) =>
      candidate.default_checkout_id &&
      activeCheckoutById.has(String(candidate.default_checkout_id))
    ) ??
    candidateStores.find((candidate) => Boolean(candidate.default_checkout_id)) ??
    candidateStores[0] ??
    null

  let checkoutBaseUrl = getAppBaseUrl(request)

  if (store?.default_checkout_id) {
    const checkout =
      activeCheckoutById.get(String(store.default_checkout_id)) ??
      (await (async () => {
        const { data } = await supabaseAdmin
          .from("checkouts")
          .select("id, config")
          .eq("id", store.default_checkout_id)
          .maybeSingle()
        return data
      })())

    const selectedDomainId =
      checkout?.config && typeof checkout.config === "object" && !Array.isArray(checkout.config)
        ? String((checkout.config as Record<string, unknown>).selectedDomainId || "")
        : ""

    let connectedDomainHost = ""

    if (selectedDomainId) {
      const { data: selectedDomain } = await supabaseAdmin
        .from("domains")
        .select("host, status")
        .eq("id", selectedDomainId)
        .eq("checkout_id", store.default_checkout_id)
        .maybeSingle()

      if (selectedDomain?.status === "Pronto") {
        connectedDomainHost = selectedDomain.host
      }
    }

    if (!connectedDomainHost) {
      const { data: fallbackDomain } = await supabaseAdmin
        .from("domains")
        .select("host, status, is_primary")
        .eq("checkout_id", store.default_checkout_id)
        .eq("status", "Pronto")
        .order("is_primary", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fallbackDomain?.host) {
        connectedDomainHost = fallbackDomain.host
      }
    }

    const normalizedConnectedDomainHost = connectedDomainHost.trim().toLowerCase()

    if (
      normalizedConnectedDomainHost &&
      normalizedConnectedDomainHost !== originHost &&
      (await isVercelDomainVerified(normalizedConnectedDomainHost))
    ) {
      checkoutBaseUrl = `https://${normalizedConnectedDomainHost}`
    }
  }

  const checkoutUrl = store?.default_checkout_id
    ? `${checkoutBaseUrl}/checkout/${store.default_checkout_id}?shop=${encodeURIComponent(shop)}&store=${encodeURIComponent(store.id)}`
    : ""

  return NextResponse.json(
    {
      checkoutUrl,
      skipCartRedirect: Boolean(store?.skip_cart_redirect),
      storeId: store?.id ?? "",
    },
    {
      headers: {
        "Cache-Control": "no-store",
        ...(corsHeaders ?? {}),
      },
    }
  )
}
