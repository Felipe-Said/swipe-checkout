import { NextResponse } from "next/server"

import { getSupabaseAdmin } from "@/lib/supabase"

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const shop = searchParams.get("shop")?.trim().toLowerCase()

  if (!shop) {
    return NextResponse.json(
      { error: "Parametro shop ausente." },
      {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data: store } = await supabaseAdmin
    .from("shopify_stores")
    .select("id, default_checkout_id, skip_cart_redirect")
    .eq("shop_domain", shop)
    .in("status", ["Pronta", "Conectada"])
    .maybeSingle()

  let checkoutBaseUrl = getAppBaseUrl(request)

  if (store?.default_checkout_id) {
    const { data: checkout } = await supabaseAdmin
      .from("checkouts")
      .select("id, config")
      .eq("id", store.default_checkout_id)
      .maybeSingle()

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

    if (connectedDomainHost) {
      checkoutBaseUrl = `https://${connectedDomainHost}`
    }
  }

  const checkoutUrl = store?.default_checkout_id
    ? `${checkoutBaseUrl}/checkout/${store.default_checkout_id}?shop=${encodeURIComponent(shop)}&store=${encodeURIComponent(store.id)}`
    : ""

  return NextResponse.json(
    {
      checkoutUrl,
      storeId: store?.id ?? "",
      skipCartRedirect: Boolean(store?.skip_cart_redirect),
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    }
  )
}
