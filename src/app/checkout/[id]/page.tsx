import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { CheckoutPixelTracker } from "@/components/checkout-preview/checkout-pixel-tracker"
import { ShopifyCheckout } from "@/components/checkout-preview/shopify-checkout"
import { getSupabaseAdmin } from "@/lib/supabase"
import {
  loadShopifyProductPreviewByDomainForPublishing,
  loadShopifyProductPreviewForPublicCheckout,
  loadShopifyProductPreviewForPublishing,
  loadShopifyStorePreviewByDomainForPublishing,
  loadShopifyStorePreviewForPublicCheckout,
  loadShopifyStorePreviewForPublishing,
  loadShopifyVariantPreviewByDomainForPublishing,
  loadShopifyVariantPreviewForPublicCheckout,
  loadShopifyVariantPreviewForPublishing,
} from "@/app/actions/shopify"
import { loadCatalogProductPreviewForPublishing } from "@/app/actions/products"
import { loadShippingMethodsForCheckout } from "@/app/actions/shipping"
import { createPublicWhopCheckoutSession } from "@/app/actions/whop"
import { SWIPE_MANUAL_STORE_ID } from "@/lib/catalog-products"
import type { CheckoutPixelConfig } from "@/lib/pixels-data"

export default async function PublicCheckoutPage({
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
  const variantId =
    typeof resolvedSearchParams.variant === "string" ? resolvedSearchParams.variant : undefined
  const productId =
    typeof resolvedSearchParams.product === "string" ? resolvedSearchParams.product : undefined
  const productNameFromRedirect =
    typeof resolvedSearchParams.product_name === "string"
      ? resolvedSearchParams.product_name
      : undefined
  const variantLabelFromRedirect =
    typeof resolvedSearchParams.variant_label === "string"
      ? resolvedSearchParams.variant_label
      : undefined
  const amountFromRedirect =
    typeof resolvedSearchParams.amount === "string" ? resolvedSearchParams.amount : undefined
  const currencyFromRedirect =
    typeof resolvedSearchParams.currency === "string" ? resolvedSearchParams.currency : undefined
  const imageFromRedirect =
    typeof resolvedSearchParams.image === "string" ? resolvedSearchParams.image : undefined
  const attribution = {
    source:
      typeof resolvedSearchParams.utm_source === "string" ? resolvedSearchParams.utm_source : null,
    medium:
      typeof resolvedSearchParams.utm_medium === "string" ? resolvedSearchParams.utm_medium : null,
    campaign:
      typeof resolvedSearchParams.utm_campaign === "string" ? resolvedSearchParams.utm_campaign : null,
    content:
      typeof resolvedSearchParams.utm_content === "string" ? resolvedSearchParams.utm_content : null,
    term:
      typeof resolvedSearchParams.utm_term === "string" ? resolvedSearchParams.utm_term : null,
    gclid: typeof resolvedSearchParams.gclid === "string" ? resolvedSearchParams.gclid : null,
    fbclid: typeof resolvedSearchParams.fbclid === "string" ? resolvedSearchParams.fbclid : null,
    ttclid: typeof resolvedSearchParams.ttclid === "string" ? resolvedSearchParams.ttclid : null,
    referrer:
      typeof resolvedSearchParams.referrer === "string" ? resolvedSearchParams.referrer : null,
  }
  const shopDomain =
    typeof resolvedSearchParams.shop === "string" ? resolvedSearchParams.shop.trim() : undefined
  const storeIdFromRedirect =
    typeof resolvedSearchParams.store === "string" ? resolvedSearchParams.store.trim() : undefined
  const supabaseAdmin = getSupabaseAdmin()

  const { data: checkout } = await supabaseAdmin
    .from("checkouts")
    .select("id, account_id, name, status, type, config")
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

  const config =
    checkout.config && typeof checkout.config === "object" && !Array.isArray(checkout.config)
      ? checkout.config
      : {}
  const configuredWhopAccountId =
    typeof (config as any).selectedWhopAccountId === "string"
      ? (config as any).selectedWhopAccountId.trim()
      : ""
  const savedWhopConfig =
    (config as any).whop && typeof (config as any).whop === "object" && !Array.isArray((config as any).whop)
      ? ((config as any).whop as Record<string, unknown>)
      : null
  const shouldUseHostedWhop =
    checkout.type === "Whop Hosted" ||
    Boolean(
      configuredWhopAccountId ||
        savedWhopConfig?.companyId ||
        savedWhopConfig?.checkoutConfigurationId ||
        savedWhopConfig?.planId ||
        savedWhopConfig?.purchaseUrl
    )
  const resolvedWhopAccountId = configuredWhopAccountId || (shouldUseHostedWhop ? checkout.account_id : "")
  const configuredStoreId =
    typeof (config as any).selectedStoreId === "string" ? (config as any).selectedStoreId : ""
  const configuredProductId =
    typeof (config as any).selectedProductId === "string" ? (config as any).selectedProductId : ""
  const configuredVariantId =
    typeof (config as any).selectedVariantId === "string" ? (config as any).selectedVariantId : ""
  const isSwipeManualMode =
    storeIdFromRedirect === SWIPE_MANUAL_STORE_ID || configuredStoreId === SWIPE_MANUAL_STORE_ID
  const redirectedAmount = Number.parseFloat(amountFromRedirect ?? "")
  const redirectedCurrency =
    currencyFromRedirect === "USD" ||
    currencyFromRedirect === "EUR" ||
    currencyFromRedirect === "GBP" ||
    currencyFromRedirect === "BRL"
      ? currencyFromRedirect
      : ((config as any).currency || "BRL")
  const redirectedStorePreview =
    productNameFromRedirect &&
    Number.isFinite(redirectedAmount) &&
    redirectedAmount >= 0
      ? {
          storeName: String((config as any).companyName || checkout.name || "Loja Shopify"),
          currency: redirectedCurrency,
          productName: productNameFromRedirect,
          variantLabel: variantLabelFromRedirect || "Variante padrao",
          amount: redirectedAmount,
          imageSrc: imageFromRedirect,
        }
      : null
  const requiresShopifyResolution = !isSwipeManualMode
    ? Boolean(
        storeIdFromRedirect ||
          shopDomain ||
          productId ||
          variantId ||
          configuredStoreId
      )
    : false

  const storePreviewResult = redirectedStorePreview
    ? { preview: redirectedStorePreview }
    : isSwipeManualMode
      ? await loadCatalogProductPreviewForPublishing({
          accountId: checkout.account_id,
          productId: productId || configuredProductId,
          variantId: variantId || configuredVariantId || null,
        })
    :
    storeIdFromRedirect
      ? variantId
        ? await loadShopifyVariantPreviewForPublicCheckout({
            storeId: storeIdFromRedirect,
            variantId,
            productId,
          })
        : productId
        ? await loadShopifyProductPreviewForPublicCheckout({
            storeId: storeIdFromRedirect,
            productId,
          })
        : await loadShopifyStorePreviewForPublicCheckout({
            storeId: storeIdFromRedirect,
          })
      : shopDomain
      ? variantId
        ? await loadShopifyVariantPreviewByDomainForPublishing({
            shopDomain,
            accountId: checkout.account_id,
            variantId,
            productId,
          })
        : productId
        ? await loadShopifyProductPreviewByDomainForPublishing({
            shopDomain,
            accountId: checkout.account_id,
            productId,
          })
        : await loadShopifyStorePreviewByDomainForPublishing({
            shopDomain,
            accountId: checkout.account_id,
          })
      : configuredStoreId
        ? variantId
          ? await loadShopifyVariantPreviewForPublishing({
              storeId: configuredStoreId,
              accountId: checkout.account_id,
              variantId: variantId || configuredVariantId,
              productId: productId || configuredProductId,
            })
          : productId || configuredProductId
          ? await loadShopifyProductPreviewForPublishing({
              storeId: configuredStoreId,
              accountId: checkout.account_id,
              productId: productId || configuredProductId,
              variantId: variantId || configuredVariantId || undefined,
            })
          : await loadShopifyStorePreviewForPublishing({
              storeId: configuredStoreId,
              accountId: checkout.account_id,
            })
        : { preview: null }

  if (!storePreviewResult.preview && "error" in storePreviewResult && storePreviewResult.error) {
    console.error("Public checkout Shopify preview failed", {
      checkoutId: checkout.id,
      accountId: checkout.account_id,
      storeIdFromRedirect,
      isSwipeManualMode,
      shopDomain,
      productId,
      variantId,
      error: storePreviewResult.error,
    })
  }

  const whopSessionResult = await createPublicWhopCheckoutSession({
    checkoutId: checkout.id,
    accountId: checkout.account_id,
    config: {
      ...(config as any),
      selectedWhopAccountId: resolvedWhopAccountId,
      selectedStoreId: configuredStoreId || storeIdFromRedirect,
      selectedProductId: configuredProductId || productId,
      selectedVariantId: configuredVariantId || variantId,
    } as any,
    storePreview: storePreviewResult.preview ?? null,
    requireResolvedStorePreview: requiresShopifyResolution,
    shopifyStoreId:
      !isSwipeManualMode ? storeIdFromRedirect || configuredStoreId || null : null,
    shopifyProductId: !isSwipeManualMode ? productId || null : null,
    shopifyVariantId: !isSwipeManualMode ? variantId || null : null,
    shopDomain: shopDomain ?? null,
    attribution,
    productName: productNameFromRedirect ?? null,
    variantLabel: variantLabelFromRedirect ?? null,
    imageSrc: imageFromRedirect ?? null,
    amount: Number.isFinite(redirectedAmount) ? redirectedAmount : null,
    currency: currencyFromRedirect ?? null,
  })

  const hasSelectedWhopAccount = Boolean(resolvedWhopAccountId)
  const liveWhopConfig =
    whopSessionResult.whop ??
    ((config as any).whop && typeof (config as any).whop === "object" ? (config as any).whop : null)

  if (hasSelectedWhopAccount && (!liveWhopConfig?.purchaseUrl || whopSessionResult.error)) {
    return (
      <main className="min-h-screen bg-[#111111] px-4 py-8 md:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-[720px] items-center justify-center">
          <div className="w-full rounded-[28px] border border-white/10 bg-white p-8 shadow-2xl">
            <div className="space-y-4 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#fb4303]">
                Checkout temporariamente indisponivel
              </p>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#111111]">
                Nao foi possivel abrir o pagamento agora
              </h1>
              <p className="text-sm leading-7 text-[#6b7280]">
                A sessao real da Whop nao foi carregada corretamente para este checkout publicado.
                Tente novamente em alguns instantes.
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const checkoutConfigWithLiveWhop = {
    ...(config as any),
    selectedWhopAccountId: resolvedWhopAccountId,
    selectedStoreId: configuredStoreId || storeIdFromRedirect,
    selectedProductId: configuredProductId || productId,
    selectedVariantId: configuredVariantId || variantId,
    whop: liveWhopConfig,
  }
  const shippingMethodsResult = await loadShippingMethodsForCheckout({
    accountId: checkout.account_id,
    shippingMethodIds: Array.isArray((config as any).selectedShippingMethodIds)
      ? (config as any).selectedShippingMethodIds.filter(
          (value: unknown): value is string => typeof value === "string" && value.length > 0
        )
      : [],
  })

  return (
    <main className="min-h-screen bg-[#111111] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl">
        <CheckoutPixelTracker
          checkoutId={checkout.id}
          config={pixelConfig}
          stage="checkout"
          orderId={null}
          productName={
            storePreviewResult.preview?.productName ||
            productNameFromRedirect ||
            (typeof (config as any).productName === "string" && (config as any).productName.trim()) ||
            checkout.name ||
            "Produto"
          }
          variantLabel={
            storePreviewResult.preview?.variantLabel ||
            variantLabelFromRedirect ||
            (typeof (config as any).productVariantLabel === "string" &&
            (config as any).productVariantLabel.trim()) ||
            "Variante padrao"
          }
          amount={
            storePreviewResult.preview?.amount ??
            (Number.isFinite(redirectedAmount)
              ? redirectedAmount
              : Number.isFinite((config as any).productPrice)
                ? Number((config as any).productPrice)
                : Number.isFinite((config as any).whop?.amount)
                  ? Number((config as any).whop?.amount)
                  : 0)
          }
          currency={
            (storePreviewResult.preview?.currency ||
              currencyFromRedirect ||
              (config as any).currency ||
              "BRL") as "BRL" | "USD" | "EUR" | "GBP"
          }
          productId={productId ?? null}
          variantId={variantId ?? null}
        />
        <ShopifyCheckout
          config={checkoutConfigWithLiveWhop as any}
          device={isMobileDevice ? "mobile" : "desktop"}
          previewPage="checkout"
          shippingMethods={shippingMethodsResult.methods}
          storePreview={storePreviewResult.preview ?? null}
          behaviorTracking={{
            enabled: true,
            checkoutId: checkout.id,
            stage: "checkout",
          }}
        />
      </div>
    </main>
  )
}
