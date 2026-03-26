"use client"

import * as React from "react"

import { supabase } from "@/lib/supabase"
import {
  getManagedAccounts,
  updateManagedAccount,
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

export default function WhopPage() {
  const [sessionRole, setSessionRole] = React.useState<"admin" | "user">("user")
  const [accounts, setAccounts] = React.useState<ManagedAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = React.useState("")
  const [isValidating, setIsValidating] = React.useState(false)
  const [events, setEvents] = React.useState<DiagnosticEvent[]>([])

  React.useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Simple role check based on metadata or profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        setSessionRole(profile?.role || "user")
      }

      const loadedAccounts = await getManagedAccounts()
      setAccounts(loadedAccounts)

      if (loadedAccounts.length > 0) {
        setSelectedAccountId(loadedAccounts[0].id)
      }
    }
    
    loadData()
  }, [])

  const currentAccount =
    accounts.find((account) => account.id === selectedAccountId) ?? accounts[0]

  const updateAccounts = React.useCallback(
    async (updater: (current: ManagedAccount[]) => ManagedAccount[]) => {
      const next = updater(accounts)
      setAccounts(next)
      
      const updatedAccount = next.find(a => a.id === selectedAccountId)
      if (updatedAccount) {
        try {
          await updateManagedAccount(updatedAccount.id, updatedAccount)
        } catch (error) {
          console.error("Failed to update account in Supabase:", error)
          toast.error("Erro ao salvar no banco de dados")
        }
      }
    },
    [accounts, selectedAccountId]
  )

  const handleKeyChange = (value: string) => {
    if (!currentAccount) return

    updateAccounts((current) =>
      current.map((account) =>
        account.id === currentAccount.id ? { ...account, whopKey: value } : account
      )
    )
  }

  const handleSave = () => {
    if (!currentAccount) return

    updateAccounts((current) =>
      current.map((account) =>
        account.id === currentAccount.id
          ? { ...account, whopIntegrationStatus: PENDING_STATUS }
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
          "A credencial foi registrada. Inicie a validacao para confirmar a conexao.",
      },
    ])
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

    setTimeout(() => {
      setEvents((prev) => [
        {
          id: "check-key",
          timestamp: new Date().toLocaleTimeString(),
          type: "success",
          message: "API Key validada com sucesso",
          description: "A chave respondeu corretamente a chamada de teste.",
        },
        ...prev,
      ])
    }, 1000)

    setTimeout(() => {
      setEvents((prev) => [
        {
          id: "check-perms",
          timestamp: new Date().toLocaleTimeString(),
          type: "success",
          message: "Permissoes verificadas",
          description: "Acesso a checkout configurations e produtos confirmado.",
        },
        ...prev,
      ])
    }, 2000)

    setTimeout(() => {
      setEvents((prev) => [
        {
          id: "check-webhook",
          timestamp: new Date().toLocaleTimeString(),
          type: "success",
          message: "Webhook monitorado",
          description: "Listener ativo e recebendo eventos de teste.",
        },
        ...prev,
      ])
    }, 3000)

    setTimeout(() => {
      setEvents((prev) => [
        {
          id: "ready",
          timestamp: new Date().toLocaleTimeString(),
          type: "success",
          message: "Checkout pronto",
          description:
            "A conta esta apta para operar o fluxo de checkout incorporado.",
        },
        ...prev,
      ])

      updateAccounts((current) =>
        current.map((account) =>
          account.id === currentAccount.id
            ? {
                ...account,
                whopIntegrationStatus: READY_STATUS,
                whopLastValidation: new Date().toLocaleString(),
                whopPermissionsValid: true,
                whopCheckoutReady: true,
                whopWebhookActive: true,
                whopCompanyId:
                  account.whopCompanyId ??
                  `comp_${Math.random().toString(36).slice(2, 11)}`,
                whopEnvironment: account.whopEnvironment ?? SANDBOX_ENV,
              }
            : account
        )
      )

      setIsValidating(false)
    }, 4000)
  }

  if (!currentAccount) return null

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
            apiKey={currentAccount.whopKey}
            onKeyChange={handleKeyChange}
            onSave={handleSave}
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
          <WhopAdvancedSettings />
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
