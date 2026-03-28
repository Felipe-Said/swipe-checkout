import { getSupabaseAdmin } from "@/lib/supabase"

const SHOPIFY_ADMIN_API_VERSION = "2026-01"

type ShopifyStoreConnection = {
  id: string
  account_id: string
  name: string
  shop_domain: string
  client_id: string | null
  client_secret: string | null
}

type WhopPaymentLike = {
  id?: string | number | null
  total?: number | null
  amount_after_fees?: number | null
  currency?: string | null
  metadata?: Record<string, unknown> | null
  user?: {
    name?: string | null
    email?: string | null
  } | null
  billing_address?: Record<string, unknown> | null
  shipping_address?: Record<string, unknown> | null
}

type ShopifySyncPayload = {
  payment: WhopPaymentLike
  accountId: string
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

function normalizeMoneyAmount(value?: number | null) {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}

function getStringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : ""
}

function getMetadata(payment: WhopPaymentLike) {
  const metadata = payment.metadata
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? metadata
    : {}
}

function extractAddressField(address: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!address) return ""

  for (const key of keys) {
    const value = getStringValue(address[key])
    if (value) return value
  }

  return ""
}

function buildOrderAddresses(payment: WhopPaymentLike) {
  const billingAddress = payment.billing_address ?? null
  const shippingAddress = payment.shipping_address ?? billingAddress

  const mapAddress = (address: Record<string, unknown> | null | undefined) => {
    if (!address) return undefined

    const address1 = extractAddressField(address, ["address1", "address_1", "line1"])
    const address2 = extractAddressField(address, ["address2", "address_2", "line2"])
    const city = extractAddressField(address, ["city", "locality"])
    const province = extractAddressField(address, ["state", "province", "region"])
    const zip = extractAddressField(address, ["zip", "postal_code", "postcode"])
    const country = extractAddressField(address, ["country", "country_code"])
    const firstName = extractAddressField(address, ["first_name", "firstName"])
    const lastName = extractAddressField(address, ["last_name", "lastName"])
    const phone = extractAddressField(address, ["phone"])

    if (!address1 && !city && !province && !zip && !country) {
      return undefined
    }

    return {
      address1,
      address2: address2 || undefined,
      city: city || undefined,
      province: province || undefined,
      zip: zip || undefined,
      country: country || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phone: phone || undefined,
    }
  }

  return {
    billingAddress: mapAddress(billingAddress),
    shippingAddress: mapAddress(shippingAddress),
  }
}

async function exchangeShopifyAdminToken(store: ShopifyStoreConnection) {
  const response = await fetch(`https://${store.shop_domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: store.client_id,
      client_secret: store.client_secret,
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

async function fetchShopifyAdminGraphQL<TData>(input: {
  shopDomain: string
  accessToken: string
  query: string
  variables?: Record<string, unknown>
}) {
  const response = await fetch(
    `https://${input.shopDomain}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`,
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
        "Nao foi possivel consultar a Shopify."
    )
  }

  return (payload?.data ?? null) as TData | null
}

async function resolveCheckoutAndStore(input: {
  checkoutId?: string
  storeId?: string
  accountId: string
}) {
  const supabaseAdmin = getSupabaseAdmin()

  let checkoutId = input.checkoutId || ""
  let storeId = input.storeId || ""

  if (checkoutId) {
    const { data: checkout } = await supabaseAdmin
      .from("checkouts")
      .select("id, account_id, config")
      .eq("id", checkoutId)
      .eq("account_id", input.accountId)
      .maybeSingle()

    if (checkout?.config && typeof checkout.config === "object" && !Array.isArray(checkout.config)) {
      const selectedStoreId = getStringValue((checkout.config as Record<string, unknown>).selectedStoreId)
      if (!storeId && selectedStoreId) {
        storeId = selectedStoreId
      }
    }
  }

  let store: ShopifyStoreConnection | null = null

  if (storeId) {
    const { data } = await supabaseAdmin
      .from("shopify_stores")
      .select("id, account_id, name, shop_domain, client_id, client_secret")
      .eq("id", storeId)
      .eq("account_id", input.accountId)
      .maybeSingle()

    store = (data as ShopifyStoreConnection | null) ?? null
  }

  if (!store && checkoutId) {
    const { data } = await supabaseAdmin
      .from("shopify_stores")
      .select("id, account_id, name, shop_domain, client_id, client_secret")
      .eq("default_checkout_id", checkoutId)
      .eq("account_id", input.accountId)
      .in("status", ["Pronta", "Conectada"])
      .maybeSingle()

    store = (data as ShopifyStoreConnection | null) ?? null
  }

  return {
    checkoutId: checkoutId || null,
    store,
  }
}

