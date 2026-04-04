"use client"

import * as React from "react"
import { Ban, Check, ImagePlus, KeyRound, MessageSquare, Percent, ShieldCheck, Users } from "lucide-react"

import {
  adminHandleSignup,
  adminMarkWithdrawalPaid,
  adminSendSupportMessage,
  adminUpdateCustomerAccount,
  loadAdminCustomersData,
} from "@/app/actions/customers"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { WhopAdvancedSettings } from "@/components/whop/whop-advanced-settings"
import { getCurrentAppSession } from "@/lib/app-session"
import { calculateFeeValue } from "@/lib/account-metrics"
import { supabase } from "@/lib/supabase"
import {
  getBankFieldDefinitions,
  withdrawalCurrencyOptions,
  type SupportedWithdrawalCurrency,
} from "@/lib/withdrawals-data"

type AdminCustomerAccount = {
  id: string
  profileId: string | null
  name: string
  email: string
  photoUrl: string
  role: "admin" | "user"
  status: "Ativa" | "Bloqueada"
  orders: number
  conversionRate: number
  revenue: number
  feeRate: number
  whopKey: string
  whopCompanyId: string
  keyFrozen: boolean
  withdrawalsEnabled: boolean
  messengerEnabled: boolean
  gatewayEnabled: boolean
  billingCycleDays: number
}

type SupportChatMessage = {
  id: string
  accountId: string
  from: "admin" | "user"
  text: string
  imageSrc: string
  createdAt: string
}

type WithdrawalRecord = {
  id: string
  accountId: string
  currency: SupportedWithdrawalCurrency
  amount: number
  requestedAt: string
  paidAt: string | null
  status: "pending" | "paid"
}

type PendingSignup = {
  id: string
  name: string
  email: string
}

type BankAccountsMap = Record<
  string,
  Partial<
    Record<
      SupportedWithdrawalCurrency,
      {
        holderName: string
        document: string
        bankName: string
        agency: string
        accountNumber: string
        pixKey: string
      }
    >
  >
>

