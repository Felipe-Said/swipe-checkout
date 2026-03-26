export type PushcutCheckoutConfig = {
  checkoutId: string
  webhookUrls: string[]
}

const STORAGE_KEY = "swipe-pushcut-configs"

const defaultPushcutConfigs: PushcutCheckoutConfig[] = [
  {
    checkoutId: "1",
    webhookUrls: [],
  },
  {
    checkoutId: "2",
    webhookUrls: [],
  },
  {
    checkoutId: "3",
    webhookUrls: [],
  },
]

export function readPushcutConfigs(): PushcutCheckoutConfig[] {
  if (typeof window === "undefined") {
    return defaultPushcutConfigs
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPushcutConfigs))
      return defaultPushcutConfigs
    }

    const parsed = JSON.parse(raw) as PushcutCheckoutConfig[]
    return Array.isArray(parsed) ? parsed : defaultPushcutConfigs
  } catch {
    return defaultPushcutConfigs
  }
}

export function writePushcutConfigs(configs: PushcutCheckoutConfig[]) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
}
