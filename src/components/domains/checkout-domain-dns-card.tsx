"use client"

import * as React from "react"
import { Copy, Check, Server, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface DomainDNSCardProps {
  mode: string
  type: string
  name: string
  value: string
  isVerified?: boolean
  onVerify?: () => void
}

export function DomainDNSCard({
  mode,
  type,
  name,
  value,
  isVerified = false,
  onVerify,
}: DomainDNSCardProps) {
  const [copied, setCopied] = React.useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Copiado para a área de transferência!")
    setTimeout(() => setCopied(false), 2000)
  }

  if (mode === "platform") return null

  return (
    <Card className="border-primary/10 bg-card/40 backdrop-blur-sm shadow-xl overflow-hidden mt-6">
       <CardHeader className="pb-4">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Server className="h-4 w-4 text-primary" />
             <CardTitle className="text-sm font-black uppercase tracking-widest">Apontamento DNS que você deve configurar</CardTitle>
           </div>
           {isVerified && (
             <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1 rounded-full px-3">
               <ShieldCheck className="h-3 w-3" />
               Verificado
             </Badge>
           )}
         </div>
         <CardDescription className="text-xs font-medium mt-1">
           Crie este registro no painel onde o seu domínio é administrado. Depois volte ao Swipe para conferir a validação.
         </CardDescription>
       </CardHeader>
       <CardContent className="space-y-4">
          <div className="p-5 bg-muted/30 rounded-2xl border border-primary/5 grid gap-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Tipo de Registro</span>
                   <div className="h-10 px-4 bg-background border border-primary/10 rounded-xl flex items-center font-black text-primary">
                      {type}
                   </div>
                </div>
                <div className="space-y-1.5">
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Host / Nome</span>
                   <div className="h-10 px-4 bg-background border border-primary/10 rounded-xl flex items-center justify-between group">
                      <span className="font-bold truncate">{name}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(name)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                   </div>
                </div>
             </div>

             <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Valor / Destino</span>
                <div className="h-12 px-5 bg-background border border-primary/10 rounded-xl flex items-center justify-between group">
                   <code className="text-sm font-mono font-bold text-primary truncate">{value}</code>
                   <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" onClick={() => copyToClipboard(value)}>
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                   </Button>
                </div>
             </div>
          </div>

          <div className="flex gap-2">
             <Button variant="outline" size="sm" className="flex-1 h-10 rounded-xl font-bold border-primary/10" onClick={() => window.open('https://vercel.com/docs/concepts/projects/custom-domains', '_blank')}>
                Ver Documentação
             </Button>
             <Button
               size="sm"
               className="flex-1 h-10 rounded-xl font-black bg-primary/10 text-primary hover:bg-primary/20"
               onClick={onVerify}
             >
                Testar DNS agora
             </Button>
          </div>
       </CardContent>
    </Card>
  )
}
