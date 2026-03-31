export const SHOPIFY_EMBEDDED_PARAM_KEYS = ["shop", "host", "embedded"] as const

export function getShopifyEmbeddedApiKey() {
  return (
    process.env.NEXT_PUBLIC_SHOPIFY_API_KEY ||
    process.env.SHOPIFY_API_KEY ||
    ""
  ).trim()
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
