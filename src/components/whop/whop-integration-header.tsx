"use client"

import * as React from "react"
import { ShieldCheck, AlertCircle, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export type WhopHealthStatus = "Pronto" | "Em validação" | "Atenção" | "Pendente" | "Falha"

interface WhopIntegrationHeaderProps {
  status: WhopHealthStatus
  onValidate: () => void
  isValidating?: boolean
}

export function WhopIntegrationHeader({ 
  status, 
  onValidate, 
  isValidating = false 
}: WhopIntegrationHeaderProps) {
  const getStatusStyles = (s: WhopHealthStatus) => {
    switch (s) {
      case "Pronto": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/10"
      case "Em validação": return "bg-primary/10 text-primary border-primary/20 animate-pulse"
      case "Atenção": return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "Falha": return "bg-destructive/10 text-destructive border-destructive/20"
      default: return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-1">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
              <Zap className="h-6 w-6" />
           </div>
           <div>
              <h1 className="text-3xl font-black tracking-tight">Integração Whop</h1>
              <p className="text-muted-foreground max-w-[500px] text-sm font-medium">
                Conecte a conta, valide a chave, acompanhe o status da integração e confirme se o checkout está pronto.
              </p>
           </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 bg-card/40 p-2 md:p-3 rounded-2xl border backdrop-blur-sm self-start md:self-center shadow-lg">
         <div className="flex flex-col items-end px-3">
            <span className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest mb-1">Status Global</span>
            <Badge variant="outline" className={cn("rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-tighter border-2", getStatusStyles(status))}>
               {status}
            </Badge>
         </div>
         <div className="h-10 w-px bg-border/50" />
         <div className="px-2">
            <Button 
               size="sm" 
               className="h-10 rounded-xl px-4 font-bold shadow-lg shadow-primary/20 group relative overflow-hidden" 
               onClick={onValidate}
               disabled={isValidating}
            >
               <span className="relative z-10 flex items-center gap-2">
                  {isValidating ? "Validando..." : "Validar Integração"}
                  {!isValidating && <ShieldCheck className="h-4 w-4 transition-transform group-hover:scale-110" />}
               </span>
               <div className="absolute inset-0 bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/10 to-primary-foreground/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Button>
         </div>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
