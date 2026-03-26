export type ShippingMethod = {
  id: string
  name: string
  description: string
  price: number
  eta: string
  active: boolean
}

const STORAGE_KEY = "swipe-shipping-methods"

export const defaultShippingMethods: ShippingMethod[] = [
  {
    id: "standard",
    name: "Entrega Padrao",
    description: "Opcao economica para todo o Brasil.",
    price: 19.9,
    eta: "3 a 7 dias uteis",
    active: true,
  },
  {
    id: "express",
    name: "Entrega Expressa",
    description: "Envio prioritario com rastreio em tempo real.",
    price: 34.9,
    eta: "1 a 2 dias uteis",
    active: true,
  },
  {
    id: "same-day",
    name: "Entrega no Mesmo Dia",
    description: "Disponivel para capitais selecionadas.",
    price: 49.9,
    eta: "Hoje ate 22h",
    active: true,
  },
]

export function readShippingMethods(): ShippingMethod[] {
  if (typeof window === "undefined") {
    return defaultShippingMethods
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultShippingMethods))
      return defaultShippingMethods
    }

    const parsed = JSON.parse(raw) as ShippingMethod[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultShippingMethods
  } catch {
    return defaultShippingMethods
  }
}

export function writeShippingMethods(methods: ShippingMethod[]) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(methods))
}
