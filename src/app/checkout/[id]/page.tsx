import { notFound } from "next/navigation"

import { ShopifyCheckout } from "@/components/checkout-preview/shopify-checkout"
import { getSupabaseAdmin } from "@/lib/supabase"
import { loadShopifyStorePreviewForPublishing } from "@/app/actions/shopify"

export default async function PublicCheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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
    config.selectedStoreId
      ? await loadShopifyStorePreviewForPublishing({
          storeId: String(config.selectedStoreId),
          accountId: checkout.account_id,
        })
      : { preview: null }

  return (
    <main className="min-h-screen bg-[#111111] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl">
        <ShopifyCheckout
          config={config as any}
          device="desktop"
          previewPage="checkout"
          shippingMethods={[]}
          storePreview={storePreviewResult.preview ?? null}
        />
      </div>
    </main>
  )
}
