"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Globe,
  LayoutTemplate,
  Monitor,
  Palette,
  ShoppingCart,
  Smartphone,
  Workflow,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PublicLocale } from "@/lib/public-locale"

type Copy = {
  nav: Array<{ label: string; href: string }>
  header: { login: string; signup: string }
  hero: {
    badge: string
    title: string
    description: string
    primaryCta: string
    secondaryCta: string
    stats: Array<{ title: string; text: string }>
    previewBadge: string
    previewTitle: string
    previewDescription: string
    previewChips: string[]
    previewAboutKicker: string
    previewAboutTitle: string
    previewAboutDescription: string
    previewAboutPoints: string[]
  }
  services: {
    kicker: string
    title: string
    description: string
    items: Array<[string, string, string]>
  }
  about: {
    projects: string
    title: string
    points: string[]
    checkoutTitle: string
    checkoutStatus: string
    checkoutItems: string[]
    cards: Array<{ title: string; text: string }>
  }
  process: {
    kicker: string
    title: string
    description: string
    steps: Array<{ title: string; text: string }>
    label: string
  }
  pricing: {
    kicker: string
    title: string
    description: string
    cards: Array<{
      eyebrow: string
      title: string
      points: string[]
      featured?: boolean
    }>
    featuredLabel: string
    pageCta: string
  }
  faq: {
    kicker: string
    title: string
    items: Array<{ question: string; answer: string }>
  }
  contact: {
    kicker: string
    title: string
    description: string
    cards: string[]
    primaryCta: string
    secondaryCta: string
    note: string
  }
  footer: {
    navigation: string
    rights: string
    privacy: string
    terms: string
    tagline: string
  }
}

