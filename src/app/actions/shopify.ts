"use server"

import { getSupabaseAdmin } from "@/lib/supabase"
import { requireServerAppSession } from "@/lib/server-app-session"
import { normalizeShopDomain, type ConnectedShopifyStore } from "@/lib/shopify-store-data"
import type { StoreCatalogProduct } from "@/lib/catalog-products"

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

type ShopifyAdminProductPreviewResult = {
  storeName: string
  currency: ShopifyStorePreviewCurrency
  productName: string
  variantLabel: string
  amount: number
  imageSrc?: string
} | null

type ShopifyStoreCatalogResult = {
  storeName: string
  currency: ShopifyStorePreviewCurrency
  products: StoreCatalogProduct[]
}

function normalizeShopifyResourceId(value?: string | null) {
  if (!value) return ""
  const trimmed = String(value).trim()
  if (!trimmed) return ""

  const gidMatch = trimmed.match(/(\d+)(?:\D*)$/)
  if (trimmed.startsWith("gid://") && gidMatch) {
    return gidMatch[1]
  }

  return trimmed
}

function resolveProductImage(
  product:
    | {
        image?: { src?: string | null } | null
        images?: Array<{ id?: number | null; src?: string | null }> | null
      }
    | null
    | undefined,
  variantImageId?: number | null
) {
  const images = Array.isArray(product?.images) ? product.images : []
  if (variantImageId) {
    const variantImage = images.find((image) => image?.id === variantImageId && image?.src)
    if (variantImage?.src) {
      return variantImage.src
    }
  }

  return product?.image?.src ?? images.find((image) => image?.src)?.src ?? undefined
}

