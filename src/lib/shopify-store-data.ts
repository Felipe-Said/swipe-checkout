import { supabase } from "./supabase"

export type ConnectedShopifyStore = {
  id: string
  name: string
  shopDomain: string
  storefrontToken: string
  clientId?: string
  clientSecret?: string
  defaultCheckoutId?: string
  skipCartRedirect?: boolean
  scriptTagId?: string
  checkoutType: "Shopify Hosted Checkout"
  status:
    | "Conectada"
    | "Em configuracao"
    | "Sincronizando"
    | "Aguardando autorizacao"
    | "Atencao necessaria"
    | "Falha"
    | "Pronta"
  productCount?: number
  variantCount?: number
  lastSync?: string
}

export function normalizeShopDomain(value: string) {
  const normalized = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "")
  return normalized.endsWith(".myshopify.com") ? normalized : `${normalized}.myshopify.com`
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

export async function getConnectedShopifyStores(accountId: string) {
  const { data, error } = await supabase
    .from("shopify_stores")
    .select(
      "id, name, shop_domain, storefront_token, default_checkout_id, skip_cart_redirect, script_tag_id, checkout_type, status, product_count, variant_count, last_sync"
    )
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching Shopify stores:", error)
    return []
  }

  return (data ?? []).map(mapDbToStore)
}

export async function addConnectedShopifyStore(input: {
  accountId: string
  name: string
  shopDomain: string
  storefrontToken?: string
  status?: ConnectedShopifyStore["status"]
  productCount?: number
  variantCount?: number
  lastSync?: string
}) {
  const { error } = await supabase.from("shopify_stores").insert({
    account_id: input.accountId,
    name: input.name,
    shop_domain: normalizeShopDomain(input.shopDomain),
    storefront_token: input.storefrontToken ?? "",
    checkout_type: "Shopify Hosted Checkout",
    status: input.status ?? "Conectada",
    product_count: input.productCount ?? 0,
    variant_count: input.variantCount ?? 0,
    last_sync: input.lastSync ? new Date(input.lastSync).toISOString() : new Date().toISOString(),
  })

  if (error) throw error
}

export async function updateConnectedShopifyStore(
  id: string,
  updates: Partial<ConnectedShopifyStore>
) {
  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.shopDomain !== undefined) dbUpdates.shop_domain = normalizeShopDomain(updates.shopDomain)
  if (updates.storefrontToken !== undefined) dbUpdates.storefront_token = updates.storefrontToken
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.productCount !== undefined) dbUpdates.product_count = updates.productCount
  if (updates.variantCount !== undefined) dbUpdates.variant_count = updates.variantCount
  if (updates.lastSync !== undefined) dbUpdates.last_sync = new Date(updates.lastSync).toISOString()
  dbUpdates.updated_at = new Date().toISOString()

  const { error } = await supabase.from("shopify_stores").update(dbUpdates).eq("id", id)

  if (error) throw error
}

export async function deleteConnectedShopifyStore(id: string) {
  const { error } = await supabase.from("shopify_stores").delete().eq("id", id)
  if (error) throw error
}

// Legacy exports kept to avoid breaking older imports during migration.
export function readConnectedShopifyStores(): ConnectedShopifyStore[] {
  return []
}

export function writeConnectedShopifyStores(_stores: ConnectedShopifyStore[]) {}
