"use client"

import * as React from "react"
import { AlertCircle, HelpCircle, RefreshCw, ShieldAlert, ZapOff, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ShopifyTroubleshootingCenter() {
  const issues = [
    {
      title: "Loja não autorizou o app",
      description: "O redirecionamento para a Shopify falhou ou a instalação foi cancelada pelo usuário.",
      icon: ShieldAlert,
      action: "Tentar Reconectar"
    },
    {
      title: "Sincronização em andamento",
      description: "O catálogo é grande e a importação inicial ainda não foi concluída. Aguarde alguns minutos.",
      icon: RefreshCw,
      action: "Atualizar Status"
    },
    {
      title: "Domínio Invalido",
      description: "O domínio .myshopify.com informado não é válido ou a loja está desativada.",
      icon: ZapOff,
      action: "Ver Tutorial"
    }
  ]

  return (
    <Card className="border-destructive/10 bg-destructive/5 backdrop-blur-sm shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
             <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-lg">Centro de Resolução</CardTitle>
            <CardDescription>Precisa de ajuda com a conexão? Veja as soluções comuns.</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {issues.map((issue, i) => (
            <div key={i} className="bg-background/40 p-5 rounded-2xl border border-destructive/5 space-y-4 hover:border-destructive/20 transition-all group">
               <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive group-hover:scale-110 transition-transform">
                     <issue.icon className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-black tracking-tight">{issue.title}</h4>
               </div>
               <p className="text-xs text-muted-foreground leading-relaxed">
                  {issue.description}
               </p>
               <Button variant="ghost" size="sm" className="w-full justify-between h-8 text-[11px] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive">
                  {issue.action}
                  <ArrowRight className="h-3 w-3" />
               </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground bg-background/20 p-3 rounded-xl border border-dashed">
           <HelpCircle className="h-4 w-4" />
           Ainda tem dúvidas? 
           <a href="#" className="font-bold text-primary hover:underline">Fale com o suporte Swipe</a>
        </div>
      </CardContent>
    </Card>
  )
}
