import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  ChevronRight,
  PlayCircle,
  LayoutDashboard,
  MousePointerClick,
  ShoppingCart,
  MessageSquare,
  Globe,
  Store,
  Landmark,
  TrendingUp,
  Percent,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-32 md:pb-32 md:pt-48">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-full w-full -translate-x-1/2">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/10 opacity-50 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/10 opacity-50 blur-[120px]" />
      </div>

      <div className="container relative z-10 text-center">
        <div className="mb-8 inline-flex animate-in items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium fade-in slide-in-from-bottom-4 duration-500">
          <span className="flex h-2 w-2 animate-pulse rounded-full bg-primary" />
          Saques disponiveis sem rastreio em 2 dias
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </div>

        <h1 className="mb-6 animate-in bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent fade-in slide-in-from-bottom-8 duration-700 md:text-6xl lg:text-7xl">
          Crie e opere checkouts <br className="hidden md:block" /> com controle total.
        </h1>

        <p className="mx-auto mb-10 max-w-[700px] animate-in text-lg text-muted-foreground fade-in slide-in-from-bottom-12 duration-1000 md:text-xl">
          Uma plataforma para construir, gerenciar e escalar sua operacao de checkout.
          Controle layout, operacao e gestao em um so lugar.
        </p>

        <div className="mb-20 flex animate-in flex-col items-center justify-center gap-4 fade-in slide-in-from-bottom-16 duration-1000 sm:flex-row">
          <Button
            size="lg"
            className="group h-14 px-8 text-lg font-semibold shadow-xl shadow-primary/20"
            asChild
          >
            <Link href="/signup">
              Criar conta gratis
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14 bg-background/50 px-8 text-lg font-semibold backdrop-blur-sm"
            asChild
          >
              <Link href="/login">
                <PlayCircle className="mr-2 h-5 w-5" />
                Ver plataforma
              </Link>
            </Button>
        </div>

        <div className="relative mx-auto mt-12 max-w-6xl animate-in zoom-in fade-in duration-1000 delay-300">
          <div className="group relative overflow-hidden rounded-2xl border bg-card/50 p-4 shadow-2xl backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-50 transition-opacity group-hover:opacity-100" />
            <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted shadow-inner">
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-zinc-900">
                <div className="h-full w-full p-5">
                  <div className="flex h-full gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3">
                    <div className="w-48 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                      <div className="flex items-center gap-2 px-2 pb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
                          <Wallet className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-semibold text-white">Swipe</span>
                      </div>

                      <div className="space-y-2">
                        {[
                          { label: "Inicio", icon: LayoutDashboard },
                          { label: "Checkouts", icon: MousePointerClick },
                          { label: "Pedidos", icon: ShoppingCart },
                          { label: "Messenger", icon: MessageSquare },
                          { label: "Dominios", icon: Globe },
                          { label: "Lojas", icon: Store },
                          { label: "Saques", icon: Landmark },
                        ].map((item, index) => {
                          const Icon = item.icon

                          return (
                            <div
                              key={item.label}
                              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs ${
                                index === 0
                                  ? "bg-white/10 font-medium text-white"
                                  : "text-zinc-400"
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              <span>{item.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                      <div>
                        <div className="text-lg font-semibold text-white">Painel do usuario</div>
                      <div className="text-xs text-zinc-400">
                          Visao da plataforma para novos visitantes.
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-4 gap-3">
                        {[
                          { label: "Receita", value: "R$ 12.450", icon: Wallet },
                          { label: "Conversao", value: "92.8%", icon: TrendingUp },
                          { label: "Taxa", value: "15%", icon: Percent },
                          { label: "Pedidos", value: "128", icon: ShoppingCart },
                        ].map((item) => {
                          const Icon = item.icon

                          return (
                            <div
                              key={item.label}
                              className="rounded-xl border border-zinc-800 bg-zinc-800/50 p-4"
                            >
                              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                                <span>{item.label}</span>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="mt-3 text-lg font-semibold text-white">
                                {item.value}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-800/40 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">Campanhas</div>
                            <div className="text-xs text-zinc-400">
                              As com mais vendas sobem para o topo.
                            </div>
                          </div>
                          <div className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium text-white">
                            Operacao em destaque
                          </div>
                        </div>

                        <div className="mt-4 space-y-3">
                          {[
                            {
                              name: "Meta - Colecao Inverno",
                              stats: "14 compras",
                              revenue: "R$ 4.280",
                            },
                            {
                              name: "Google - Search Premium",
                              stats: "9 compras",
                              revenue: "R$ 2.910",
                            },
                            {
                              name: "TikTok - Oferta Relampago",
                              stats: "7 compras",
                              revenue: "R$ 1.880",
                            },
                          ].map((campaign) => (
                            <div
                              key={campaign.name}
                              className="flex items-center justify-between rounded-xl bg-zinc-800 p-3"
                            >
                              <div>
                                <div className="text-sm font-medium text-white">
                                  {campaign.name}
                                </div>
                                <div className="text-[11px] text-zinc-400">
                                  {campaign.stats}
                                </div>
                              </div>
                              <div className="text-sm font-semibold text-white">
                                {campaign.revenue}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -right-6 -top-6 -z-10 h-24 w-24 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-6 -left-6 -z-10 h-24 w-24 rounded-full bg-blue-500/20 blur-3xl" />
        </div>
      </div>
    </section>
  )
}
