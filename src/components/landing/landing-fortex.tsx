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
  Shield,
  ShoppingCart,
  Smartphone,
  Workflow,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const nav = ["Home", "About", "Services", "Process", "Pricing", "Contact"]
const logos = ["Shopify", "Whop", "Supabase", "Vercel", "Meta Pixel", "Google Ads"]
const services = [
  ["001", "Gestao de Checkouts", "Crie, publique e opere checkouts com controle total."],
  ["002", "Editor Visual", "Controle branding, layouts, blocos e responsividade."],
  ["003", "Operacao", "Gerencie fretes, pixels, PushCut, pedidos e saques."],
  ["004", "Dashboard", "Acompanhe faturamento, conversao e comportamento real."],
] as const
const process = [
  "Crie sua conta",
  "Configure seu workspace",
  "Personalize seu checkout",
  "Ative as operacoes",
  "Gerencie e escale",
]
const pricing: Array<{
  eyebrow: string
  title: string
  points: string[]
  featured?: boolean
}> = [
  {
    eyebrow: "Basic",
    title: "Workspace do Usuario",
    points: [
      "Criacao ilimitada de checkouts",
      "Conexao com multiplas lojas",
      "Gestao de dominios e pixels",
      "Relatorios de vendas e conversao",
    ],
  },
  {
    eyebrow: "Standard",
    title: "Supervisao Administrativa",
    featured: true,
    points: [
      "Visao operacional em tempo real",
      "Gestao e aprovacao de saques",
      "Controle de bloqueio de contas",
      "Dashboard consolidado de escala",
    ],
  },
  {
    eyebrow: "Premium",
    title: "Controle de Escala",
    points: [
      "Sincronizacao Shopify + Whop",
      "Controle de gateway e payout",
      "Funil do checkout em tempo real",
      "Operacao preparada para escalar",
    ],
  },
]
const contactCards = [
  { title: "Conexao Shopify", icon: Globe },
  { title: "Fluxos de Saque", icon: CreditCard },
  { title: "Preview Mobile", icon: Smartphone },
  { title: "Controle Operacional", icon: Workflow },
]
const faqs = [
  "A Swipe funciona com Shopify?",
  "Consigo editar o checkout com liberdade total?",
  "A operacao inclui pixels, frete e notificacoes?",
  "Existe visao para admin e usuario?",
]

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