async function fetchShopifyAdminGraphQL<TData>(input: {
  shopDomain: string
  accessToken: string
  query: string
  variables?: Record<string, unknown>
}) {
  const response = await fetch(
    `https://${input.shopDomain}/admin/api/${SHOPIFY_STOREFRONT_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": input.accessToken,
      },
      body: JSON.stringify({
        query: input.query,
        variables: input.variables ?? {},
      }),
      cache: "no-store",
    }
  )

  const payload = await response.json().catch(() => null)
  const errors = Array.isArray(payload?.errors) ? payload.errors : []

  if (!response.ok || errors.length > 0) {
    throw new Error(
      errors[0]?.message ||
        payload?.message ||
        "Nao foi possivel consultar os dados da Shopify."
    )
  }

  return (payload?.data ?? null) as TData | null
}

function parseShopifyMoneyAmount(value?: string | null) {
  const amount = Number.parseFloat(value ?? "")
  return Number.isFinite(amount) ? amount : 0
}

function mapGraphQLPreview(input: {
  storeName?: string | null
  currency?: string | null
  productName?: string | null
  variantLabel?: string | null
  amount?: string | null
  imageSrc?: string | null
}): ShopifyStorePreview | null {
  if (!input.productName) {
    return null
  }

  return {
    storeName: input.storeName || "Loja Shopify",
    currency: normalizeStoreCurrency(input.currency),
    productName: input.productName,
    variantLabel:
      input.variantLabel && input.variantLabel !== "Default Title"
        ? input.variantLabel
        : "Variante padrao",
    amount: parseShopifyMoneyAmount(input.amount),
    imageSrc: input.imageSrc ?? undefined,
  }
}

async function fetchShopifyGraphQLStorePreview(input: {
  shopDomain: string
  accessToken: string
}) {
  const data = await fetchShopifyAdminGraphQL<{
    shop?: { name?: string | null; currencyCode?: string | null } | null
    products?: {
      nodes?: Array<{
        title?: string | null
        featuredImage?: { url?: string | null } | null
        variants?: {
          nodes?: Array<{
            title?: string | null
            price?: string | null
            image?: { url?: string | null } | null
          }>
        } | null
      }>
    } | null
  }>({
    shopDomain: input.shopDomain,
    accessToken: input.accessToken,
    query: `
      query SwipeStorePreview {
        shop {
          name
          currencyCode
        }
        products(first: 10, query: "status:active") {
          nodes {
            title
            featuredImage {
              url
            }
            variants(first: 10) {
              nodes {
                title
                price
                image {
                  url
                }
              }
            }
          }
        }
      }
    `,
  })

  const products = Array.isArray(data?.products?.nodes) ? data!.products!.nodes! : []
  const product = products.find(
    (item) =>
      item?.title &&
      Array.isArray(item?.variants?.nodes) &&
      item.variants.nodes.some((variant) => parseShopifyMoneyAmount(variant?.price) >= 0)
  )

  if (!product) {
    return null
  }

  const variant =
    product.variants?.nodes?.find((item) => parseShopifyMoneyAmount(item?.price) >= 0) ?? null

  return mapGraphQLPreview({
    storeName: data?.shop?.name,
    currency: data?.shop?.currencyCode,
    productName: product.title,
    variantLabel: variant?.title,
    amount: variant?.price,
    imageSrc: variant?.image?.url ?? product.featuredImage?.url ?? null,
  })
}

async function fetchShopifyGraphQLVariantPreview(input: {
  shopDomain: string
  accessToken: string
  variantId: string
}) {
  const gid = `gid://shopify/ProductVariant/${normalizeShopifyResourceId(input.variantId)}`
  const data = await fetchShopifyAdminGraphQL<{
    shop?: { name?: string | null; currencyCode?: string | null } | null
    productVariant?: {
      title?: string | null
      price?: string | null
      image?: { url?: string | null } | null
      product?: {
        title?: string | null
        featuredImage?: { url?: string | null } | null
      } | null
    } | null
  }>({
    shopDomain: input.shopDomain,
    accessToken: input.accessToken,
    query: `
      query SwipeVariantPreview($id: ID!) {
        shop {
          name
          currencyCode
        }
        productVariant(id: $id) {
          title
          price
          image {
            url
          }
          product {
            title
            featuredImage {
              url
            }
          }
        }
      }
    `,
    variables: {
      id: gid,
    },
  })

  if (!data?.productVariant?.product?.title) {
    return null
  }

  return mapGraphQLPreview({
    storeName: data?.shop?.name,
    currency: data?.shop?.currencyCode,
    productName: data?.productVariant?.product?.title,
    variantLabel: data?.productVariant?.title,
    amount: data?.productVariant?.price,
    imageSrc:
      data?.productVariant?.image?.url ??
      data?.productVariant?.product?.featuredImage?.url ??
      null,
  })
}

async function fetchShopifyGraphQLProductPreview(input: {
  shopDomain: string
  accessToken: string
  productId: string
  variantId?: string
}) {
  const gid = `gid://shopify/Product/${normalizeShopifyResourceId(input.productId)}`
  const normalizedVariantId = normalizeShopifyResourceId(input.variantId)
  const data = await fetchShopifyAdminGraphQL<{
    shop?: { name?: string | null; currencyCode?: string | null } | null
    product?: {
      title?: string | null
      featuredImage?: { url?: string | null } | null
      variants?: {
        nodes?: Array<{
          legacyResourceId?: string | null
          title?: string | null
          price?: string | null
          image?: { url?: string | null } | null
        }>
      } | null
    } | null
  }>({
    shopDomain: input.shopDomain,
    accessToken: input.accessToken,
    query: `
      query SwipeProductPreview($id: ID!) {
        shop {
          name
          currencyCode
        }
        product(id: $id) {
          title
          featuredImage {
            url
          }
          variants(first: 50) {
            nodes {
              legacyResourceId
              title
              price
              image {
                url
              }
            }
          }
        }
      }
    `,
    variables: {
      id: gid,
    },
  })

  if (!data?.product?.title) {
    return null
  }

  const variants = Array.isArray(data?.product?.variants?.nodes) ? data!.product!.variants!.nodes! : []
  const selectedVariant =
    variants.find(
      (item) =>
        String(item?.legacyResourceId ?? "") === normalizedVariantId &&
        parseShopifyMoneyAmount(item?.price) >= 0
    ) ??
    variants.find((item) => parseShopifyMoneyAmount(item?.price) >= 0) ??
    null

  return mapGraphQLPreview({
    storeName: data?.shop?.name,
    currency: data?.shop?.currencyCode,
    productName: data?.product?.title,
    variantLabel: selectedVariant?.title,
    amount: selectedVariant?.price,
    imageSrc: selectedVariant?.image?.url ?? data?.product?.featuredImage?.url ?? null,
  })
}

async function assertAccountAccess(accountId: string, userId: string) {
  const actor = await requireServerAppSession(userId)
  const supabaseAdmin = getSupabaseAdmin()
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", actor.userId)
    .maybeSingle()

  const isAdmin = profile?.role === "admin"

  let query = supabaseAdmin
    .from("managed_accounts")
    .select("id, profile_id")
    .eq("id", accountId)

  if (!isAdmin) {
    query = query.eq("profile_id", actor.userId)
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
    defaultCheckoutId: db.default_checkout_id ?? "",
    skipCartRedirect: Boolean(db.skip_cart_redirect),
    scriptTagId: db.script_tag_id ?? "",
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
    const preview = await fetchShopifyGraphQLStorePreview({
      shopDomain: store.shop_domain,
      accessToken,
    })

    return {
      preview,
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

async function fetchShopifyStoreCatalog(input: {
  storeId: string
  accountId: string
  limit?: number
}) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: store, error } = await supabaseAdmin
    .from("shopify_stores")
    .select("id, account_id, name, shop_domain, client_id, client_secret")
    .eq("account_id", input.accountId)
    .eq("id", input.storeId)
    .maybeSingle()

  if (error || !store) {
    return {
      error: "Loja Shopify nao encontrada.",
      catalog: null as ShopifyStoreCatalogResult | null,
    }
  }

  try {
    const accessToken = await exchangeShopifyAdminToken(
      store.shop_domain,
      store.client_id,
      store.client_secret
    )

    const data = await fetchShopifyAdminGraphQL<{
      shop?: { name?: string | null; currencyCode?: string | null } | null
      products?: {
        nodes?: Array<{
          legacyResourceId?: string | null
          title?: string | null
          featuredImage?: { url?: string | null } | null
          variants?: {
            nodes?: Array<{
              legacyResourceId?: string | null
              title?: string | null
              price?: string | null
              image?: { url?: string | null } | null
            }>
          } | null
        }>
      } | null
    }>({
      shopDomain: store.shop_domain,
      accessToken,
      query: `
        query SwipeStoreCatalog($first: Int!) {
          shop {
            name
            currencyCode
          }
          products(first: $first, query: "status:active") {
            nodes {
              legacyResourceId
              title
              featuredImage {
                url
              }
              variants(first: 10) {
                nodes {
                  legacyResourceId
                  title
                  price
                  image {
                    url
                  }
                }
              }
            }
          }
        }
      `,
      variables: {
        first: Math.min(Math.max(input.limit ?? 12, 1), 30),
      },
    })

    const currency = normalizeStoreCurrency(data?.shop?.currencyCode)
    const products = (Array.isArray(data?.products?.nodes) ? data!.products!.nodes! : [])
      .map((product) => {
        const variants = Array.isArray(product?.variants?.nodes) ? product.variants.nodes : []
        const selectedVariant =
          variants.find((variant) => parseShopifyMoneyAmount(variant?.price) >= 0) ?? null

        if (!product?.legacyResourceId || !product?.title || !selectedVariant) {
          return null
        }

        return {
          id: String(product.legacyResourceId),
          storeId: store.id,
          storeName: store.name,
          title: product.title,
          variantLabel:
            selectedVariant.title && selectedVariant.title !== "Default Title"
              ? selectedVariant.title
              : "Variante padrao",
          price: parseShopifyMoneyAmount(selectedVariant.price),
          currency,
          imageSrc:
            selectedVariant.image?.url ??
            product.featuredImage?.url ??
            "",
        } satisfies StoreCatalogProduct
      })
      .filter((product): product is StoreCatalogProduct => Boolean(product))

    return {
      catalog: {
        storeName: data?.shop?.name || store.name,
        currency,
        products,
      },
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar os produtos da Shopify.",
      catalog: null as ShopifyStoreCatalogResult | null,
    }
  }
}

async function fetchPublishingStoreById(storeId: string) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: store, error } = await supabaseAdmin
    .from("shopify_stores")
    .select("id, account_id, name, shop_domain, client_id, client_secret, status")
    .eq("id", storeId)
    .in("status", ["Pronta", "Conectada"])
    .maybeSingle()

  if (error || !store) {
    return null
  }

  return store
}

