"use client"

import * as React from "react"
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Loader2, 
  Key, 
  ShieldCheck, 
  ShoppingCart, 
  Webhook, 
  ArrowRight
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type ReadinessStatus = "Pronto" | "Pendente" | "Atenção" | "Validando"

interface ReadinessItemProps {
  icon: React.ElementType
  label: string
  description: string
  status: ReadinessStatus
}

function ReadinessItem({ icon: Icon, label, description, status }: ReadinessItemProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "Pronto": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case "Pendente": return <Circle className="h-4 w-4 text-muted-foreground" />
      case "Validando": return <Loader2 className="h-4 w-4 text-primary animate-spin" />
      case "Atenção": return <AlertCircle className="h-4 w-4 text-amber-500" />
    }
  }

  const getStatusColor = () => {
     switch (status) {
        case "Pronto": return "text-emerald-500"
        case "Pendente": return "text-muted-foreground"
        case "Validando": return "text-primary"
        case "Atenção": return "text-amber-500"
     }
  }

  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/20 border border-primary/5 hover:border-primary/20 transition-all group/item shadow-sm">
       <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center border transition-all shrink-0",
          status === "Pronto" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
          status === "Validando" ? "bg-primary/10 border-primary/20 text-primary" :
          "bg-background border-border text-muted-foreground group-hover/item:border-primary/20 group-hover/item:text-primary"
       )}>
          <Icon className="h-5 w-5" />
       </div>
       <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center justify-between mb-0.5">
             <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover/item:text-foreground transition-colors">
                {label}
             </span>
             {getStatusIcon()}
          </div>
          <p className="text-xs font-bold leading-tight line-clamp-1">{description}</p>
          <div className="mt-2 flex items-center gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
             <span className={cn("text-[10px] font-black uppercase tracking-tighter", getStatusColor())}>
                {status === "Pronto" ? "VALIDADO" : status === "Validando" ? "VERIFICANDO" : "PENDENTE"}
             </span>
             <ArrowRight className={cn("h-3 w-3", getStatusColor())} />
          </div>
       </div>
    </div>
  )
}

interface WhopIntegrationReadinessProps {
  apiKeyStatus: ReadinessStatus
  permissionsStatus: ReadinessStatus
  checkoutStatus: ReadinessStatus
  webhookStatus: ReadinessStatus
}

export function WhopIntegrationReadiness({
  apiKeyStatus,
  permissionsStatus,
  checkoutStatus,
  webhookStatus
}: WhopIntegrationReadinessProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
       <ReadinessItem 
         icon={Key} 
         label="Chave Salva" 
         description="Credencial principal" 
         status={apiKeyStatus} 
       />
       <ReadinessItem 
         icon={ShieldCheck} 
         label="Permissões" 
         description="Acesso verificado" 
         status={permissionsStatus} 
       />
       <ReadinessItem 
         icon={ShoppingCart} 
         label="Checkout" 
         description="Prontidão operacional" 
         status={checkoutStatus} 
       />
       <ReadinessItem 
         icon={Webhook} 
         label="Webhook" 
         description="Monitoramento ativo" 
         status={webhookStatus} 
       />
    </div>
  )
}
