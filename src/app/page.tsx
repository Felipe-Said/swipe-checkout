import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { LandingPageClient } from "@/components/landing/landing-page-client"
import { resolvePublicLocale } from "@/lib/public-locale"
import { getSupabaseAdmin } from "@/lib/supabase"

export default async function LandingPage() {
  const requestHeaders = await headers()
  const forwardedHost = requestHeaders.get("x-forwarded-host")
  const requestHost = requestHeaders.get("host")
  const normalizedHost = (forwardedHost || requestHost || "")
    .split(",")[0]
    ?.trim()
    .replace(/:\d+$/, "")
    .toLowerCase()

  if (normalizedHost) {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: connectedDomain } = await supabaseAdmin
      .from("domains")
      .select("checkout_id, status")
      .eq("host", normalizedHost)
      .eq("status", "Pronto")
      .maybeSingle()

    if (connectedDomain?.checkout_id) {
      const { data: checkout } = await supabaseAdmin
        .from("checkouts")
        .select("id, status")
        .eq("id", connectedDomain.checkout_id)
        .eq("status", "Ativo")
        .maybeSingle()

      if (checkout?.id) {
        redirect(`/checkout/${checkout.id}`)
      }
    }
  }

  const locale = resolvePublicLocale({
    country: requestHeaders.get("x-vercel-ip-country"),
    language: requestHeaders.get("accept-language"),
  })

  return <LandingPageClient locale={locale} />
}
