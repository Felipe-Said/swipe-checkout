export type PixelPlatform = "meta" | "google" | "tiktok"

export type CheckoutPixelConfig = {
  checkoutId: string
  metaPixelIds: string[]
  googleAdsIds: string[]
  tiktokPixelIds: string[]
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