export function LandingFortex() {
  return (
    <div className="bg-[#050505] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/88 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-6 px-5 py-4 sm:px-8 lg:px-12">
          <Link href="/" className="relative block h-8 w-[114px]">
            <Image src="/swipe-logo-white.svg" alt="Swipe" fill className="object-contain object-left" priority />
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-white/62 lg:flex">
            {nav.map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-white">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden rounded-full border border-white/12 bg-transparent px-5 text-white hover:bg-white/8 hover:text-white sm:inline-flex">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90">
              <Link href="/signup">Criar conta</Link>
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
                Saques disponiveis sem rastreio em 2 dias
              </div>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.08em] text-white sm:text-6xl lg:text-8xl">
                Crie e opere checkouts com controle total.
              </h1>
              <p className="max-w-xl text-base leading-7 text-white/62 sm:text-lg">
                Uma plataforma para construir, gerenciar e escalar sua operacao de checkout. Controle layout, operacao e gestao em um so lugar.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full bg-primary px-7 text-primary-foreground hover:bg-primary/90">
                  <Link href="/signup">Criar conta gratis<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="rounded-full border border-white/12 bg-transparent px-7 text-white hover:bg-white/8 hover:text-white">
                  <a href="#about">Ver plataforma</a>
                </Button>
              </div>
              <div className="grid gap-4 pt-4 sm:grid-cols-3">
                {[
                  ["Editor", "Controle visual em desktop e mobile"],
                  ["Shopify", "Sincronizacao real de produto e operacao"],
                  ["Dashboard", "Conversao, pedidos e saques em tempo real"],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="text-lg font-medium tracking-[-0.04em] text-white">{title}</div>
                    <div className="mt-2 text-sm leading-6 text-white/55">{text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-[#0d0d0d] p-3 shadow-[0_40px_80px_rgba(0,0,0,0.45)]">
              <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[#0b0b0b]">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-xs text-white/45">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/55">Swipe</div>
                    <span>Checkout publicado</span>
                  </div>
                  <div className="flex items-center gap-2"><Monitor className="h-4 w-4" /><Smartphone className="h-4 w-4" /></div>
                </div>
                <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="relative min-h-[540px] overflow-hidden">
                    <Image src="/login-background.png" alt="Preview da plataforma Swipe" fill className="object-cover opacity-58" />
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(5,5,5,0.18),rgba(5,5,5,0.74))]" />
                    <div className="relative flex h-full flex-col justify-between p-7">
                      <div className="flex flex-wrap gap-2">
                        {["Funcionalidades", "Editor Visual", "Operacoes"].map((chip) => (
                          <span key={chip} className="rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/65">{chip}</span>
                        ))}
                      </div>
                      <div className="max-w-md space-y-4">
                        <div className="text-xs uppercase tracking-[0.3em] text-white/50">Plataforma premium para operacao</div>
                        <div className="text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl">Total liberdade criativa com uma operacao pronta para escalar.</div>
                        <div className="text-sm leading-6 text-white/62">Editor visual, preview mobile, dominios proprios, pixels, saques e dashboard real em uma unica area.</div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-white/10 bg-[#090909] p-6 lg:border-l lg:border-t-0">
                    <div className="space-y-4">
                      <div className="text-xs uppercase tracking-[0.28em] text-white/42">About</div>
                      <div className="text-2xl font-semibold tracking-[-0.05em] text-white">Tudo o que voce precisa para operar com excelencia.</div>
                      <div className="text-sm leading-6 text-white/58">A Swipe centraliza toda a sua operacao de checkout em uma unica plataforma premium e intuitiva.</div>
                    </div>
                    <div className="mt-8 space-y-3">
                      {["Gestao de checkouts", "Editor visual", "Preview instantaneo desktop e mobile", "Conexao Shopify e dominios proprios", "Pixels, PushCut, frete e metricas avancadas"].map((item) => (
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

        <section className="border-b border-white/10">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 py-8 text-white/42 sm:px-8 lg:px-12">
            <div className="text-xs uppercase tracking-[0.32em]">Trusted</div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
              {logos.map((item) => (
                <div key={item} className="text-sm font-medium uppercase tracking-[0.22em] text-white/55">{item}</div>
              ))}
            </div>
          </div>
        </section>

        <section id="services" className="border-b border-white/10 py-24">
          <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:px-12">
            <Heading kicker="Services" title="Uma plataforma premium para construir, gerenciar e escalar checkouts." description="A Swipe combina controle visual, operacao real e supervisao administrativa em um produto unico." />
            <div className="grid gap-5">
              {services.map(([index, title, text]) => (
                <article key={title} className="grid gap-6 rounded-[34px] border border-white/10 bg-white/[0.03] p-6 sm:grid-cols-[100px_1fr_auto]">
                  <div className="text-sm uppercase tracking-[0.26em] text-white/34">{index}</div>
                  <div className="max-w-2xl">
                    <h3 className="text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/58 sm:text-base">{text}</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-primary">
                    {title === "Gestao de Checkouts" ? <ShoppingCart className="h-5 w-5" /> : title === "Editor Visual" ? <Palette className="h-5 w-5" /> : title === "Operacao" ? <Workflow className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
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
                  <div className="text-xs uppercase tracking-[0.28em] text-white/42">Projects</div>
                  <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">Editor visual poderoso. Total liberdade criativa.</div>
                </div>
                <LayoutTemplate className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-8 grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
                <div className="space-y-4 rounded-[28px] border border-white/10 bg-[#090909] p-5">
                  {["Personalizacao completa de branding", "Modos Classic e One-page layout", "Preview instantaneo desktop e mobile", "Configuracao de banners e backgrounds", "Controle de campos e politicas"].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                      <Palette className="mt-0.5 h-4 w-4 text-primary" />
                      <span className="text-sm leading-6 text-white/72">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-[28px] border border-white/10 bg-[#f4efe8] p-5 text-[#18130f]">
                  <div className="rounded-[24px] border border-[#18130f]/10 bg-white p-5 shadow-[0_30px_60px_rgba(24,19,15,0.12)]">
                    <div className="mb-5 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-[#6e6259]"><span>Swipe checkout</span><span>published</span></div>
                    <div className="space-y-3">
                      {["Contato", "Entrega", "Frete", "Pagamento", "Resumo do pedido"].map((item, index) => (
                        <div key={item} className={cn("rounded-2xl border px-4 py-3 text-sm font-medium", index === 4 ? "border-[#18130f]/12 bg-[#18130f] text-white" : "border-[#18130f]/10 bg-[#faf7f2] text-[#18130f]")}>{item}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-6">
              {[
                "Controle total sobre cores, fontes, layouts e elementos do seu checkout.",
                "A Swipe centraliza Shopify, dominios, fretes, pixels, pedidos e saques em uma unica operacao.",
                "Estrutura pensada tanto para operacao individual quanto para supervisao administrativa em larga escala.",
              ].map((text, index) => (
                <article key={text} className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
                  <div className="text-xs uppercase tracking-[0.26em] text-white/36">00{index + 1}</div>
                  <div className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-white">{index === 0 ? "Editor Visual Poderoso" : index === 1 ? "Muito mais que um construtor" : "Uma plataforma multifuncional"}</div>
                  <p className="mt-3 text-sm leading-7 text-white/58">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="border-b border-white/10 py-24">
          <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <Heading kicker="Process" title="Do zero ao checkout operando em escala em poucos minutos." description="A mesma logica da home atual foi mantida, so que agora dentro da estrutura visual da Fortex." />
            <div className="mt-14 grid gap-5 lg:grid-cols-5">
              {process.map((step, index) => (
                <article key={step} className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-5xl font-semibold tracking-[-0.08em] text-white/18">{String(index + 1).padStart(2, "0")}</div>
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/52">Step</div>
                  </div>
                  <h3 className="mt-10 text-xl font-semibold tracking-[-0.04em] text-white">{step}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/58">{index === 0 ? "Comece em segundos com um processo de registro simples e intuitivo." : index === 1 ? "Conecte sua loja Shopify e defina as preferencias basicas da operacao." : index === 2 ? "Use o editor visual para deixar o checkout com a identidade da sua marca." : index === 3 ? "Configure frete, dominios, pixels e notificacoes PushCut no mesmo fluxo." : "Acompanhe tudo pelo dashboard e otimize sua conversao com controle total."}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="border-b border-white/10 py-24">
          <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <Heading kicker="Pricing" title="Uma plataforma, multifuncional." description="A estrutura da Fortex pedia um bloco de planos. Aqui ele virou a apresentacao dos modos reais de operacao da Swipe." center />
            <div className="mt-14 grid gap-6 xl:grid-cols-3">
              {pricing.map((plan) => (
                <article key={plan.title} className={cn("rounded-[36px] border border-white/10 bg-[#0a0a0a] p-7", plan.featured && "border-primary/40 bg-[#0d0a08]")}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/58">{plan.eyebrow}</div>
                    {plan.featured ? <div className="rounded-full bg-primary px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-primary-foreground">Most used</div> : null}
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
          </div>
        </section>

        <section id="contact" className="py-24">
          <div className="mx-auto grid w-full max-w-[1440px] gap-6 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-12">
            <div className="rounded-[36px] border border-white/10 bg-white/[0.03] p-7">
              <div className="text-xs uppercase tracking-[0.28em] text-white/42">FAQ</div>
              <h3 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white">Tudo o que voce precisa saber antes de operar.</h3>
              <div className="mt-8 space-y-4">
                {faqs.map((faq, index) => (
                  <article key={faq} className="rounded-[24px] border border-white/8 bg-[#090909] p-5">
                    <div className="text-lg font-medium tracking-[-0.04em] text-white">{faq}</div>
                    <p className="mt-3 text-sm leading-7 text-white/58">{index === 0 ? "Sim. A plataforma foi desenhada para conectar lojas Shopify, sincronizar catalogo e operar checkouts publicados com dominio proprio." : index === 1 ? "Sim. O editor permite controlar branding, blocos, layout, CSS customizado, preview desktop e mobile e paginas complementares." : index === 2 ? "Sim. A mesma estrutura do checkout conecta pixels, metodos de frete, notificacoes PushCut e funil de comportamento." : "Sim. O produto foi projetado para ter workspace do usuario e supervisao administrativa sem quebrar a operacao."}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="rounded-[36px] border border-white/10 bg-[#0b0b0b] p-7">
              <div className="text-xs uppercase tracking-[0.28em] text-white/42">Contact</div>
              <h3 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-white">Pronto para escalar seu checkout com a Swipe?</h3>
              <p className="mt-5 max-w-xl text-base leading-8 text-white/60">Junte-se a produtores e empresas que ja operam suas vendas com total controle e performance.</p>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {contactCards.map((item) => (
                  <div key={item.title} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-primary"><item.icon className="h-4 w-4" /></div>
                    <div className="mt-5 text-xl font-medium tracking-[-0.04em] text-white">{item.title}</div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="rounded-full bg-primary px-7 text-primary-foreground hover:bg-primary/90">
                  <Link href="/signup">Comecar agora<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="rounded-full border border-white/12 bg-transparent px-7 text-white hover:bg-white/8 hover:text-white">
                  <Link href="/login">Fazer login</Link>
                </Button>
              </div>
              <div className="mt-6 text-sm text-white/42">Nao requer cartao de credito para comecar.</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 py-10 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-white/38">Navigation</div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/58">
                {nav.map((item) => (
                  <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-white">{item}</a>
                ))}
              </div>
            </div>
            <div className="text-sm text-white/42">© {new Date().getFullYear()} Swipe. Todos os direitos reservados.</div>
          </div>
          <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/42 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms</a>
            </div>
            <div>Designed for checkout operations with total control.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