async function fetchShopifyStorePreviewByDomain(input: { shopDomain: string; accountId: string }) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: store, error } = await supabaseAdmin
    .from("shopify_stores")
    .select("id")
    .eq("account_id", input.accountId)
    .eq("shop_domain", normalizeShopDomain(input.shopDomain))
    .in("status", ["Pronta", "Conectada"])
    .maybeSingle()

  if (error || !store?.id) {
    return { error: "Loja Shopify nao encontrada.", preview: null as ShopifyStorePreview | null }
  }

  return fetchShopifyStorePreview({ storeId: store.id, accountId: input.accountId })
}

async function fetchShopifyVariantPreview(input: {
  storeId: string
  accountId: string
  variantId: string
  productId?: string
}) {
  const normalizedVariantId = normalizeShopifyResourceId(input.variantId)
  if (!normalizedVariantId) {
    return input.productId
      ? fetchShopifyProductPreview({
          storeId: input.storeId,
          accountId: input.accountId,
          productId: input.productId,
        })
      : fetchShopifyStorePreview({ storeId: input.storeId, accountId: input.accountId })
  }

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
    const preview = await fetchShopifyGraphQLVariantPreview({
      shopDomain: store.shop_domain,
      accessToken,
      variantId: normalizedVariantId,
    })

    if (!preview) {
      return input.productId
        ? fetchShopifyProductPreview({
            storeId: input.storeId,
            accountId: input.accountId,
            productId: input.productId,
            variantId: normalizedVariantId,
          })
        : fetchShopifyStorePreview({ storeId: input.storeId, accountId: input.accountId })
    }

    return {
      preview,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar o produto real da Shopify.",
      preview: null as ShopifyStorePreview | null,
    }
  }
}

