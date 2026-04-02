"use client"

import * as React from "react"
import { Apple, Copy, ExternalLink, Globe2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import type { ConnectedDomain } from "@/lib/domain-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface WhopApplePayDomainCardProps {
  accountName: string
  domains: ConnectedDomain[]
}

export function WhopApplePayDomainCard({
  accountName,
  domains,
}: WhopApplePayDomainCardProps) {
  const appHost = React.useMemo(() => {
    if (typeof window === "undefined") {
      return "swipe-checkout.vercel.app"
    }

    return window.location.host
  }, [])

  const availableHosts = React.useMemo(() => {
    const seen = new Set<string>()
    const hosts: string[] = []

    ;[appHost, ...domains.map((domain) => domain.host)].forEach((host) => {
      const normalized = host.trim().replace(/^https?:\/\//, "")
      if (!normalized || seen.has(normalized)) return
      seen.add(normalized)
      hosts.push(normalized)
    })

    return hosts
  }, [appHost, domains])

  const defaultHost = React.useMemo(() => {
    const preferred =
      domains.find((domain) => domain.isPrimary)?.host ||
      domains.find((domain) => domain.verificationStatus === "verified")?.host ||
      availableHosts[0] ||
      appHost

    return preferred.replace(/^https?:\/\//, "")
  }, [appHost, availableHosts, domains])

  const [selectedHost, setSelectedHost] = React.useState(defaultHost)

  React.useEffect(() => {
    setSelectedHost(defaultHost)
  }, [defaultHost, accountName])

  const selectedDomain = domains.find(
    (domain) => domain.host.replace(/^https?:\/\//, "") === selectedHost
  )

  const associationPath = "/.well-known/apple-developer-merchantid-domain-association"
  const fullAssociationUrl = `https://${selectedHost}${associationPath}`

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copiado.`)
    } catch {
      toast.error(`Nao foi possivel copiar ${label.toLowerCase()}.`)
    }
  }

  return (
    <Card className="border-primary/10 bg-card/40 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-3 border-b border-primary/10 bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
            <Apple className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl">Apple Pay e dominio</CardTitle>
            <CardDescription>
              Use este bloco para repetir a verificacao ao trocar a conta Whop da conta{" "}
              <span className="font-semibold text-foreground">{accountName}</span>.
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] font-bold">
            Verificacao por dominio
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] font-bold">
            Reaproveita o mesmo host
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-3">
            <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Dominio para verificar na Whop
            </Label>
            <Select value={selectedHost} onValueChange={setSelectedHost}>
              <SelectTrigger className="h-12 rounded-xl bg-muted/20">
                <div className="flex items-center gap-3">
                  <Globe2 className="h-4 w-4 text-primary" />
                  <SelectValue placeholder="Selecione o dominio" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {availableHosts.map((host) => (
                  <SelectItem key={host} value={host}>
                    {host}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-xl px-5"
            onClick={() => copyValue(selectedHost, "Dominio")}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copiar dominio
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-3">
            <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Arquivo de verificacao
            </Label>
            <Input readOnly value={fullAssociationUrl} className="h-12 rounded-xl bg-muted/20" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-xl px-5"
            onClick={() => copyValue(fullAssociationUrl, "URL do arquivo")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Copiar URL
          </Button>
        </div>

        <div className="rounded-2xl border border-primary/10 bg-muted/20 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Como trocar de conta Whop sem se perder
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Hospede o arquivo oficial da Apple exatamente neste caminho do dominio acima.</p>
            <p>2. Na nova conta Whop, abra Apple Pay e adicione somente o host, sem https.</p>
            <p>3. Se o dominio continuar o mesmo, voce reaproveita esse mesmo arquivo.</p>
            <p>4. Se trocar o dominio do checkout, a verificacao precisa ser refeita no host novo.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-dashed border-primary/10 bg-background/60 p-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Valor para colar na Whop
            </p>
            <p className="mt-2 break-all font-mono text-sm font-semibold">{selectedHost}</p>
          </div>

          <div className="rounded-2xl border border-dashed border-primary/10 bg-background/60 p-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Status atual do dominio
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {selectedDomain
                ? `${selectedDomain.status} • SSL ${selectedDomain.sslStatus === "active" ? "ativo" : "pendente"}`
                : "Usando o dominio principal da plataforma"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
