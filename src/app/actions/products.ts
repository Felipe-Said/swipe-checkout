"use server"

import { getSupabaseAdmin } from "@/lib/supabase"
import type { CatalogProduct, CatalogProductCurrency, CatalogProductStatus } from "@/lib/catalog-products"
import { loadShopifyStoreCatalogForSession, loadShopifyStoresForSession } from "@/app/actions/shopify"

type ProductInput = {
  id?: string
  accountId: string
  userId: string
  name: string
  variantLabel?: string
  description?: string
  price: number
  currency: CatalogProductCurrency
  imageSrc?: string
  status: CatalogProductStatus
}

function slugifyProductName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

async function assertProductAccountAccess(accountId: string, userId: string) {
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

function mapCatalogProduct(row: any): CatalogProduct {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name ?? "Produto",
    slug: row.slug ?? "",
    variantLabel: row.variant_label ?? "",
    description: row.description ?? "",
    price: Number(row.price ?? 0),
    currency:
      row.currency === "USD" || row.currency === "EUR" || row.currency === "GBP"
        ? row.currency
        : "BRL",
    imageSrc: row.image_src ?? "",
    status: row.status === "draft" ? "draft" : "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function loadManualProductsFromDb(accountId: string) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from("catalog_products")
    .select("id, account_id, name, slug, variant_label, description, price, currency, image_src, status, created_at, updated_at")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })

  if (error) {
    if (error.message.toLowerCase().includes("catalog_products")) {
      return { products: [] as CatalogProduct[] }
    }

    return { error: error.message, products: [] as CatalogProduct[] }
  }

  return {
    products: (data ?? []).map(mapCatalogProduct),
  }
}

export async function loadManualProductsForSession(input: { accountId: string; userId: string }) {
  await assertProductAccountAccess(input.accountId, input.userId)
  return loadManualProductsFromDb(input.accountId)
}

export async function loadProductsHubData(input: { accountId: string; userId: string }) {
  await assertProductAccountAccess(input.accountId, input.userId)

  const [manualProductsResult, storesResult] = await Promise.all([
    loadManualProductsFromDb(input.accountId),
    loadShopifyStoresForSession({ accountId: input.accountId, userId: input.userId }),
  ])

  const activeStores = (storesResult.stores ?? []).filter(
    (store) => store.status === "Pronta" || store.status === "Conectada"
  )

  const catalogs = await Promise.all(
    activeStores.map(async (store) => {
      const result = await loadShopifyStoreCatalogForSession({
        storeId: store.id,
        accountId: input.accountId,
        userId: input.userId,
        limit: 12,
      })

      return {
        store,
        products: result.catalog?.products ?? [],
        error: result.error ?? "",
      }
    })
  )

  return {
    manualProducts: manualProductsResult.products ?? [],
    manualProductsError: manualProductsResult.error ?? "",
    storeCatalogs: catalogs,
  }
}

export async function saveManualProductForSession(input: ProductInput) {
  await assertProductAccountAccess(input.accountId, input.userId)

  const cleanName = input.name.trim()
  if (!cleanName) {
    return { error: "Nome do produto e obrigatorio." }
  }

  if (!(Number.isFinite(input.price) && input.price >= 0)) {
    return { error: "Preco invalido." }
  }

  const supabaseAdmin = getSupabaseAdmin()
  const payload = {
    account_id: input.accountId,
    name: cleanName,
    slug: slugifyProductName(cleanName) || `produto-${Date.now()}`,
    variant_label: input.variantLabel?.trim() || "",
    description: input.description?.trim() || "",
    price: Number(input.price),
    currency: input.currency,
    image_src: input.imageSrc?.trim() || "",
    status: input.status,
    updated_at: new Date().toISOString(),
  }

  const query = input.id
    ? supabaseAdmin
        .from("catalog_products")
        .update(payload)
        .eq("id", input.id)
        .eq("account_id", input.accountId)
        .select("id, account_id, name, slug, variant_label, description, price, currency, image_src, status, created_at, updated_at")
        .single()
    : supabaseAdmin
        .from("catalog_products")
        .insert(payload)
        .select("id, account_id, name, slug, variant_label, description, price, currency, image_src, status, created_at, updated_at")
        .single()

  const { data, error } = await query

  if (error) {
    if (error.message.toLowerCase().includes("catalog_products")) {
      return { error: "A tabela de produtos ainda nao foi criada no Supabase." }
    }

    return { error: error.message }
  }

  return {
    success: true,
    product: mapCatalogProduct(data),
  }
}

export async function deleteManualProductForSession(input: {
  id: string
  accountId: string
  userId: string
}) {
  await assertProductAccountAccess(input.accountId, input.userId)

  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin
    .from("catalog_products")
    .delete()
    .eq("id", input.id)
    .eq("account_id", input.accountId)

  if (error) {
    if (error.message.toLowerCase().includes("catalog_products")) {
      return { error: "A tabela de produtos ainda nao foi criada no Supabase." }
    }

    return { error: error.message }
  }

  return { success: true }
}
