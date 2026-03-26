"use client"

import * as React from "react"
import { Store, Laptop, ArrowRightCircle, Info } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function ShopifySetupTutorial() {
  return (
    <Card className="overflow-hidden border-primary/10 bg-card/50 shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-primary/10 bg-primary/5 pb-6">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Info className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">Como conectar sua loja</CardTitle>
            <CardDescription>Siga o passo a passo para validar a Shopify sem erros.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Accordion type="single" collapsible defaultValue="shopify-side" className="w-full">
          <AccordionItem value="shopify-side" className="border-b-0 px-6 py-2">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <Store className="h-5 w-5 text-primary" />
                <span className="font-bold">1. Acoes no Admin Shopify</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-4 pb-4 pt-2">
                {[
                  "Entre no painel administrativo da sua loja Shopify.",
                  "Confirme se voce esta logado na loja correta.",
                  "Tenha o dominio .myshopify.com em maos.",
                  "Crie ou copie um Storefront API token com acesso de leitura do catalogo.",
                  "Garanta que o token possa ler produtos publicados na Storefront API.",
                  "Volte ao Swipe com o dominio e o token prontos.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed text-muted-foreground">{step}</span>
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
                <span className="font-bold">2. Acoes no Painel Swipe</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-4 pb-4 pt-2">
                {[
                  "Informe o dominio .myshopify.com no assistente ao lado.",
                  "De um nome interno para identificar sua loja no Swipe.",
                  "Cole o Storefront API token da loja no campo de token real.",
                  'Clique em "Conectar com Shopify" para validar o acesso.',
                  "Aguarde a leitura real do dominio e do catalogo da loja.",
                  'Verifique o status de "Pronta" apos a validacao.',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed text-muted-foreground">{step}</span>
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
                <span className="font-bold">3. Pos-Conexao e Sincronia</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="mb-4 rounded-xl border border-dashed border-primary/20 bg-muted/30 p-4">
                <p className="text-xs italic font-medium text-muted-foreground">
                  "O Swipe valida a loja em tempo real pela Storefront API antes de liberar a conexao."
                </p>
              </div>
              <ul className="space-y-4 pb-4 pt-2">
                {[
                  "Acompanhe o progresso da sincronizacao inicial.",
                  "Confira a contagem lida pela validacao real da Storefront API.",
                  'Verifique se o selo "Pronta" aparece no card da loja.',
                  "Se houver qualquer erro, consulte a area de troubleshooting abaixo.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed text-muted-foreground">{step}</span>
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
