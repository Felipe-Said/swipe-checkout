export type PixelPlatform = "meta" | "google" | "tiktok"

export type CheckoutPixelConfig = {
  checkoutId: string
  metaPixelId: string
  googleAdsId: string
  tiktokPixelId: string
  trackCampaignSource: boolean
}

export type CampaignPerformance = {
  id: string
  accountEmail: string
  checkoutId: string
  campaignName: string
  platform: PixelPlatform
  revenue: number
  purchases: number
  updatedAt: string
}

const PIXELS_STORAGE_KEY = "swipe-pixels-configs"
const CAMPAIGNS_STORAGE_KEY = "swipe-campaign-performance"

const defaultPixelConfigs: CheckoutPixelConfig[] = [
  {
    checkoutId: "1",
    metaPixelId: "",
    googleAdsId: "",
    tiktokPixelId: "",
    trackCampaignSource: true,
  },
  {
    checkoutId: "2",
    metaPixelId: "",
    googleAdsId: "",
    tiktokPixelId: "",
    trackCampaignSource: true,
  },
  {
    checkoutId: "3",
    metaPixelId: "",
    googleAdsId: "",
    tiktokPixelId: "",
    trackCampaignSource: true,
  },
]

const defaultCampaignPerformance: CampaignPerformance[] = [
  {
    id: "camp-1",
    accountEmail: "user@swipe.com.br",
    checkoutId: "1",
    campaignName: "Meta - Colecao Inverno",
    platform: "meta",
    revenue: 6120,
    purchases: 14,
    updatedAt: "2026-03-24T14:20:00.000Z",
  },
  {
    id: "camp-2",
    accountEmail: "user@swipe.com.br",
    checkoutId: "1",
    campaignName: "Google - Search Premium",
    platform: "google",
    revenue: 4280,
    purchases: 9,
    updatedAt: "2026-03-24T13:40:00.000Z",
  },
  {
    id: "camp-3",
    accountEmail: "user@swipe.com.br",
    checkoutId: "3",
    campaignName: "TikTok - Oferta Relampago",
    platform: "tiktok",
    revenue: 3170,
    purchases: 7,
    updatedAt: "2026-03-24T14:45:00.000Z",
  },
]

export function readPixelConfigs() {
  if (typeof window === "undefined") {
    return defaultPixelConfigs
  }

  try {
    const raw = window.localStorage.getItem(PIXELS_STORAGE_KEY)
    if (!raw) {
      window.localStorage.setItem(PIXELS_STORAGE_KEY, JSON.stringify(defaultPixelConfigs))
      return defaultPixelConfigs
    }

    const parsed = JSON.parse(raw) as CheckoutPixelConfig[]
    return Array.isArray(parsed) ? parsed : defaultPixelConfigs
  } catch {
    return defaultPixelConfigs
  }
}

export function writePixelConfigs(configs: CheckoutPixelConfig[]) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(PIXELS_STORAGE_KEY, JSON.stringify(configs))
}

export function readCampaignPerformance() {
  if (typeof window === "undefined") {
    return defaultCampaignPerformance
  }

  try {
    const raw = window.localStorage.getItem(CAMPAIGNS_STORAGE_KEY)
    if (!raw) {
      window.localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(defaultCampaignPerformance))
      return defaultCampaignPerformance
    }

    const parsed = JSON.parse(raw) as CampaignPerformance[]
    return Array.isArray(parsed) ? parsed : defaultCampaignPerformance
  } catch {
    return defaultCampaignPerformance
  }
}

export function writeCampaignPerformance(campaigns: CampaignPerformance[]) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns))
}
