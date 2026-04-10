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
  Globe,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConnectedDomain } from "@/lib/domain-data"
import { cn } from "@/lib/utils"

interface DomainListCardProps {
  domain: ConnectedDomain
  onDelete: (id: string) => void
  onRefresh: (id: string) => void
  onSetPrimary: (id: string) => void
  onViewDns: (domain: ConnectedDomain) => void
}

export function DomainListCard({
  domain,
  onDelete,
  onRefresh,
  onSetPrimary,
  onViewDns,
}: DomainListCardProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    onRefresh(domain.id)
    setTimeout(() => setIsRefreshing(false), 1500)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pronto":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
      case "Aguardando DNS":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20"
      case "Atencao":
      case "Atenção":
        return "text-destructive bg-destructive/10 border-destructive/20"
      default:
        return "text-blue-500 bg-blue-500/10 border-blue-500/20"
    }
  }

  return (
    <Card className="group overflow-hidden border-primary/10 bg-card/40 shadow-lg backdrop-blur-sm transition-all hover:bg-card/60">
      <CardContent className="p-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">{domain.host}</h3>
                {domain.isPrimary && (
                  <Badge className="h-5 rounded-full bg-primary px-2 text-[10px] font-black uppercase text-primary-foreground">
                    Principal
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                Vinculado a: <span className="font-bold text-foreground">{domain.checkoutName}</span>
                <ArrowUpRight className="h-3 w-3" />
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 items-center gap-3 md:flex md:gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                Status Geral
              </span>
              <Badge
                className={cn(
                  "w-fit gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black",
                  getStatusColor(domain.status)
                )}
              >
                {domain.status === "Pronto" ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3 animate-pulse" />
                )}
                {domain.status.toUpperCase()}
              </Badge>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                SSL / Seguranca
              </span>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    domain.sslStatus === "active"
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      : "animate-pulse bg-amber-500"
                  )}
                />
                <span className="text-xs font-bold">
                  {domain.sslStatus === "active" ? "Ativo" : "Provisionando"}
                </span>
              </div>
            </div>

            <div className="hidden flex-col gap-1 md:flex">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                Ultima Checagem
              </span>
              <span className="text-xs font-medium text-muted-foreground">{domain.lastChecked}</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className={cn(
                  "h-10 w-10 rounded-xl border-primary/10 hover:bg-primary/5",
                  isRefreshing && "animate-spin"
                )}
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>

              <Button
                size="icon"
                variant="outline"
                className="h-10 w-10 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive"
                onClick={() => onDelete(domain.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl border-primary/10">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-xl border-primary/10 bg-background/95 backdrop-blur-md"
                >
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 py-3 font-bold"
                    onClick={() => onSetPrimary(domain.id)}
                  >
                    <Zap className="h-4 w-4 text-primary" /> Definir como Principal
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 py-3 font-bold"
                    onClick={() => onViewDns(domain)}
                  >
                    <Lock className="h-4 w-4" /> Ver Instrucoes DNS
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-primary/5" />
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 py-3 font-bold text-destructive focus:text-destructive"
                    onClick={() => onDelete(domain.id)}
                  >
                    <Trash2 className="h-4 w-4" /> Remover Dominio
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {domain.status !== "Pronto" && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-bold text-amber-500">Acao necessaria no DNS</p>
              <p className="mt-1 text-xs font-medium leading-relaxed text-muted-foreground">
                Detectamos que o apontamento {domain.recordType} para <b>{domain.recordValue}</b>{" "}
                ainda nao foi propagado totalmente. Certifique-se de que nao ha outros registros
                conflitantes no host <b>{domain.recordName}</b>.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