const copyByLocale: Record<PublicLocale, Copy> = {
  "pt-BR": {
    nav: [
      { label: "Home", href: "#home" },
      { label: "Sobre", href: "#about" },
      { label: "Servicos", href: "#services" },
      { label: "Processo", href: "#process" },
      { label: "Pricing", href: "/pricing" },
      { label: "Contato", href: "#contact" },
    ],
    header: { login: "Entrar", signup: "Criar conta" },
    hero: {
      badge: "Taxas definidas conforme volume, risco e modelo de operacao",
      title: "Crie e opere checkouts com controle total.",
      description:
        "Uma plataforma para construir, gerenciar e escalar sua operacao de checkout. Controle layout, operacao e gestao em um so lugar.",
      primaryCta: "Criar conta gratis",
      secondaryCta: "Ver plataforma",
      stats: [
        { title: "Editor", text: "Controle visual em desktop e mobile" },
        { title: "Shopify", text: "Sincronizacao real de produto e operacao" },
        { title: "Dashboard", text: "Conversao, pedidos e saques em tempo real" },
      ],
      previewBadge: "Checkout publicado",
      previewTitle: "Total liberdade criativa com uma operacao pronta para escalar.",
      previewDescription:
        "Editor visual, preview mobile, dominios proprios, pixels, funil em tempo real e controle operacional em uma unica area.",
      previewChips: ["Funcionalidades", "Editor Visual", "Operacoes"],
      previewAboutKicker: "Sobre",
      previewAboutTitle: "Tudo o que voce precisa para operar com excelencia.",
      previewAboutDescription:
        "A Swipe centraliza toda a sua operacao de checkout em uma unica plataforma premium e intuitiva.",
      previewAboutPoints: [
        "Gestao de checkouts",
        "Editor visual",
        "Preview instantaneo desktop e mobile",
        "Conexao Shopify e dominios proprios",
        "Pixels, PushCut, frete e metricas avancadas",
      ],
    },
    services: {
      kicker: "Servicos",
      title: "Uma plataforma premium para construir, gerenciar e escalar checkouts.",
      description:
        "A Swipe combina controle visual, operacao real e supervisao administrativa em um produto unico.",
      items: [
        ["001", "Gestao de Checkouts", "Crie, publique e opere checkouts com controle total."],
        ["002", "Editor Visual", "Controle branding, layouts, blocos e responsividade."],
        ["003", "Operacao", "Gerencie fretes, pixels, notificacoes, pedidos e saques."],
        ["004", "Dashboard", "Acompanhe faturamento, conversao e comportamento real."],
      ],
    },
    about: {
      projects: "Projetos",
      title: "Editor visual poderoso. Total liberdade criativa.",
      points: [
        "Personalizacao completa de branding",
        "Modos Classic e One-page layout",
        "Preview instantaneo desktop e mobile",
        "Configuracao de banners e backgrounds",
        "Controle de campos e politicas",
      ],
      checkoutTitle: "Swipe checkout",
      checkoutStatus: "publicado",
      checkoutItems: ["Contato", "Entrega", "Frete", "Pagamento", "Resumo do pedido"],
      cards: [
        {
          title: "Editor Visual Poderoso",
          text: "Controle total sobre cores, fontes, layouts e elementos do seu checkout.",
        },
        {
          title: "Muito mais que um construtor",
          text: "A Swipe centraliza Shopify, dominios, fretes, pixels, pedidos e saques em uma unica operacao.",
        },
        {
          title: "Uma plataforma multifuncional",
          text: "Estrutura pensada tanto para operacao individual quanto para supervisao administrativa em larga escala.",
        },
      ],
    },
    process: {
      kicker: "Processo",
      title: "Do zero ao checkout operando em escala em poucos minutos.",
      description:
        "A mesma estrutura visual continua, mas agora a mensagem publica explica com clareza como a operacao entra no ar.",
      label: "Etapa",
      steps: [
        { title: "Crie sua conta", text: "Comece em segundos com um processo de registro simples e intuitivo." },
        { title: "Configure seu workspace", text: "Conecte sua loja Shopify e defina as preferencias basicas da operacao." },
        { title: "Personalize seu checkout", text: "Use o editor visual para deixar o checkout com a identidade da sua marca." },
        { title: "Ative as operacoes", text: "Configure frete, dominios, pixels e notificacoes no mesmo fluxo." },
        { title: "Gerencie e escale", text: "Acompanhe tudo pelo dashboard e otimize sua conversao com controle total." },
      ],
    },
    pricing: {
      kicker: "Pricing",
      title: "Taxas adaptadas a cada operacao.",
      description:
        "A Swipe trabalha com precificacao comercial definida conforme cada negocio, considerando volume, perfil operacional, risco e estrutura da loja. A cobranca e a liquidacao acontecem a cada 2 dias, com base na movimentacao real de cada loja.",
      featuredLabel: "Mais comum",
      pageCta: "Ver pricing completo",
      cards: [
        {
          eyebrow: "Custom pricing",
          title: "Taxa sob medida por negocio",
          points: [
            "Analise comercial conforme nicho, volume e operacao",
            "Percentual definido de forma individual por loja",
            "Condicoes ajustadas conforme complexidade e risco",
          ],
        },
        {
          eyebrow: "Billing cycle",
          title: "Cobranca e liquidacao a cada 2 dias",
          featured: true,
          points: [
            "Apuracao baseada na movimentacao real de cada loja",
            "Fechamentos recorrentes em ciclos de 2 dias",
            "Visao operacional para acompanhar o que foi movimentado",
          ],
        },
        {
          eyebrow: "Commercial review",
          title: "Proposta alinhada com a sua estrutura",
          points: [
            "Negocios menores e maiores nao recebem a mesma tabela fixa",
            "Cada operacao pode receber condicoes diferentes",
            "A pagina publica de pricing detalha o modelo comercial",
          ],
        },
      ],
    },
    faq: {
      kicker: "FAQ",
      title: "Tudo o que voce precisa saber antes de operar.",
      items: [
        {
          question: "A Swipe funciona com Shopify?",
          answer:
            "Sim. A plataforma foi desenhada para conectar lojas Shopify, sincronizar catalogo e operar checkouts publicados com dominio proprio.",
        },
        {
          question: "Consigo editar o checkout com liberdade total?",
          answer:
            "Sim. O editor permite controlar branding, blocos, layout, CSS customizado, preview desktop e mobile e paginas complementares.",
        },
        {
          question: "As taxas sao iguais para toda loja?",
          answer:
            "Nao. A precificacao e ajustada conforme o perfil do negocio, a movimentacao da loja e a estrutura operacional necessaria.",
        },
        {
          question: "Como funciona a cobranca?",
          answer:
            "A cobranca e a liquidacao seguem ciclos de 2 dias baseados na movimentacao real de cada loja conectada.",
        },
      ],
    },
    contact: {
      kicker: "Contato",
      title: "Pronto para escalar seu checkout com a Swipe?",
      description:
        "Junte-se a produtores e empresas que ja operam suas vendas com total controle e performance.",
      cards: ["Conexao Shopify", "Fluxos de saque", "Preview mobile", "Controle operacional"],
      primaryCta: "Comecar agora",
      secondaryCta: "Fazer login",
      note: "Nao requer cartao de credito para comecar.",
    },
    footer: {
      navigation: "Navegacao",
      rights: "Todos os direitos reservados.",
      privacy: "Politica de Privacidade",
      terms: "Termos de Servico",
      tagline: "Plataforma premium para operacoes de checkout com controle total.",
    },
  },
  "en-US": {
    nav: [
      { label: "Home", href: "#home" },
      { label: "About", href: "#about" },
      { label: "Services", href: "#services" },
      { label: "Process", href: "#process" },
      { label: "Pricing", href: "/pricing" },
      { label: "Contact", href: "#contact" },
    ],
    header: { login: "Log in", signup: "Create account" },
    hero: {
      badge: "Fees are defined by volume, risk profile, and operating model",
      title: "Build and run checkouts with full control.",
      description:
        "A platform to create, manage, and scale your checkout operation. Layout, operations, and admin control in one place.",
      primaryCta: "Create free account",
      secondaryCta: "See platform",
      stats: [
        { title: "Editor", text: "Visual control across desktop and mobile" },
        { title: "Shopify", text: "Real product and operation sync" },
        { title: "Dashboard", text: "Conversion, orders, and withdrawals in real time" },
      ],
      previewBadge: "Published checkout",
      previewTitle: "Total creative freedom backed by an operation built to scale.",
      previewDescription:
        "Visual editor, mobile preview, custom domains, pixels, real-time funnel tracking, and operational control in one place.",
      previewChips: ["Features", "Visual Editor", "Operations"],
      previewAboutKicker: "About",
      previewAboutTitle: "Everything you need to operate with excellence.",
      previewAboutDescription:
        "Swipe centralizes your entire checkout operation inside one premium and intuitive platform.",
      previewAboutPoints: [
        "Checkout management",
        "Visual editor",
        "Instant desktop and mobile preview",
        "Shopify connection and custom domains",
        "Pixels, PushCut, shipping, and advanced metrics",
      ],
    },
    services: {
      kicker: "Services",
      title: "A premium platform to build, manage, and scale checkouts.",
      description:
        "Swipe combines visual control, real operations, and administrative oversight in a single product.",
      items: [
        ["001", "Checkout Management", "Create, publish, and operate checkouts with total control."],
        ["002", "Visual Editor", "Control branding, layouts, blocks, and responsiveness."],
        ["003", "Operations", "Manage shipping, pixels, notifications, orders, and withdrawals."],
        ["004", "Dashboard", "Track revenue, conversion, and customer behavior in real time."],
      ],
    },
    about: {
      projects: "Projects",
      title: "Powerful visual editor. Total creative freedom.",
      points: [
        "Complete branding customization",
        "Classic and one-page layouts",
        "Instant desktop and mobile preview",
        "Banner and background configuration",
        "Field and policy controls",
      ],
      checkoutTitle: "Swipe checkout",
      checkoutStatus: "published",
      checkoutItems: ["Contact", "Delivery", "Shipping", "Payment", "Order summary"],
      cards: [
        {
          title: "Powerful Visual Editor",
          text: "Full control over colors, fonts, layouts, and every element of your checkout.",
        },
        {
          title: "More than a builder",
          text: "Swipe centralizes Shopify, domains, shipping, pixels, orders, and withdrawals in one operation.",
        },
        {
          title: "A multi-functional platform",
          text: "Built for both individual operations and large-scale administrative supervision.",
        },
      ],
    },
    process: {
      kicker: "Process",
      title: "From zero to a checkout running at scale in just a few minutes.",
      description:
        "The same visual structure stays in place, now with public messaging clearly explaining how the operation goes live.",
      label: "Step",
      steps: [
        { title: "Create your account", text: "Start in seconds with a simple and intuitive signup flow." },
        { title: "Set up your workspace", text: "Connect your Shopify store and define your base operating preferences." },
        { title: "Customize your checkout", text: "Use the visual editor to match your checkout to your brand identity." },
        { title: "Activate operations", text: "Configure shipping, domains, pixels, and notifications in the same flow." },
        { title: "Manage and scale", text: "Track everything in the dashboard and improve conversion with full control." },
      ],
    },
    pricing: {
      kicker: "Pricing",
      title: "Fees tailored to each operation.",
      description:
        "Swipe pricing is commercially defined for each business based on volume, operating profile, risk, and store structure. Billing and settlement happen every 2 days based on the real transaction flow of each connected store.",
      featuredLabel: "Most used",
      pageCta: "View full pricing details",
      cards: [
        {
          eyebrow: "Custom pricing",
          title: "A fee model tailored to each business",
          points: [
            "Commercial review based on niche, volume, and operating profile",
            "Individual fee structure defined per store",
            "Terms adjusted to complexity and risk level",
          ],
        },
        {
          eyebrow: "Billing cycle",
          title: "Billing and settlement every 2 days",
          featured: true,
          points: [
            "Settlement based on each store's real transaction volume",
            "Recurring billing windows in 2-day cycles",
            "Operational visibility into what was processed",
          ],
        },
        {
          eyebrow: "Commercial review",
          title: "A proposal aligned with your structure",
          points: [
            "Small and large operations do not receive the same fixed table",
            "Each business can receive different commercial terms",
            "The public pricing page details the commercial model",
          ],
        },
      ],
    },
    faq: {
      kicker: "FAQ",
      title: "Everything you need to know before operating.",
      items: [
        {
          question: "Does Swipe work with Shopify?",
          answer:
            "Yes. The platform was designed to connect Shopify stores, sync catalog data, and run published checkouts on custom domains.",
        },
        {
          question: "Can I fully customize the checkout?",
          answer:
            "Yes. The editor lets you control branding, blocks, layout, custom CSS, desktop and mobile preview, and supporting pages.",
        },
        {
          question: "Are fees the same for every store?",
          answer:
            "No. Pricing is adjusted based on the business profile, the store's transaction flow, and the operational structure required.",
        },
        {
          question: "How does billing work?",
          answer:
            "Billing and settlement follow 2-day cycles based on the real transaction volume of each connected store.",
        },
      ],
    },
    contact: {
      kicker: "Contact",
      title: "Ready to scale your checkout operation with Swipe?",
      description:
        "Join creators and companies already running sales with full control and performance.",
      cards: ["Shopify connection", "Withdrawal flows", "Mobile preview", "Operational control"],
      primaryCta: "Start now",
      secondaryCta: "Log in",
      note: "No credit card required to get started.",
    },
    footer: {
      navigation: "Navigation",
      rights: "All rights reserved.",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      tagline: "Premium checkout operations platform with total control.",
    },
  },
}

