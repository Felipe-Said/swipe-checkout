export type CatalogProductCurrency = "BRL" | "USD" | "EUR" | "GBP"

export type CatalogProductStatus = "active" | "draft"

export const SWIPE_MANUAL_STORE_ID = "swipe-manual"

export type CatalogProductVariant = {
  id: string
  name: string
  price: number
  imageSrc: string
}

export type CatalogProduct = {
  id: string
  accountId: string
  name: string
  slug: string
  optionName: string
  variantLabel: string
  variants: CatalogProductVariant[]
  description: string
  price: number
  currency: CatalogProductCurrency
  imageSrc: string
  status: CatalogProductStatus
  createdAt: string
  updatedAt: string
}

export type StoreCatalogProduct = {
  id: string
  storeId: string
  storeName: string
  title: string
  variantLabel: string
  price: number
  currency: CatalogProductCurrency
  imageSrc: string
}
