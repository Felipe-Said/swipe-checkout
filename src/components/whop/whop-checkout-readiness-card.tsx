"use client"

import * as React from "react"
import { ShoppingCart, CheckCircle2, ShieldCheck, Zap, ArrowRight, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface WhopCheckoutReadinessCardProps {
  isReady: boolean
  hasConfig: boolean
  hasPermissions: boolean
}

export function WhopCheckoutReadinessCard({
  isReady,
  hasConfig,
  hasPermissions
}: WhopCheckoutReadinessCardProps) {
  return (
    <Card className="border-primary/10 bg-card/40 backdrop-blur-sm shadow-xl overflow-hidden group">
       <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
             <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ShoppingCart className="h-6 w-6" />
             </div>
             <div>
                <h3 className="text-sm font-black uppercase tracking-tight">Prontidão do Checkout</h3>
                <p className="text-[10px] font-bold text-muted-foreground">Capacidade de processamento operacional</p>
             </div>
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-primary/5">
                <div className="flex items-center gap-3">
                   <Zap className={cn("h-4 w-4", hasConfig ? "text-emerald-500" : "text-muted-foreground")} />
                   <span className="text-xs font-bold">Configuração de Checkout</span>
                </div>
                {hasConfig ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
             </div>

             <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-primary/5">
                <div className="flex items-center gap-3">
                   <ShieldCheck className={cn("h-4 w-4", hasPermissions ? "text-emerald-500" : "text-muted-foreground")} />
                   <span className="text-xs font-bold">Permissão de Operação</span>
                </div>
                {hasPermissions ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
             </div>
          </div>

          <div className="mt-6">
             <Button variant="outline" className="w-full h-10 rounded-xl border-primary/10 text-xs font-black uppercase tracking-widest gap-2 group/btn">
                Testar Fluxo de Checkout
                <ArrowRight className="h-3 w-3 translate-x-0 group-hover/btn:translate-x-1 transition-transform" />
             </Button>
          </div>
       </CardContent>
    </Card>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
