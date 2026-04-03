"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { LandingFortex } from "@/components/landing/landing-fortex"
import { getCurrentAppSession } from "@/lib/app-session"
import type { PublicLocale } from "@/lib/public-locale"
import { buildEmbeddedPath } from "@/lib/shopify-embedded"

export function LandingPageClient({ locale }: { locale: PublicLocale }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ready, setReady] = React.useState(false)

  const withEmbeddedContext = React.useCallback(
    (targetPath: string) => buildEmbeddedPath(targetPath, searchParams),
    [searchParams]
  )

  React.useEffect(() => {
    let cancelled = false

    async function loadSession() {
      const session = await getCurrentAppSession()

      if (cancelled) {
        return
      }

      if (session) {
        router.replace(withEmbeddedContext("/app"))
        return
      }

      setReady(true)
    }

    loadSession()

    return () => {
      cancelled = true
    }
  }, [router, withEmbeddedContext])

  if (!ready) {
    return null
  }

  return <LandingFortex locale={locale} />
}
