"use client"

import * as React from "react"

import {
  createWithdrawalForSession,
  loadWithdrawalsForSession,
  saveBankAccountForSession,
} from "@/app/actions/withdrawals"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCurrentAppSession } from "@/lib/app-session"
import { supabase } from "@/lib/supabase"
import {
  getBankFieldDefinitions,
  type BankAccountDetails,
  type SupportedWithdrawalCurrency,
  withdrawalCurrencyOptions,
} from "@/lib/withdrawals-data"

type ManagedAccount = {
  id: string
  profileId: string | null
  name: string
  email: string
  role: "admin" | "user"
  feeRate: number
  billingCycleDays: number
  withdrawalsEnabled: boolean
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

const emptyBankAccount: BankAccountDetails = {
  holderName: "",
  document: "",
  bankName: "",
  agency: "",
  accountNumber: "",
  pixKey: "",
}

const minimumWithdrawalByCurrency: Record<SupportedWithdrawalCurrency, number> = {
  BRL: 5564.6,
  USD: 1000,
  EUR: 861,
  GBP: 745.6,
}

export default function WithdrawalsPage() {
  const [sessionUserId, setSessionUserId] = React.useState("")
  const [accountId, setAccountId] = React.useState("")
  const [sessionRole, setSessionRole] = React.useState<"admin" | "user">("user")
  const [accounts, setAccounts] = React.useState<ManagedAccount[]>([])
  const [currency, setCurrency] = React.useState<SupportedWithdrawalCurrency>("BRL")
  const [bankAccount, setBankAccount] = React.useState<BankAccountDetails>(emptyBankAccount)
  const [withdrawals, setWithdrawals] = React.useState<WithdrawalRecord[]>([])
  const [bankAccounts, setBankAccounts] = React.useState<
    Partial<Record<SupportedWithdrawalCurrency, BankAccountDetails>>
  >({})
  const [availableByCurrency, setAvailableByCurrency] = React.useState<
    Record<SupportedWithdrawalCurrency, number>
  >({
    BRL: 0,
    USD: 0,
    EUR: 0,
    GBP: 0,
  })
  const [adminPendingWithdrawals, setAdminPendingWithdrawals] = React.useState<WithdrawalRecord[]>([])
  const [adminPaidTotal, setAdminPaidTotal] = React.useState(0)
  const [adminCurrentDailyProfit, setAdminCurrentDailyProfit] = React.useState(0)
  const [requestAmount, setRequestAmount] = React.useState("1500")

  const loadData = React.useCallback(
    async (userId: string, nextAccountId?: string | null) => {
      const result = await loadWithdrawalsForSession({
        userId,
        accountId: nextAccountId,
        accessToken: (await supabase.auth.getSession()).data.session?.access_token ?? null,
      })

      if ("error" in result) {
        return
      }

      setSessionRole(result.role)
      setAccounts(result.accounts)
      setAccountId(result.currentAccountId ?? "")
      setBankAccounts(result.bankAccounts)
      setWithdrawals(result.withdrawals)
      setAdminPendingWithdrawals(result.adminPendingWithdrawals)
      setAdminPaidTotal(result.adminPaidTotal)
      setAdminCurrentDailyProfit(result.adminCurrentDailyProfit)
      setAvailableByCurrency(result.availableByCurrency)
    },
    []
  )

  React.useEffect(() => {
    async function load() {
      const session = await getCurrentAppSession()
      if (!session?.userId) {
        return
      }

      setSessionUserId(session.userId)
      await loadData(session.userId, session.accountId)
    }

    void load()
  }, [loadData])

  React.useEffect(() => {
    setBankAccount(bankAccounts[currency] ?? emptyBankAccount)
  }, [bankAccounts, currency])

  const bankFieldDefinitions = getBankFieldDefinitions(currency)
  const minimumWithdrawalAmount = minimumWithdrawalByCurrency[currency]
  const availableAmountRaw = availableByCurrency[currency] ?? 0
  const availableAmount = Number.isFinite(availableAmountRaw) ? availableAmountRaw : 0
  const paidWithdrawalsTotal = withdrawals
    .filter((withdrawal) => withdrawal.status === "paid")
    .reduce((sum, withdrawal) => sum + withdrawal.amount, 0)
  const pendingWithdrawals = withdrawals.filter((withdrawal) => withdrawal.status === "pending")
  const currentAccount = accounts.find((item) => item.id === accountId) ?? null

  React.useEffect(() => {
    if (sessionRole !== "admin" && currentAccount && !currentAccount.withdrawalsEnabled) {
      window.location.replace("/app")
    }
  }, [currentAccount, sessionRole])

  const handleSaveBankAccount = async () => {
    if (!sessionUserId || !accountId) {
      return
    }

    await saveBankAccountForSession({
      userId: sessionUserId,
      accountId,
      currency,
      details: bankAccount,
      accessToken: (await supabase.auth.getSession()).data.session?.access_token ?? null,
    })

    await loadData(sessionUserId, accountId)
  }

  const handleCreateWithdrawal = async () => {
    if (!sessionUserId || !accountId) {
      return
    }

    const amount = Number(requestAmount || 0)
    if (!amount || amount < minimumWithdrawalAmount || amount > availableAmount) {
      return
    }

    await createWithdrawalForSession({
      userId: sessionUserId,
      accountId,
      currency,
      amount,
      accessToken: (await supabase.auth.getSession()).data.session?.access_token ?? null,
    })

    await loadData(sessionUserId, accountId)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Saques</h1>
        <p className="text-muted-foreground">
          {sessionRole === "admin"
            ? "Acompanhe os valores pagos e os pendentes para cada conta."
            : "Configure sua conta bancaria global e acompanhe os saques da sua conta."}
        </p>
      </div>

      {sessionRole === "admin" ? (
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard
                    title="Valores Pagos"
                    value={formatCurrency(adminPaidTotal, "BRL")}
                    description="Total ja concluido manualmente."
            />
            <MetricCard
              title="Valores Pendentes"
              value={formatCurrency(adminPendingWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0), "BRL")}
              description="Somatorio das contas que ainda faltam pagar."
            />
            <MetricCard
              title="Lucro Atual do Dia"
              value={formatCurrency(adminCurrentDailyProfit, "BRL")}
              description="Atualizacao diaria com base nas taxas das contas ativas."
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Contas Pendentes de Pagamento</CardTitle>
              <CardDescription>
                Veja quais contas ainda possuem saques aguardando pagamento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {adminPendingWithdrawals.map((withdrawal) => {
                const owner = accounts.find((item) => item.id === withdrawal.accountId)

                return (
                  <div key={withdrawal.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium">{owner?.name ?? withdrawal.accountId}</div>
                        <div className="text-sm text-muted-foreground">
                          {owner?.email ?? "Conta nao encontrada"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(withdrawal.amount, withdrawal.currency)}</div>
                        <div className="text-sm text-muted-foreground">
                          {withdrawal.currency} • {formatDate(withdrawal.requestedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Conta Bancaria Global</CardTitle>
              <CardDescription>
                Cadastre uma conta por moeda para o admin pagar no mesmo tipo de recebimento das vendas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full space-y-2 md:max-w-[220px]">
                <Label htmlFor="bank-currency">Moeda da conta</Label>
                <select
                  id="bank-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as SupportedWithdrawalCurrency)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {withdrawalCurrencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="Titular" value={bankAccount.holderName} onChange={(value) => setBankAccount((prev) => ({ ...prev, holderName: value }))} />
              <Field label={bankFieldDefinitions.documentLabel} value={bankAccount.document} onChange={(value) => setBankAccount((prev) => ({ ...prev, document: value }))} />
              <Field label="Banco" value={bankAccount.bankName} onChange={(value) => setBankAccount((prev) => ({ ...prev, bankName: value }))} />
              <Field label={bankFieldDefinitions.agencyLabel} value={bankAccount.agency} onChange={(value) => setBankAccount((prev) => ({ ...prev, agency: value }))} />
              <Field label={bankFieldDefinitions.accountLabel} value={bankAccount.accountNumber} onChange={(value) => setBankAccount((prev) => ({ ...prev, accountNumber: value }))} />
              <Field label={bankFieldDefinitions.pixKeyLabel} value={bankAccount.pixKey} onChange={(value) => setBankAccount((prev) => ({ ...prev, pixKey: value }))} />
              <Button className="w-full" onClick={handleSaveBankAccount}>
                Salvar conta bancaria
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Novo Saque</CardTitle>
                <CardDescription>
                  Solicite um novo saque na mesma moeda da conta de recebimento selecionada.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="w-full space-y-2 md:max-w-[220px]">
                  <Label htmlFor="withdrawal-currency">Moeda</Label>
                  <select
                    id="withdrawal-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as SupportedWithdrawalCurrency)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {withdrawalCurrencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full space-y-2 md:max-w-[220px]">
                  <Label htmlFor="withdrawal-amount">Valor do saque</Label>
                  <Input
                    id="withdrawal-amount"
                    type="number"
                    min={minimumWithdrawalAmount}
                    max={availableAmount}
                    step="0.01"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Disponivel nesta janela: {formatCurrency(availableAmount, currency)}
                  </p>
                  {minimumWithdrawalAmount > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Saque minimo nesta moeda: {formatCurrency(minimumWithdrawalAmount, currency)}
                    </p>
                  ) : null}
                </div>
                <Button
                  onClick={handleCreateWithdrawal}
                  disabled={
                    availableAmount <= 0 ||
                    Number(requestAmount || 0) > availableAmount ||
                    Number(requestAmount || 0) < minimumWithdrawalAmount
                  }
                >
                  Solicitar saque
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historico de Saques</CardTitle>
                <CardDescription>
                  Veja os valores pagos e pendentes da sua conta.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-4 md:grid-cols-2">
                  <MetricCard
                    title="Valores Pagos"
                    value={formatCurrency(paidWithdrawalsTotal, "BRL")}
                    description="Total concluido para a sua conta."
                  />
                  <MetricCard
                    title="Valores Pendentes"
                    value={formatCurrency(pendingWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0), "BRL")}
                    description="Solicitacoes aguardando pagamento."
                  />
                </div>

                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium">{formatCurrency(withdrawal.amount, withdrawal.currency ?? "BRL")}</div>
                        <div className="text-sm text-muted-foreground">
                          Solicitado em {formatDate(withdrawal.requestedAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {withdrawal.status === "paid" ? "Pago" : "Pendente"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {withdrawal.paidAt ? `Pago em ${formatDate(withdrawal.paidAt)}` : "Aguardando pagamento"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
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

function MetricCard({
  title,
  value,
  description,
}: {
  title: string
  value: string
  description: string
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
    </div>
  )
}
