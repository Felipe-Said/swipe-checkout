"use client"

import * as React from "react"
import { Globe, Plus, Check, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { getCurrentAppSession } from "@/lib/app-session"
import { DomainMode } from "@/lib/domain-data"

interface DomainSetupCardProps {
  onAdd: (domain: string, mode: DomainMode, checkoutId: string, isPrimary: boolean) => void
}

export function DomainSetupCard({ onAdd }: DomainSetupCardProps) {
  const [domain, setDomain] = React.useState("")
  const [mode, setMode] = React.useState<DomainMode>("custom_subdomain")
  const [checkouts, setCheckouts] = React.useState<any[]>([])
  const [checkoutId, setCheckoutId] = React.useState("")
  const [isPrimary, setIsPrimary] = React.useState(false)

  React.useEffect(() => {
    async function load() {
      const session = await getCurrentAppSession()
      if (!session?.accountId) return

      const { getCheckouts } = await import("@/lib/domain-data")
      const list = await getCheckouts(session.accountId)
      setCheckouts(list)
      if (list.length > 0) setCheckoutId(list[0].id)
    }
    load()
  }, [])

  const handleAdd = () => {
    if (!domain || !checkoutId) return
    onAdd(domain, mode, checkoutId, isPrimary)
    setDomain("")
  }

  return (
    <Card className="border-primary/10 bg-card/40 backdrop-blur-sm shadow-xl overflow-hidden group">
      <CardHeader className="bg-primary/5 pb-6 border-b border-primary/10 relative">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">Novo domínio do checkout</CardTitle>
            <CardDescription>Conecte um domínio e aponte para a plataforma.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
              Modo do domínio
            </Label>
            <Select value={mode} onValueChange={(v: DomainMode) => setMode(v)}>
              <SelectTrigger className="h-12 bg-muted/20 border-primary/5 rounded-xl font-bold">
                <SelectValue placeholder="Selecione o modo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="platform" className="font-medium">Subdomínio da plataforma (*.swipe.com.br)</SelectItem>
                <SelectItem value="custom_subdomain" className="font-medium">Subdomínio próprio (checkout.seu.com)</SelectItem>
                <SelectItem value="custom_apex" className="font-medium">Domínio próprio (seu.com)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
              {mode === "platform" ? "Identificador do subdomínio" : "Domínio ou subdomínio"}
            </Label>
            <div className="relative group/input">
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value.toLowerCase())}
                placeholder={mode === "platform" ? "minhaloja" : "checkout.meudominio.com"}
                className="h-12 bg-muted/20 border-primary/5 rounded-xl px-4 pr-12 focus-visible:ring-primary/20 transition-all font-bold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground/40 group-focus-within/input:text-primary transition-colors">
                {mode === "platform" ? ".swipe.com.br" : ""}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
              Checkout vinculado
            </Label>
            <Select value={checkoutId} onValueChange={setCheckoutId}>
              <SelectTrigger className="h-12 bg-muted/20 border-primary/5 rounded-xl font-bold">
                <SelectValue placeholder="Vincular checkout" />
              </SelectTrigger>
              <SelectContent>
                {checkouts.map((chk) => (
                  <SelectItem key={chk.id} value={chk.id} className="font-medium">
                    {chk.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-primary/5 mt-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold">Domínio principal</Label>
              <p className="text-xs text-muted-foreground">Definir como destino primário do checkout.</p>
            </div>
            <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
          </div>
        </div>

        <Button 
          className="w-full h-14 text-lg font-black tracking-tighter rounded-2xl shadow-lg shadow-primary/20 group relative overflow-hidden"
          onClick={handleAdd}
          disabled={!domain}
        >
          <span className="relative z-10 flex items-center gap-2">
            ADICIONAR DOMÍNIO
            <Plus className="h-5 w-5" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/10 to-primary-foreground/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </Button>

        <div className="flex gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            {mode === "platform" 
              ? "Os subdomínios da plataforma são ativados instantaneamente e não requerem alteração no seu DNS externo."
              : "Após adicionar, o Swipe mostrará o apontamento DNS que você deve configurar no seu provedor. Não é necessário acesso à Vercel."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
