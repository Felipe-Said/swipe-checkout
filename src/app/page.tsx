"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { LandingFortex } from "@/components/landing/landing-fortex"
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

  return <LandingFortex />
}
