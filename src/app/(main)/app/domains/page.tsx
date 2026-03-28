"use client"

import * as React from "react"
import { Activity, Globe, Search } from "lucide-react"
import { type ConnectedDomain, type DomainMode } from "@/lib/domain-data"
import { getCurrentAppSession } from "@/lib/app-session"
import {
  addDomainForSession,
  deleteDomainForSession,
  loadDomainsForSession,
  refreshDomainForSession,
  setPrimaryDomainForSession,
} from "@/app/actions/domains"
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
    verificationRecordType?: string
    verificationRecordName?: string
    verificationRecordValue?: string
    secondaryRecordType?: string
    secondaryRecordName?: string
    secondaryRecordValue?: string
  } | null>(null)
  const [activeAccountId, setActiveAccountId] = React.useState("")
  const [sessionUserId, setSessionUserId] = React.useState("")

  const loadDomains = React.useCallback(async (userId: string, accountId: string) => {
    const result = await loadDomainsForSession({ userId, accountId })
    if (result.error) {
      toast.error(result.error)
      return
    }

    setDomains(result.domains)
  }, [])

  React.useEffect(() => {
    async function load() {
      const session = await getCurrentAppSession()
      if (!session?.accountId || !session.userId) return

      setSessionUserId(session.userId)
      setActiveAccountId(session.accountId)
      await loadDomains(session.userId, session.accountId)
    }

    void load()
  }, [loadDomains])

  const handleAddDomain = async (
    host: string,
    mode: DomainMode,
    checkoutId: string,
    isPrimary: boolean
  ) => {
    if (!activeAccountId || !sessionUserId) return

    const formattedHost = mode === "platform" ? `${host}.swipe.com.br` : host

    const result = await addDomainForSession({
      userId: sessionUserId,
      accountId: activeAccountId,
      host: formattedHost,
      checkoutId,
      isPrimary,
    })

    if (result.error) {
      toast.error(result.error)
      return
    }

    await loadDomains(sessionUserId, activeAccountId)

    if (mode !== "platform" && result.setup) {
      setSelectedSetup({
        host: formattedHost,
          mode: result.setup.mode,
          recordType: result.setup.recordType,
          recordName: result.setup.recordName,
          recordValue: result.setup.recordValue,
          verificationRecordType: result.setup.verificationRecordType,
          verificationRecordName: result.setup.verificationRecordName,
          verificationRecordValue: result.setup.verificationRecordValue,
          secondaryRecordType: result.setup.secondaryRecordType,
          secondaryRecordName: result.setup.secondaryRecordName,
          secondaryRecordValue: result.setup.secondaryRecordValue,
        })
      }

    toast.success("Dominio adicionado com sucesso!")
  }

  const handleDeleteDomain = async (id: string) => {
    if (!activeAccountId || !sessionUserId) return

    const result = await deleteDomainForSession({
      userId: sessionUserId,
      accountId: activeAccountId,
      domainId: id,
    })

    if (result.error) {
      toast.error(result.error)
      return
    }

    await loadDomains(sessionUserId, activeAccountId)
    toast.info("Dominio removido.")
  }

  const handleRefreshStatus = async (id: string) => {
    if (!activeAccountId || !sessionUserId) return

    const result = await refreshDomainForSession({
      userId: sessionUserId,
      accountId: activeAccountId,
      domainId: id,
    })

    if (result.error) {
      toast.error(result.error)
      return
    }

    await loadDomains(sessionUserId, activeAccountId)
    toast.success("Status do dominio atualizado.")
  }

  const handleSetPrimary = async (id: string) => {
    if (!activeAccountId || !sessionUserId) return

    const result = await setPrimaryDomainForSession({
      userId: sessionUserId,
      accountId: activeAccountId,
      domainId: id,
    })

    if (result.error) {
      toast.error(result.error)
      return
    }

    await loadDomains(sessionUserId, activeAccountId)
    toast.success("Dominio principal atualizado.")
  }

  const handleViewDns = (domain: ConnectedDomain) => {
    setSelectedSetup({
      host: domain.host,
      mode: domain.mode,
      recordType: domain.recordType,
      recordName: domain.recordName,
      recordValue: domain.recordValue,
      verificationRecordType: domain.verificationRecordType,
      verificationRecordName: domain.verificationRecordName,
      verificationRecordValue: domain.verificationRecordValue,
      secondaryRecordType: domain.secondaryRecordType,
      secondaryRecordName: domain.secondaryRecordName,
      secondaryRecordValue: domain.secondaryRecordValue,
    })
  }

  const filteredDomains = domains.filter(
    (domain) =>
      domain.host.toLowerCase().includes(search.toLowerCase()) ||
      domain.checkoutName.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: domains.length,
    ready: domains.filter((domain) => domain.status === "Pronto").length,
    pending: domains.filter((domain) => domain.status !== "Pronto").length,
  }

  const selectedSetupDomain = selectedSetup
    ? domains.find((item) => item.host === selectedSetup.host)
    : null

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
              <Activity
                className={`h-4 w-4 ${
                  stats.total > 0 && stats.pending === 0 ? "text-emerald-500" : "text-amber-500"
                }`}
              />
              <span className="text-sm font-black">
                {stats.total === 0
                  ? "Sem dominios"
                  : `${Math.round((stats.ready / Math.max(stats.total, 1)) * 100)}% OK`}
              </span>
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
              verificationType={selectedSetup.verificationRecordType}
              verificationName={selectedSetup.verificationRecordName}
              verificationValue={selectedSetup.verificationRecordValue}
              secondaryType={selectedSetup.secondaryRecordType}
              secondaryName={selectedSetup.secondaryRecordName}
              secondaryValue={selectedSetup.secondaryRecordValue}
              isVerified={selectedSetupDomain?.verificationStatus === "verified"}
              onVerify={() => {
                if (!selectedSetupDomain) return
                void handleRefreshStatus(selectedSetupDomain.id)
              }}
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
                  onViewDns={handleViewDns}
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
