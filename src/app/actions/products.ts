"use server"

import crypto from "crypto"

import { getSupabaseAdmin } from "@/lib/supabase"
import type {
  CatalogProduct,
  CatalogProductCurrency,
  CatalogProductStatus,
  CatalogProductVariant,
} from "@/lib/catalog-products"
import { loadShopifyStoreCatalogForSession, loadShopifyStoresForSession } from "@/app/actions/shopify"

type ProductInput = {
  id?: string
  accountId: string
  userId: string
  name: string
  optionName?: string
  variantLabel?: string
  variants?: CatalogProductVariant[]
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

function createCatalogVariantId() {
  return crypto.randomUUID()
}

function normalizeCatalogVariant(
  variant: Partial<CatalogProductVariant> | null | undefined,
  fallbackPrice: number,
  fallbackImageSrc: string
): CatalogProductVariant | null {
  const name = String(variant?.name ?? "").trim()
  if (!name) {
    return null
  }

  const parsedPrice = Number(variant?.price)
  const normalizedPrice =
    Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : Math.max(fallbackPrice, 0)

  return {
    id: String(variant?.id || createCatalogVariantId()),
    name,
    price: normalizedPrice,
    imageSrc: String(variant?.imageSrc ?? fallbackImageSrc ?? "").trim(),
  }
}

function resolveCatalogProductVariants(row: any): CatalogProductVariant[] {
  const rawVariants = Array.isArray(row?.variants) ? row.variants : []
  const normalized = rawVariants
    .map((item: unknown) =>
      normalizeCatalogVariant(
        item as Partial<CatalogProductVariant> | null | undefined,
        Number(row?.price ?? 0),
        String(row?.image_src ?? "")
      )
    )
    .filter((variant: CatalogProductVariant | null): variant is CatalogProductVariant => Boolean(variant))

  if (normalized.length > 0) {
    return normalized
  }

  const legacyVariantLabel = String(row?.variant_label ?? "").trim()
  return [
    {
      id: createCatalogVariantId(),
      name: legacyVariantLabel || "Padrao",
      price: Number(row?.price ?? 0),
      imageSrc: String(row?.image_src ?? "").trim(),
    },
  ]
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
  const variants = resolveCatalogProductVariants(row)
  const primaryVariant = variants[0]

  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name ?? "Produto",
    slug: row.slug ?? "",
    optionName: row.option_name ?? "Variante",
    variantLabel: row.variant_label ?? primaryVariant?.name ?? "",
    variants,
    description: row.description ?? "",
    price: primaryVariant?.price ?? Number(row.price ?? 0),
    currency:
      row.currency === "USD" || row.currency === "EUR" || row.currency === "GBP"
        ? row.currency
        : "BRL",
    imageSrc: row.image_src ?? primaryVariant?.imageSrc ?? "",
    status: row.status === "draft" ? "draft" : "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function loadManualProductsFromDb(accountId: string) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from("catalog_products")
    .select("id, account_id, name, slug, option_name, variant_label, variants, description, price, currency, image_src, status, created_at, updated_at")
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

  const [manualProductsResult, storesResult, checkoutsResult] = await Promise.all([
    loadManualProductsFromDb(input.accountId),
    loadShopifyStoresForSession({ accountId: input.accountId, userId: input.userId }),
    getSupabaseAdmin()
      .from("checkouts")
      .select("id, account_id, status, config")
      .eq("account_id", input.accountId)
      .eq("status", "Ativo")
      .order("created_at", { ascending: false }),
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

  const checkoutIdsByProductId: Record<string, string> = {}
  for (const checkout of checkoutsResult.data ?? []) {
    const config =
      checkout.config && typeof checkout.config === "object" && !Array.isArray(checkout.config)
        ? (checkout.config as { selectedProductId?: unknown })
        : null
    const selectedProductId =
      config && typeof config.selectedProductId === "string" ? config.selectedProductId : ""

    if (selectedProductId && !checkoutIdsByProductId[selectedProductId]) {
      checkoutIdsByProductId[selectedProductId] = checkout.id
    }
  }

  return {
    manualProducts: manualProductsResult.products ?? [],
    manualProductsError: manualProductsResult.error ?? "",
    storeCatalogs: catalogs,
    checkoutIdsByProductId,
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

  const variants = (input.variants ?? [])
    .map((variant) => normalizeCatalogVariant(variant, Number(input.price), input.imageSrc?.trim() || ""))
    .filter((variant): variant is CatalogProductVariant => Boolean(variant))

  if (variants.length === 0) {
    return { error: "Adicione pelo menos uma variante." }
  }

  const primaryVariant = variants[0]
  const supabaseAdmin = getSupabaseAdmin()
  const payload = {
    account_id: input.accountId,
    name: cleanName,
    slug: slugifyProductName(cleanName) || `produto-${Date.now()}`,
    option_name: input.optionName?.trim() || "Variante",
    variant_label: primaryVariant.name,
    variants,
    description: input.description?.trim() || "",
    price: primaryVariant.price,
    currency: input.currency,
    image_src: input.imageSrc?.trim() || primaryVariant.imageSrc || "",
    status: input.status,
    updated_at: new Date().toISOString(),
  }

  const query = input.id
    ? supabaseAdmin
        .from("catalog_products")
        .update(payload)
        .eq("id", input.id)
        .eq("account_id", input.accountId)
        .select("id, account_id, name, slug, option_name, variant_label, variants, description, price, currency, image_src, status, created_at, updated_at")
        .single()
    : supabaseAdmin
        .from("catalog_products")
        .insert(payload)
        .select("id, account_id, name, slug, option_name, variant_label, variants, description, price, currency, image_src, status, created_at, updated_at")
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

export async function loadCatalogProductPreviewForPublishing(input: {
  accountId: string
  productId: string
  variantId?: string | null
}) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from("catalog_products")
    .select("id, account_id, name, slug, option_name, variant_label, variants, description, price, currency, image_src, status, created_at, updated_at")
    .eq("account_id", input.accountId)
    .eq("id", input.productId)
    .maybeSingle()

  if (error || !data) {
    return {
      error: "Produto da Swipe nao encontrado.",
      preview: null as null | {
        storeName: string
        productName: string
        variantLabel: string
        amount: number
        currency: CatalogProductCurrency
        imageSrc?: string
      },
    }
  }

  const product = mapCatalogProduct(data)
  const selectedVariant =
    product.variants.find((variant) => variant.id === input.variantId) ?? product.variants[0] ?? null

  if (!selectedVariant) {
    return {
      error: "Variante do produto nao encontrada.",
      preview: null as null | {
        storeName: string
        productName: string
        variantLabel: string
        amount: number
        currency: CatalogProductCurrency
        imageSrc?: string
      },
    }
  }

  return {
    preview: {
      storeName: "Meu Swipe",
      productName: product.name,
      variantLabel: selectedVariant.name,
      amount: selectedVariant.price,
      currency: product.currency,
      imageSrc: selectedVariant.imageSrc || product.imageSrc || undefined,
    },
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
