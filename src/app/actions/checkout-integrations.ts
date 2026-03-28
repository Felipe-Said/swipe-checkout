"use server"

import { getSupabaseAdmin } from "@/lib/supabase"
import type { CheckoutPixelConfig } from "@/lib/pixels-data"
import type { PushcutCheckoutConfig } from "@/lib/pushcut-data"

function normalizePixelIds(value: unknown, fallback?: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? "").trim())
      .filter(Boolean)
  }

  if (typeof fallback === "string" && fallback.trim()) {
    return [fallback.trim()]
  }

  return [] as string[]
}

async function assertCheckoutIntegrationAccess(input: { accountId: string; userId: string }) {
  const supabaseAdmin = getSupabaseAdmin()

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", input.userId)
    .maybeSingle()

  const isAdmin = profile?.role === "admin"

  let query = supabaseAdmin
    .from("managed_accounts")
    .select("id")
    .eq("id", input.accountId)

  if (!isAdmin) {
    query = query.eq("profile_id", input.userId)
  }

  const { data: account, error } = await query.maybeSingle()
  if (error || !account) {
    throw new Error("Conta operacional nao encontrada.")
  }
}

export async function loadCheckoutPushcutConfigsForSession(input: {
  accountId: string
  userId: string
}) {
  await assertCheckoutIntegrationAccess(input)

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from("checkout_pushcut_configs")
    .select("checkout_id, webhook_urls")
    .in(
      "checkout_id",
      (
        await supabaseAdmin
          .from("checkouts")
          .select("id")
          .eq("account_id", input.accountId)
      ).data?.map((checkout) => checkout.id) ?? []
    )

  if (error) {
    return { error: error.message, configs: [] as PushcutCheckoutConfig[] }
  }

  return {
    configs: (data ?? []).map((row) => ({
      checkoutId: row.checkout_id,
      webhookUrls: Array.isArray(row.webhook_urls) ? row.webhook_urls : [],
    })),
  }
}

export async function saveCheckoutPushcutConfigForSession(input: {
  accountId: string
  userId: string
  checkoutId: string
  webhookUrls: string[]
}) {
  await assertCheckoutIntegrationAccess(input)

  const supabaseAdmin = getSupabaseAdmin()

  const { data: checkout, error: checkoutError } = await supabaseAdmin
    .from("checkouts")
    .select("id")
    .eq("id", input.checkoutId)
    .eq("account_id", input.accountId)
    .maybeSingle()

  if (checkoutError || !checkout) {
    return { error: "Checkout nao encontrado." }
  }

  const { error } = await supabaseAdmin.from("checkout_pushcut_configs").upsert(
    {
      checkout_id: input.checkoutId,
      webhook_urls: input.webhookUrls,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "checkout_id",
    }
  )

  if (error) {
    return { error: error.message }
  }

  return {
    success: true,
    config: {
      checkoutId: input.checkoutId,
      webhookUrls: input.webhookUrls,
    } satisfies PushcutCheckoutConfig,
  }
}

export async function loadCheckoutPixelConfigsForSession(input: {
  accountId: string
  userId: string
}) {
  await assertCheckoutIntegrationAccess(input)

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from("checkout_pixel_configs")
    .select(
      "checkout_id, meta_pixel_id, google_ads_id, tiktok_pixel_id, meta_pixel_ids, google_ads_ids, tiktok_pixel_ids, track_campaign_source"
    )
    .in(
      "checkout_id",
      (
        await supabaseAdmin
          .from("checkouts")
          .select("id")
          .eq("account_id", input.accountId)
      ).data?.map((checkout) => checkout.id) ?? []
    )

  if (error) {
    return { error: error.message, configs: [] as CheckoutPixelConfig[] }
  }

  return {
    configs: (data ?? []).map((row) => ({
      checkoutId: row.checkout_id,
      metaPixelIds: normalizePixelIds(row.meta_pixel_ids, row.meta_pixel_id),
      googleAdsIds: normalizePixelIds(row.google_ads_ids, row.google_ads_id),
      tiktokPixelIds: normalizePixelIds(row.tiktok_pixel_ids, row.tiktok_pixel_id),
      trackCampaignSource: Boolean(row.track_campaign_source),
    })),
  }
}

export async function saveCheckoutPixelConfigForSession(input: {
  accountId: string
  userId: string
  checkoutId: string
  metaPixelIds: string[]
  googleAdsIds: string[]
  tiktokPixelIds: string[]
  trackCampaignSource: boolean
}) {
  await assertCheckoutIntegrationAccess(input)

  const supabaseAdmin = getSupabaseAdmin()

  const { data: checkout, error: checkoutError } = await supabaseAdmin
    .from("checkouts")
    .select("id")
    .eq("id", input.checkoutId)
    .eq("account_id", input.accountId)
    .maybeSingle()

  if (checkoutError || !checkout) {
    return { error: "Checkout nao encontrado." }
  }

  const { error } = await supabaseAdmin.from("checkout_pixel_configs").upsert(
    {
      checkout_id: input.checkoutId,
      meta_pixel_id: input.metaPixelIds[0] ?? "",
      google_ads_id: input.googleAdsIds[0] ?? "",
      tiktok_pixel_id: input.tiktokPixelIds[0] ?? "",
      meta_pixel_ids: input.metaPixelIds,
      google_ads_ids: input.googleAdsIds,
      tiktok_pixel_ids: input.tiktokPixelIds,
      track_campaign_source: input.trackCampaignSource,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "checkout_id",
    }
  )

  if (error) {
    return { error: error.message }
  }

  return {
    success: true,
    config: {
      checkoutId: input.checkoutId,
      metaPixelIds: input.metaPixelIds,
      googleAdsIds: input.googleAdsIds,
      tiktokPixelIds: input.tiktokPixelIds,
      trackCampaignSource: input.trackCampaignSource,
    } satisfies CheckoutPixelConfig,
  }
}
