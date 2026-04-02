"use client"

import * as React from "react"

import type { CheckoutPixelConfig } from "@/lib/pixels-data"

type PixelTrackerStage = "checkout" | "thank-you"
type SupportedCurrency = "BRL" | "USD" | "EUR" | "GBP"

type PixelTrackerProps = {
  checkoutId: string
  config?: CheckoutPixelConfig | null
  stage: PixelTrackerStage
  orderId?: string | null
  productName: string
  variantLabel: string
  amount: number
  currency: SupportedCurrency
  productId?: string | null
  variantId?: string | null
}

type AttributionPayload = {
  source: string
  medium: string
  campaign: string
  content: string
  term: string
  gclid: string
  fbclid: string
  ttclid: string
  referrer: string
  landingUrl: string
}

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
    _fbq?: (...args: any[]) => void
    ttq?: any
    dataLayer?: any[]
    gtag?: (...args: any[]) => void
  }
}

const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "ttclid",
] as const

const META_PIXEL_SCRIPT_ID = "swipe-meta-pixel-script"
const GOOGLE_TAG_SCRIPT_ID = "swipe-google-tag-script"
const TIKTOK_PIXEL_SCRIPT_ID = "swipe-tiktok-pixel-script"

export function CheckoutPixelTracker(props: PixelTrackerProps) {
  React.useEffect(() => {
    if (!props.config) return
    if (props.stage !== "thank-you") return
    if (!props.orderId?.trim()) return

    const attribution = props.config.trackCampaignSource
      ? captureAttribution(props.checkoutId)
      : null
    const dedupeKey = [
      "swipe-pixel-stage",
      props.stage,
      props.orderId,
      props.checkoutId,
      props.productId ?? "product",
      props.variantId ?? "variant",
      props.amount,
      props.currency,
    ].join(":")

    if (window.sessionStorage.getItem(dedupeKey) === "done") {
      return
    }

    const metaIds = normalizePixelList(props.config.metaPixelIds)
    const googleEntries = normalizePixelList(props.config.googleAdsIds).map(parseGooglePixelEntry)
    const tiktokIds = normalizePixelList(props.config.tiktokPixelIds)

    if (!metaIds.length && !googleEntries.length && !tiktokIds.length) {
      return
    }

    if (metaIds.length) {
      ensureMetaPixel(metaIds)
    }
    if (googleEntries.length) {
      ensureGoogleTag(googleEntries)
    }
    if (tiktokIds.length) {
      ensureTikTokPixel(tiktokIds)
    }

    const contentIds = [props.variantId || props.productId || props.checkoutId]
    const commonPayload = {
      content_name: props.productName,
      content_type: "product",
      content_ids: contentIds,
      value: props.amount,
      currency: props.currency,
      contents: [
        {
          content_id: props.variantId || props.productId || props.checkoutId,
          content_name: props.productName,
          content_category: props.variantLabel,
          quantity: 1,
          price: props.amount,
        },
      ],
      ...buildAttributionPayload(attribution),
    }

    trackMetaEvent("Purchase", commonPayload)

    trackGoogleEvent("purchase", {
      transaction_id: props.orderId,
      currency: props.currency,
      value: props.amount,
      items: [
        {
          item_id: props.variantId || props.productId || props.checkoutId,
          item_name: props.productName,
          item_variant: props.variantLabel,
          price: props.amount,
          quantity: 1,
        },
      ],
      ...buildAttributionPayload(attribution),
    })

    for (const entry of googleEntries) {
      if (entry.label) {
        trackGoogleEvent("conversion", {
          send_to: `${entry.id}/${entry.label}`,
          transaction_id: props.orderId,
          value: props.amount,
          currency: props.currency,
        })
      }
    }

    trackTikTokEvent("CompletePayment", commonPayload)

    window.sessionStorage.setItem(dedupeKey, "done")
  }, [
    props.amount,
    props.checkoutId,
    props.config,
    props.currency,
    props.orderId,
    props.productId,
    props.productName,
    props.stage,
    props.variantId,
    props.variantLabel,
  ])

  return null
}

function normalizePixelList(value: string[] | undefined) {
  return Array.isArray(value)
    ? value.map((item) => item.trim()).filter(Boolean)
    : []
}

function parseGooglePixelEntry(value: string) {
  const [idPart, labelPart] = value.split("/", 2)
  return {
    id: idPart.trim(),
    label: labelPart?.trim() || "",
  }
}

function captureAttribution(checkoutId: string): AttributionPayload | null {
  const next = readAttributionFromLocation()
  const storageKey = `swipe-attribution:${checkoutId}`
  const previous = readAttributionFromStorage(storageKey)

  const resolved: AttributionPayload | null =
    next && hasMeaningfulAttribution(next)
      ? next
      : previous && hasMeaningfulAttribution(previous)
        ? previous
        : next || previous

  if (resolved) {
    window.localStorage.setItem(storageKey, JSON.stringify(resolved))
  }

  return resolved
}

