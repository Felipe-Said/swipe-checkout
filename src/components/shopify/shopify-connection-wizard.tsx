"use client"

import * as React from "react"
import { Check, Loader2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

export type ShopifyStep = 
  | "identifying" 
  | "connecting" 
  | "authorizing" 
  | "syncing" 
  | "completed" 
  | "failed"

interface Step {
  id: ShopifyStep
  label: string
  description: string
}

const steps: Step[] = [
  { id: "identifying", label: "Identificar loja", description: "Domínio Shopify" },
  { id: "connecting", label: "Iniciar conexão", description: "Fluxo de app" },
  { id: "authorizing", label: "Autorizar Shopify", description: "Acesso total" },
  { id: "syncing", label: "Sincronização", description: "Catálogo e pedidos" },
  { id: "completed", label: "Concluído", description: "Pronta para uso" },
]

interface ShopifyConnectionWizardProps {
  currentStep: ShopifyStep
}

export function ShopifyConnectionWizard({ currentStep }: ShopifyConnectionWizardProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep)
  const isFailed = currentStep === "failed"

  return (
    <div className="w-full py-8">
      <div className="relative flex justify-between">
        {/* Progress Line */}
        <div className="absolute top-[18px] left-[20px] right-[20px] h-[2px] bg-muted -z-10">
          <div 
            className="h-full bg-primary transition-all duration-500" 
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, index) => {
          const isCompleted = currentIndex > index || currentStep === "completed"
          const isActive = currentIndex === index && currentStep !== "completed"
          
          return (
            <div key={step.id} className="flex flex-col items-center gap-3 relative z-10 w-32">
              <div
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isCompleted ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25" :
                  isActive ? "bg-background border-primary text-primary animate-pulse shadow-lg shadow-primary/10 scale-110" :
                  "bg-muted border-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                 <span className={cn(
                    "text-[11px] font-black uppercase tracking-wider",
                    isActive ? "text-primary" : "text-muted-foreground"
                 )}>
                    {step.label}
                 </span>
                 <span className="text-[10px] text-muted-foreground font-medium max-w-[80px] leading-tight">
                    {step.description}
                 </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
