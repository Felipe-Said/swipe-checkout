"use client"

import * as React from "react"
import { 
  MoreVertical, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Lock, 
  ArrowUpRight, 
  ShieldCheck, 
  RefreshCcw,
  Zap,
  Globe
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { ConnectedDomain } from "@/lib/domain-data"
import { cn } from "@/lib/utils"

interface DomainListCardProps {
  domain: ConnectedDomain
  onDelete: (id: string) => void
  onRefresh: (id: string) => void
  onSetPrimary: (id: string) => void
}

export function DomainListCard({ domain, onDelete, onRefresh, onSetPrimary }: DomainListCardProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    onRefresh(domain.id)
    setTimeout(() => setIsRefreshing(false), 1500)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pronto": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
      case "Aguardando DNS": return "text-amber-500 bg-amber-500/10 border-amber-500/20"
      case "Atenção": return "text-destructive bg-destructive/10 border-destructive/20"
      default: return "text-blue-500 bg-blue-500/10 border-blue-500/20"
    }
  }

  return (
    <Card className="border-primary/10 bg-card/40 backdrop-blur-sm shadow-lg overflow-hidden transition-all hover:bg-card/60 group">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 shrink-0">
               <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
               <div className="flex items-center gap-2">
                 <h3 className="text-lg font-black tracking-tight">{domain.host}</h3>
                 {domain.isPrimary && (
                   <Badge className="bg-primary text-primary-foreground text-[10px] h-5 rounded-full px-2 font-black uppercase">
                     Principal
                   </Badge>
                 )}
               </div>
               <p className="text-sm text-muted-foreground font-medium flex items-center gap-2 mt-0.5">
                 Vinculado a: <span className="text-foreground font-bold">{domain.checkoutName}</span>
                 <ArrowUpRight className="h-3 w-3" />
               </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:flex items-center gap-3 md:gap-6">
             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Status Geral</span>
                <Badge className={cn("rounded-full px-3 py-1 text-[11px] font-black gap-1.5 border w-fit", getStatusColor(domain.status))}>
                   {domain.status === "Pronto" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3 animate-pulse" />}
                   {domain.status.toUpperCase()}
                </Badge>
             </div>

             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">SSL / Segurança</span>
                <div className="flex items-center gap-2">
                   <div className={cn("h-2 w-2 rounded-full", domain.sslStatus === "active" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500 animate-pulse")} />
                   <span className="text-xs font-bold">{domain.sslStatus === "active" ? "Ativo" : "Provisionando"}</span>
                </div>
             </div>

             <div className="hidden md:flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Última Checagem</span>
                <span className="text-xs font-medium text-muted-foreground">{domain.lastChecked}</span>
             </div>

             <div className="flex items-center gap-2 ml-auto">
                <Button 
                  size="icon" 
                  variant="outline" 
                  className={cn("h-10 w-10 rounded-xl border-primary/10 hover:bg-primary/5", isRefreshing && "animate-spin")}
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                   <RefreshCcw className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl border-primary/10">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl border-primary/10 bg-background/95 backdrop-blur-md">
                     <DropdownMenuItem className="gap-2 font-bold py-3 cursor-pointer" onClick={() => onSetPrimary(domain.id)}>
                        <Zap className="h-4 w-4 text-primary" /> Definir como Principal
                     </DropdownMenuItem>
                     <DropdownMenuItem className="gap-2 font-bold py-3 cursor-pointer">
                        <Lock className="h-4 w-4" /> Ver Instruções DNS
                     </DropdownMenuItem>
                     <DropdownMenuSeparator className="bg-primary/5" />
                     <DropdownMenuItem className="gap-2 font-bold py-3 text-destructive focus:text-destructive cursor-pointer" onClick={() => onDelete(domain.id)}>
                        <Trash2 className="h-4 w-4" /> Remover Domínio
                     </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
             </div>
          </div>
        </div>

        {domain.status !== "Pronto" && (
           <div className="mt-6 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                 <p className="text-sm font-bold text-amber-500">Ação necessária no DNS</p>
                 <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
                    Detectamos que o apontamento {domain.recordType} para <b>{domain.recordValue}</b> ainda não foi propagado totalmente. 
                    Certifique-se de que não há outros registros conflitantes no host <b>{domain.recordName}</b>.
                 </p>
              </div>
           </div>
        )}
      </CardContent>
    </Card>
  )
}
