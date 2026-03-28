"use client"

import * as React from "react"
import { Globe, Plus, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { getCurrentAppSession } from "@/lib/app-session"
import { DomainMode } from "@/lib/domain-data"
import { loadCheckoutOptionsForDomainSession } from "@/app/actions/domains"

interface DomainSetupCardProps {
  onAdd: (domain: string, mode: DomainMode, checkoutId: string, isPrimary: boolean) => void
}

export function DomainSetupCard({ onAdd }: DomainSetupCardProps) {
  const [domain, setDomain] = React.useState("")
  const [mode, setMode] = React.useState<DomainMode>("custom_subdomain")
  const [checkouts, setCheckouts] = React.useState<Array<{ id: string; name: string }>>([])
  const [checkoutId, setCheckoutId] = React.useState("")
  const [isPrimary, setIsPrimary] = React.useState(false)

  React.useEffect(() => {
    async function load() {
      const session = await getCurrentAppSession()
      if (!session?.accountId || !session.userId) return

      const result = await loadCheckoutOptionsForDomainSession({
        userId: session.userId,
        accountId: session.accountId,
      })

      if (result.error) return

      setCheckouts(result.checkouts)
      if (result.checkouts.length > 0) {
        setCheckoutId(result.checkouts[0].id)
      }
    }

    void load()
  }, [])

  const handleAdd = () => {
    if (!domain || !checkoutId) return
    onAdd(domain, mode, checkoutId, isPrimary)
    setDomain("")
  }

  return (
    <Card className="group overflow-hidden border-primary/10 bg-card/40 shadow-xl backdrop-blur-sm">
      <CardHeader className="relative border-b border-primary/10 bg-primary/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">Novo dominio do checkout</CardTitle>
            <CardDescription>Conecte um dominio e aponte para a plataforma.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="ml-1 text-xs font-black uppercase tracking-widest text-muted-foreground">
              Modo do dominio
            </Label>
            <Select value={mode} onValueChange={(value: DomainMode) => setMode(value)}>
              <SelectTrigger className="h-12 rounded-xl border-primary/5 bg-muted/20 font-bold">
                <SelectValue placeholder="Selecione o modo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="platform" className="font-medium">
                  Subdominio da plataforma (*.swipe.com.br)
                </SelectItem>
                <SelectItem value="custom_subdomain" className="font-medium">
                  Subdominio proprio (checkout.seu.com)
                </SelectItem>
                <SelectItem value="custom_apex" className="font-medium">
                  Dominio proprio (seu.com)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="ml-1 text-xs font-black uppercase tracking-widest text-muted-foreground">
              {mode === "platform" ? "Identificador do subdominio" : "Dominio ou subdominio"}
            </Label>
            <div className="group/input relative">
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value.toLowerCase())}
                placeholder={mode === "platform" ? "minhaloja" : "checkout.meudominio.com"}
                className="h-12 rounded-xl border-primary/5 bg-muted/20 px-4 pr-12 font-bold transition-all focus-visible:ring-primary/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground/40 transition-colors group-focus-within/input:text-primary">
                {mode === "platform" ? ".swipe.com.br" : ""}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="ml-1 text-xs font-black uppercase tracking-widest text-muted-foreground">
              Checkout vinculado
            </Label>
            <Select value={checkoutId} onValueChange={setCheckoutId}>
              <SelectTrigger className="h-12 rounded-xl border-primary/5 bg-muted/20 font-bold">
                <SelectValue placeholder="Vincular checkout" />
              </SelectTrigger>
              <SelectContent>
                {checkouts.map((checkout) => (
                  <SelectItem key={checkout.id} value={checkout.id} className="font-medium">
                    {checkout.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-primary/5 bg-muted/20 p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold">Dominio principal</Label>
              <p className="text-xs text-muted-foreground">
                Definir como destino primario do checkout.
              </p>
            </div>
            <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
          </div>
        </div>

        <Button
          className="group relative h-14 w-full overflow-hidden rounded-2xl text-lg font-black tracking-tighter shadow-lg shadow-primary/20"
          onClick={handleAdd}
          disabled={!domain || !checkoutId}
        >
          <span className="relative z-10 flex items-center gap-2">
            ADICIONAR DOMINIO
            <Plus className="h-5 w-5" />
          </span>
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/10 to-primary-foreground/0 transition-transform duration-1000 group-hover:translate-x-full" />
        </Button>

        <div className="flex gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-xs font-medium leading-relaxed text-muted-foreground">
            {mode === "platform"
              ? "Os subdominios da plataforma usam o wildcard interno do Swipe e nao exigem DNS externo do cliente."
              : "Depois de adicionar, o Swipe vai mostrar exatamente os registros DNS que devem ser criados no seu provedor. Nao e necessario acessar a Vercel manualmente."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
