"use server"

import { getSupabaseAdmin } from "@/lib/supabase"
import { normalizeShopDomain, type ConnectedShopifyStore } from "@/lib/shopify-store-data"

const SHOPIFY_STOREFRONT_API_VERSION = "2026-01"

type ShopifyProbeResult = {
  shopName: string
  primaryDomain: string
  productCount: number
  variantCount: number
}

type ShopifyStorePreviewCurrency = "BRL" | "USD" | "EUR" | "GBP"

type ShopifyStorePreview = {
  storeName: string
  currency: ShopifyStorePreviewCurrency
  productName: string
  variantLabel: string
  amount: number
  imageSrc?: string
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
    primaryDomain: normalizeShopDomain(resolvedDomain),
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

function normalizeStoreCurrency(value?: string | null): ShopifyStorePreviewCurrency {
  if (!value) return "BRL"
  const currency = value.toUpperCase()
  if (currency === "USD" || currency === "EUR" || currency === "GBP") {
    return currency
  }
  return "BRL"
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
    primaryDomain: normalizeShopDomain(resolvedDomain),
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

async function fetchShopifyStorePreview(input: { storeId: string; accountId: string }) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: store, error } = await supabaseAdmin
    .from("shopify_stores")
    .select("id, account_id, name, shop_domain, client_id, client_secret")
    .eq("account_id", input.accountId)
    .eq("id", input.storeId)
    .maybeSingle()

  if (error || !store) {
    return { error: "Loja Shopify nao encontrada.", preview: null as ShopifyStorePreview | null }
  }

  if (!store.client_id || !store.client_secret) {
    return {
      error: "A loja conectada ainda nao possui Client ID e Secret validos.",
      preview: null as ShopifyStorePreview | null,
    }
  }

  try {
    const accessToken = await exchangeShopifyAdminToken(
      store.shop_domain,
      store.client_id,
      store.client_secret
    )

    const shopResponse = await fetch(
      `https://${store.shop_domain}/admin/api/${SHOPIFY_STOREFRONT_API_VERSION}/shop.json?fields=name,currency`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        cache: "no-store",
      }
    )
    const shopPayload = await shopResponse.json().catch(() => null)
    if (!shopResponse.ok) {
      throw new Error(
        shopPayload?.errors || shopPayload?.error || "Nao foi possivel ler a moeda da loja."
      )
    }

    const productsResponse = await fetch(
      `https://${store.shop_domain}/admin/api/${SHOPIFY_STOREFRONT_API_VERSION}/products.json?limit=10&status=active&fields=id,title,image,variants`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        cache: "no-store",
      }
    )
    const productsPayload = await productsResponse.json().catch(() => null)
    if (!productsResponse.ok) {
      throw new Error(
        productsPayload?.errors ||
          productsPayload?.error ||
          "Nao foi possivel ler os produtos da loja."
      )
    }

    const products = Array.isArray(productsPayload?.products) ? productsPayload.products : []
    const firstProduct = products.find(
      (product: { title?: string; variants?: Array<{ price?: string; title?: string }> }) =>
        product?.title &&
        Array.isArray(product.variants) &&
        product.variants.some((variant) => Number.parseFloat(variant?.price ?? "") >= 0)
    )

    if (!firstProduct) {
      return { preview: null as ShopifyStorePreview | null }
    }

    const firstVariant =
      (Array.isArray(firstProduct.variants) ? firstProduct.variants : []).find(
        (variant: { price?: string; title?: string }) =>
          Number.isFinite(Number.parseFloat(variant?.price ?? ""))
      ) ?? null

    const amount = Number.parseFloat(firstVariant?.price ?? "0")

    return {
      preview: {
        storeName: shopPayload?.shop?.name || store.name,
        currency: normalizeStoreCurrency(shopPayload?.shop?.currency),
        productName: firstProduct.title,
        variantLabel:
          firstVariant?.title && firstVariant.title !== "Default Title"
            ? firstVariant.title
            : "Variante padrao",
        amount: Number.isFinite(amount) ? amount : 0,
        imageSrc: firstProduct?.image?.src ?? undefined,
      },
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar os produtos reais da Shopify.",
      preview: null as ShopifyStorePreview | null,
    }
  }
}

export async function loadShopifyStorePreviewForSession(input: {
  storeId: string
  accountId: string
  userId: string
}) {
  await assertAccountAccess(input.accountId, input.userId)
  return fetchShopifyStorePreview(input)
}

export async function loadShopifyStorePreviewForPublishing(input: {
  storeId: string
  accountId: string
}) {
  return fetchShopifyStorePreview(input)
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

export async function loadShopifyStoreOptionsForSession(input: { accountId: string; userId: string }) {
  const result = await loadShopifyStoresForSession(input)
  if (result.error) {
    return result
  }

  return {
    stores: result.stores.filter(
      (store) => store.status === "Pronta" || store.status === "Conectada"
    ),
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
      shop_domain: normalizedDomain,
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
      .eq("shop_domain", normalizedDomain)
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
        shopDomain: normalizedDomain,
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
