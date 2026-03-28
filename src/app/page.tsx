"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LandingNavbar } from "@/components/landing/landing-navbar"
import { LandingHero } from "@/components/landing/landing-hero"
import { LandingFeatureGrid } from "@/components/landing/landing-feature-grid"
import { LandingEditorShowcase } from "@/components/landing/landing-editor-showcase"
import { LandingOperationsSection } from "@/components/landing/landing-operations-section"
import { LandingRolesSection } from "@/components/landing/landing-roles-section"
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works"
import { LandingFinalCta } from "@/components/landing/landing-final-cta"
import { getCurrentAppSession } from "@/lib/app-session"

export default function LandingPage() {
  const router = useRouter()
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false

    async function loadSession() {
      const session = await getCurrentAppSession()

      if (cancelled) {
        return
      }

      if (session) {
        router.replace("/app")
        return
      }

      setReady(true)
    }

    loadSession()

    return () => {
      cancelled = true
    }
  }, [router])

  if (!ready) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatureGrid />
        <LandingEditorShowcase />
        <LandingOperationsSection />
        <LandingRolesSection />
        <LandingHowItWorks />
        <LandingFinalCta />
      </main>
      <footer className="border-t py-12 bg-muted/50">
        <div className="container flex flex-col items-center justify-between gap-6 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Swipe. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Termos</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacidade</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
