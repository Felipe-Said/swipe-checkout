import Whop from "@whop/sdk"
import { NextResponse } from "next/server"

import { sendPushcutNotificationsForCheckout } from "@/lib/pushcut"
import { syncPaidWhopOrderToShopify } from "@/lib/shopify-order-sync"
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

  const metadata =
    payment?.metadata && typeof payment.metadata === "object" && !Array.isArray(payment.metadata)
      ? payment.metadata
      : {}
  const orderId = String(payment.id || event.id)
  const checkoutId =
    typeof metadata.swipeCheckoutId === "string" && metadata.swipeCheckoutId.trim()
      ? metadata.swipeCheckoutId.trim()
      : null
  const customerName =
    payment.user?.name ||
    payment.billing_address?.name ||
    "Cliente"
  const currency = String(payment.currency || "brl").toUpperCase()
  const orderDate = payment.paid_at || payment.created_at || new Date().toISOString()
  const { data: existingOrder } = await supabaseAdmin
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle()

  await supabaseAdmin.from("orders").upsert(
    {
      id: orderId,
      account_id: account.id,
      checkout_id: checkoutId,
      customer_name: customerName,
      amount,
      currency,
      status,
      date: orderDate,
      attribution_source:
        typeof metadata.utmSource === "string" ? metadata.utmSource : null,
      attribution_medium:
        typeof metadata.utmMedium === "string" ? metadata.utmMedium : null,
      attribution_campaign:
        typeof metadata.utmCampaign === "string" ? metadata.utmCampaign : null,
      attribution_content:
        typeof metadata.utmContent === "string" ? metadata.utmContent : null,
      attribution_term:
        typeof metadata.utmTerm === "string" ? metadata.utmTerm : null,
      attribution_gclid:
        typeof metadata.gclid === "string" ? metadata.gclid : null,
      attribution_fbclid:
        typeof metadata.fbclid === "string" ? metadata.fbclid : null,
      attribution_ttclid:
        typeof metadata.ttclid === "string" ? metadata.ttclid : null,
      attribution_referrer:
        typeof metadata.referrer === "string" ? metadata.referrer : null,
      attribution_landing_url:
        typeof metadata.sourceUrl === "string"
          ? metadata.sourceUrl
          : typeof metadata.landingUrl === "string"
            ? metadata.landingUrl
            : null,
    },
    {
      onConflict: "id",
    }
  )

  if (existingOrder?.status !== status) {
    const pushcutResult = await sendPushcutNotificationsForCheckout({
      accountId: account.id,
      checkoutId,
      checkoutName:
        typeof metadata.swipeCheckoutName === "string" ? metadata.swipeCheckoutName : null,
      orderId,
      customerName,
      amount,
      currency,
      status,
      sourceUrl:
        typeof metadata.sourceUrl === "string"
          ? metadata.sourceUrl
          : typeof metadata.landingUrl === "string"
            ? metadata.landingUrl
            : null,
    })

    if (!pushcutResult.success && !("skipped" in pushcutResult && pushcutResult.skipped === "no_urls")) {
      console.error("Pushcut delivery failed", {
        paymentId: orderId,
        accountId: account.id,
        checkoutId,
        status,
        result: pushcutResult,
      })
    }
  }

  if (event.type === "payment.succeeded") {
    const syncResult = await syncPaidWhopOrderToShopify({
      payment,
      accountId: account.id,
    })

    if ("error" in syncResult && syncResult.error) {
      console.error("Shopify order sync failed", {
        paymentId: String(payment.id || event.id),
        accountId: account.id,
        error: syncResult.error,
      })
    }
  }

  return NextResponse.json({ received: true })
}