export default function CustomersAdminPage() {
  const [accounts, setAccounts] = React.useState<AdminCustomerAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = React.useState<string>("")
  const [chatDraft, setChatDraft] = React.useState("")
  const [chatImage, setChatImage] = React.useState("")
  const [signupQueue, setSignupQueue] = React.useState<PendingSignup[]>([])
  const [messages, setMessages] = React.useState<SupportChatMessage[]>([])
  const [withdrawals, setWithdrawals] = React.useState<WithdrawalRecord[]>([])
  const [bankAccounts, setBankAccounts] = React.useState<BankAccountsMap>({})
  const [loaded, setLoaded] = React.useState(false)
  const [sessionUserId, setSessionUserId] = React.useState("")
  const companyIdSaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const upsertRealtimeMessage = React.useCallback((message: SupportChatMessage) => {
    setMessages((current) => {
      const next = current.filter((item) => item.id !== message.id)
      next.push(message)
      next.sort((left, right) => {
        const leftTime = new Date(left.createdAt).getTime()
        const rightTime = new Date(right.createdAt).getTime()
        return leftTime - rightTime
      })
      return next
    })
  }, [])

  const removeRealtimeMessage = React.useCallback((messageId: string) => {
    setMessages((current) => current.filter((item) => item.id !== messageId))
  }, [])

  const loadData = React.useCallback(async (userId: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const result = await loadAdminCustomersData({
      userId,
      accessToken: session?.access_token ?? null,
    })
    if (result.error) {
      setLoaded(true)
      return
    }

    const nextAccounts = result.accounts ?? []
    const nextMessages = result.messages ?? []
    const nextWithdrawals = result.withdrawals ?? []
    const nextBankAccounts = result.bankAccounts ?? {}
    const nextPendingSignups = result.pendingSignups ?? []

    setAccounts(nextAccounts)
    setSelectedAccountId((current) =>
      current && nextAccounts.some((account) => account.id === current)
        ? current
        : (nextAccounts[0]?.id ?? "")
    )
    setMessages(nextMessages)
    setWithdrawals(nextWithdrawals)
    setBankAccounts(nextBankAccounts)
    setSignupQueue(nextPendingSignups)
    setLoaded(true)
  }, [])

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      const session = await getCurrentAppSession()
      if (!session?.userId) {
        if (!cancelled) {
          setLoaded(true)
        }
        return
      }

      setSessionUserId(session.userId)
      await loadData(session.userId)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [loadData])

  React.useEffect(() => {
    if (!sessionUserId) {
      return
    }

    const messagesChannel = supabase
      .channel("admin-support-messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_messages",
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            removeRealtimeMessage(String(payload.old.id))
            return
          }

          if (payload.new && typeof payload.new === "object") {
            const row = payload.new as {
              id?: string
              account_id?: string
              from_role?: string
              text?: string | null
              image_src?: string | null
              created_at?: string
            }

            if (row.id && row.account_id && row.created_at) {
              upsertRealtimeMessage({
                id: row.id,
                accountId: row.account_id,
                from: row.from_role === "admin" ? "admin" : "user",
                text: row.text ?? "",
                imageSrc: row.image_src ?? "",
                createdAt: row.created_at,
              })
            }
          }
        }
      )
      .subscribe()

    const accountsChannel = supabase
      .channel("admin-managed-accounts")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "managed_accounts",
        },
        async () => {
          await loadData(sessionUserId)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        async () => {
          await loadData(sessionUserId)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(messagesChannel)
      void supabase.removeChannel(accountsChannel)
    }
  }, [loadData, removeRealtimeMessage, sessionUserId, upsertRealtimeMessage])

  React.useEffect(() => {
    return () => {
      if (companyIdSaveTimeoutRef.current) {
        clearTimeout(companyIdSaveTimeoutRef.current)
      }
    }
  }, [])

  const selectedAccount =
    accounts.find((account) => account.id === selectedAccountId) ?? accounts[0]

  const handleAccountPatch = async (patch: {
    feeRate?: number
    whopKey?: string
    whopCompanyId?: string
    keyFrozen?: boolean
    withdrawalsEnabled?: boolean
    messengerEnabled?: boolean
    gatewayEnabled?: boolean
    status?: "Ativa" | "Bloqueada"
  }) => {
    if (!selectedAccount || !sessionUserId) return

    await adminUpdateCustomerAccount({
      userId: sessionUserId,
      accessToken: (await supabase.auth.getSession()).data.session?.access_token ?? null,
      accountId: selectedAccount.id,
      patch,
    })

    await loadData(sessionUserId)
  }

  const handleCompanyIdChange = (value: string) => {
    if (!selectedAccount) return

    setAccounts((current) =>
      current.map((account) =>
        account.id === selectedAccount.id ? { ...account, whopCompanyId: value } : account
      )
    )

    if (companyIdSaveTimeoutRef.current) {
      clearTimeout(companyIdSaveTimeoutRef.current)
    }

    companyIdSaveTimeoutRef.current = setTimeout(() => {
      void handleAccountPatch({ whopCompanyId: value })
    }, 450)
  }

  const handleChatImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setChatImage(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSendMessage = async () => {
    if (!selectedAccount || !sessionUserId || (!chatDraft.trim() && !chatImage)) {
      return
    }

    await adminSendSupportMessage({
      userId: sessionUserId,
      accessToken: (await supabase.auth.getSession()).data.session?.access_token ?? null,
      accountId: selectedAccount.id,
      text: chatDraft.trim(),
      imageSrc: chatImage,
    })

    setChatDraft("")
    setChatImage("")
    await loadData(sessionUserId)
  }

  const handleMarkWithdrawalPaid = async (withdrawalId: string) => {
    if (!sessionUserId) return

    await adminMarkWithdrawalPaid({
      userId: sessionUserId,
      accessToken: (await supabase.auth.getSession()).data.session?.access_token ?? null,
      withdrawalId,
    })

    await loadData(sessionUserId)
  }

  const handleDecision = async (profileId: string, nextStatus: "approved" | "rejected") => {
    if (!sessionUserId) return

    await adminHandleSignup({
      userId: sessionUserId,
      accessToken: (await supabase.auth.getSession()).data.session?.access_token ?? null,
      profileId,
      nextStatus,
    })

    await loadData(sessionUserId)
  }

  if (!loaded) {
    return <div className="min-h-[320px]" />
  }

  if (!selectedAccount) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Painel admin com metricas, chat, controle de chaves e aprovacao de cadastros.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nenhuma conta carregada</CardTitle>
            <CardDescription>
              Assim que novos usuarios forem aprovados, eles aparecerao aqui para administracao.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const accountMessages = messages.filter((message) => message.accountId === selectedAccount.id)
  const accountBankAccounts = bankAccounts[selectedAccount.id] ?? {}
  const pendingWithdrawals = withdrawals.filter(
    (withdrawal) => withdrawal.accountId === selectedAccount.id && withdrawal.status === "pending"
  )
  const paidWithdrawals = withdrawals.filter(
    (withdrawal) => withdrawal.accountId === selectedAccount.id && withdrawal.status === "paid"
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground">
          Painel admin com metricas, chat, controle de chaves e aprovacao de cadastros.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Contas</CardTitle>
            <CardDescription>Selecione uma conta para administrar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {accounts.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => setSelectedAccountId(account.id)}
                className={`w-full rounded-xl border p-4 text-left ${
                  selectedAccount.id === account.id ? "border-primary bg-muted" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 border">
                    <AvatarImage src={account.photoUrl} alt={account.name} />
                    <AvatarFallback className="text-sm font-medium">
                      {getAccountInitials(account.name, account.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-medium">{account.name}</div>
                    <div className="truncate text-sm text-muted-foreground">{account.email}</div>
                    <div className="mt-2 text-xs text-muted-foreground">{account.status}</div>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard title="Pedidos" value={selectedAccount.orders.toString()} icon={<Users className="h-4 w-4" />} />
            <MetricCard title="Conversao" value={`${selectedAccount.conversionRate.toFixed(1)}%`} icon={<ShieldCheck className="h-4 w-4" />} />
            <MetricCard title="Receita" value={formatCurrency(selectedAccount.revenue)} icon={<KeyRound className="h-4 w-4" />} />
            <MetricCard title="Taxa" value={`${selectedAccount.feeRate.toFixed(2)}%`} icon={<Percent className="h-4 w-4" />} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Taxa por Conta</CardTitle>
              <CardDescription>
                Defina a porcentagem de transacao que sera cobrada deste usuario.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[220px_1fr] md:items-end">
              <div className="grid gap-2">
                <Label>Taxa de transacao (%)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={selectedAccount.feeRate}
                  onChange={(e) =>
                    void handleAccountPatch({ feeRate: Number(e.target.value || 0) })
                  }
                />
              </div>
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                Valor total cobrado nesta conta:{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(calculateFeeValue(selectedAccount))}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Chat em Tempo Real</CardTitle>
                <CardDescription>
                  Canal privado entre admin e a conta selecionada.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 rounded-xl border p-4">
                  {accountMessages.length > 0 ? accountMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                        message.from === "admin"
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {message.text ? <div>{message.text}</div> : null}
                      {message.imageSrc ? (
                        <img
                          src={message.imageSrc}
                          alt="Anexo do chat"
                          className="mt-2 max-h-40 rounded-lg border object-contain"
                        />
                      ) : null}
                    </div>
                  )) : (
                    <div className="text-sm text-muted-foreground">
                      Nenhuma mensagem real para esta conta ainda.
                    </div>
                  )}
                </div>
                <Textarea
                  rows={4}
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  placeholder="Responder conta selecionada..."
                />
                <div className="flex items-center gap-2">
                  <Input type="file" accept="image/*" onChange={handleChatImageUpload} />
                  <Button variant="outline" size="icon">
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={() => void handleSendMessage()}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Enviar resposta
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Controle da Conta</CardTitle>
                <CardDescription>
                  Bloqueio, chaves da Whop e congelamento do campo para o usuario.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => void handleAccountPatch({ status: "Bloqueada" })}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Bloquear
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleAccountPatch({ status: "Ativa" })}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Desbloquear
                  </Button>
                </div>
                <div className="grid gap-2">
                  <Label>Whop API Key</Label>
                  <Input
                    value={selectedAccount.whopKey}
                    onChange={(e) => void handleAccountPatch({ whopKey: e.target.value })}
                  />
                </div>
                <WhopAdvancedSettings
                  companyId={selectedAccount.whopCompanyId}
                  onCompanyIdChange={handleCompanyIdChange}
                  webhookEndpoint={`${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/whop`}
                  successUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/checkout/exemplo/thank-you`}
                  cancelUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/checkout/exemplo`}
                />
                <div className="rounded-lg border p-3">
                  <div className="font-medium">Ciclo de cobranca</div>
                  <div className="text-sm text-muted-foreground">
                    A cada {selectedAccount.billingCycleDays} dias
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="font-medium">Forma de pagamento</div>
                  <div className="text-sm text-muted-foreground">
                    Manual
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium">Campo de chave congelado</div>
                    <div className="text-sm text-muted-foreground">
                      Quando congelado, o usuario nao ve mais a edicao da chave.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedAccount.keyFrozen}
                    onChange={(e) => void handleAccountPatch({ keyFrozen: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium">Saques habilitados</div>
                    <div className="text-sm text-muted-foreground">
                      Se desativado, o usuario deixa de ver Saques e a taxa deixa de ser aplicada.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedAccount.withdrawalsEnabled}
                    onChange={(e) =>
                      void handleAccountPatch({ withdrawalsEnabled: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium">Messenger habilitado</div>
                    <div className="text-sm text-muted-foreground">
                      Se desativado, o usuario perde acesso ao canal de mensagens.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedAccount.messengerEnabled}
                    onChange={(e) =>
                      void handleAccountPatch({ messengerEnabled: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium">Gateway liberado para esta conta</div>
                    <div className="text-sm text-muted-foreground">
                      Quando ativado junto com o Modo Gateway global, este usuario passa a ver a pagina Gateway.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedAccount.gatewayEnabled}
                    onChange={(e) =>
                      void handleAccountPatch({ gatewayEnabled: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conta Bancaria do Usuario</CardTitle>
                <CardDescription>
                  Dados por moeda para o admin realizar os pagamentos no recebimento correto.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {withdrawalCurrencyOptions.map((option) => {
                  const bankAccount = accountBankAccounts[option.value]
                  const fieldDefinitions = getBankFieldDefinitions(option.value)

                  return (
                    <div key={option.value} className="rounded-xl border p-3">
                      <div className="mb-3 font-medium">{option.label}</div>
                      <div className="space-y-3">
                        <BankDetail label="Titular" value={bankAccount?.holderName ?? "Nao informado"} />
                        <BankDetail label={fieldDefinitions.documentLabel} value={bankAccount?.document ?? "Nao informado"} />
                        <BankDetail label="Banco" value={bankAccount?.bankName ?? "Nao informado"} />
                        <BankDetail label={fieldDefinitions.agencyLabel} value={bankAccount?.agency ?? "Nao informado"} />
                        <BankDetail label={fieldDefinitions.accountLabel} value={bankAccount?.accountNumber ?? "Nao informado"} />
                        <BankDetail label={fieldDefinitions.pixKeyLabel} value={bankAccount?.pixKey ?? "Nao informado"} />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Saques</CardTitle>
                <CardDescription>
                  Marque o saque como pago para enviar o valor ao historico da conta.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {pendingWithdrawals.length > 0 ? pendingWithdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium">{formatCurrency(withdrawal.amount, withdrawal.currency ?? "BRL")}</div>
                          <div className="text-sm text-muted-foreground">
                            {(withdrawal.currency ?? "BRL")} • Solicitado em {formatDate(withdrawal.requestedAt)}
                          </div>
                        </div>
                        <Button size="sm" onClick={() => void handleMarkWithdrawalPaid(withdrawal.id)}>
                          Marcar saque pago
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                      Nenhum saque pendente para esta conta.
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {paidWithdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="rounded-xl border p-4 text-sm">
                      <div className="font-medium">{formatCurrency(withdrawal.amount, withdrawal.currency ?? "BRL")}</div>
                      <div className="text-muted-foreground">
                        {(withdrawal.currency ?? "BRL")} • Pago em {withdrawal.paidAt ? formatDate(withdrawal.paidAt) : "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Aprovacao de Cadastros</CardTitle>
              <CardDescription>
                Aprove ou negue novos registros antes de liberar acesso ao painel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {signupQueue.length > 0 ? signupQueue.map((signup) => (
                <div key={signup.id} className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <div className="font-medium">{signup.name}</div>
                    <div className="text-sm text-muted-foreground">{signup.email}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void handleDecision(signup.id, "approved")}>
                      Aprovar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void handleDecision(signup.id, "rejected")}>
                      Negar
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                  Nenhum cadastro pendente no momento.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function BankDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="font-medium">{label}</div>
      <div className="text-muted-foreground">{value}</div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
        <div className="rounded-lg bg-muted p-2">{icon}</div>
      </CardContent>
    </Card>
  )
}

function formatCurrency(value: number, currency: SupportedWithdrawalCurrency = "BRL") {
  const locale = currency === "BRL" ? "pt-BR" : currency === "USD" ? "en-US" : currency === "GBP" ? "en-GB" : "de-DE"

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function getAccountInitials(name: string, email: string) {
  const source = name.trim() || email.trim()
  const parts = source.split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return "?"
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}
