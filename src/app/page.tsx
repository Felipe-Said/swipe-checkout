import { headers } from "next/headers"

import { LandingPageClient } from "@/components/landing/landing-page-client"
import { resolvePublicLocale } from "@/lib/public-locale"

export default async function LandingPage() {
  const requestHeaders = await headers()
  const locale = resolvePublicLocale({
    country: requestHeaders.get("x-vercel-ip-country"),
    language: requestHeaders.get("accept-language"),
  })

  return <LandingPageClient locale={locale} />
}