async function fetchShopifyProductPreview(input: {
  storeId: string
  accountId: string
  productId: string
  variantId?: string
}) {
  const normalizedProductId = normalizeShopifyResourceId(input.productId)
  if (!normalizedProductId) {
    return fetchShopifyStorePreview({ storeId: input.storeId, accountId: input.accountId })
  }

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
    const preview = await fetchShopifyGraphQLProductPreview({
      shopDomain: store.shop_domain,
      accessToken,
      productId: normalizedProductId,
      variantId: input.variantId,
    })

    if (!preview) {
      return fetchShopifyStorePreview({ storeId: input.storeId, accountId: input.accountId })
    }

    return {
      preview,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar o produto real da Shopify.",
      preview: null as ShopifyStorePreview | null,
    }
  }
}

async function fetchShopifyProductPreviewByDomain(input: {
  shopDomain: string
  accountId: string
  productId: string
  variantId?: string
}) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: store, error } = await supabaseAdmin
    .from("shopify_stores")
    .select("id")
    .eq("account_id", input.accountId)
    .eq("shop_domain", normalizeShopDomain(input.shopDomain))
    .in("status", ["Pronta", "Conectada"])
    .maybeSingle()

  if (error || !store?.id) {
    return { error: "Loja Shopify nao encontrada.", preview: null as ShopifyStorePreview | null }
  }

  return fetchShopifyProductPreview({
    storeId: store.id,
    accountId: input.accountId,
    productId: input.productId,
    variantId: input.variantId,
  })
}

async function fetchShopifyVariantPreviewByDomain(input: {
  shopDomain: string
  accountId: string
  variantId: string
  productId?: string
}) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: store, error } = await supabaseAdmin
    .from("shopify_stores")
    .select("id")
    .eq("account_id", input.accountId)
    .eq("shop_domain", normalizeShopDomain(input.shopDomain))
    .in("status", ["Pronta", "Conectada"])
    .maybeSingle()

  if (error || !store?.id) {
    return { error: "Loja Shopify nao encontrada.", preview: null as ShopifyStorePreview | null }
  }

  return fetchShopifyVariantPreview({
    storeId: store.id,
    accountId: input.accountId,
    variantId: input.variantId,
    productId: input.productId,
  })
}

export async function loadShopifyStorePreviewForSession(input: {
  storeId: string
  accountId: string
  userId: string
}) {
  await assertAccountAccess(input.accountId, input.userId)
  return fetchShopifyStorePreview(input)
}

export async function loadShopifyStoreCatalogForSession(input: {
  storeId: string
  accountId: string
  userId: string
  limit?: number
}) {
  await assertAccountAccess(input.accountId, input.userId)
  return fetchShopifyStoreCatalog(input)
}

export async function loadShopifyStorePreviewForPublishing(input: {
  storeId: string
  accountId: string
}) {
  return fetchShopifyStorePreview(input)
}

export async function loadShopifyStorePreviewForPublicCheckout(input: {
  storeId: string
}) {
  const store = await fetchPublishingStoreById(input.storeId)

  if (!store) {
    return { error: "Loja Shopify nao encontrada.", preview: null as ShopifyStorePreview | null }
  }

  return fetchShopifyStorePreview({
    storeId: store.id,
    accountId: store.account_id,
  })
}

export async function loadShopifyStorePreviewByDomainForPublishing(input: {
  shopDomain: string
  accountId: string
}) {
  return fetchShopifyStorePreviewByDomain(input)
}

