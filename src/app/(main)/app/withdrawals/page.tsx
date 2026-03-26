"use client"

import * as React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { readDemoSession } from "@/lib/demo-auth"
import { readManagedAccounts, type ManagedAccount } from "@/lib/account-metrics"
import {
  createWithdrawal,
  getBankAccount,
  getBankFieldDefinitions,
  getWithdrawalsByAccount,
  saveBankAccount,
  type BankAccountDetails,
  type SupportedWithdrawalCurrency,
  type WithdrawalRecord,
  readWithdrawalsStore,
  withdrawalCurrencyOptions,
} from "@/lib/withdrawals-data"

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
  const [accountId, setAccountId] = React.useState("")
  const [account, setAccount] = React.useState<ManagedAccount | null>(null)
  const [sessionRole, setSessionRole] = React.useState<"admin" | "user">("user")
  const [accounts, setAccounts] = React.useState<ManagedAccount[]>([])
  const [currency, setCurrency] = React.useState<SupportedWithdrawalCurrency>("BRL")
  const [bankAccount, setBankAccount] = React.useState<BankAccountDetails>(emptyBankAccount)
  const [withdrawals, setWithdrawals] = React.useState<WithdrawalRecord[]>([])
  const [requestAmount, setRequestAmount] = React.useState("1500")

  React.useEffect(() => {
    const session = readDemoSession()
    const accounts = readManagedAccounts()
    setAccounts(accounts)
    setSessionRole(session?.role ?? "user")
    const currentAccount = accounts.find((account) => account.email === session?.email) ?? accounts[0]
    if (!currentAccount) {
      return
    }

    setAccountId(currentAccount.id)
    setAccount(currentAccount)
    setBankAccount(getBankAccount(currentAccount.id, "BRL") ?? emptyBankAccount)
    setWithdrawals(getWithdrawalsByAccount(currentAccount.id))
  }, [])

  React.useEffect(() => {
    if (!accountId) {
      return
    }

    setBankAccount(getBankAccount(accountId, currency) ?? emptyBankAccount)
  }, [accountId, currency])

  const bankFieldDefinitions = getBankFieldDefinitions(currency)
  const minimumWithdrawalAmount = minimumWithdrawalByCurrency[currency]
  const availableAmountRaw = account
    ? calculateAvailableWithdrawalAmount({
        account,
        currency,
        withdrawals,
      })
    : 0
  const availableAmount = Number.isFinite(availableAmountRaw) ? availableAmountRaw : 0
  const paidWithdrawalsTotal = withdrawals
    .filter((withdrawal) => withdrawal.status === "paid")
    .reduce((sum, withdrawal) => sum + withdrawal.amount, 0)
  const pendingWithdrawals = withdrawals.filter((withdrawal) => withdrawal.status === "pending")
  const store = readWithdrawalsStore()
  const allWithdrawals = store.withdrawals
  const adminPaidTotal = allWithdrawals
    .filter((withdrawal) => withdrawal.status === "paid")
    .reduce((sum, withdrawal) => sum + withdrawal.amount, 0)
  const adminPendingWithdrawals = allWithdrawals.filter((withdrawal) => withdrawal.status === "pending")
  const adminCurrentDailyProfit = accounts
    .filter((item) => item.role === "user")
    .reduce(
      (sum, item) =>
        sum + ((item.estimatedDailyRevenueByCurrency.BRL ?? 0) * item.feeRate) / 100,
      0
    )

  const handleSaveBankAccount = () => {
    if (!accountId) {
      return
    }

    saveBankAccount(accountId, currency, bankAccount)
  }

  const handleCreateWithdrawal = () => {
    if (!accountId) {
      return
    }

    const amount = Number(requestAmount || 0)
    if (!amount || amount < minimumWithdrawalAmount || amount > availableAmount) {
      return
    }

    const nextStore = createWithdrawal(accountId, amount, currency)
    setWithdrawals(nextStore.withdrawals.filter((withdrawal) => withdrawal.accountId === accountId))
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

function calculateAvailableWithdrawalAmount({
  account,
  currency,
  withdrawals,
}: {
  account: ManagedAccount
  currency: SupportedWithdrawalCurrency
  withdrawals: WithdrawalRecord[]
}) {
  const startDate = new Date(account.settlementStartedAt)
  const now = new Date()
  const startTimestamp = Number.isFinite(startDate.getTime())
    ? startDate.getTime()
    : now.getTime()
  const billingCycleDays =
    typeof account.billingCycleDays === "number" && account.billingCycleDays > 0
      ? account.billingCycleDays
      : 2
  const estimatedDailyRevenue =
    typeof account.estimatedDailyRevenueByCurrency?.[currency] === "number"
      ? account.estimatedDailyRevenueByCurrency[currency] ?? 0
      : 0
  const elapsedMs = Math.max(now.getTime() - startTimestamp, 0)
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24))
  const completedCycles = Math.floor(elapsedDays / billingCycleDays)
  const releasedAmount = completedCycles * billingCycleDays * estimatedDailyRevenue

  const reservedAmount = withdrawals
    .filter((withdrawal) => withdrawal.currency === currency)
    .reduce((sum, withdrawal) => sum + withdrawal.amount, 0)

  return Math.max(releasedAmount - reservedAmount, 0)
}
