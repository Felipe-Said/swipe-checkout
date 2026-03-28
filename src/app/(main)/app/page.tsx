"use client"

import * as React from "react"
import {
  ArrowUpRight,
  CalendarRange,
  LayoutDashboard,
  Megaphone,
  Percent,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react"

import { loadDashboardForSession } from "@/app/actions/dashboard"
import { DashboardRevenueChart } from "@/components/dashboard/dashboard-revenue-chart"
import { getCurrentAppSession } from "@/lib/app-session"
import { useI18n } from "@/lib/i18n"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type DashboardPeriod = "today" | "week" | "month" | "quarter"
type SupportedCurrency = "BRL" | "USD" | "EUR" | "GBP"
type DashboardSummary = {
  totalCheckouts: number
  averageConversionRate: number
  totalOrders: number
  revenueByCurrency: Record<SupportedCurrency, number>
  feeRevenueByCurrency: Record<SupportedCurrency, number>
  feeRate: number
  billingCycleDays: number
  withdrawalsEnabled: boolean
  lastWithdrawalAmountByCurrency: Partial<Record<SupportedCurrency, number>>
  adminRevenueByCurrency: Record<SupportedCurrency, number>
  totalFeeRevenueByCurrency: Record<SupportedCurrency, number>
  recentOrders: Array<{
    id: string
    customerName: string
    amount: number
    currency: SupportedCurrency
    status: string
    date: string
  }>
  activeCheckouts: Array<{
    id: string
    name: string
    status: string
    createdAt: string
    storeName: string | null
    domainHost: string | null
  }>
  taxByAccount: Array<{
    id: string
    name: string
    email: string
    feeRate: number
    feeRevenueByCurrency: Record<SupportedCurrency, number>
  }>
  campaigns: Array<{
    id: string
    campaignName: string
    platform: string
    purchases: number
    revenue: number
    currency: SupportedCurrency
    updatedAt: string
  }>
  revenueChart: {
    day: {
      points: Array<{ date: string; label: string } & Record<string, string | number>>
      series: Array<{ key: string; label: string; color: string }>
    }
    week: {
      points: Array<{ date: string; label: string } & Record<string, string | number>>
      series: Array<{ key: string; label: string; color: string }>
    }
    month: {
      points: Array<{ date: string; label: string } & Record<string, string | number>>
      series: Array<{ key: string; label: string; color: string }>
    }
    year: {
      points: Array<{ date: string; label: string } & Record<string, string | number>>
      series: Array<{ key: string; label: string; color: string }>
    }
  }
}

const todayIso = new Date().toISOString().slice(0, 10)

export default function DashboardPage() {
  const { t, currency, language } = useI18n()
  const [sessionUserId, setSessionUserId] = React.useState("")
  const [sessionRole, setSessionRole] = React.useState<"admin" | "user">("user")
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null)
  const [period, setPeriod] = React.useState<DashboardPeriod>("month")
  const [date, setDate] = React.useState(todayIso)
  const [loaded, setLoaded] = React.useState(false)

  const loadData = React.useCallback(
    async (userId: string, accountId?: string | null) => {
      const result = await loadDashboardForSession({
        userId,
        accountId,
        period,
        referenceDate: date,
      })

      if ("error" in result) {
        setSummary(null)
        setLoaded(true)
        return
      }

      setSessionRole(result.role)
      setSummary(result.summary)
      setLoaded(true)
    },
    [date, period]
  )

  React.useEffect(() => {
    async function load() {
      const session = await getCurrentAppSession()
      if (!session?.userId) {
        setLoaded(true)
        return
      }

      setSessionUserId(session.userId)
      await loadData(session.userId, session.accountId)
    }

    void load()
  }, [loadData])

  const displayCurrency = currency === "USD" || currency === "EUR" ? currency : "BRL"
  const summaryRevenue = summary?.revenueByCurrency[displayCurrency] ?? 0
  const summaryFeeRevenue = summary?.feeRevenueByCurrency[displayCurrency] ?? 0
  const adminRevenue = summary?.adminRevenueByCurrency[displayCurrency] ?? 0
  const adminFeeRevenue = summary?.totalFeeRevenueByCurrency[displayCurrency] ?? 0
  const lastWithdrawalAmount = summary?.lastWithdrawalAmountByCurrency[displayCurrency] ?? 0

  if (!loaded) {
    return <div className="min-h-[320px]" />
  }

  if (!summary) {
    return null
  }

  const shouldShowWithdrawalsCard = sessionRole === "admin" || summary.withdrawalsEnabled
  const shouldShowFeeCard = sessionRole === "admin" || summary.withdrawalsEnabled

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{t("dash.welcome")}</h1>
        <p className="text-muted-foreground">{t("dash.subtitle")}</p>
      </div>

      {sessionRole === "admin" ? (
        <div className="grid gap-4 rounded-xl border p-4 lg:grid-cols-[220px_220px]">
          <div className="space-y-2">
            <Label htmlFor="metric-date">{t("dash.date_ref")}</Label>
            <Input id="metric-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metric-period">{t("dash.period")}</Label>
            <select
              id="metric-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value as DashboardPeriod)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="today">{t("dash.today")}</option>
              <option value="week">{t("dash.7days")}</option>
              <option value="month">{t("dash.30days")}</option>
              <option value="quarter">{t("dash.90days")}</option>
            </select>
          </div>
        </div>
      ) : null}

      <DashboardRevenueChart
        chart={summary.revenueChart}
        currency={displayCurrency}
        language={language}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <SummaryCard
          title={t("dash.total_checkouts")}
          value={summary.totalCheckouts.toString()}
          icon={<LayoutDashboard className="h-4 w-4 text-muted-foreground" />}
          detail="Total real de checkouts vinculados a esta operacao."
        />
        <SummaryCard
          title={t("dash.avg_conversion")}
          value={`${summary.averageConversionRate.toFixed(1)}%`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          detail="Conversao real com base nos pedidos do periodo."
        />
        <SummaryCard
          title={t("dash.total_orders")}
          value={summary.totalOrders.toString()}
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
          detail="Pedidos reais dentro do periodo selecionado."
        />
        <SummaryCard
          title={t("dash.revenue")}
          value={formatAmount(summaryRevenue, displayCurrency, language)}
          icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
          detail={`Receita real em ${displayCurrency} no periodo.`}
        />
        {shouldShowFeeCard ? (
          <SummaryCard
            title={t("dash.fee_rate")}
            value={`${summary.feeRate.toFixed(2)}%`}
            icon={<Percent className="h-4 w-4 text-muted-foreground" />}
            detail={`Total cobrado: ${formatAmount(summaryFeeRevenue, displayCurrency, language)}`}
          />
        ) : null}
      </div>

      {shouldShowWithdrawalsCard ? (
        <Card>
          <CardContent className="flex flex-col gap-2 p-5 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <span>
              Ciclo de cobranca real: a cada {summary.billingCycleDays} dia{summary.billingCycleDays === 1 ? "" : "s"}
            </span>
            <span>
              {t("dash.last_withdrawal")}: {formatAmount(lastWithdrawalAmount, displayCurrency, language)}
            </span>
          </CardContent>
        </Card>
      ) : null}

      {sessionRole === "admin" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <SummaryCard
              title="Faturamento da Conta Admin"
              value={formatAmount(adminRevenue, displayCurrency, language)}
              icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
              detail={`Data base: ${formatDate(date, language)}`}
            />
            <SummaryCard
              title="Lucro Total das Taxas"
              value={formatAmount(adminFeeRevenue, displayCurrency, language)}
              icon={<CalendarRange className="h-4 w-4 text-muted-foreground" />}
              detail={`Lucro real de taxas em ${displayCurrency}.`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Taxas por Conta</CardTitle>
              <CardDescription>
                Visao real das contas com taxa definida e valor cobrado no periodo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {summary.taxByAccount.length > 0 ? (
                  summary.taxByAccount.map((account) => (
                    <div key={account.id} className="rounded-xl border p-4">
                      <div>
                        <div className="font-medium">{account.name}</div>
                        <div className="text-sm text-muted-foreground">{account.email}</div>
                      </div>
                      <div className="mt-4 text-left">
                        <div className="font-medium">{account.feeRate.toFixed(2)}%</div>
                        <div className="text-sm text-muted-foreground">
                          {formatAmount(account.feeRevenueByCurrency[displayCurrency] ?? 0, displayCurrency, language)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                    Nenhuma conta de usuario com faturamento real no periodo.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
            <CardDescription>
              Voce gerou {formatAmount(summaryRevenue, displayCurrency, language)} em {displayCurrency} no periodo atual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.recentOrders.length > 0 ? (
                summary.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-sm text-muted-foreground">
                        {normalizeOrderStatus(order.status)} • {formatDateTime(order.date, language)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatAmount(order.amount, order.currency, language)}</div>
                      <div className="text-xs text-muted-foreground">{order.id}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-muted-foreground">
                  Nenhuma venda real encontrada no periodo.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Checkouts Ativos</CardTitle>
            <CardDescription>Checkouts reais ativos nesta operacao.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.activeCheckouts.length > 0 ? (
                summary.activeCheckouts.map((checkout, index) => (
                  <div key={checkout.id} className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted font-bold text-xs">
                      C{index + 1}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{checkout.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {checkout.storeName ? `Loja: ${checkout.storeName}` : "Loja nao configurada"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {checkout.domainHost ? `Dominio: ${checkout.domainHost}` : "Dominio nao configurado"}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {formatDateTime(checkout.createdAt, language)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  Nenhum checkout ativo encontrado.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campanhas</CardTitle>
          <CardDescription>
            Esta secao agora exibe apenas atribuicao real. Sem dados atribuidos, ela fica vazia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.campaigns.length > 0 ? (
            summary.campaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{campaign.campaignName}</div>
                    <div className="text-sm text-muted-foreground">
                      {campaign.platform} • {campaign.purchases} compras
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatAmount(campaign.revenue, campaign.currency, language)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Atualizado em {formatDateTime(campaign.updatedAt, language)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              Nenhuma campanha real rastreada no banco ainda.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  icon,
  detail,
}: {
  title: string
  value: string
  icon: React.ReactNode
  detail: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="mt-1 flex items-center text-xs text-muted-foreground">
          <span className="mr-1 flex items-center text-emerald-500">
            <ArrowUpRight className="h-3 w-3" />
          </span>
          {detail}
        </p>
      </CardContent>
    </Card>
  )
}

function normalizeOrderStatus(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === "paid" || normalized === "pago") return "Pago"
  if (normalized === "pending" || normalized === "pendente") return "Pendente"
  if (normalized === "failed" || normalized === "falha") return "Falha"
  return status
}

function formatAmount(value: number, currency: SupportedCurrency, language: string) {
  const locale =
    language === "en-US" || language === "es-ES" || language === "pt-BR"
      ? language
      : currency === "USD"
        ? "en-US"
        : currency === "EUR"
          ? "es-ES"
          : currency === "GBP"
            ? "en-US"
            : "pt-BR"

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value)
}

function formatDate(value: string, language: string) {
  return new Intl.DateTimeFormat(language === "en-US" ? "en-US" : "pt-BR", {
    dateStyle: "short",
  }).format(new Date(`${value}T00:00:00`))
}

function formatDateTime(value: string, language: string) {
  return new Intl.DateTimeFormat(language === "en-US" ? "en-US" : "pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}
