"use client"

import * as React from "react"
import { 
  History, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  ShieldAlert, 
  ZapOff,
  Activity
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ValidationEvent {
  id: string
  timestamp: string
  type: "success" | "warning" | "error" | "info"
  message: string
  description?: string
}

interface WhopDiagnosticsPanelProps {
  events: ValidationEvent[]
  onRetry: () => void
}

export function WhopDiagnosticsPanel({ events, onRetry }: WhopDiagnosticsPanelProps) {
  return (
    <Card className="border-primary/10 bg-card/40 backdrop-blur-sm shadow-xl overflow-hidden">
      <CardHeader className="pb-4 border-b border-primary/5">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                 <Activity className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">Painel de Diagnóstico</CardTitle>
                <CardDescription>Acompanhe eventos de validação e prontidão operacional.</CardDescription>
              </div>
           </div>
           <Button variant="outline" size="sm" className="h-9 rounded-lg border-primary/10 gap-2" onClick={onRetry}>
              <RefreshCw className="h-3.5 w-3.5" />
              Revalidar Tudo
           </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[320px]">
           <div className="p-6 space-y-6">
              {events.length > 0 ? (
                 <div className="relative space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-primary/5">
                    {events.map((event) => (
                      <div key={event.id} className="relative pl-8 group">
                         <div className={cn(
                            "absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 bg-background flex items-center justify-center -translate-x-1 transition-transform group-hover:scale-125",
                            event.type === "success" ? "border-emerald-500 text-emerald-500" :
                            event.type === "error" ? "border-destructive text-destructive" :
                            event.type === "warning" ? "border-amber-500 text-amber-500" :
                            "border-primary text-primary"
                         )}>
                            {event.type === "success" && <CheckCircle2 className="h-2.5 w-2.5" />}
                            {event.type === "error" && <ShieldAlert className="h-2.5 w-2.5" />}
                            {event.type === "warning" && <AlertCircle className="h-2.5 w-2.5" />}
                         </div>
                         <div className="space-y-1">
                            <div className="flex items-center justify-between">
                               <span className="text-[13px] font-black tracking-tight">{event.message}</span>
                               <span className="text-[10px] text-muted-foreground font-bold font-mono">{event.timestamp}</span>
                            </div>
                            {event.description && (
                               <p className="text-xs text-muted-foreground leading-relaxed">
                                  {event.description}
                               </p>
                            )}
                         </div>
                      </div>
                    ))}
                 </div>
              ) : (
                 <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                    <History className="h-12 w-12 mb-4" />
                    <p className="text-sm font-bold">Nenhum evento de diagnóstico registrado.</p>
                    <p className="text-[11px]">Execute a validação para iniciar o monitoramento.</p>
                 </div>
              )}
           </div>
        </ScrollArea>

        <div className="p-4 bg-muted/20 border-t border-primary/5">
           <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                 <span className="text-[11px] font-bold text-muted-foreground">Última checagem completa foi bem-sucedida</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase text-primary hover:bg-primary/10">
                 Ver Logs Detalhados
              </Button>
           </div>
        </div>
      </CardContent>
    </Card>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