async function createDraftOrder(input: {
  accessToken: string
  store: ShopifyStoreConnection
  payment: WhopPaymentLike
  metadata: Record<string, unknown>
}) {
  const paymentId = getStringValue(input.payment.id)
  const checkoutId = getStringValue(input.metadata.swipeCheckoutId)
  const variantId = normalizeShopifyResourceId(getStringValue(input.metadata.swipeVariantId))
  const productName =
    getStringValue(input.metadata.swipeProductName) ||
    getStringValue(input.metadata.swipeCheckoutName) ||
    "Pedido Swipe"
  const variantLabel = getStringValue(input.metadata.swipeVariantLabel)
  const amount =
    normalizeMoneyAmount(input.payment.total) ||
    normalizeMoneyAmount(input.payment.amount_after_fees)
  const currency = getStringValue(input.payment.currency).toUpperCase() || "BRL"
  const email =
    getStringValue(input.payment.user?.email) ||
    extractAddressField(input.payment.billing_address, ["email"]) ||
    extractAddressField(input.payment.shipping_address, ["email"])
  const customerName =
    getStringValue(input.payment.user?.name) ||
    extractAddressField(input.payment.billing_address, ["name"]) ||
    "Cliente Swipe"
  const { billingAddress, shippingAddress } = buildOrderAddresses(input.payment)

  const lineItems = variantId
    ? [
        {
          variantId: `gid://shopify/ProductVariant/${variantId}`,
          quantity: 1,
        },
      ]
    : [
        {
          title: variantLabel ? `${productName} - ${variantLabel}` : productName,
          originalUnitPrice: amount.toFixed(2),
          quantity: 1,
        },
      ]

  const data = await fetchShopifyAdminGraphQL<{
    draftOrderCreate?: {
      draftOrder?: { id?: string | null } | null
      userErrors?: Array<{ message?: string | null }>
    } | null
  }>({
    shopDomain: input.store.shop_domain,
    accessToken: input.accessToken,
    query: `
      mutation SwipeDraftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            id
          }
          userErrors {
            message
          }
        }
      }
    `,
    variables: {
      input: {
        email: email || undefined,
        note: `Pedido pago via Swipe / Whop (${paymentId || "sem-id"})`,
        presentmentCurrencyCode: currency,
        tags: ["Swipe Checkout", "Whop Payment"],
        customAttributes: [
          { key: "swipe_order_id", value: paymentId || "" },
          { key: "swipe_checkout_id", value: checkoutId || "" },
          { key: "swipe_store_id", value: input.store.id },
        ],
        billingAddress,
        shippingAddress,
        lineItems,
      },
    },
  })

  const userErrors = data?.draftOrderCreate?.userErrors ?? []
  if (userErrors.length > 0) {
    throw new Error(userErrors[0]?.message || "Nao foi possivel criar o draft order na Shopify.")
  }

  const draftOrderId = getStringValue(data?.draftOrderCreate?.draftOrder?.id)
  if (!draftOrderId) {
    throw new Error("A Shopify nao retornou o draft order criado.")
  }

  return {
    draftOrderId,
    customerName,
  }
}

