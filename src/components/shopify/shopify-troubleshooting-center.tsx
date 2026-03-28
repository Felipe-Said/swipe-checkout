"use client"

import * as React from "react"
import { AlertCircle, HelpCircle, RefreshCw, ShieldAlert, ZapOff, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ShopifyTroubleshootingCenter() {
  const issues = [
    {
      title: "App Embed nao ativado",
      description: "A loja conectou, mas o tema ainda nao ativou o App Embed do Swipe com a URL publica da aplicacao.",
      icon: ShieldAlert,
      action: "Abrir Tema",
    },
    {
      title: "Sincronizacao em andamento",
      description: "O catalogo e grande e a importacao inicial ainda nao foi concluida. Aguarde alguns minutos.",
      icon: RefreshCw,
      action: "Atualizar Status",
    },
    {
      title: "Dominio Invalido",
      description: "O dominio .myshopify.com informado nao e valido ou a loja esta desativada.",
      icon: ZapOff,
      action: "Ver Tutorial",
    },
  ]

  return (
    <Card className="border-destructive/10 bg-destructive/5 backdrop-blur-sm shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-lg">Centro de Resolucao</CardTitle>
            <CardDescription>Precisa de ajuda com a conexao? Veja as solucoes comuns.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {issues.map((issue, i) => (
            <div
              key={i}
              className="group flex min-h-[220px] flex-col rounded-2xl border border-destructive/5 bg-background/40 p-5 transition-all hover:border-destructive/20"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition-transform group-hover:scale-110">
                  <issue.icon className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-black leading-tight tracking-tight">{issue.title}</h4>
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{issue.description}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-5 h-9 w-full justify-between rounded-xl px-0 text-sm font-bold text-destructive hover:bg-transparent hover:text-destructive"
              >
                {issue.action}
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-background/20 p-4 text-center text-sm text-muted-foreground sm:flex-row">
          <HelpCircle className="h-4 w-4" />
          Ainda tem duvidas?
          <a href="#" className="font-bold text-primary hover:underline">
            Fale com o suporte Swipe
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
