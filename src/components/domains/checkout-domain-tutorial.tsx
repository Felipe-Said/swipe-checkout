"use client"

import * as React from "react"
import { Globe, ShieldCheck, Zap, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

export function DomainTutorial() {
  const steps = [
    {
      id: "swipe",
      title: "O que fazer no Swipe",
      icon: <ShieldCheck className="h-4 w-4" />,
      items: [
        "Informe o domínio ou subdomínio que deseja usar no checkout.",
        "Escolha o checkout que vai usar esse domínio.",
        "Adicione o domínio na plataforma clicando no botão principal.",
        "Copie os valores de apontamento DNS que o Swipe exibirá automaticamente.",
        "Acompanhe o progresso de verificação e SSL diretamente no painel de listagem.",
      ],
    },
    {
      id: "dns",
      title: "O que fazer no seu provedor de DNS",
      icon: <Globe className="h-4 w-4" />,
      items: [
        "Acesse o painel onde o seu domínio é administrado.",
          "Crie os registros DNS exatamente com o tipo e valor mostrados pelo Swipe.",
          "Para domÃ­nio raiz, o Swipe pode exibir um registro A principal e um CNAME complementar.",
        "Certifique-se de que o host e o valor estão idênticos aos exibidos.",
        "Salve a alteração e aguarde a propagação conforme o seu provedor.",
        "Não é necessário fazer nenhuma configuração manual na Vercel.",
      ],
    },
    {
      id: "automation",
      title: "O que o Swipe faz automaticamente",
      icon: <Zap className="h-4 w-4" />,
      items: [
        "Provisiona internamente o domínio na infraestrutura da plataforma.",
        "Monitora a rede para detectar quando o DNS foi propagado.",
        "Inicia a emissão do certificado SSL seguro assim que o domínio é validado.",
        "Configura as rotas para que o checkout responda pelo novo endereço.",
        "Marca o domínio como pronto assim que as etapas técnicas são concluídas.",
      ],
    },
  ]

  return (
    <Card className="mt-10 border-primary/10 bg-card/40 shadow-xl backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black">Guia de Conexão</CardTitle>
            <CardDescription>
              O único passo manual externo é o apontamento DNS no seu provedor.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 font-bold text-primary"
            onClick={() =>
              window.open("https://vercel.com/docs/concepts/projects/custom-domains", "_blank")
            }
          >
            Ver Ajuda <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {steps.map((step) => (
            <AccordionItem
              key={step.id}
              value={step.id}
              className="overflow-hidden rounded-2xl border border-primary/10 bg-primary/5 px-6 transition-all data-[state=open]:bg-primary/10"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    {step.icon}
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest">
                    {step.title}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-4 pl-11">
                  {step.items.map((item, idx) => (
                    <div key={idx} className="group flex gap-3">
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary/20 transition-colors group-hover:border-primary/40">
                        <span className="text-[10px] font-black">{idx + 1}</span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}
