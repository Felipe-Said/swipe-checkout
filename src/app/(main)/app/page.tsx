"use client"

import * as React from "react"
import {
  MousePointerClick,
  TrendingUp,
  ShoppingCart,
  Users,
  ArrowUpRight,
  Percent,
  CalendarRange,
  Wallet,
  Megaphone,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { useI18n } from "@/lib/i18n"
import {
  calculateFeeValue,
  getManagedAccounts,
  type ManagedAccount,
} from "@/lib/account-metrics"
import { readCampaignPerformance } from "@/lib/pixels-data"
import { getLastPaidWithdrawalAmount } from "@/lib/withdrawals-data"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const periodFactors = {
  today: 0.12,
  week: 0.36,
  month: 1,
  quarter: 2.8,
}

export default function DashboardPage() {
  const { t, formatCurrency, language } = useI18n()
  const [sessionEmail, setSessionEmail] = React.useState("user@swipe.com.br")
  const [sessionRole, setSessionRole] = React.useState<"admin" | "user">("user")
  const [accounts, setAccounts] = React.useState<ManagedAccount[]>([])
  const [campaigns, setCampaigns] = React.useState<ReturnType<typeof readCampaignPerformance>>([])
  const [period, setPeriod] = React.useState<keyof typeof periodFactors>("month")
  const [date, setDate] = React.useState("2026-03-24")

  React.useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setSessionEmail(user.email || "")
        // Role check could be better but let's stick to this for now
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        setSessionRole(profile?.role || "user")
      }
      
      const accs = await getManagedAccounts()
      setAccounts(accs)
      setCampaigns(readCampaignPerformance())
    }
    load()
  }, [])

  const currentAccount =
    accounts.find((account) => account.email === sessionEmail) ?? accounts[0]

  if (!currentAccount) {
    return null
  }

  const factor = periodFactors[period]
  const scopedRevenue = (currentAccount.revenue || 0) * factor
  const scopedOrders = Math.round((currentAccount.orders || 0) * factor)
  const scopedFeeValue = calculateFeeValue({
    ...currentAccount,
    revenue: scopedRevenue,
  })
  const lastWithdrawalAmount = getLastPaidWithdrawalAmount(currentAccount.id)
  const userAccounts = accounts.filter((account) => account.role === "user")
  const adminAccount =
    accounts.find((account) => account.role === "admin") ?? currentAccount
  const adminRevenue = (adminAccount.revenue || 0) * factor
  const totalFeeRevenue = userAccounts.reduce(
    (sum, account) =>
      sum +
      calculateFeeValue({
        ...account,
        revenue: (account.revenue || 0) * factor,
      }),
    0
  )
  const scopedCampaigns = campaigns
    .filter((campaign) => (sessionRole === "admin" ? true : campaign.accountEmail === sessionEmail))
    .sort((a, b) => {
      if (b.revenue !== a.revenue) {
        return b.revenue - a.revenue
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
    .slice(0, 4)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{t("dash.welcome")}</h1>
        <p className="text-muted-foreground">
          {t("dash.subtitle")}
        </p>
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
              onChange={(e) => setPeriod(e.target.value as keyof typeof periodFactors)}
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

  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
    <SummaryCard title={t("dash.total_checkouts")} value="12" icon={<MousePointerClick className="h-4 w-4 text-muted-foreground" />} detail="+2 desde o mes passado" />
    <SummaryCard title={t("dash.avg_conversion")} value={`${(currentAccount.conversionRate || 0).toFixed(1)}%`} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} detail="+0.4% em relacao a ontem" />
    <SummaryCard title={t("dash.total_orders")} value={scopedOrders.toString()} icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />} detail="volume do periodo selecionado" />
    <SummaryCard title={t("dash.revenue")} value={formatCurrency(scopedRevenue)} icon={<Users className="h-4 w-4 text-muted-foreground" />} detail="faturamento bruto do periodo" />
    <SummaryCard title={t("dash.fee_rate")} value={`${(currentAccount.feeRate || 0).toFixed(2)}%`} icon={<Percent className="h-4 w-4 text-muted-foreground" />} detail={`Total cobrado: ${formatCurrency(scopedFeeValue)}`} />
  </div>

      <Card>
        <CardContent className="flex flex-col gap-2 p-5 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>{t("dash.billing_cycle")}</span>
          <span>{t("dash.last_withdrawal")}: {formatCurrency(lastWithdrawalAmount)}</span>
        </CardContent>
      </Card>

      {sessionRole === "admin" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <SummaryCard title="Faturamento da Conta Admin" value={formatCurrency(adminRevenue)} icon={<Wallet className="h-4 w-4 text-muted-foreground" />} detail={`Data base: ${date}`} />
            <SummaryCard title="Lucro Total das Taxas" value={formatCurrency(totalFeeRevenue)} icon={<CalendarRange className="h-4 w-4 text-muted-foreground" />} detail="Somatorio das taxas pagas pelos usuarios" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Taxas por Conta</CardTitle>
              <CardDescription>
                Visao horizontal das contas com porcentagem definida e valor cobrado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {userAccounts.map((account) => {
                const scopedAccountRevenue = (account.revenue || 0) * factor
                const scopedAccountFee = calculateFeeValue({
                  ...account,
                  revenue: scopedAccountRevenue,
                })

                return (
                  <div key={account.id} className="rounded-xl border p-4">
                    <div>
                      <div className="font-medium">{account.name}</div>
                      <div className="text-sm text-muted-foreground">{account.email}</div>
                    </div>
                    <div className="mt-4 text-left">
                      <div className="font-medium">{(account.feeRate || 0).toFixed(2)}%</div>
                      <div className="text-sm text-muted-foreground">{formatCurrency(scopedAccountFee)}</div>
                    </div>
                  </div>
                )
                })}
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
              Voce gerou {formatCurrency(scopedRevenue)} no periodo atual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-muted-foreground">
              Placeholder Grafico de Vendas
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Checkouts Ativos</CardTitle>
            <CardDescription>Seus checkouts com melhor desempenho.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted font-bold text-xs">
                    C{i}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Checkout Shopify Premium {i}</p>
                    <p className="text-xs text-muted-foreground">{i * 12}% de conversao</p>
                  </div>
                  <div className="text-sm font-medium">R$ {i * 1250},00</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campanhas</CardTitle>
          <CardDescription>
            As campanhas com mais vendas sobem para o topo conforme novas compras concluidas chegam.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {scopedCampaigns.map((campaign) => (
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
                <div className="font-medium">{formatCurrency(campaign.revenue)}</div>
                <div className="text-sm text-muted-foreground">
                  Atualizado em {formatDateTime(campaign.updatedAt)}
                </div>
              </div>
            </div>
          ))}
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}
