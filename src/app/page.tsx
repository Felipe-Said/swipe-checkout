import { headers } from "next/headers"

import { loadSafePageByHost } from "@/app/actions/safe-page"
import { LandingPageClient } from "@/components/landing/landing-page-client"
import { SafePagePublic } from "@/components/safe-page/safe-page-public"
import { resolvePublicLocale } from "@/lib/public-locale"

export default async function LandingPage() {
  const requestHeaders = await headers()
  const host = requestHeaders.get("host") ?? ""
  const safePageResult = await loadSafePageByHost(host)

  if (safePageResult.safePage) {
    return (
      <SafePagePublic
        businessName={safePageResult.safePage.businessName}
        logoUrl={safePageResult.safePage.logoUrl || undefined}
        members={safePageResult.safePage.membersPreview}
        pathname="/"
      />
    )
  }

  const locale = resolvePublicLocale({
    country: requestHeaders.get("x-vercel-ip-country"),
    language: requestHeaders.get("accept-language"),
  })

  return <LandingPageClient locale={locale} />
}
