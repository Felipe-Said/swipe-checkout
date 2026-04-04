"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"

import {
  clearWhopAccountCredentials,
  loadWhopAccountForSession,
  saveWhopAccountCredentials,
  validateWhopAccount,
} from "@/app/actions/whop"
import { getCurrentAppSession } from "@/lib/app-session"
import {
  getManagedAccounts,
  type ManagedAccount,
} from "@/lib/account-metrics"
import { toast } from "sonner"

import {
  WhopIntegrationHeader,
  type WhopHealthStatus,
} from "@/components/whop/whop-integration-header"
import { WhopCredentialsCard } from "@/components/whop/whop-credentials-card"
import {
  WhopIntegrationReadiness,
  type ReadinessStatus,
} from "@/components/whop/whop-integration-readiness"
import { WhopSetupTutorial } from "@/components/whop/whop-setup-tutorial"
import { WhopDiagnosticsPanel } from "@/components/whop/whop-diagnostics-panel"
import { WhopWebhookStatusCard } from "@/components/whop/whop-webhook-status-card"
import { WhopCheckoutReadinessCard } from "@/components/whop/whop-checkout-readiness-card"
import { WhopAccountSummaryCard } from "@/components/whop/whop-account-summary-card"
import { WhopAdvancedSettings } from "@/components/whop/whop-advanced-settings"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

type DiagnosticEvent = {
  id: string
  timestamp: string
  type: "info" | "success" | "warning" | "error"
  message: string
  description?: string
}

const READY_STATUS: NonNullable<ManagedAccount["whopIntegrationStatus"]> = "Pronto"
const PENDING_STATUS: NonNullable<ManagedAccount["whopIntegrationStatus"]> = "Pendente"
const SANDBOX_ENV: NonNullable<ManagedAccount["whopEnvironment"]> = "Sandbox"

