import Link from "next/link"
import { headers } from "next/headers"
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { resolvePublicLocale } from "@/lib/public-locale"

const copyByLocale = {
  "pt-BR": {
    back: "Voltar para a home",
    eyebrow: "Pricing",
    title: "Detalhes de pricing da Swipe",
    description:
      "A Swipe trabalha com precificacao comercial personalizada. As taxas cobradas dependem do perfil de cada negocio, do volume processado, da estrutura operacional da loja e das necessidades especificas de integracao e suporte.",
    cards: [
      {
        title: "Taxas variaveis por negocio",
        text: "Nao operamos com uma tabela fixa unica para toda loja. Cada operacao pode receber um modelo comercial proprio, definido conforme nicho, estrutura, volume e risco.",
      },
      {
        title: "Apuracao baseada na movimentacao",
        text: "Os valores sao apurados com base na movimentacao real de cada loja conectada, respeitando o comportamento operacional de cada conta.",
      },
      {
        title: "Cobranca e liquidacao a cada 2 dias",
        text: "A cobranca segue ciclos recorrentes de 2 dias, acompanhando a movimentacao de cada loja e a estrutura comercial aprovada para aquela operacao.",
      },
    ],
    bulletsTitle: "O que a pagina de pricing comunica",
    bullets: [
      "as taxas sao definidas conforme cada negocio",
      "a analise considera volume, modelo operacional e risco",
      "nao existe obrigatoriamente um valor padrao igual para todos",
      "a cobranca e a liquidacao acontecem a cada 2 dias",
      "a base de calculo considera a movimentacao real de cada loja",
    ],
    ctaTitle: "Precisa de uma proposta comercial?",
    ctaText:
      "Se a sua operacao precisa de condicoes especificas, a Swipe pode estruturar uma proposta alinhada ao seu fluxo de vendas.",
    primary: "Criar conta",
    secondary: "Voltar para a home",
  },
  "en-US": {
    back: "Back to home",
    eyebrow: "Pricing",
    title: "Swipe pricing details",
    description:
      "Swipe uses custom commercial pricing. Fees depend on each business profile, processed volume, store operating structure, and the specific integration and support requirements involved.",
    cards: [
      {
        title: "Variable fees by business",
        text: "We do not operate with a single fixed pricing table for every store. Each operation may receive its own commercial model based on niche, structure, volume, and risk.",
      },
      {
        title: "Settlement based on transaction flow",
        text: "Amounts are calculated from the real transaction flow of each connected store, respecting the operating behavior of every account.",
      },
      {
        title: "Billing and settlement every 2 days",
        text: "Billing follows recurring 2-day cycles, based on store activity and the approved commercial structure for that operation.",
      },
    ],
    bulletsTitle: "What this pricing page communicates",
    bullets: [
      "fees are defined according to each business",
      "commercial review considers volume, operating model, and risk",
      "there is not necessarily one default fixed price for everyone",
      "billing and settlement happen every 2 days",
      "calculation is based on each store's real transaction flow",
    ],
    ctaTitle: "Need a custom commercial proposal?",
    ctaText:
      "If your operation needs specific conditions, Swipe can structure a commercial proposal aligned with your sales flow.",
    primary: "Create account",
    secondary: "Back to home",
  },
} as const

export default async function PricingPage() {
  const requestHeaders = await headers()
  const locale = resolvePublicLocale({
    country: requestHeaders.get("x-vercel-ip-country"),
    language: requestHeaders.get("accept-language"),
  })
  const copy = copyByLocale[locale]

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-14 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-white/62 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            {copy.back}
          </Link>
          <img src="/swipe-logo-white.svg" alt="Swipe" className="h-8 w-auto max-w-[120px]" />
        </div>

        <header className="space-y-5 rounded-[32px] border border-white/10 bg-white/[0.03] p-8 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-white/62">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {copy.eyebrow}
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
            {copy.title}
          </h1>
          <p className="max-w-3xl text-base leading-8 text-white/62 sm:text-lg">
            {copy.description}
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          {copy.cards.map((card) => (
            <article key={card.title} className="rounded-[28px] border border-white/10 bg-[#0a0a0a] p-6">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">{card.title}</h2>
              <p className="mt-4 text-sm leading-7 text-white/62 sm:text-base">{card.text}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">{copy.bulletsTitle}</h2>
            <div className="mt-6 space-y-3">
              {copy.bullets.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-sm leading-6 text-white/72">{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[32px] border border-primary/30 bg-[#0d0a08] p-8">
            <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white">{copy.ctaTitle}</h2>
            <p className="mt-4 text-sm leading-7 text-white/68 sm:text-base">{copy.ctaText}</p>
            <div className="mt-8 flex flex-col gap-4">
              <Button asChild size="lg" className="rounded-full bg-primary px-7 text-primary-foreground hover:bg-primary/90">
                <Link href="/signup">
                  {copy.primary}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="rounded-full border border-white/12 bg-transparent px-7 text-white hover:bg-white/8 hover:text-white">
                <Link href="/">{copy.secondary}</Link>
              </Button>
            </div>
          </article>
        </section>
      </div>
    </div>
  )
}
