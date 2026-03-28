import { notFound } from "next/navigation"

import { ShopifyCheckout } from "@/components/checkout-preview/shopify-checkout"
import { getSupabaseAdmin } from "@/lib/supabase"
import {
  loadShopifyStorePreviewByDomainForPublishing,
  loadShopifyStorePreviewForPublishing,
  loadShopifyVariantPreviewByDomainForPublishing,
  loadShopifyVariantPreviewForPublishing,
} from "@/app/actions/shopify"
import { createPublicWhopCheckoutSession } from "@/app/actions/whop"

export default async function PublicCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const variantId =
    typeof resolvedSearchParams.variant === "string" ? resolvedSearchParams.variant : undefined
  const shopDomain =
    typeof resolvedSearchParams.shop === "string" ? resolvedSearchParams.shop.trim() : undefined
  const storeIdFromRedirect =
    typeof resolvedSearchParams.store === "string" ? resolvedSearchParams.store.trim() : undefined
  const supabaseAdmin = getSupabaseAdmin()

  const { data: checkout } = await supabaseAdmin
    .from("checkouts")
    .select("id, account_id, name, status, config")
    .eq("id", id)
    .maybeSingle()

  if (!checkout || checkout.status !== "Ativo") {
    notFound()
  }

  const config =
    checkout.config && typeof checkout.config === "object" && !Array.isArray(checkout.config)
      ? checkout.config
      : {}

  const storePreviewResult =
    storeIdFromRedirect
      ? variantId
        ? await loadShopifyVariantPreviewForPublishing({
            storeId: storeIdFromRedirect,
            accountId: checkout.account_id,
            variantId,
          })
        : await loadShopifyStorePreviewForPublishing({
            storeId: storeIdFromRedirect,
            accountId: checkout.account_id,
          })
      : shopDomain
      ? variantId
        ? await loadShopifyVariantPreviewByDomainForPublishing({
            shopDomain,
            accountId: checkout.account_id,
            variantId,
          })
        : await loadShopifyStorePreviewByDomainForPublishing({
            shopDomain,
            accountId: checkout.account_id,
          })
      : config.selectedStoreId
        ? variantId
          ? await loadShopifyVariantPreviewForPublishing({
              storeId: String(config.selectedStoreId),
              accountId: checkout.account_id,
              variantId,
            })
          : await loadShopifyStorePreviewForPublishing({
              storeId: String(config.selectedStoreId),
              accountId: checkout.account_id,
            })
        : { preview: null }

  const whopSessionResult = await createPublicWhopCheckoutSession({
    checkoutId: checkout.id,
    accountId: checkout.account_id,
    config: config as any,
    storePreview: storePreviewResult.preview ?? null,
  })

  const checkoutConfigWithLiveWhop = {
    ...(config as any),
    whop: (config as any).selectedWhopAccountId
      ? whopSessionResult.whop ?? null
      : (config as any).whop,
  }

  return (
    <main className="min-h-screen bg-[#111111] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl">
        <ShopifyCheckout
          config={checkoutConfigWithLiveWhop as any}
          device="desktop"
          previewPage="checkout"
          shippingMethods={[]}
          storePreview={storePreviewResult.preview ?? null}
        />
      </div>
    </main>
  )
}
