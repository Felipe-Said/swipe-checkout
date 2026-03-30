"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export function LegalPageShell({
  eyebrow,
  title,
  updatedAt,
  children,
}: {
  eyebrow: string
  title: string
  updatedAt: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-14 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a home
          </Link>
          <img
            src="/swipe-logo-white.svg"
            alt="Swipe"
            className="hidden h-7 w-auto max-w-[120px] rounded bg-[#1d1d21] px-3 py-1.5 sm:block"
          />
        </div>

        <header className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            {eyebrow}
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Ultima atualizacao: {updatedAt}
          </p>
        </header>

        <article className="space-y-8 text-sm leading-7 text-muted-foreground sm:text-base">
          {children}
        </article>
      </div>
    </div>
  )
}
