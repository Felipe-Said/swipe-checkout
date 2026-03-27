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

async function exchangeShopifyAdminToken(shopDomain: string, clientId: string, clientSecret: string) {
  const response = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.access_token) {
    throw new Error(
      payload?.error_description ||
        payload?.error ||
        "Nao foi possivel gerar o access token da Shopify."
    )
  }

  return payload.access_token as string
}

async function probeShopifyAdminApp(
  shopDomain: string,
  clientId: string,
  clientSecret: string
): Promise<ShopifyProbeResult> {
  const accessToken = await exchangeShopifyAdminToken(shopDomain, clientId, clientSecret)
  const endpoint = `https://${shopDomain}/admin/api/${SHOPIFY_STOREFRONT_API_VERSION}/graphql.json`
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({
      query: `
        query SwipeAdminConnectionProbe($productsFirst: Int!, $variantsFirst: Int!) {
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
      "Nao foi possivel validar o app Shopify nesta loja."
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
  clientId: string
  clientSecret: string
}) {
  if (!input.storeName.trim() || !input.shopDomain.trim() || !input.clientId.trim() || !input.clientSecret.trim()) {
    return { error: "Nome interno, dominio Shopify, Client ID e Secret sao obrigatorios." }
  }

  await assertAccountAccess(input.accountId, input.userId)

  try {
    const normalizedDomain = normalizeShopDomain(input.shopDomain)
    const probe = await probeShopifyAdminApp(
      normalizedDomain,
      input.clientId.trim(),
      input.clientSecret.trim()
    )
    const supabaseAdmin = getSupabaseAdmin()

    const payload = {
      account_id: input.accountId,
      name: input.storeName.trim(),
      shop_domain: probe.shopDomain,
      storefront_token: "",
      client_id: input.clientId.trim(),
      client_secret: input.clientSecret.trim(),
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
    .select("id, account_id, shop_domain, storefront_token, client_id, client_secret")
    .eq("id", input.storeId)
    .eq("account_id", input.accountId)
    .maybeSingle()

  if (error || !store) {
    return { error: "Loja nao encontrada." }
  }

  if (!store.client_id || !store.client_secret) {
    return { error: "A loja nao possui Client ID e Secret salvos." }
  }

  try {
    const probe = await probeShopifyAdminApp(
      store.shop_domain,
      store.client_id,
      store.client_secret
    )
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
