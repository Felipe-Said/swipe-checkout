"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { hasShopifyEmbeddedParams } from "@/lib/shopify-embedded"

declare global {
  interface Window {
    shopify?: {
      idToken?: () => Promise<string>
    }
  }
}

async function waitForShopifyBridge() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (typeof window !== "undefined" && typeof window.shopify?.idToken === "function") {
      return true
    }

    await new Promise((resolve) => window.setTimeout(resolve, 300))
  }

  return false
}

export function ShopifyEmbeddedProbe() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  React.useEffect(() => {
    const isEmbedded =
      hasShopifyEmbeddedParams(searchParams) ||
      (typeof window !== "undefined" && window.top !== window.self)

    if (!isEmbedded) {
      return
    }

    let cancelled = false

    async function sendProbe() {
      const ready = await waitForShopifyBridge()
      if (!ready || cancelled || typeof window === "undefined") {
        return
      }

      const getToken = window.shopify?.idToken
      if (typeof getToken !== "function") {
        return
      }

      const token = await getToken().catch(() => "")
      if (!token || cancelled) {
        return
      }

      await fetch("/api/shopify/session-token", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pathname,
          shop: searchParams.get("shop"),
          host: searchParams.get("host"),
        }),
        cache: "no-store",
        credentials: "include",
      }).catch(() => null)
    }

    void sendProbe()

    return () => {
      cancelled = true
    }
  }, [pathname, searchParams])

  return null
}
