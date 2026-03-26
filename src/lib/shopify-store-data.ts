export type ConnectedShopifyStore = {
  id: string
  name: string
  shopDomain: string
  storefrontToken: string
  checkoutType: "Shopify Hosted Checkout"
  status: "Conectada" | "Em configuracao" | "Sincronizando" | "Aguardando autorização" | "Atenção necessária" | "Falha" | "Pronta"
  productCount?: number
  variantCount?: number
  lastSync?: string
}

const STORAGE_KEY = "swipe-connected-shopify-stores"

export const defaultConnectedShopifyStores: ConnectedShopifyStore[] = [
  {
    id: "shopify-1",
    name: "Aurora Store",
    shopDomain: "aurora-demo.myshopify.com",
    storefrontToken: "shptka_aurora_demo_public",
    checkoutType: "Shopify Hosted Checkout",
    status: "Conectada",
    productCount: 124,
    variantCount: 450,
    lastSync: "25/03/2026 04:30",
  },
  {
    id: "shopify-2",
    name: "Atlas Shop",
    shopDomain: "atlas-labs.myshopify.com",
    storefrontToken: "shptka_atlas_demo_public",
    checkoutType: "Shopify Hosted Checkout",
    status: "Em configuracao",
    productCount: 0,
    variantCount: 0,
  },
]

export function normalizeShopDomain(value: string) {
  const normalized = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "")
  return normalized.endsWith(".myshopify.com") ? normalized : `${normalized}.myshopify.com`
}

export function readConnectedShopifyStores(): ConnectedShopifyStore[] {
  if (typeof window === "undefined") {
    return defaultConnectedShopifyStores
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultConnectedShopifyStores))
      return defaultConnectedShopifyStores
    }

    const parsed = JSON.parse(raw) as ConnectedShopifyStore[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultConnectedShopifyStores
  } catch {
    return defaultConnectedShopifyStores
  }
}

export function writeConnectedShopifyStores(stores: ConnectedShopifyStore[]) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stores))
}