export async function loadShopifyVariantPreviewForPublishing(input: {
  storeId: string
  accountId: string
  variantId: string
  productId?: string
}) {
  return fetchShopifyVariantPreview(input)
}

export async function loadShopifyVariantPreviewForPublicCheckout(input: {
  storeId: string
  variantId: string
  productId?: string
}) {
  const store = await fetchPublishingStoreById(input.storeId)

  if (!store) {
    return { error: "Loja Shopify nao encontrada.", preview: null as ShopifyStorePreview | null }
  }

  return fetchShopifyVariantPreview({
    storeId: store.id,
    accountId: store.account_id,
    variantId: input.variantId,
    productId: input.productId,
  })
}

export async function loadShopifyVariantPreviewByDomainForPublishing(input: {
  shopDomain: string
  accountId: string
  variantId: string
  productId?: string
}) {
  return fetchShopifyVariantPreviewByDomain(input)
}

export async function loadShopifyProductPreviewForPublishing(input: {
  storeId: string
  accountId: string
  productId: string
  variantId?: string
}) {
  return fetchShopifyProductPreview(input)
}

export async function loadShopifyProductPreviewForPublicCheckout(input: {
  storeId: string
  productId: string
  variantId?: string
}) {
  const store = await fetchPublishingStoreById(input.storeId)

  if (!store) {
    return { error: "Loja Shopify nao encontrada.", preview: null as ShopifyStorePreview | null }
  }

  return fetchShopifyProductPreview({
    storeId: store.id,
    accountId: store.account_id,
    productId: input.productId,
    variantId: input.variantId,
  })
}

export async function loadShopifyProductPreviewByDomainForPublishing(input: {
  shopDomain: string
  accountId: string
  productId: string
  variantId?: string
}) {
  return fetchShopifyProductPreviewByDomain(input)
}

export async function loadShopifyStoresForSession(input: { accountId: string; userId: string }) {
  await assertAccountAccess(input.accountId, input.userId)

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from("shopify_stores")
    .select(
      "id, name, shop_domain, storefront_token, default_checkout_id, skip_cart_redirect, script_tag_id, checkout_type, status, product_count, variant_count, last_sync"
    )
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

    const { data: existing } = await supabaseAdmin
      .from("shopify_stores")
      .select("id, default_checkout_id, skip_cart_redirect, script_tag_id")
      .eq("account_id", input.accountId)
      .eq("shop_domain", normalizedDomain)
      .maybeSingle()

    const storeId = existing?.id ?? crypto.randomUUID()
    const payload = {
      id: storeId,
      account_id: input.accountId,
      name: input.storeName.trim(),
      shop_domain: normalizedDomain,
      storefront_token: "",
      client_id: input.clientId.trim(),
      client_secret: input.clientSecret.trim(),
      default_checkout_id: existing?.default_checkout_id ?? null,
      skip_cart_redirect: existing?.skip_cart_redirect ?? false,
      script_tag_id: existing?.script_tag_id ?? "",
      checkout_type: "Shopify Hosted Checkout",
      status: "Pronta",
      product_count: probe.productCount,
      variant_count: probe.variantCount,
      last_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

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
    .select("id, account_id, shop_domain, storefront_token, client_id, client_secret, script_tag_id")
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
        script_tag_id: store.script_tag_id ?? "",
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

export async function updateShopifyStoreBehavior(input: {
  storeId: string
  accountId: string
  userId: string
  defaultCheckoutId: string
  skipCartRedirect: boolean
}) {
  await assertAccountAccess(input.accountId, input.userId)

  const supabaseAdmin = getSupabaseAdmin()
  const { data: store, error } = await supabaseAdmin
    .from("shopify_stores")
    .select("id, account_id, shop_domain, client_id, client_secret, script_tag_id")
    .eq("id", input.storeId)
    .eq("account_id", input.accountId)
    .maybeSingle()

  if (error || !store) {
    return { error: "Loja nao encontrada." }
  }

  if (!input.defaultCheckoutId) {
    return { error: "Selecione um checkout padrao para ativar o redirecionamento." }
  }

  try {
    const { error: updateError } = await supabaseAdmin
      .from("shopify_stores")
      .update({
        default_checkout_id: input.defaultCheckoutId,
        skip_cart_redirect: input.skipCartRedirect,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.storeId)

    if (updateError) {
      return { error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar o comportamento da loja.",
    }
  }
}
