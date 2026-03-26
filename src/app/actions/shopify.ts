"use server"

import { getSupabaseAdmin } from "@/lib/supabase"
import { normalizeShopDomain, type ConnectedShopifyStore } from "@/lib/shopify-store-data"

const SHOPIFY_STOREFRONT_API_VERSION = "2026-01"

type ShopifyProbeResult = {
  shopName: string
  shopDomain: string
  productCount: number
  variantCount: number
}

async function assertAccountAccess(accountId: string, userId: string) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle()

  const isAdmin = profile?.role === "admin"

  let query = supabaseAdmin
    .from("managed_accounts")
    .select("id, profile_id")
    .eq("id", accountId)

  if (!isAdmin) {
    query = query.eq("profile_id", userId)
  }

  const { data: account, error } = await query.maybeSingle()
  if (error || !account) {
    throw new Error("Conta operacional nao encontrada.")
  }

  return account
}

async function probeShopifyStorefront(shopDomain: string, storefrontToken: string): Promise<ShopifyProbeResult> {
  const endpoint = `https://${shopDomain}/api/${SHOPIFY_STOREFRONT_API_VERSION}/graphql.json`
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontToken,
    },
    body: JSON.stringify({
      query: `
        query SwipeStoreConnectionProbe($productsFirst: Int!, $variantsFirst: Int!) {
          shop {
            name
            primaryDomain {
              host
            }
          }
          products(first: $productsFirst) {
            nodes {
              id
              variants(first: $variantsFirst) {
                nodes {
                  id
                }
              }
            }
          }
        }
      `,
      variables: {
        productsFirst: 25,
        variantsFirst: 25,
      },
    }),
    cache: "no-store",
  })

  const payload = await response.json().catch(() => null)
  const errors = Array.isArray(payload?.errors) ? payload.errors : []

  if (!response.ok || errors.length > 0) {
    const message =
      errors[0]?.message ||
      payload?.message ||
      "Nao foi possivel validar a loja na Shopify."
    throw new Error(message)
  }

  const shopName = payload?.data?.shop?.name
  const resolvedDomain = payload?.data?.shop?.primaryDomain?.host
  const products = Array.isArray(payload?.data?.products?.nodes) ? payload.data.products.nodes : []
  const variantCount = products.reduce((total: number, product: { variants?: { nodes?: Array<unknown> } }) => {
    const count = Array.isArray(product?.variants?.nodes) ? product.variants.nodes.length : 0
    return total + count
  }, 0)

  if (!shopName || !resolvedDomain) {
    throw new Error("A Shopify nao retornou os dados basicos da loja.")
  }

  return {
    shopName,
    shopDomain: normalizeShopDomain(resolvedDomain),
    productCount: products.length,
    variantCount,
  }
}

function mapDbToStore(db: any): ConnectedShopifyStore {
  return {
    id: db.id,
    name: db.name,
    shopDomain: db.shop_domain,
    storefrontToken: db.storefront_token ?? "",
    checkoutType: "Shopify Hosted Checkout",
    status: (db.status ?? "Em configuracao") as ConnectedShopifyStore["status"],
    productCount: db.product_count ?? 0,
    variantCount: db.variant_count ?? 0,
    lastSync: db.last_sync ? new Date(db.last_sync).toLocaleString("pt-BR") : undefined,
  }
}

export async function loadShopifyStoresForSession(input: { accountId: string; userId: string }) {
  await assertAccountAccess(input.accountId, input.userId)

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from("shopify_stores")
    .select("*")
    .eq("account_id", input.accountId)
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message, stores: [] as ConnectedShopifyStore[] }
  }

  return {
    stores: (data ?? []).map(mapDbToStore),
  }
}

export async function connectShopifyStore(input: {
  accountId: string
  userId: string
  storeName: string
  shopDomain: string
  storefrontToken: string
}) {
  if (!input.storeName.trim() || !input.shopDomain.trim() || !input.storefrontToken.trim()) {
    return { error: "Nome interno, dominio Shopify e Storefront API token sao obrigatorios." }
  }

  await assertAccountAccess(input.accountId, input.userId)

  try {
    const normalizedDomain = normalizeShopDomain(input.shopDomain)
    const probe = await probeShopifyStorefront(normalizedDomain, input.storefrontToken.trim())
    const supabaseAdmin = getSupabaseAdmin()

    const payload = {
      account_id: input.accountId,
      name: input.storeName.trim(),
      shop_domain: probe.shopDomain,
      storefront_token: input.storefrontToken.trim(),
      checkout_type: "Shopify Hosted Checkout",
      status: "Pronta",
      product_count: probe.productCount,
      variant_count: probe.variantCount,
      last_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: existing } = await supabaseAdmin
      .from("shopify_stores")
      .select("id")
      .eq("account_id", input.accountId)
      .eq("shop_domain", probe.shopDomain)
      .maybeSingle()

    if (existing?.id) {
      const { error } = await supabaseAdmin
        .from("shopify_stores")
        .update(payload)
        .eq("id", existing.id)

      if (error) return { error: error.message }
    } else {
      const { error } = await supabaseAdmin.from("shopify_stores").insert(payload)
      if (error) return { error: error.message }
    }

    return {
      success: true,
      store: {
        name: probe.shopName,
        shopDomain: probe.shopDomain,
        productCount: probe.productCount,
        variantCount: probe.variantCount,
      },
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel conectar a loja Shopify.",
    }
  }
}

export async function syncShopifyStore(input: {
  storeId: string
  accountId: string
  userId: string
}) {
  await assertAccountAccess(input.accountId, input.userId)

  const supabaseAdmin = getSupabaseAdmin()
  const { data: store, error } = await supabaseAdmin
    .from("shopify_stores")
    .select("id, account_id, shop_domain, storefront_token")
    .eq("id", input.storeId)
    .eq("account_id", input.accountId)
    .maybeSingle()

  if (error || !store) {
    return { error: "Loja nao encontrada." }
  }

  if (!store.storefront_token) {
    return { error: "A loja nao possui Storefront API token salvo." }
  }

  try {
    const probe = await probeShopifyStorefront(store.shop_domain, store.storefront_token)
    const { error: updateError } = await supabaseAdmin
      .from("shopify_stores")
      .update({
        status: "Pronta",
        product_count: probe.productCount,
        variant_count: probe.variantCount,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.storeId)

    if (updateError) {
      return { error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    await supabaseAdmin
      .from("shopify_stores")
      .update({
        status: "Falha",
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.storeId)

    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel sincronizar a loja Shopify.",
    }
  }
}

export async function deleteShopifyStoreForSession(input: {
  storeId: string
  accountId: string
  userId: string
}) {
  await assertAccountAccess(input.accountId, input.userId)

  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin
    .from("shopify_stores")
    .delete()
    .eq("id", input.storeId)
    .eq("account_id", input.accountId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
