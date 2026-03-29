export type ShippingMethod = {
  id: string
  name: string
  description: string
  price: number
  eta: string
  active: boolean
  accountId?: string
}
