import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { CheckoutPixelTracker } from "@/components/checkout-preview/checkout-pixel-tracker"
import { ShopifyCheckout } from "@/components/checkout-preview/shopify-checkout"
import { getSupabaseAdmin } from "@/lib/supabase"
import type { CheckoutPixelConfig } from "@/lib/pixels-data"

export default async function PublicCheckoutThankYouPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const requestHeaders = await headers()
  const userAgent = requestHeaders.get("user-agent") ?? ""
  const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent)
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const supabaseAdmin = getSupabaseAdmin()

  const { data: checkout } = await supabaseAdmin
    .from("checkouts")
    .select("id, name, status, config")
    .eq("id", id)
    .maybeSingle()

  if (!checkout || checkout.status !== "Ativo") {
    notFound()
  }

  const { data: pixelConfigRow } = await supabaseAdmin
    .from("checkout_pixel_configs")
    .select(
      "checkout_id, meta_pixel_id, google_ads_id, tiktok_pixel_id, meta_pixel_ids, google_ads_ids, tiktok_pixel_ids, track_campaign_source"
    )
    .eq("checkout_id", checkout.id)
    .maybeSingle()

  const pixelConfig: CheckoutPixelConfig | null = pixelConfigRow
    ? {
        checkoutId: pixelConfigRow.checkout_id,
        metaPixelIds: Array.isArray(pixelConfigRow.meta_pixel_ids)
          ? pixelConfigRow.meta_pixel_ids.filter(Boolean)
          : pixelConfigRow.meta_pixel_id
            ? [pixelConfigRow.meta_pixel_id]
            : [],
        googleAdsIds: Array.isArray(pixelConfigRow.google_ads_ids)
          ? pixelConfigRow.google_ads_ids.filter(Boolean)
          : pixelConfigRow.google_ads_id
            ? [pixelConfigRow.google_ads_id]
            : [],
        tiktokPixelIds: Array.isArray(pixelConfigRow.tiktok_pixel_ids)
          ? pixelConfigRow.tiktok_pixel_ids.filter(Boolean)
          : pixelConfigRow.tiktok_pixel_id
            ? [pixelConfigRow.tiktok_pixel_id]
            : [],
        trackCampaignSource: Boolean(pixelConfigRow.track_campaign_source),
      }
    : null

  const selectedStoreId =
    checkout.config && typeof checkout.config === "object"
      ? String((checkout.config as Record<string, unknown>).selectedStoreId ?? "")
      : ""
  const shopParam =
    typeof resolvedSearchParams.shop === "string" ? resolvedSearchParams.shop : ""
  const { data: selectedStore } =
    selectedStoreId || shopParam
      ? await supabaseAdmin
          .from("shopify_stores")
          .select("shop_domain")
          .or(
            [
              selectedStoreId ? `id.eq.${selectedStoreId}` : null,
              shopParam ? `shop_domain.eq.${shopParam}` : null,
            ]
              .filter(Boolean)
              .join(",")
          )
          .maybeSingle()
      : { data: null }

  const productName =
    typeof resolvedSearchParams.product_name === "string"
      ? resolvedSearchParams.product_name
      : (typeof (checkout.config as any)?.productName === "string" &&
          (checkout.config as any).productName.trim()) ||
        checkout.name ||
        "Produto"
  const variantLabel =
    typeof resolvedSearchParams.variant_label === "string"
      ? resolvedSearchParams.variant_label
      : (typeof (checkout.config as any)?.productVariantLabel === "string" &&
          (checkout.config as any).productVariantLabel.trim()) ||
        "Variante padrao"
  const rawAmount =
    typeof resolvedSearchParams.amount === "string"
      ? Number.parseFloat(resolvedSearchParams.amount)
      : Number.isFinite((checkout.config as any)?.productPrice)
        ? Number((checkout.config as any).productPrice)
        : Number.isFinite((checkout.config as any)?.whop?.amount)
          ? Number((checkout.config as any).whop.amount)
          : 0
  const amount = Number.isFinite(rawAmount) ? rawAmount : 0
  const currency =
    typeof resolvedSearchParams.currency === "string"
      ? resolvedSearchParams.currency
      : (typeof (checkout.config as any)?.currency === "string"
          ? (checkout.config as any).currency
          : "BRL")
  const imageSrc =
    typeof resolvedSearchParams.image === "string" ? resolvedSearchParams.image : undefined
  const productId =
    typeof resolvedSearchParams.product === "string" ? resolvedSearchParams.product : null
  const variantId =
    typeof resolvedSearchParams.variant === "string" ? resolvedSearchParams.variant : null
  const orderId =
    typeof resolvedSearchParams.order_id === "string"
      ? resolvedSearchParams.order_id
      : checkout.id.slice(0, 8).toUpperCase()
  const paymentMethod =
    typeof resolvedSearchParams.payment_method === "string"
      ? resolvedSearchParams.payment_method
      : "Whop"
  const paidAt =
    typeof resolvedSearchParams.paid_at === "string"
      ? resolvedSearchParams.paid_at
      : new Date().toISOString()
  const formattedDateTime = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(paidAt))
  const thankYouLayoutStyle =
    checkout.config &&
    typeof checkout.config === "object" &&
    (checkout.config as Record<string, unknown>).thankYouLayoutStyle === "shopsfi"
      ? "shopsfi"
      : "default"

  return (
    <main
      className={
        thankYouLayoutStyle === "shopsfi"
          ? "min-h-screen bg-[#f1f1f1] px-0 py-0"
          : "min-h-screen bg-[#111111] px-4 py-8 md:px-8"
      }
    >
      <div
        className={
          thankYouLayoutStyle === "shopsfi"
            ? "mx-auto max-w-[1280px]"
            : "mx-auto max-w-[1200px] overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl"
        }
      >
        <CheckoutPixelTracker
          checkoutId={checkout.id}
          config={pixelConfig}
          stage="thank-you"
          productName={productName}
          variantLabel={variantLabel}
          amount={amount}
          currency={(currency === "USD" || currency === "EUR" || currency === "GBP" ? currency : "BRL") as "BRL" | "USD" | "EUR" | "GBP"}
          productId={productId}
          variantId={variantId}
        />
        <ShopifyCheckout
          config={(checkout.config && typeof checkout.config === "object" ? checkout.config : {}) as any}
          device={isMobileDevice ? "mobile" : "desktop"}
          previewPage="thank-you"
          shippingMethods={[]}
          storePreview={{
            storeName: String(((checkout.config as any)?.companyName || checkout.name || "Loja Shopify")),
            currency: (currency === "USD" || currency === "EUR" || currency === "GBP" ? currency : "BRL") as "BRL" | "USD" | "EUR" | "GBP",
            productName,
            variantLabel,
            amount,
            imageSrc,
            storeUrl: selectedStore?.shop_domain ? `https://${selectedStore.shop_domain}` : undefined,
          }}
          behaviorTracking={{
            enabled: true,
            checkoutId: checkout.id,
            stage: "thank-you",
          }}
          thankYouMeta={{
            orderId,
            paymentMethod,
            dateTime: formattedDateTime,
            paidAt,
          }}
        />
      </div>
    </main>
  )
}
