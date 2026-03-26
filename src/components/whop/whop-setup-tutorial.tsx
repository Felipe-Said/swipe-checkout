"use client"

import * as React from "react"
import { 
  CheckCircle2, 
  Store, 
  Laptop, 
  ArrowRightCircle, 
  Info, 
  ExternalLink,
  ShieldCheck,
  Webhook as WebhookIcon,
  ShoppingBag
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function WhopSetupTutorial() {
  return (
    <Card className="border-primary/10 bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl">
      <CardHeader className="bg-primary/5 pb-6 border-b border-primary/10">
        <div className="flex items-center gap-3 mb-2">
           <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Info className="h-6 w-6" />
           </div>
           <div>
              <CardTitle className="text-xl">Como integrar a Whop</CardTitle>
              <CardDescription>Siga os passos exatos para uma conexão de alta performance.</CardDescription>
           </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Accordion type="single" collapsible defaultValue="whop-side" className="w-full">
          <AccordionItem value="whop-side" className="border-b-0 px-6 py-2">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <Store className="h-5 w-5 text-primary" />
                <span className="font-black text-sm uppercase tracking-tight">1. O que fazer na Whop</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-4 pt-2 pb-4">
                {[
                  "Entre no painel de desenvolvedor da conta Whop correta.",
                  "Crie ou localize a API key da conta que será usada nesta operação.",
                  "Revise as permissões da chave antes de copiar.",
                  "Copie a chave com segurança.",
                  "Se for usar ambiente de testes, confirme se você está no ambiente correto."
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-[13px]">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 border border-primary/20">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground leading-relaxed font-medium">{step}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 pb-4">
                 <a href="https://dev.whop.com/get-api-key" target="_blank" className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-primary/5 text-xs font-bold hover:bg-muted/50 transition-colors">
                    Obter API Key na Whop
                    <ExternalLink className="h-3.5 w-3.5" />
                 </a>
              </div>
            </AccordionContent>
          </AccordionItem>

          <Separator className="mx-6 opacity-30" />

          <AccordionItem value="swipe-side" className="border-b-0 px-6 py-2">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <Laptop className="h-5 w-5 text-primary" />
                <span className="font-black text-sm uppercase tracking-tight">2. O que fazer no Swipe</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-4 pt-2 pb-4">
                {[
                  "Selecione a conta correta dentro do Swipe.",
                  "Cole a API key no campo da integração.",
                  "Clique em salvar a chave.",
                  "Depois execute a validação da integração clicando no botão superior.",
                  "Confirme se o status da chave, permissões, checkout e webhook aparecem como prontos.",
                  "Se houver pendência, siga a ação sugerida pelo painel de diagnóstico."
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-[13px]">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 border border-primary/20">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground leading-relaxed font-medium">{step}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <Separator className="mx-6 opacity-30" />

          <AccordionItem value="readiness" className="border-b-0 px-6 py-2">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <span className="font-black text-sm uppercase tracking-tight text-emerald-500/80">3. Como saber se ficou pronto</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
               <div className="bg-emerald-500/5 p-4 rounded-xl border border-dashed border-emerald-500/20 mb-4">
                  <p className="text-xs text-emerald-500/80 font-bold italic">
                    "A integração só é considerada operacional quando todos os diagnósticos estão verdes."
                  </p>
               </div>
              <ul className="space-y-4 pt-2 pb-4">
                <li className="flex gap-3 text-[13px]">
                   <span className="h-5 w-5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                      <CheckCircle2 className="h-3 w-3" />
                   </span>
                   <span className="text-muted-foreground leading-relaxed font-medium">A credencial deve aparecer como <strong className="text-foreground">Salva e Validada</strong>.</span>
                </li>
                <li className="flex gap-3 text-[13px]">
                   <span className="h-5 w-5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                      <ShieldCheck className="h-3 w-3" />
                   </span>
                   <span className="text-muted-foreground leading-relaxed font-medium"><strong className="text-foreground">Permissões Verificadas</strong> (leitura de produtos e configurações).</span>
                </li>
                <li className="flex gap-3 text-[13px]">
                   <span className="h-5 w-5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                      <ShoppingBag className="h-3 w-3" />
                   </span>
                   <span className="text-muted-foreground leading-relaxed font-medium">O painel deve indicar <strong className="text-foreground">Readiness de Checkout</strong>.</span>
                </li>
                <li className="flex gap-3 text-[13px]">
                   <span className="h-5 w-5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                      <WebhookIcon className="h-3 w-3" />
                   </span>
                   <span className="text-muted-foreground leading-relaxed font-medium">Status operacional <strong className="text-foreground">Conectado</strong> no monitor global.</span>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
