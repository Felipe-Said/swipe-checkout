"use client"

import * as React from "react"
import { Building2, Globe, ShieldCheck, Clock, ExternalLink, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface WhopAccountSummaryCardProps {
  accountName: string
  companyId: string
  environment: "Produção" | "Sandbox" | "Não definido"
  status: string
  lastUpdate: string
}

export function WhopAccountSummaryCard({
  accountName,
  companyId,
  environment,
  status,
  lastUpdate
}: WhopAccountSummaryCardProps) {
  return (
    <Card className="border-primary/10 bg-card/40 backdrop-blur-sm shadow-xl overflow-hidden group">
       <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
             <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/10 group-hover:scale-105 transition-transform duration-500">
                <Building2 className="h-8 w-8" />
             </div>
             <div>
                <h3 className="text-xl font-black tracking-tight">{accountName}</h3>
                <div className="flex items-center gap-2 mt-1">
                   <Badge variant="secondary" className="bg-muted text-muted-foreground text-[9px] font-black uppercase tracking-widest h-5">
                      ID: {companyId}
                   </Badge>
                   <Badge variant="outline" className={cn(
                      "text-[9px] font-black uppercase tracking-widest h-5",
                      environment === "Produção" ? "border-emerald-500/50 text-emerald-500" : "border-amber-500/50 text-amber-500"
                   )}>
                      {environment}
                   </Badge>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 rounded-2xl bg-muted/20 border border-primary/5 space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                   <ShieldCheck className="h-3 w-3" />
                   Status Operacional
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                   <span className="text-sm font-black tracking-tight">{status}</span>
                </div>
             </div>

             <div className="p-4 rounded-2xl bg-muted/20 border border-primary/5 space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                   <Clock className="h-3 w-3" />
                   Última Atualização
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-sm font-black tracking-tight">{lastUpdate}</span>
                </div>
             </div>
          </div>

          <div className="mt-6 pt-6 border-t border-primary/5">
             <a href="#" className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors group/link">
                Abrir Whop Enterprise
                <div className="flex items-center gap-1">
                   <span className="opacity-0 group-hover/link:opacity-100 -translate-x-2 group-hover/link:translate-x-0 transition-all">VISITAR LOJA</span>
                   <ExternalLink className="h-4 w-4" />
                </div>
             </a>
          </div>
       </CardContent>
    </Card>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
