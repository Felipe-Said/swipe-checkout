"use client"

import * as React from "react"
import { 
  CheckCircle2, 
  Loader2, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  Globe,
  Database,
  History,
  Store
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type ShopifyConnectionStatus = 
  | "Conectada" 
  | "Sincronizando" 
  | "Aguardando autorização" 
  | "Atenção necessária" 
  | "Falha" 
  | "Pronta"
  | "Em configuracao"

interface ShopifyConnectedStoreCardProps {
  store: {
    id: string
    name: string
    shopDomain: string
    status: ShopifyConnectionStatus
    lastSync?: string
    productCount?: number
    variantCount?: number
    connectionMode?: string
  }
  onSync: (id: string) => void
  onDelete: (id: string) => void
  onReconnect: (id: string) => void
}

export function ShopifyConnectedStoreCard({ 
  store, 
  onSync, 
  onDelete, 
  onReconnect 
}: ShopifyConnectedStoreCardProps) {
  const isSyncing = store.status === "Sincronizando"
  const hasIssues = store.status === "Atenção necessária" || store.status === "Falha"
  
  return (
    <Card className="border-primary/10 bg-card/40 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/10">
                 <Store className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                   <h3 className="text-xl font-black tracking-tight">{store.name}</h3>
                   <StatusBadge status={store.status} />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                   <Globe className="h-3.5 w-3.5" />
                   <span className="font-mono">{store.shopDomain}</span>
                   <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-10 w-10 rounded-xl"
                        onClick={() => onSync(store.id)}
                        disabled={isSyncing}
                      >
                         <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                      </Button>
                   </TooltipTrigger>
                   <TooltipContent>Sincronizar Catálogo Agora</TooltipContent>
                 </Tooltip>
               </TooltipProvider>

               <Button 
                 variant="outline" 
                 size="sm" 
                 className="h-10 rounded-xl px-4 border-primary/10"
                 onClick={() => onReconnect(store.id)}
               >
                 Reconectar
               </Button>
               
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="h-10 w-10 group-hover:bg-destructive group-hover:text-destructive-foreground transition-all rounded-xl"
                 onClick={() => onDelete(store.id)}
               >
                 <Trash2 className="h-4 w-4" />
               </Button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-3">
                <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                   <Database className="h-3 w-3" />
                   Dados Importados
                </div>
                <div className="bg-muted/30 p-4 rounded-2xl border border-primary/5 space-y-3">
                   <div className="flex justify-between items-end">
                      <span className="text-xs text-muted-foreground">Produtos</span>
                      <span className="text-lg font-black">{store.productCount ?? 0}</span>
                   </div>
                   <div className="flex justify-between items-end">
                      <span className="text-xs text-muted-foreground">Variantes</span>
                      <span className="text-sm font-bold">{store.variantCount ?? 0}</span>
                   </div>
                </div>
             </div>

             <div className="space-y-3">
                <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                   <History className="h-3 w-3" />
                   Sincronização
                </div>
                <div className="bg-muted/30 p-4 rounded-2xl border border-primary/5 space-y-3">
                   <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground font-bold">ÚLTIMA VEZ EM:</span>
                      <span className="text-sm font-bold">{store.lastSync ?? "Nenhuma"}</span>
                   </div>
                   <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                         <span className="text-muted-foreground">Integridade</span>
                         <span className="text-emerald-500 font-bold">100%</span>
                      </div>
                      <Progress value={isSyncing ? 45 : 100} className="h-1.5" />
                   </div>
                </div>
             </div>

             <div className="space-y-3">
                <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                   <ShieldCheck className="h-3 w-3" />
                   Segurança
                </div>
                <div className="bg-muted/30 p-4 rounded-2xl border border-primary/5 space-y-3">
                   <div className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                       <span className="text-[11px] font-bold">Authorization Grant v2</span>
                   </div>
                   <div className="text-[10px] text-muted-foreground leading-relaxed italic">
                      "Token de acesso persistente gerado via OAuth2 Flow oficial da Shopify."
                   </div>
                </div>
             </div>
          </div>
        </div>

        {isSyncing && (
          <div className="bg-primary/5 border-t border-primary/10 px-6 py-2 flex items-center justify-between text-[11px] font-bold text-primary animate-pulse">
             <span>SINCRONIZANDO CATÁLOGO EM TEMPO REAL...</span>
             <RefreshCw className="h-3 w-3 animate-spin" />
          </div>
        )}

        {hasIssues && (
           <div className="bg-destructive/10 border-t border-destructive/20 px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[11px] font-bold text-destructive">
                 <AlertCircle className="h-3.5 w-3.5" />
                 Atenção: A loja requer nova autorização ou o domínio está inacessível.
              </div>
              <Button size="sm" variant="destructive" className="h-7 text-[10px] font-bold px-4 rounded-lg">
                 Corrigir Agora
              </Button>
           </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: ShopifyConnectionStatus }) {
  const styles = {
    "Conectada": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    "Pronta": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    "Sincronizando": "bg-primary/10 text-primary border-primary/20",
    "Aguardando autorização": "bg-amber-500/10 text-amber-500 border-amber-500/20",
    "Atenção necessária": "bg-destructive/10 text-destructive border-destructive/20",
    "Falha": "bg-destructive/10 text-destructive border-destructive/20",
    "Em configuracao": "bg-muted text-muted-foreground border-border",
  }[status]

  return (
    <Badge variant="outline" className={cn("rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter", styles)}>
       {status === "Sincronizando" && <Loader2 className="mr-1.5 h-2.5 w-2.5 animate-spin" />}
       {status === "Conectada" && <CheckCircle2 className="mr-1.5 h-2.5 w-2.5" />}
       {status}
    </Badge>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}

import { AlertCircle } from "lucide-react"