function getWhopWebhookEndpoint() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/webhooks/whop`
  }

  return "https://seu-dominio.com/api/webhooks/whop"
}

export default function WhopPage() {
  const searchParams = useSearchParams()
  const [sessionRole, setSessionRole] = React.useState<"admin" | "user">("user")
  const [accounts, setAccounts] = React.useState<ManagedAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = React.useState("")
  const [isValidating, setIsValidating] = React.useState(false)
  const [events, setEvents] = React.useState<DiagnosticEvent[]>([])
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false

    async function loadData() {
      const session = await getCurrentAppSession()
      if (session && !cancelled) {
        setSessionRole(session.role === "admin" ? "admin" : "user")
      }

      const {
        data: { session: supabaseSession },
      } = await supabase.auth.getSession()

      let loadedAccounts = await getManagedAccounts()

      if (session?.userId) {
        const serverLoaded = await loadWhopAccountForSession({
          accountId: session.accountId,
          userId: session.userId,
          accessToken: supabaseSession?.access_token ?? null,
        })

        if (serverLoaded.account) {
          loadedAccounts = [serverLoaded.account]
        }
      }

      if (loadedAccounts.length === 0 && session) {
        loadedAccounts = [
          {
            id: session.accountId ?? session.userId,
            profile_id: session.userId,
            name: session.name,
            email: session.email,
            role: session.role,
            status: "Ativa",
            orders: 0,
            conversionRate: 0,
            revenue: 0,
            feeRate: session.role === "admin" ? 0 : 15,
            keyFrozen: session.keyFrozen,
            billingCycleDays: 2,
            paymentMode: "manual",
            settlementStartedAt: new Date().toISOString(),
            whopIntegrationStatus: PENDING_STATUS,
            estimatedDailyRevenueByCurrency: { BRL: 0, USD: 0, EUR: 0, GBP: 0 },
          },
        ]
      }

      if (!cancelled) {
        setAccounts(loadedAccounts)
        const requestedAccountId = searchParams.get("accountId") || ""
        const preferredAccountId =
          (requestedAccountId &&
          loadedAccounts.some((account) => account.id === requestedAccountId)
            ? requestedAccountId
            : session?.accountId &&
          loadedAccounts.some((account) => account.id === session.accountId)
            ? session.accountId
            : loadedAccounts[0]?.id) ?? ""
        setSelectedAccountId(preferredAccountId)
        setLoaded(true)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [searchParams])

  const reloadAccounts = React.useCallback(async () => {
    const session = await getCurrentAppSession()
    if (!session) {
      return
    }

    const {
      data: { session: supabaseSession },
    } = await supabase.auth.getSession()

    const result = await loadWhopAccountForSession({
      accountId: session.accountId,
      userId: session.userId,
      accessToken: supabaseSession?.access_token ?? null,
    })

    if (!result.account) {
      return
    }

    setAccounts([result.account])
    setSelectedAccountId(result.account.id)
  }, [])

  const currentAccount =
    accounts.find((account) => account.id === selectedAccountId) ?? accounts[0]

  const handleKeyChange = (value: string) => {
    if (!currentAccount) return

    setAccounts((current) =>
      current.map((account) =>
        account.id === currentAccount.id ? { ...account, whopKey: value } : account
      )
    )
  }

  const handleCompanyIdChange = (value: string) => {
    if (!currentAccount) return

    setAccounts((current) =>
      current.map((account) =>
        account.id === currentAccount.id ? { ...account, whopCompanyId: value } : account
      )
    )
  }

  const handleSave = async () => {
    if (!currentAccount) return

    try {
      const session = await getCurrentAppSession()
      const {
        data: { session: supabaseSession },
      } = await supabase.auth.getSession()

      const result = await saveWhopAccountCredentials({
        accountId: currentAccount.id,
        apiKey: currentAccount.whopKey || "",
        companyId: currentAccount.whopCompanyId || "",
        userId: session?.userId ?? undefined,
        accessToken: supabaseSession?.access_token ?? null,
      })

      if (result?.error) {
        toast.error(result.error)
        return
      }

      setAccounts((current) =>
        current.map((account) =>
          account.id === currentAccount.id
            ? {
                ...account,
                whopIntegrationStatus: PENDING_STATUS,
                whopPermissionsValid: false,
                whopCheckoutReady: false,
                whopWebhookActive: false,
              }
            : account
        )
      )

      setEvents([
        {
          id: "save",
          timestamp: new Date().toLocaleTimeString(),
          type: "info",
          message: "Chave salva na conta",
          description:
            "A credencial foi registrada no banco. Inicie a validacao para confirmar a conexao.",
        },
      ])

      toast.success("Chave da Whop salva com sucesso.")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel salvar a chave da Whop."
      toast.error(message)
    }
  }

  const handleClear = async () => {
    if (!currentAccount?.whopKey) return

    try {
      const session = await getCurrentAppSession()
      const {
        data: { session: supabaseSession },
      } = await supabase.auth.getSession()

      const result = await clearWhopAccountCredentials({
        accountId: currentAccount.id,
        userId: session?.userId ?? undefined,
        accessToken: supabaseSession?.access_token ?? null,
      })

      if (result?.error) {
        toast.error(result.error)
        return
      }

      setAccounts((current) =>
        current.map((account) =>
          account.id === currentAccount.id
            ? {
                ...account,
                whopKey: undefined,
                whopCompanyId: undefined,
                whopIntegrationStatus: PENDING_STATUS,
                whopLastValidation: undefined,
                whopPermissionsValid: false,
                whopCheckoutReady: false,
                whopWebhookActive: false,
                whopEnvironment: SANDBOX_ENV,
              }
            : account
        )
      )

      setEvents([
        {
          id: "clear",
          timestamp: new Date().toLocaleTimeString(),
          type: "warning",
          message: "Chave removida da conta",
          description:
            "A credencial atual foi apagada. Salve uma nova chave e valide novamente para reativar a integracao.",
        },
      ])

      toast.success("Chave da Whop apagada com sucesso.")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel apagar a chave da Whop."
      toast.error(message)
    }
  }

  const handleValidate = () => {
    if (isValidating || !currentAccount) return

    setIsValidating(true)
    setEvents([
      {
        id: "start",
        timestamp: new Date().toLocaleTimeString(),
        type: "info",
        message: "Iniciando validacao completa...",
      },
    ])

    void (async () => {
      const session = await getCurrentAppSession()
      const {
        data: { session: supabaseSession },
      } = await supabase.auth.getSession()

      const result = await validateWhopAccount({
        accountId: currentAccount.id,
        apiKey: currentAccount.whopKey || "",
        companyId: currentAccount.whopCompanyId || "",
        userId: session?.userId ?? undefined,
        accessToken: supabaseSession?.access_token ?? null,
      })

      if (result?.error) {
        setEvents((prev) => [
          {
            id: "error",
            timestamp: new Date().toLocaleTimeString(),
            type: "error",
            message: "Falha ao validar a API Key",
            description: result.error,
          },
          ...prev,
        ])
        toast.error(result.error)
        setIsValidating(false)
        return
      }

      setEvents((prev) => [
        {
          id: "check-key",
          timestamp: new Date().toLocaleTimeString(),
          type: "success",
          message: "API Key validada com sucesso",
          description: "A chave respondeu corretamente a Whop.",
        },
        {
          id: "check-perms",
          timestamp: new Date().toLocaleTimeString(),
          type: "success",
          message: "Permissoes verificadas",
          description: "Checkout configurations, company e webhooks confirmados.",
        },
        {
          id: "check-webhook",
          timestamp: new Date().toLocaleTimeString(),
          type: "success",
          message: "Webhook configurado",
          description: "A URL operacional da Whop foi registrada para esta conta.",
        },
        {
          id: "ready",
          timestamp: new Date().toLocaleTimeString(),
          type: "success",
          message: "Checkout pronto",
          description: "A conta esta apta para publicar checkouts reais na Whop.",
        },
        ...prev,
      ])

      setAccounts((current) =>
        current.map((account) =>
          account.id === currentAccount.id
            ? {
                ...account,
                whopIntegrationStatus: READY_STATUS,
                whopLastValidation: new Date().toLocaleString(),
                whopPermissionsValid: true,
                whopCheckoutReady: true,
                whopWebhookActive: true,
                whopCompanyId: result.company?.id ?? account.whopCompanyId,
                whopEnvironment: "Produção",
              }
            : account
        )
      )

      toast.success("Integracao Whop validada com sucesso.")
      setIsValidating(false)
    })()
  }

  if (!loaded) {
    return <div className="min-h-[320px]" />
  }

  if (!currentAccount) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Whop</h1>
          <p className="text-muted-foreground">
            Configure as chaves da Whop e acompanhe a saude da integracao.
          </p>
        </div>

        <Card className="p-6">
          <h4 className="mb-2 text-sm font-black uppercase tracking-tight">
            Nenhuma conta carregada
          </h4>
          <p className="text-sm text-muted-foreground">
            Assim que a conta operacional estiver disponivel, as configuracoes da Whop aparecerao aqui.
          </p>
        </Card>
      </div>
    )
  }

  const isFrozenForUser = sessionRole === "user" && currentAccount.keyFrozen

  if (isFrozenForUser) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="flex max-w-md flex-col items-center justify-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10 text-destructive">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Acesso Restrito</h1>
            <p className="font-medium text-muted-foreground">
              As configuracoes da Whop foram congeladas pelo administrador para esta
              conta.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const headerStatus = (currentAccount.whopIntegrationStatus ?? PENDING_STATUS) as WhopHealthStatus
  const apiKeyStatus = (currentAccount.whopKey ? READY_STATUS : PENDING_STATUS) as ReadinessStatus
  const permissionsStatus = (
    currentAccount.whopPermissionsValid ? READY_STATUS : isValidating ? "Validando" : PENDING_STATUS
  ) as ReadinessStatus
  const checkoutStatus = (
    currentAccount.whopCheckoutReady ? READY_STATUS : isValidating ? "Validando" : PENDING_STATUS
  ) as ReadinessStatus
  const webhookStatus = (
    currentAccount.whopWebhookActive ? READY_STATUS : isValidating ? "Validando" : PENDING_STATUS
  ) as ReadinessStatus

  return (
    <div className="flex flex-col gap-8 pb-10">
      <WhopIntegrationHeader
        status={headerStatus}
        onValidate={handleValidate}
        isValidating={isValidating}
      />

      <WhopIntegrationReadiness
        apiKeyStatus={apiKeyStatus}
        permissionsStatus={permissionsStatus}
        checkoutStatus={checkoutStatus}
        webhookStatus={webhookStatus}
      />

      <div className="grid gap-8 xl:grid-cols-[440px_1fr]">
        <div className="space-y-8">
          <WhopCredentialsCard
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            onAccountChange={setSelectedAccountId}
            apiKey={currentAccount.whopKey || ""}
            onKeyChange={handleKeyChange}
            onSave={handleSave}
            onClear={handleClear}
            isAdmin={sessionRole === "admin"}
            isSaved={!!currentAccount.whopKey}
            isLoading={isValidating}
          />

          <WhopAccountSummaryCard
            accountName={currentAccount.name || ""}
            companyId={currentAccount.whopCompanyId || "Aguardando conexao"}
            environment={currentAccount.whopEnvironment || "Não definido"}
            status={currentAccount.whopIntegrationStatus || PENDING_STATUS}
            lastUpdate={currentAccount.whopLastValidation || "Nunca validado"}
          />

          <Card className="rounded-2xl border-primary/10 bg-primary/5 p-6">
            <h4 className="mb-2 text-sm font-black uppercase tracking-tight">
              O que esta conexao habilita
            </h4>
            <p className="text-xs font-medium leading-relaxed text-muted-foreground">
              Essa conexao permite gerenciar configuracoes de checkout, validar
              pagamentos em tempo real e monitorar a saude da operacao no painel.
            </p>
          </Card>
        </div>

        <div className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <WhopCheckoutReadinessCard
              isReady={!!currentAccount.whopCheckoutReady}
              hasConfig={!!currentAccount.whopCheckoutReady}
              hasPermissions={!!currentAccount.whopPermissionsValid}
            />
            <WhopWebhookStatusCard
              status={currentAccount.whopWebhookActive ? "Ativo" : "Pendente"}
            />
          </div>

          <WhopDiagnosticsPanel events={events} onRetry={handleValidate} />
          <WhopSetupTutorial />
          <WhopAdvancedSettings
            companyId={currentAccount.whopCompanyId || ""}
            onCompanyIdChange={handleCompanyIdChange}
            webhookEndpoint={getWhopWebhookEndpoint()}
            successUrl={`${typeof window !== "undefined" ? window.location.origin : "https://seu-dominio.com"}/app`}
            cancelUrl={`${typeof window !== "undefined" ? window.location.origin : "https://seu-dominio.com"}/app/whop`}
          />
        </div>
      </div>
    </div>
  )
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("rounded-xl border bg-card", className)}>{children}</div>
}
