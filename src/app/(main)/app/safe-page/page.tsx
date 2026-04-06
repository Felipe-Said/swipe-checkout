"use client"

import * as React from "react"
import { Download, ExternalLink, Globe, RefreshCcw, ShieldCheck, Trash2, Users } from "lucide-react"

import {
  addSafePageDomainForSession,
  exportSafePageCsvForSession,
  loadSafePageForSession,
  refreshSafePageDomainForSession,
  removeSafePageDomainForSession,
  saveSafePageSettingsForSession,
} from "@/app/actions/safe-page"
import { SafePagePublic } from "@/components/safe-page/safe-page-public"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCurrentAppSession } from "@/lib/app-session"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

type SafePageViewModel = Awaited<ReturnType<typeof loadSafePageForSession>>["safePage"]

export default function SafePagePage() {
  const [safePage, setSafePage] = React.useState<SafePageViewModel>(null)
  const [businessName, setBusinessName] = React.useState("")
  const [domainHost, setDomainHost] = React.useState("")
  const [demoClientCount, setDemoClientCount] = React.useState("25")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)

  const loadData = React.useCallback(async () => {
    const session = await getCurrentAppSession()
    if (!session?.userId || !session.accountId) {
      setLoading(false)
      return
    }

    const {
      data: { session: supabaseSession },
    } = await supabase.auth.getSession()

    const result = await loadSafePageForSession({
      userId: session.userId,
      accountId: session.accountId,
      accessToken: supabaseSession?.access_token ?? null,
    })

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    setSafePage(result.safePage)
    setBusinessName(result.safePage?.businessName || "")
    setDomainHost(result.safePage?.domainHost || "")
    setDemoClientCount(String(result.safePage?.demoClientCount ?? 25))
    setLoading(false)
  }, [])

  React.useEffect(() => {
    void loadData()
  }, [loadData])

  const handleSaveSettings = async () => {
    const session = await getCurrentAppSession()
    if (!session?.userId || !session.accountId) return

    setSaving(true)
    try {
      const {
        data: { session: supabaseSession },
      } = await supabase.auth.getSession()

      const result = await saveSafePageSettingsForSession({
        userId: session.userId,
        accountId: session.accountId,
        businessName,
        demoClientCount: Number.parseInt(demoClientCount || "0", 10),
        accessToken: supabaseSession?.access_token ?? null,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      setSafePage(result.safePage ?? null)
      toast.success("Safe Page salva com sucesso.")
    } finally {
      setSaving(false)
    }
  }

  const handleAddDomain = async () => {
    const session = await getCurrentAppSession()
    if (!session?.userId || !session.accountId) return

    setSaving(true)
    try {
      const {
        data: { session: supabaseSession },
      } = await supabase.auth.getSession()

      const result = await addSafePageDomainForSession({
        userId: session.userId,
        accountId: session.accountId,
        host: domainHost,
        accessToken: supabaseSession?.access_token ?? null,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      setSafePage(result.safePage ?? null)
      setDomainHost(result.safePage?.domainHost || "")
      toast.success("Dominio da Safe Page conectado.")
    } finally {
      setSaving(false)
    }
  }

  const handleRefreshDomain = async () => {
    const session = await getCurrentAppSession()
    if (!session?.userId || !session.accountId) return

    setSaving(true)
    try {
      const {
        data: { session: supabaseSession },
      } = await supabase.auth.getSession()

      const result = await refreshSafePageDomainForSession({
        userId: session.userId,
        accountId: session.accountId,
        accessToken: supabaseSession?.access_token ?? null,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      setSafePage(result.safePage ?? null)
      toast.success("Status do dominio atualizado.")
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveDomain = async () => {
    const session = await getCurrentAppSession()
    if (!session?.userId || !session.accountId) return

    setSaving(true)
    try {
      const {
        data: { session: supabaseSession },
      } = await supabase.auth.getSession()

      const result = await removeSafePageDomainForSession({
        userId: session.userId,
        accountId: session.accountId,
        accessToken: supabaseSession?.access_token ?? null,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      setSafePage(result.safePage ?? null)
      setDomainHost("")
      toast.success("Dominio da Safe Page removido.")
    } finally {
      setSaving(false)
    }
  }

  const handleExportCsv = async () => {
    const session = await getCurrentAppSession()
    if (!session?.userId || !session.accountId) return

    setExporting(true)
    try {
      const {
        data: { session: supabaseSession },
      } = await supabase.auth.getSession()

      const result = await exportSafePageCsvForSession({
        userId: session.userId,
        accountId: session.accountId,
        businessName,
        demoClientCount: Number.parseInt(demoClientCount || "0", 10),
        accessToken: supabaseSession?.access_token ?? null,
      })

      if (result.error || !result.csv || !result.filename) {
        toast.error(result.error || "Nao foi possivel exportar o CSV.")
        return
      }

      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success("CSV gerado com sucesso.")
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <div className="min-h-[420px]" />
  }

  const publicUrl = safePage?.domainHost ? `https://${safePage.domainHost}` : ""

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Safe Page</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Dominio white isolado da plataforma, com area de membros e exportacao CSV para comprovar a entrega dos acessos.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[420px_1fr]">
        <div className="space-y-8">
          <Card className="rounded-3xl border-primary/10 bg-card/40 shadow-xl">
            <CardHeader>
              <CardTitle>Negocio e demonstracao</CardTitle>
              <CardDescription>
                Se a conta ainda nao tiver vendas, usamos esses dados para gerar a lista demo do CSV.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Nome do negocio</Label>
                <Input
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder="Atelier do Sabor"
                />
              </div>
              <div className="space-y-2">
                <Label>Quantidade de clientes demo</Label>
                <Input
                  type="number"
                  min={0}
                  max={5000}
                  value={demoClientCount}
                  onChange={(event) => setDemoClientCount(event.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleSaveSettings} disabled={saving}>
                {saving ? "Salvando..." : "Salvar configuracao"}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-primary/10 bg-card/40 shadow-xl">
            <CardHeader>
              <CardTitle>Dominio proprio da Safe Page</CardTitle>
              <CardDescription>
                Esse host passa a servir a pagina white da Safe Page no lugar da landing publica principal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Host da Safe Page</Label>
                <Input
                  value={domainHost}
                  onChange={(event) => setDomainHost(event.target.value)}
                  placeholder="membros.seunegocio.com"
                />
              </div>

              <div className="rounded-2xl border border-primary/10 bg-muted/20 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Globe className="h-4 w-4 text-primary" />
                  Status do host
                </div>
                <p className="mt-2">
                  Dominio: {safePage?.domainHost || "Nao configurado"}
                </p>
                <p className="mt-1">
                  Verificacao: {safePage?.domainStatus || "none"} • SSL: {safePage?.sslStatus || "inactive"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button onClick={handleAddDomain} disabled={saving || !domainHost.trim()}>
                  {saving ? "Processando..." : "Conectar dominio"}
                </Button>
                <Button variant="outline" onClick={handleRefreshDomain} disabled={saving || !safePage?.domainHost}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Atualizar
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                onClick={handleRemoveDomain}
                disabled={saving || !safePage?.domainHost}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover dominio da Safe Page
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-primary/10 bg-card/40 shadow-xl">
            <CardHeader>
              <CardTitle>Entrega de acessos</CardTitle>
              <CardDescription>
                Exporta a lista CSV da area de membros. Se nao houver vendas, gera uma lista demo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-primary/10 bg-muted/20 p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">
                  {safePage?.hasSales
                    ? `${safePage.salesCount} venda(s) paga(s) encontrada(s)`
                    : "Nenhuma venda encontrada para esta conta"}
                </p>
                <p className="mt-2">
                  {safePage?.hasSales
                    ? "O CSV usara a lista real de acessos entregues."
                    : "O CSV usara a quantidade demo configurada acima, com a logo ja enviada pela conta."}
                </p>
              </div>
              <Button className="w-full" onClick={handleExportCsv} disabled={exporting}>
                <Download className="mr-2 h-4 w-4" />
                {exporting ? "Gerando CSV..." : "Exportar lista CSV"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="rounded-3xl border-primary/10 bg-card/40 shadow-xl">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Preview da Safe Page</CardTitle>
                <CardDescription>
                  Pagina white especifica para culinaria, com area de membros e acesso entregue.
                </CardDescription>
              </div>
              {publicUrl ? (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-primary/20 px-3 py-2 text-sm font-medium text-primary"
                >
                  Abrir dominio
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-[28px] border border-primary/10 bg-white">
                <SafePagePublic
                  businessName={businessName || safePage?.businessName || "Atelier do Sabor"}
                  logoUrl={safePage?.logoUrl || undefined}
                  members={safePage?.membersPreview || []}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-primary/10 bg-card/40 shadow-xl">
            <CardHeader>
              <CardTitle>Resumo operacional</CardTitle>
              <CardDescription>
                Estrutura pronta para apresentacao white, members area e comprovacao CSV.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-primary/10 bg-muted/20 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Membros</p>
                <p className="mt-2 text-2xl font-bold">{safePage?.membersPreview.length || 0}</p>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-muted/20 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Area</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  White members area
                </p>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-muted/20 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Segmento</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
                  <Users className="h-4 w-4 text-primary" />
                  Culinaria premium
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
