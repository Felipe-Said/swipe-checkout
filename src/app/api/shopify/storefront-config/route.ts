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

  const checkoutUrl = store?.default_checkout_id
    ? `${getAppBaseUrl(request)}/checkout/${store.default_checkout_id}`
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