async function completeDraftOrder(input: {
  accessToken: string
  store: ShopifyStoreConnection
  draftOrderId: string
}) {
  const data = await fetchShopifyAdminGraphQL<{
    draftOrderComplete?: {
      draftOrder?: {
        order?: { id?: string | null; name?: string | null } | null
      } | null
      userErrors?: Array<{ message?: string | null }>
    } | null
  }>({
    shopDomain: input.store.shop_domain,
    accessToken: input.accessToken,
    query: `
      mutation SwipeDraftOrderComplete($id: ID!) {
        draftOrderComplete(id: $id) {
          draftOrder {
            order {
              id
              name
            }
          }
          userErrors {
            message
          }
        }
      }
    `,
    variables: {
      id: input.draftOrderId,
    },
  })

  const userErrors = data?.draftOrderComplete?.userErrors ?? []
  if (userErrors.length > 0) {
    throw new Error(userErrors[0]?.message || "Nao foi possivel concluir o pedido na Shopify.")
  }

  const orderId = getStringValue(data?.draftOrderComplete?.draftOrder?.order?.id)
  const orderName = getStringValue(data?.draftOrderComplete?.draftOrder?.order?.name)

  if (!orderId) {
    throw new Error("A Shopify nao retornou o pedido concluido.")
  }

  return {
    orderId,
    orderName,
  }
}

export async function syncPaidWhopOrderToShopify(input: ShopifySyncPayload) {
  const supabaseAdmin = getSupabaseAdmin()
  const metadata = getMetadata(input.payment)
  const paymentId = getStringValue(input.payment.id)

  if (!paymentId) {
    return { skipped: true, reason: "Pagamento da Whop sem id." as const }
  }

  const existingOrderResult = await supabaseAdmin
    .from("orders")
    .select("id, shopify_order_id, shopify_sync_status")
    .eq("id", paymentId)
    .maybeSingle()

  const existingOrder = existingOrderResult.data
  if (existingOrder?.shopify_order_id || existingOrder?.shopify_sync_status === "synced") {
    return { skipped: true, reason: "Pedido ja sincronizado com a Shopify." as const }
  }

  const checkoutId = getStringValue(metadata.swipeCheckoutId)
  const storeId = getStringValue(metadata.swipeStoreId)

  const { store } = await resolveCheckoutAndStore({
    checkoutId,
    storeId,
    accountId: input.accountId,
  })

  if (!store) {
    await supabaseAdmin
      .from("orders")
      .update({
        checkout_id: checkoutId || null,
        shopify_sync_status: "skipped",
        shopify_sync_error: "Nenhuma loja Shopify vinculada a este checkout.",
      })
      .eq("id", paymentId)

    return { skipped: true, reason: "Nenhuma loja Shopify vinculada a este checkout." as const }
  }

  if (!store.client_id || !store.client_secret) {
    await supabaseAdmin
      .from("orders")
      .update({
        checkout_id: checkoutId || null,
        shopify_store_id: store.id,
        shopify_sync_status: "failed",
        shopify_sync_error: "A loja conectada nao possui Client ID e Secret validos.",
      })
      .eq("id", paymentId)

    return { skipped: true, reason: "A loja conectada nao possui Client ID e Secret validos." as const }
  }

  try {
    const accessToken = await exchangeShopifyAdminToken(store)
    const { draftOrderId } = await createDraftOrder({
      accessToken,
      store,
      payment: input.payment,
      metadata,
    })
    const { orderId, orderName } = await completeDraftOrder({
      accessToken,
      store,
      draftOrderId,
    })

    await supabaseAdmin
      .from("orders")
      .update({
        checkout_id: checkoutId || null,
        shopify_store_id: store.id,
        shopify_draft_order_id: draftOrderId,
        shopify_order_id: orderId,
        shopify_order_name: orderName || null,
        shopify_sync_status: "synced",
        shopify_sync_error: null,
      })
      .eq("id", paymentId)

    return {
      success: true,
      storeId: store.id,
      shopifyOrderId: orderId,
      shopifyOrderName: orderName || null,
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nao foi possivel criar o pedido pago na Shopify."

    await supabaseAdmin
      .from("orders")
      .update({
        checkout_id: checkoutId || null,
        shopify_store_id: store.id,
        shopify_sync_status: "failed",
        shopify_sync_error: message,
      })
      .eq("id", paymentId)

    return {
      error: message,
    }
  }
}
