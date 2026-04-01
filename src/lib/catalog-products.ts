export type CatalogProductCurrency = "BRL" | "USD" | "EUR" | "GBP"

export type CatalogProductStatus = "active" | "draft"

export type CatalogProduct = {
  id: string
  accountId: string
  name: string
  slug: string
  variantLabel: string
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
