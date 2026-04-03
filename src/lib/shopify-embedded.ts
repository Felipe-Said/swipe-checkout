export const SHOPIFY_EMBEDDED_PARAM_KEYS = ["shop", "host", "embedded", "shopify_app"] as const

type ShopifyEmbeddedAppConfig = {
  slot: "1" | "2"
  apiKey: string
  secret: string
}

function normalize(value: string | undefined) {
  return (value || "").trim()
}

export function getShopifyEmbeddedAppConfigs(): ShopifyEmbeddedAppConfig[] {
  const primary: ShopifyEmbeddedAppConfig = {
    slot: "1",
    apiKey: normalize(process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || process.env.SHOPIFY_API_KEY),
    secret: normalize(
      process.env.SHOPIFY_API_SECRET ||
        process.env.SHOPIFY_API_SECRET_KEY ||
        process.env.SHOPIFY_APP_SECRET
    ),
  }

  const secondary: ShopifyEmbeddedAppConfig = {
    slot: "2",
    apiKey: normalize(process.env.NEXT_PUBLIC_SHOPIFY_API_KEY_2 || process.env.SHOPIFY_API_KEY_2),
    secret: normalize(
      process.env.SHOPIFY_API_SECRET_2 ||
        process.env.SHOPIFY_API_SECRET_KEY_2 ||
        process.env.SHOPIFY_APP_SECRET_2
    ),
  }

  return [primary, secondary].filter((config) => config.apiKey)
}

export function resolveShopifyEmbeddedSlot(input: { get(name: string): string | null } | null | undefined) {
  const slot = input?.get("shopify_app")
  return slot === "2" ? "2" : "1"
}

export function getShopifyEmbeddedApiKey(slot: "1" | "2" = "1") {
  return getShopifyEmbeddedAppConfigs().find((config) => config.slot === slot)?.apiKey ?? ""
}

export function getShopifyEmbeddedAppSecret(slot: "1" | "2" = "1") {
  return getShopifyEmbeddedAppConfigs().find((config) => config.slot === slot)?.secret ?? ""
}

export function buildEmbeddedPath(
  pathname: string,
  input:
    | URLSearchParams
    | { get(name: string): string | null }
    | null
    | undefined,
  extraParams?: Record<string, string>
) {
  const params = new URLSearchParams()

  for (const key of SHOPIFY_EMBEDDED_PARAM_KEYS) {
    const value = input?.get(key) ?? null
    if (value) {
      params.set(key, value)
    }
  }

  for (const [key, value] of Object.entries(extraParams ?? {})) {
    if (value) {
      params.set(key, value)
    }
  }

  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function hasShopifyEmbeddedParams(input: { get(name: string): string | null } | null | undefined) {
  return Boolean(input?.get("host") || input?.get("embedded") === "1" || input?.get("shop"))
}
