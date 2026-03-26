"use client"

import * as React from "react"
import { Store, ShieldCheck, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ShopifyIntegrationHeaderProps {
  connectionCount: number
  hasIssues?: boolean
}

export function ShopifyIntegrationHeader({ 
  connectionCount, 
  hasIssues = false 
}: ShopifyIntegrationHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
           <h1 className="text-3xl font-bold tracking-tight">Integração Shopify</h1>
           <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors">
              Core Engine
           </Badge>
        </div>
        <p className="text-muted-foreground max-w-[600px]">
          Conecte sua loja, autorize o app e acompanhe a sincronização do catálogo dentro do Swipe para uma operação de checkout externa de alta performance.
        </p>
      </div>
      
      <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-2xl border backdrop-blur-sm self-start md:self-center">
         <div className="flex flex-col items-end px-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Status Geral</span>
            <div className="flex items-center gap-2">
               {hasIssues ? (
                 <>
                   <span className="text-sm font-bold text-destructive">Atenção</span>
                   <AlertCircle className="h-4 w-4 text-destructive" />
                 </>
               ) : (
                 <>
                   <span className="text-sm font-bold text-emerald-500">Operacional</span>
                   <ShieldCheck className="h-4 w-4 text-emerald-500" />
                 </>
               )}
            </div>
         </div>
         <div className="h-8 w-px bg-border" />
         <div className="flex flex-col items-start px-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Lojas Ativas</span>
            <span className="text-lg font-black">{connectionCount}</span>
         </div>
      </div>
    </div>
  )
}
