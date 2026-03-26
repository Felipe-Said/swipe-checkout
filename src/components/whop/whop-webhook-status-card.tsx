"use client"

import * as React from "react"
import { Webhook, Activity, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface WhopWebhookStatusCardProps {
  status: "Ativo" | "Pendente" | "Falha"
  lastEvent?: string
  lastEventType?: string
}

export function WhopWebhookStatusCard({
  status,
  lastEvent = "Há 5 minutos",
  lastEventType = "checkout.completed"
}: WhopWebhookStatusCardProps) {
  return (
    <Card className="border-primary/10 bg-card/40 backdrop-blur-sm shadow-xl overflow-hidden group">
       <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform duration-500">
                   <Webhook className="h-6 w-6" />
                </div>
                <div>
                   <h3 className="text-sm font-black uppercase tracking-tight">Status de Webhooks</h3>
                   <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={cn(
                         "h-1.5 w-1.5 rounded-full animate-pulse",
                         status === "Ativo" ? "bg-emerald-500" : status === "Falha" ? "bg-destructive" : "bg-amber-500"
                      )} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{status}</span>
                   </div>
                </div>
             </div>
             <Badge variant="outline" className="border-primary/10 text-[9px] font-black uppercase h-5">HID: 84920</Badge>
          </div>

          <div className="space-y-4">
             <div className="p-4 rounded-xl bg-muted/20 border border-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Saúde do Listener</span>
                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">100% OPERATIONAL</span>
                </div>
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                   <div className="h-full w-[100%] bg-emerald-500" />
                </div>
             </div>

             <div className="flex items-start gap-3 px-1">
                <div className="mt-0.5">
                   <Activity className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="space-y-0.5">
                   <div className="text-[11px] font-black tracking-tight flex items-center gap-2">
                      {lastEventType}
                      <Badge className="h-4 text-[8px] bg-primary/20 text-primary border-0 font-black">LATEST</Badge>
                   </div>
                   <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold">
                      <Clock className="h-3 w-3" />
                      Recebido {lastEvent}
                   </div>
                </div>
             </div>
          </div>
       </CardContent>
    </Card>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
