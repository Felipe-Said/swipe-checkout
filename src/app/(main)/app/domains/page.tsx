"use client"

import * as React from "react"
import { Activity, Globe, Search } from "lucide-react"
import {
  getConnectedDomains,
  addDomain,
  deleteDomain,
  setPrimaryDomain,
  type ConnectedDomain,
  type DomainMode,
  getDomainSetup,
} from "@/lib/domain-data"
import { getCurrentAppSession } from "@/lib/app-session"
import { DomainSetupCard } from "@/components/domains/checkout-domain-setup-card"
import { DomainDNSCard } from "@/components/domains/checkout-domain-dns-card"
import { DomainListCard } from "@/components/domains/checkout-domain-list-card"
import { DomainTutorial } from "@/components/domains/checkout-domain-tutorial"
import { useI18n } from "@/lib/i18n"
import { Input } from "@/components/ui/input"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"

export default function DomainsPage() {
  const { t } = useI18n()
  const [domains, setDomains] = React.useState<ConnectedDomain[]>([])
  const [search, setSearch] = React.useState("")
  const [selectedSetup, setSelectedSetup] = React.useState<{
    host: string
    mode: DomainMode
    recordType: string
    recordName: string
    recordValue: string
  } | null>(null)
  const [activeAccountId, setActiveAccountId] = React.useState("")

  const loadDomains = React.useCallback(async (accountId: string) => {
    const doms = await getConnectedDomains(accountId)
    setDomains(doms)
  }, [])

  React.useEffect(() => {
    async function load() {
      const session = await getCurrentAppSession()
      if (!session?.accountId) return

      setActiveAccountId(session.accountId)
      await loadDomains(session.accountId)
    }

    load()
  }, [loadDomains])

  const handleAddDomain = async (
    host: string,
    mode: DomainMode,
    checkoutId: string,
    isPrimary: boolean
  ) => {
    if (!activeAccountId) return

    const setup = getDomainSetup(host, mode)
    const formattedHost = mode === "platform" ? `${host}.swipe.com.br` : host

    try {
      await addDomain({
        account_id: activeAccountId,
        host: formattedHost,
        mode,
        checkoutId,
        isPrimary,
        status: setup.status as any,
        sslStatus: setup.sslStatus as any,
      })

      await loadDomains(activeAccountId)

      if (mode !== "platform") {
        setSelectedSetup({
          host: formattedHost,
          mode,
          recordType: setup.recordType!,
          recordName: setup.recordName!,
          recordValue: setup.recordValue!,
        })
      }

      toast.success("Dominio adicionado com sucesso!")
    } catch {
      toast.error("Erro ao adicionar dominio.")
    }
  }

  const handleDeleteDomain = async (id: string) => {
    try {
      await deleteDomain(id)
      await loadDomains(activeAccountId)
      toast.info("Dominio removido.")
    } catch {
      toast.error("Erro ao remover dominio.")
    }
  }

  const handleRefreshStatus = async () => {
    if (!activeAccountId) return
    await loadDomains(activeAccountId)
  }

  const handleSetPrimary = async (id: string) => {
    if (!activeAccountId) return

    try {
      await setPrimaryDomain(activeAccountId, id)
      await loadDomains(activeAccountId)
      toast.success("Dominio principal atualizado.")
    } catch {
      toast.error("Erro ao atualizar dominio principal.")
    }
  }

  const filteredDomains = domains.filter(
    (domain) =>
      domain.host.toLowerCase().includes(search.toLowerCase()) ||
      domain.checkoutName.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: domains.length,
    ready: domains.filter((domain) => domain.status === "Pronto").length,
    pending: domains.filter((domain) => domain.status === "Aguardando DNS").length,
  }

  return (
    <div className="flex flex-col gap-10 pb-20">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-1">
          <h1 className="bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-4xl font-black tracking-tighter text-transparent">
            {t("domains.title")}
          </h1>
          <p className="max-w-2xl font-medium text-muted-foreground">
            {t("domains.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-3xl border border-primary/5 bg-card/40 p-4 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col border-r border-primary/10 px-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Saude Global
            </span>
            <div className="mt-1 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-black">100% OK</span>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-xs font-bold">{stats.ready} Prontos</span>
            <div className="ml-2 h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            <span className="text-xs font-bold">{stats.pending} Pendentes</span>
          </div>
        </div>
      </div>

      <div className="grid gap-10 xl:grid-cols-[400px_minmax(0,1fr)]">
        <div className="space-y-6">
          <DomainSetupCard onAdd={handleAddDomain} />

          {selectedSetup && (
            <DomainDNSCard
              mode={selectedSetup.mode}
              type={selectedSetup.recordType}
              name={selectedSetup.recordName}
              value={selectedSetup.recordValue}
            />
          )}
        </div>

        <div className="space-y-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight">Dominios Conectados</h2>
            <div className="relative w-72">
              <Input
                placeholder="Buscar dominio ou checkout..."
                className="h-10 rounded-xl border-primary/10 bg-card px-10 text-xs font-medium focus-visible:ring-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="grid gap-4">
            {filteredDomains.length > 0 ? (
              filteredDomains.map((domain) => (
                <DomainListCard
                  key={domain.id}
                  domain={domain}
                  onDelete={handleDeleteDomain}
                  onRefresh={handleRefreshStatus}
                  onSetPrimary={handleSetPrimary}
                />
              ))
            ) : (
              <Card className="flex flex-col items-center justify-center border-dashed border-primary/20 bg-transparent py-20 text-center">
                <Globe className="mb-4 h-12 w-12 text-muted-foreground/20" />
                <CardTitle className="font-black text-muted-foreground/60">
                  Nenhum dominio encontrado
                </CardTitle>
                <CardDescription>
                  Comece adicionando seu primeiro dominio de checkout no formulario lateral.
                </CardDescription>
              </Card>
            )}
          </div>

          <DomainTutorial />
        </div>
      </div>
    </div>
  )
}
