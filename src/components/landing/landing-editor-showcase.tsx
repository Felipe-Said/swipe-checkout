import * as React from "react"
import {
  CheckCircle2,
  Monitor,
  Smartphone,
  Brush,
  LayoutTemplate,
  Settings2,
  Palette,
  Image as ImageIcon,
  Type,
  SlidersHorizontal,
} from "lucide-react"

import { Button } from "@/components/ui/button"

export function LandingEditorShowcase() {
  return (
    <section id="editor" className="overflow-hidden py-24">
      <div className="container">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className="relative">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-[100px] -z-10" />
            <div className="space-y-8">
              <div>
                <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-5xl">
                  Editor Visual Poderoso. <br /> Total Liberdade Criativa.
                </h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Nao se limite a templates engessados. Com o nosso editor visual, voce tem
                  controle total sobre cores, fontes, layouts e elementos do seu checkout.
                </p>
              </div>

              <ul className="space-y-4">
                {[
                  "Personalizacao completa de branding",
                  "Modos Classic e One-page layout",
                  "Preview instantaneo Desktop e Mobile",
                  "Configuracao de banners e backgrounds",
                  "Controle de campos e politicas",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <Button size="lg" className="px-8 shadow-lg shadow-primary/20">
                  Experimentar Editor
                </Button>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative flex aspect-[4/3] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl">
              <div className="flex h-10 items-center justify-between border-b bg-muted/50 px-4">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-destructive/30" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/30" />
                  <div className="h-3 w-3 rounded-full bg-green-500/30" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-md border bg-background px-3 py-1 text-[10px] font-medium text-muted-foreground">
                    Editor visual
                  </div>
                  <div className="flex gap-2 rounded-md bg-muted px-2 py-1">
                    <Monitor className="h-3 w-3 text-muted-foreground" />
                    <Smartphone className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="flex flex-1 bg-muted/30">
                <div className="w-52 rounded-none border-r bg-card p-3">
                  <div className="border-b px-2 pb-4">
                    <div className="text-sm font-semibold">Editor de checkout</div>
                     <div className="mt-1 text-[11px] text-muted-foreground">
                       Area de configuracao do checkout
                     </div>
                  </div>

                  <div className="mt-4 flex gap-2 px-2">
                    <div className="flex h-8 flex-1 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <Brush className="h-4 w-4" />
                    </div>
                    <div className="flex h-8 flex-1 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <LayoutTemplate className="h-4 w-4" />
                    </div>
                    <div className="flex h-8 flex-1 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Settings2 className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="space-y-2 rounded-xl border bg-card p-3">
                      <div className="flex items-center gap-2 text-xs">
                        <Palette className="h-3.5 w-3.5 text-primary" />
                        Cor principal
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-8 rounded-md border bg-white" />
                        <div className="h-8 flex-1 rounded-md bg-muted" />
                      </div>
                    </div>

                    <div className="space-y-2 rounded-xl border bg-card p-3">
                      <div className="flex items-center gap-2 text-xs">
                        <ImageIcon className="h-3.5 w-3.5 text-primary" />
                        Banner desktop
                      </div>
                      <div className="flex h-14 items-center justify-center rounded-md border border-dashed text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="space-y-2 rounded-xl border bg-card p-3">
                      <div className="flex items-center gap-2 text-xs">
                        <Type className="h-3.5 w-3.5 text-primary" />
                        Texto do botao
                      </div>
                      <div className="h-8 rounded-md bg-muted" />
                    </div>

                    <div className="space-y-2 rounded-xl border bg-card p-3">
                      <div className="flex items-center gap-2 text-xs">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                        Politicas e layout
                      </div>
                      <div className="space-y-2">
                        <div className="h-6 rounded-md bg-muted" />
                        <div className="h-6 rounded-md bg-muted" />
                        <div className="h-6 rounded-md bg-muted" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full border bg-background px-3 py-1 text-[10px] font-medium text-muted-foreground">
                        Checkout publicado
                      </div>
                      <div className="rounded-md border bg-background px-3 py-1 text-[10px] font-medium text-muted-foreground">
                        Layout classico
                      </div>
                    </div>
                    <div className="rounded-md border bg-background px-3 py-1 text-[10px] font-medium text-muted-foreground">
                      Desktop
                    </div>
                  </div>

                  <div className="mt-4 flex h-[calc(100%-2.25rem)] items-center justify-center rounded-2xl border bg-muted/30 p-6">
                    <div className="w-[350px] rounded-[28px] border bg-white p-5 shadow-2xl">
                      <div className="mb-5 flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Minha Loja Premium</span>
                        <span>Desktop</span>
                      </div>

                      <div className="mb-5 flex items-center gap-2 text-[11px] text-sky-600">
                        <span>Carrinho</span>
                        <span>›</span>
                        <span className="font-medium">Informacoes</span>
                        <span>›</span>
                        <span>Pagamento</span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 text-sm font-semibold text-zinc-900">Contato</div>
                          <div className="space-y-2">
                            <div className="h-10 rounded-lg border border-zinc-200 bg-zinc-50" />
                            <div className="h-10 rounded-lg border border-zinc-200 bg-zinc-50" />
                            <div className="h-10 rounded-lg border border-zinc-200 bg-zinc-50" />
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 text-sm font-semibold text-zinc-900">Entrega</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="h-10 rounded-lg border border-zinc-200 bg-zinc-50" />
                            <div className="h-10 rounded-lg border border-zinc-200 bg-zinc-50" />
                          </div>
                          <div className="mt-2 h-10 rounded-lg border border-zinc-200 bg-zinc-50" />
                        </div>

                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                          <div className="mb-2 text-xs font-medium text-zinc-700">Resumo do pedido</div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-[11px] text-zinc-500">
                              <span>Subtotal</span>
                              <span>R$ 1.250,00</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-zinc-500">
                              <span>Frete</span>
                              <span>R$ 29,90</span>
                            </div>
                            <div className="flex justify-between text-sm font-semibold text-zinc-900">
                              <span>Total</span>
                              <span>R$ 1.279,90</span>
                            </div>
                          </div>
                        </div>

                        <div className="h-11 rounded-xl bg-zinc-900 shadow-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-blue-500/10 blur-[100px] -z-10" />
          </div>
        </div>
      </div>
    </section>
  )
}
