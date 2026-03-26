"use client"

import * as React from "react"
import { Ban, Check, ImagePlus, KeyRound, MessageSquare, Percent, ShieldCheck, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  calculateFeeValue,
  readManagedAccounts,
  type ManagedAccount,
  writeManagedAccounts,
} from "@/lib/account-metrics"
import {
  appendSupportChatMessage,
  readSupportChatMessages,
  type SupportChatMessage,
} from "@/lib/support-chat-data"
import {
  getBankAccountsByAccount,
  getBankFieldDefinitions,
  getWithdrawalsByAccount,
  markWithdrawalAsPaid,
  withdrawalCurrencyOptions,
  type WithdrawalRecord,
} from "@/lib/withdrawals-data"

const pendingSignups = [
  { id: "p1", name: "North Commerce", email: "hello@north.co" },
  { id: "p2", name: "Pixel Market", email: "contact@pixel.market" },
]

export default function CustomersAdminPage() {
  const [accounts, setAccounts] = React.useState<ManagedAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = React.useState<string>("")
  const [chatDraft, setChatDraft] = React.useState("")
  const [chatImage, setChatImage] = React.useState("")
  const [signupQueue, setSignupQueue] = React.useState(pendingSignups)
  const [messages, setMessages] = React.useState<SupportChatMessage[]>([])
  const [withdrawals, setWithdrawals] = React.useState<WithdrawalRecord[]>([])

  React.useEffect(() => {
    const loaded = readManagedAccounts()
    setAccounts(loaded)
    setSelectedAccountId(loaded[0]?.id ?? "")
    setMessages(readSupportChatMessages())
  }, [])

  const selectedAccount =
    accounts.find((account) => account.id === selectedAccountId) ?? accounts[0]

  React.useEffect(() => {
    if (!selectedAccountId) {
      return
    }
    setWithdrawals(getWithdrawalsByAccount(selectedAccountId))
  }, [selectedAccountId])

  const updateAccounts = (updater: (current: ManagedAccount[]) => ManagedAccount[]) => {
    setAccounts((current) => {
      const next = updater(current)
      writeManagedAccounts(next)
      return next
    })
  }

  const handleDecision = (id: string) => {
    setSignupQueue((current) => current.filter((item) => item.id !== id))
  }

  const handleAccountPatch = (patch: Partial<ManagedAccount>) => {
    if (!selectedAccount) return

    updateAccounts((current) =>
      current.map((account) =>
        account.id === selectedAccount.id ? { ...account, ...patch } : account
      )
    )
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

  const handleSendMessage = () => {
    if (!selectedAccount || (!chatDraft.trim() && !chatImage)) {
      return
    }

    const nextMessages = appendSupportChatMessage({
      id: `msg-${Date.now()}`,
      accountId: selectedAccount.id,
      from: "admin",
      text: chatDraft.trim(),
      imageSrc: chatImage,
      createdAt: new Date().toISOString(),
    })

    setMessages(nextMessages)
    setChatDraft("")
    setChatImage("")
  }

  const handleMarkWithdrawalPaid = (withdrawalId: string) => {
    const nextStore = markWithdrawalAsPaid(withdrawalId)
    setWithdrawals(nextStore.withdrawals.filter((withdrawal) => withdrawal.accountId === selectedAccountId))
  }

  if (!selectedAccount) {
    return null
  }

  const accountMessages = messages.filter((message) => message.accountId === selectedAccount.id)
  const bankAccounts = getBankAccountsByAccount(selectedAccount.id)
  const pendingWithdrawals = withdrawals.filter((withdrawal) => withdrawal.status === "pending")
  const paidWithdrawals = withdrawals.filter((withdrawal) => withdrawal.status === "paid")

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
                <div className="font-medium">{account.name}</div>
                <div className="text-sm text-muted-foreground">{account.email}</div>
                <div className="mt-2 text-xs text-muted-foreground">{account.status}</div>
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
                    handleAccountPatch({ feeRate: Number(e.target.value || 0) })
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
                  {accountMessages.map((message) => (
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
                  ))}
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
                <Button onClick={handleSendMessage}>
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
                    onClick={() => handleAccountPatch({ status: "Bloqueada" })}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Bloquear
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAccountPatch({ status: "Ativa" })}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Desbloquear
                  </Button>
                </div>
                <div className="grid gap-2">
                  <Label>Whop API Key</Label>
                  <Input
                    value={selectedAccount.whopKey}
                    onChange={(e) => handleAccountPatch({ whopKey: e.target.value })}
                  />
                </div>
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
                    onChange={(e) => handleAccountPatch({ keyFrozen: e.target.checked })}
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
                  const bankAccount = bankAccounts[option.value]
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
                        <Button size="sm" onClick={() => handleMarkWithdrawalPaid(withdrawal.id)}>
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
              {signupQueue.map((signup) => (
                <div key={signup.id} className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <div className="font-medium">{signup.name}</div>
                    <div className="text-sm text-muted-foreground">{signup.email}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleDecision(signup.id)}>
                      Aprovar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDecision(signup.id)}>
                      Negar
                    </Button>
                  </div>
                </div>
              ))}
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

function formatCurrency(value: number, currency: "BRL" | "USD" | "EUR" | "GBP" = "BRL") {
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
