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
  Store,
  AlertCircle,
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
  | "Aguardando autorizacao"
  | "Atencao necessaria"
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
  onReconnect,
}: ShopifyConnectedStoreCardProps) {
  const isSyncing = store.status === "Sincronizando"
  const isReady = store.status === "Conectada" || store.status === "Pronta"
  const hasIssues = store.status === "Atencao necessaria" || store.status === "Falha"

  return (
    <Card className="group overflow-hidden border-primary/10 bg-card/40 backdrop-blur-sm transition-all duration-300 hover:border-primary/30">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10 text-primary">
                <Store className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black tracking-tight">{store.name}</h3>
                  <StatusBadge status={store.status} />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="font-mono">{store.shopDomain}</span>
                  <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
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
                  <TooltipContent>Sincronizar Catalogo Agora</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                variant="outline"
                size="sm"
                className="h-10 rounded-xl border-primary/10 px-4"
                onClick={() => onReconnect(store.id)}
              >
                Reconectar
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl transition-all group-hover:bg-destructive group-hover:text-destructive-foreground"
                onClick={() => onDelete(store.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <Database className="h-3 w-3" />
                Dados Importados
              </div>
              <div className="space-y-3 rounded-2xl border border-primary/5 bg-muted/30 p-4">
                <div className="flex items-end justify-between">
                  <span className="text-xs text-muted-foreground">Produtos</span>
                  <span className="text-lg font-black">{store.productCount ?? 0}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-xs text-muted-foreground">Variantes</span>
                  <span className="text-sm font-bold">{store.variantCount ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <History className="h-3 w-3" />
                Sincronizacao
              </div>
              <div className="space-y-3 rounded-2xl border border-primary/5 bg-muted/30 p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground">ULTIMA VEZ EM:</span>
                  <span className="text-sm font-bold">{store.lastSync ?? "Nenhuma"}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Integridade</span>
                    <span className={cn("font-bold", hasIssues ? "text-destructive" : "text-emerald-500")}>
                      {hasIssues ? "0%" : isSyncing ? "45%" : "100%"}
                    </span>
                  </div>
                  <Progress value={hasIssues ? 0 : isSyncing ? 45 : 100} className="h-1.5" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                Seguranca
              </div>
              <div className="space-y-3 rounded-2xl border border-primary/5 bg-muted/30 p-4">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full shadow-lg",
                      hasIssues
                        ? "bg-destructive shadow-destructive/50"
                        : isSyncing
                          ? "bg-primary shadow-primary/50"
                          : "bg-emerald-500 shadow-emerald-500/50"
                    )}
                  />
                  <span className="text-[11px] font-bold">
                    {hasIssues ? "Credenciais exigem revisao" : isReady ? "Client Credentials" : "Validacao em andamento"}
                  </span>
                </div>
                <div className="text-[10px] italic leading-relaxed text-muted-foreground">
                  {hasIssues
                    ? '"A loja perdeu o estado valido da conexao. Use Reconectar para testar Client ID, Secret e escopos de novo."'
                    : isReady
                      ? '"Conexao validada com Client ID e Secret reais do app Shopify."'
                      : '"A conexao esta em validacao e pode demorar alguns instantes para estabilizar."'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isSyncing && (
          <div className="flex items-center justify-between border-t border-primary/10 bg-primary/5 px-6 py-2 text-[11px] font-bold text-primary animate-pulse">
            <span>SINCRONIZANDO CATALOGO EM TEMPO REAL...</span>
            <RefreshCw className="h-3 w-3 animate-spin" />
          </div>
        )}

        {hasIssues && (
          <div className="flex items-center justify-between gap-4 border-t border-destructive/20 bg-destructive/10 px-6 py-3">
            <div className="flex items-center gap-2 text-[11px] font-bold text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              Atencao: a loja requer nova autorizacao ou o dominio esta inacessivel.
            </div>
            <Button size="sm" variant="destructive" className="h-7 rounded-lg px-4 text-[10px] font-bold">
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
    Conectada: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    Pronta: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    Sincronizando: "bg-primary/10 text-primary border-primary/20",
    "Aguardando autorizacao": "bg-amber-500/10 text-amber-500 border-amber-500/20",
    "Atencao necessaria": "bg-destructive/10 text-destructive border-destructive/20",
    Falha: "bg-destructive/10 text-destructive border-destructive/20",
    "Em configuracao": "bg-muted text-muted-foreground border-border",
  }[status]

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter",
        styles
      )}
    >
      {status === "Sincronizando" && <Loader2 className="mr-1.5 h-2.5 w-2.5 animate-spin" />}
      {status === "Conectada" && <CheckCircle2 className="mr-1.5 h-2.5 w-2.5" />}
      {status}
    </Badge>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