function Heading({
  kicker,
  title,
  description,
  center = false,
}: {
  kicker: string
  title: string
  description: string
  center?: boolean
}) {
  return (
    <div className={cn("space-y-5", center && "mx-auto max-w-3xl text-center")}>
      <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-white/62">
        <span className="h-2 w-2 rounded-full bg-primary" />
        {kicker}
      </div>
      <h2 className="max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      <p className="max-w-2xl text-base leading-7 text-white/62 sm:text-lg">
        {description}
      </p>
    </div>
  )
}

export function LandingFortex({ locale = "pt-BR" }: { locale?: PublicLocale }) {
  const copy = copyByLocale[locale]

  return (
    <div className="bg-[#050505] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/88 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-6 px-5 py-4 sm:px-8 lg:px-12">
          <Link href="/" className="relative block h-8 w-[114px]">
            <Image src="/swipe-logo-white.svg" alt="Swipe" fill className="object-contain object-left" priority />
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-white/62 lg:flex">
            {copy.nav.map((item) => (
              <Link key={item.label} href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden rounded-full border border-white/12 bg-transparent px-5 text-white hover:bg-white/8 hover:text-white sm:inline-flex">
              <Link href="/login">{copy.header.login}</Link>
            </Button>
            <Button asChild className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90">
              <Link href="/signup">{copy.header.signup}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section id="home" className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,67,3,0.28),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(251,67,3,0.12),transparent_28%)]" />
          <div className="mx-auto grid w-full max-w-[1440px] gap-16 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)] lg:px-12 lg:py-24">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-xs text-white/72">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {copy.hero.badge}
              </div>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.08em] text-white sm:text-6xl lg:text-8xl">
                {copy.hero.title}
              </h1>
              <p className="max-w-xl text-base leading-7 text-white/62 sm:text-lg">
                {copy.hero.description}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full bg-primary px-7 text-primary-foreground hover:bg-primary/90">
                  <Link href="/signup">
                    {copy.hero.primaryCta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="rounded-full border border-white/12 bg-transparent px-7 text-white hover:bg-white/8 hover:text-white">
                  <a href="#about">{copy.hero.secondaryCta}</a>
                </Button>
              </div>
              <div className="grid gap-4 pt-4 sm:grid-cols-3">
                {copy.hero.stats.map((item) => (
                  <div key={item.title} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="text-lg font-medium tracking-[-0.04em] text-white">{item.title}</div>
                    <div className="mt-2 text-sm leading-6 text-white/55">{item.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-[#0d0d0d] p-3 shadow-[0_40px_80px_rgba(0,0,0,0.45)]">
              <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[#0b0b0b]">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-xs text-white/45">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/55">Swipe</div>
                    <span>{copy.hero.previewBadge}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <Smartphone className="h-4 w-4" />
                  </div>
                </div>
                <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="relative min-h-[540px] overflow-hidden">
                    <Image src="/login-background.png" alt="Preview da plataforma Swipe" fill className="object-cover opacity-58" />
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(5,5,5,0.18),rgba(5,5,5,0.74))]" />
                    <div className="relative flex h-full flex-col justify-between p-7">
                      <div className="flex flex-wrap gap-2">
                        {copy.hero.previewChips.map((chip) => (
                          <span key={chip} className="rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/65">
                            {chip}
                          </span>
                        ))}
                      </div>
                      <div className="max-w-md space-y-4">
                        <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                          {copy.hero.previewAboutKicker}
                        </div>
                        <div className="text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl">
                          {copy.hero.previewTitle}
                        </div>
                        <div className="text-sm leading-6 text-white/62">
                          {copy.hero.previewDescription}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-white/10 bg-[#090909] p-6 lg:border-l lg:border-t-0">
                    <div className="space-y-4">
                      <div className="text-xs uppercase tracking-[0.28em] text-white/42">
                        {copy.hero.previewAboutKicker}
                      </div>
                      <div className="text-2xl font-semibold tracking-[-0.05em] text-white">
                        {copy.hero.previewAboutTitle}
                      </div>
                      <div className="text-sm leading-6 text-white/58">
                        {copy.hero.previewAboutDescription}
                      </div>
                    </div>
                    <div className="mt-8 space-y-3">
                      {copy.hero.previewAboutPoints.map((item) => (
                        <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                          <span className="text-sm leading-6 text-white/74">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="services" className="border-b border-white/10 py-24">
          <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:px-12">
            <Heading kicker={copy.services.kicker} title={copy.services.title} description={copy.services.description} />
            <div className="grid gap-5">
              {copy.services.items.map(([index, title, text]) => (
                <article key={title} className="grid gap-6 rounded-[34px] border border-white/10 bg-white/[0.03] p-6 sm:grid-cols-[100px_1fr_auto]">
                  <div className="text-sm uppercase tracking-[0.26em] text-white/34">{index}</div>
                  <div className="max-w-2xl">
                    <h3 className="text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/58 sm:text-base">{text}</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-primary">
                    {title.includes("Checkout") ? (
                      <ShoppingCart className="h-5 w-5" />
                    ) : title.includes("Editor") ? (
                      <Palette className="h-5 w-5" />
                    ) : title.includes("Operation") || title.includes("Operacao") ? (
                      <Workflow className="h-5 w-5" />
                    ) : (
                      <BarChart3 className="h-5 w-5" />
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="border-b border-white/10 py-24">
          <div className="mx-auto grid w-full max-w-[1440px] gap-6 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
            <div className="rounded-[36px] border border-white/10 bg-white/[0.03] p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-white/42">{copy.about.projects}</div>
                  <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{copy.about.title}</div>
                </div>
                <LayoutTemplate className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-8 grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
                <div className="space-y-4 rounded-[28px] border border-white/10 bg-[#090909] p-5">
                  {copy.about.points.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                      <Palette className="mt-0.5 h-4 w-4 text-primary" />
                      <span className="text-sm leading-6 text-white/72">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-[28px] border border-white/10 bg-[#f4efe8] p-5 text-[#18130f]">
                  <div className="rounded-[24px] border border-[#18130f]/10 bg-white p-5 shadow-[0_30px_60px_rgba(24,19,15,0.12)]">
                    <div className="mb-5 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-[#6e6259]">
                      <span>{copy.about.checkoutTitle}</span>
                      <span>{copy.about.checkoutStatus}</span>
                    </div>
                    <div className="space-y-3">
                      {copy.about.checkoutItems.map((item, index) => (
                        <div key={item} className={cn("rounded-2xl border px-4 py-3 text-sm font-medium", index === copy.about.checkoutItems.length - 1 ? "border-[#18130f]/12 bg-[#18130f] text-white" : "border-[#18130f]/10 bg-[#faf7f2] text-[#18130f]")}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-6">
              {copy.about.cards.map((card, index) => (
                <article key={card.title} className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
                  <div className="text-xs uppercase tracking-[0.26em] text-white/36">00{index + 1}</div>
                  <div className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-white">{card.title}</div>
                  <p className="mt-3 text-sm leading-7 text-white/58">{card.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="border-b border-white/10 py-24">
          <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <Heading kicker={copy.process.kicker} title={copy.process.title} description={copy.process.description} />
            <div className="mt-14 grid gap-5 lg:grid-cols-5">
              {copy.process.steps.map((step, index) => (
                <article key={step.title} className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-5xl font-semibold tracking-[-0.08em] text-white/18">{String(index + 1).padStart(2, "0")}</div>
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/52">
                      {copy.process.label}
                    </div>
                  </div>
                  <h3 className="mt-10 text-xl font-semibold tracking-[-0.04em] text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/58">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="border-b border-white/10 py-24">
          <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <Heading kicker={copy.pricing.kicker} title={copy.pricing.title} description={copy.pricing.description} center />
            <div className="mt-14 grid gap-6 xl:grid-cols-3">
              {copy.pricing.cards.map((plan) => (
                <article key={plan.title} className={cn("rounded-[36px] border border-white/10 bg-[#0a0a0a] p-7", plan.featured && "border-primary/40 bg-[#0d0a08]")}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/58">
                      {plan.eyebrow}
                    </div>
                    {plan.featured ? (
                      <div className="rounded-full bg-primary px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-primary-foreground">
                        {copy.pricing.featuredLabel}
                      </div>
                    ) : null}
                  </div>
                  <h3 className="mt-8 text-3xl font-semibold tracking-[-0.06em] text-white">{plan.title}</h3>
                  <div className="mt-8 space-y-3">
                    {plan.points.map((point) => (
                      <div key={point} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                        <span className="text-sm leading-6 text-white/72">{point}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <Button asChild size="lg" className="rounded-full bg-primary px-7 text-primary-foreground hover:bg-primary/90">
                <Link href="/pricing">
                  {copy.pricing.pageCta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
        <section id="contact" className="py-24">
          <div className="mx-auto grid w-full max-w-[1440px] gap-6 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-12">
            <div className="rounded-[36px] border border-white/10 bg-white/[0.03] p-7">
              <div className="text-xs uppercase tracking-[0.28em] text-white/42">{copy.faq.kicker}</div>
              <h3 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white">{copy.faq.title}</h3>
              <div className="mt-8 space-y-4">
                {copy.faq.items.map((faq) => (
                  <article key={faq.question} className="rounded-[24px] border border-white/8 bg-[#090909] p-5">
                    <div className="text-lg font-medium tracking-[-0.04em] text-white">{faq.question}</div>
                    <p className="mt-3 text-sm leading-7 text-white/58">{faq.answer}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="rounded-[36px] border border-white/10 bg-[#0b0b0b] p-7">
              <div className="text-xs uppercase tracking-[0.28em] text-white/42">{copy.contact.kicker}</div>
              <h3 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-white">{copy.contact.title}</h3>
              <p className="mt-5 max-w-xl text-base leading-8 text-white/60">{copy.contact.description}</p>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {copy.contact.cards.map((item) => {
                  const Icon =
                    item.toLowerCase().includes("shopify")
                      ? Globe
                      : item.toLowerCase().includes("withdrawal") || item.toLowerCase().includes("saque")
                        ? CreditCard
                        : item.toLowerCase().includes("mobile")
                          ? Smartphone
                          : Workflow

                  return (
                    <div key={item} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="mt-5 text-xl font-medium tracking-[-0.04em] text-white">{item}</div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="rounded-full bg-primary px-7 text-primary-foreground hover:bg-primary/90">
                  <Link href="/signup">
                    {copy.contact.primaryCta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="rounded-full border border-white/12 bg-transparent px-7 text-white hover:bg-white/8 hover:text-white">
                  <Link href="/login">{copy.contact.secondaryCta}</Link>
                </Button>
              </div>
              <div className="mt-6 text-sm text-white/42">{copy.contact.note}</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 py-10 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-white/38">{copy.footer.navigation}</div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/58">
                {copy.nav.map((item) => (
                  <Link key={item.label} href={item.href} className="hover:text-white">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="text-sm text-white/42">
              © {new Date().getFullYear()} Swipe. {copy.footer.rights}
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/42 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-white">
                {copy.footer.privacy}
              </Link>
              <Link href="/terms" className="hover:text-white">
                {copy.footer.terms}
              </Link>
            </div>
            <div>{copy.footer.tagline}</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