function readAttributionFromLocation(): AttributionPayload | null {
  const url = new URL(window.location.href)
  const params = url.searchParams

  return {
    source: params.get("utm_source") || "",
    medium: params.get("utm_medium") || "",
    campaign: params.get("utm_campaign") || "",
    content: params.get("utm_content") || "",
    term: params.get("utm_term") || "",
    gclid: params.get("gclid") || "",
    fbclid: params.get("fbclid") || "",
    ttclid: params.get("ttclid") || "",
    referrer: params.get("referrer") || document.referrer || "",
    landingUrl: window.location.href,
  }
}

function readAttributionFromStorage(storageKey: string): AttributionPayload | null {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    return JSON.parse(raw) as AttributionPayload
  } catch {
    return null
  }
}

function hasMeaningfulAttribution(payload: AttributionPayload) {
  return Boolean(
    payload.source ||
      payload.medium ||
      payload.campaign ||
      payload.content ||
      payload.term ||
      payload.gclid ||
      payload.fbclid ||
      payload.ttclid ||
      payload.referrer
  )
}

function buildAttributionPayload(payload: AttributionPayload | null) {
  if (!payload) return {}

  return {
    campaign_source: payload.source,
    campaign_medium: payload.medium,
    campaign_name: payload.campaign,
    campaign_content: payload.content,
    campaign_term: payload.term,
    gclid: payload.gclid,
    fbclid: payload.fbclid,
    ttclid: payload.ttclid,
    referrer: payload.referrer,
    landing_url: payload.landingUrl,
  }
}

function ensureMetaPixel(ids: string[]) {
  if (!document.getElementById(META_PIXEL_SCRIPT_ID)) {
    const script = document.createElement("script")
    script.id = META_PIXEL_SCRIPT_ID
    script.innerHTML = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
    `
    document.head.appendChild(script)
  }

  ids.forEach((id) => {
    window.fbq?.("init", id)
  })
}

function ensureGoogleTag(entries: Array<{ id: string; label: string }>) {
  const firstId = entries[0]?.id
  if (!firstId) return

  if (!document.getElementById(GOOGLE_TAG_SCRIPT_ID)) {
    const script = document.createElement("script")
    script.id = GOOGLE_TAG_SCRIPT_ID
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(firstId)}`
    document.head.appendChild(script)

    const inlineScript = document.createElement("script")
    inlineScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
    `
    document.head.appendChild(inlineScript)
  }

  entries.forEach((entry) => {
    window.gtag?.("config", entry.id)
  })
}

function ensureTikTokPixel(ids: string[]) {
  if (!document.getElementById(TIKTOK_PIXEL_SCRIPT_ID)) {
    const script = document.createElement("script")
    script.id = TIKTOK_PIXEL_SCRIPT_ID
    script.innerHTML = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject = t;
        var ttq = w[t] = w[t] || [];
        ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
        ttq.setAndDefer = function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}; 
        for (var i = 0; i < ttq.methods.length; i++) { ttq.setAndDefer(ttq, ttq.methods[i]); }
        ttq.instance = function(t){var e=ttq._i[t]||[]; for (var n=0; n<ttq.methods.length; n++) { ttq.setAndDefer(e, ttq.methods[n]); } return e; };
        ttq.load = function(e,n){var r='https://analytics.tiktok.com/i18n/pixel/events.js'; ttq._i=ttq._i||{}; ttq._i[e]=[]; ttq._i[e]._u=r; ttq._t=ttq._t||{}; ttq._t[e]=+new Date; ttq._o=ttq._o||{}; ttq._o[e]=n||{}; var o=document.createElement('script'); o.type='text/javascript'; o.async=!0; o.src=r+'?sdkid='+e+'&lib='+t; var a=document.getElementsByTagName('script')[0]; a.parentNode.insertBefore(o,a); };
      }(window, document, 'ttq');
    `
    document.head.appendChild(script)
  }

  ids.forEach((id) => {
    window.ttq?.load(id)
  })
}

function trackMetaEvent(name: string, payload?: Record<string, unknown>) {
  if (typeof window.fbq !== "function") return
  if (payload) {
    window.fbq("track", name, payload)
    return
  }
  window.fbq("track", name)
}

function trackGoogleEvent(name: string, payload: Record<string, unknown>) {
  if (typeof window.gtag !== "function") return
  window.gtag("event", name, payload)
}

function trackTikTokEvent(name: string, payload?: Record<string, unknown>) {
  if (!window.ttq) return
  if (payload) {
    window.ttq.track(name, payload)
    return
  }
  window.ttq.track(name)
}
