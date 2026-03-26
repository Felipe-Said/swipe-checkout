"use client"

import * as React from "react"
import { CheckCircle2, Store, Laptop, ArrowRightCircle, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function ShopifySetupTutorial() {
  return (
    <Card className="border-primary/10 bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl">
      <CardHeader className="bg-primary/5 pb-6 border-b border-primary/10">
        <div className="flex items-center gap-3 mb-2">
           <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Info className="h-6 w-6" />
           </div>
           <div>
              <CardTitle className="text-xl">Como conectar sua loja</CardTitle>
              <CardDescription>Siga o passo a passo para garantir uma integração sem erros.</CardDescription>
           </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Accordion type="single" collapsible defaultValue="shopify-side" className="w-full">
          <AccordionItem value="shopify-side" className="border-b-0 px-6 py-2">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <Store className="h-5 w-5 text-primary" />
                <span className="font-bold">1. Ações no Admin Shopify</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-4 pt-2 pb-4">
                {[
                  "Entre no painel administrativo da sua loja Shopify.",
                  "Confirme se você está logado na loja correta.",
                  "Tenha o domínio .myshopify.com em mãos.",
                  "Autorize a instalação do App Swipe quando solicitado.",
                  "Revise as permissões de leitura de produtos e pedidos.",
                  "Aguarde o redirecionamento automático de volta para o Swipe."
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 border border-primary/20">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <Separator className="mx-6 opacity-30" />

          <AccordionItem value="swipe-side" className="border-b-0 px-6 py-2">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <Laptop className="h-5 w-5 text-primary" />
                <span className="font-bold">2. Ações no Painel Swipe</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-4 pt-2 pb-4">
                {[
                  "Informe o domínio .myshopify.com no assistente ao lado.",
                  "Dê um nome interno para identificar sua loja no Swipe.",
                  "Clique em \"Conectar com Shopify\" para iniciar o fluxo.",
                  "Siga as etapas visuais no assistente de progresso.",
                  "Aguarde a validação da permissão e autorização.",
                  "Verifique o status de \"Conectado\" após o retorno."
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 border border-primary/20">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <Separator className="mx-6 opacity-30" />

          <AccordionItem value="after-connection" className="border-b-0 px-6 py-2">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <ArrowRightCircle className="h-5 w-5 text-primary" />
                <span className="font-bold">3. Pós-Conexão e Sincronia</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
               <div className="bg-muted/30 p-4 rounded-xl border border-dashed border-primary/20 mb-4">
                  <p className="text-xs text-muted-foreground font-medium italic">
                    "O Swipe inicia automaticamente a sincronização do catálogo assim que a autorização é confirmada."
                  </p>
               </div>
              <ul className="space-y-4 pt-2 pb-4">
                {[
                  "Acompanhe o progresso da sincronização inicial.",
                  "Confira a contagem de produtos e variantes importados.",
                  "Verifique se o selo \"Conectada\" aparece no card da loja.",
                  "Se houver qualquer erro, consulte a área de Troubleshooting abaixo."
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 border border-primary/20">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
