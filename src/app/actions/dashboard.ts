"use server"

import { getSupabaseAdmin } from "@/lib/supabase"

type SessionRole = "admin" | "user"
type SupportedCurrency = "BRL" | "USD" | "EUR" | "GBP"
type DashboardPeriod = "today" | "week" | "month" | "quarter"

type DashboardAccount = {
  id: string
  profileId: string | null
  name: string
  email: string
  role: SessionRole
  feeRate: number
  billingCycleDays: number
}

type DashboardCheckoutRow = {
  id: string
  name: string
  status: string
  createdAt: string
  storeName: string | null
  domainHost: string | null
}

type DashboardOrderRow = {
  id: string
  accountId: string
  customerName: string
  amount: number
  currency: SupportedCurrency
  status: string
  date: string
}

type DashboardCampaignRow = {
  id: string
  campaignName: string
  platform: string
  purchases: number
  revenue: number
  currency: SupportedCurrency
  updatedAt: string
}

type DashboardCurrencyMap = Record<SupportedCurrency, number>

type DashboardSummary = {
  totalCheckouts: number
  averageConversionRate: number
  totalOrders: number
  revenueByCurrency: DashboardCurrencyMap
  feeRevenueByCurrency: DashboardCurrencyMap
  feeRate: number
  billingCycleDays: number
  lastWithdrawalAmountByCurrency: Partial<Record<SupportedCurrency, number>>
  adminRevenueByCurrency: DashboardCurrencyMap
  totalFeeRevenueByCurrency: DashboardCurrencyMap
  recentOrders: DashboardOrderRow[]
  activeCheckouts: DashboardCheckoutRow[]
  taxByAccount: Array<{
    id: string
    name: string
    email: string
    feeRate: number
    feeRevenueByCurrency: DashboardCurrencyMap
  }>
  campaigns: DashboardCampaignRow[]
}

function emptyCurrencyMap(): DashboardCurrencyMap {
  return {
    BRL: 0,
    USD: 0,
    EUR: 0,
    GBP: 0,
  }
}

function normalizeCurrency(value: string | null | undefined): SupportedCurrency {
  return value === "USD" || value === "EUR" || value === "GBP" ? value : "BRL"
}

function isPaidStatus(value: string | null | undefined) {
  const normalized = (value ?? "").toLowerCase()
  return normalized === "paid" || normalized === "pago"
}

function getWindowBounds(referenceDate: string, period: DashboardPeriod) {
  const end = new Date(`${referenceDate}T23:59:59.999`)
  const start = new Date(`${referenceDate}T00:00:00.000`)

  const offsets: Record<DashboardPeriod, number> = {
    today: 0,
    week: 6,
    month: 29,
    quarter: 89,
  }

  start.setDate(start.getDate() - offsets[period])

  return {
    start,
    end,
  }
}

export async function loadDashboardForSession(input: {
  userId: string
  accountId?: string | null
  period: DashboardPeriod
  referenceDate: string
}) {
  const supabaseAdmin = getSupabaseAdmin()
  const { start, end } = getWindowBounds(input.referenceDate, input.period)

  const { data: sessionProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, role, email")
    .eq("id", input.userId)
    .maybeSingle()

  if (!sessionProfile) {
    return { error: "Sessao nao encontrada." }
  }

  const sessionRole: SessionRole = sessionProfile.role === "admin" ? "admin" : "user"

  const accountsResult = await supabaseAdmin
    .from("managed_accounts")
    .select("id, profile_id, name, fee_rate, billing_cycle_days")
    .order("created_at", { ascending: false })

  if (accountsResult.error) {
    return { error: accountsResult.error.message }
  }

  const rawAccounts = accountsResult.data ?? []
  const profileIds = rawAccounts
    .map((account) => account.profile_id)
    .filter((value): value is string => Boolean(value))

  const profilesResult = profileIds.length
    ? await supabaseAdmin
        .from("profiles")
        .select("id, email, role")
        .in("id", profileIds)
    : { data: [], error: null as { message: string } | null }

  if (profilesResult.error) {
    return { error: profilesResult.error.message }
  }

  const profileMap = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]))

  const allAccounts: DashboardAccount[] = rawAccounts.map((account) => {
    const profile = profileMap.get(account.profile_id)

    return {
      id: account.id,
      profileId: account.profile_id,
      name: account.name,
      email: profile?.email ?? "",
      role: profile?.role === "admin" ? "admin" : "user",
      feeRate: Number(account.fee_rate ?? 0),
      billingCycleDays: Math.max(Number(account.billing_cycle_days ?? 2), 1),
    }
  })

  const visibleAccounts =
    sessionRole === "admin"
      ? allAccounts
      : allAccounts.filter((account) => account.profileId === input.userId)

  const currentAccount =
    sessionRole === "admin"
      ? visibleAccounts.find((account) => account.profileId === input.userId) ??
        visibleAccounts.find((account) => account.id === input.accountId) ??
        visibleAccounts[0] ??
        null
      : visibleAccounts[0] ?? null

  if (!currentAccount && sessionRole !== "admin") {
    return { error: "Conta operacional nao encontrada." }
  }

  const visibleAccountIds = visibleAccounts.map((account) => account.id)
  if (visibleAccountIds.length === 0) {
    return {
      role: sessionRole,
      currentAccountId: currentAccount?.id ?? null,
      summary: {
        totalCheckouts: 0,
        averageConversionRate: 0,
        totalOrders: 0,
        revenueByCurrency: emptyCurrencyMap(),
        feeRevenueByCurrency: emptyCurrencyMap(),
        feeRate: currentAccount?.feeRate ?? 0,
        billingCycleDays: currentAccount?.billingCycleDays ?? 2,
        lastWithdrawalAmountByCurrency: {},
        adminRevenueByCurrency: emptyCurrencyMap(),
        totalFeeRevenueByCurrency: emptyCurrencyMap(),
        recentOrders: [],
        activeCheckouts: [],
        taxByAccount: [],
        campaigns: [],
      } satisfies DashboardSummary,
    }
  }

  const [checkoutsResult, domainsResult, storesResult, ordersResult, withdrawalsResult] =
    await Promise.all([
      supabaseAdmin
        .from("checkouts")
        .select("id, account_id, name, status, created_at, config")
        .in("account_id", visibleAccountIds)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("domains")
        .select("host, checkout_id")
        .in("account_id", visibleAccountIds),
      supabaseAdmin
        .from("shopify_stores")
        .select("name, default_checkout_id")
        .in("account_id", visibleAccountIds),
      supabaseAdmin
        .from("orders")
        .select("id, account_id, customer_name, amount, currency, status, date")
        .in("account_id", visibleAccountIds)
        .gte("date", start.toISOString())
        .lte("date", end.toISOString())
        .order("date", { ascending: false }),
      supabaseAdmin
        .from("withdrawals")
        .select("account_id, amount, currency, status, paid_at, created_at")
        .in("account_id", visibleAccountIds)
        .order("created_at", { ascending: false }),
    ])

  if (checkoutsResult.error) return { error: checkoutsResult.error.message }
  if (domainsResult.error) return { error: domainsResult.error.message }
  if (storesResult.error) return { error: storesResult.error.message }
  if (ordersResult.error) return { error: ordersResult.error.message }
  if (withdrawalsResult.error) return { error: withdrawalsResult.error.message }

  const domainByCheckout = new Map<string, string>()
  for (const domain of domainsResult.data ?? []) {
    if (domain.checkout_id && !domainByCheckout.has(domain.checkout_id)) {
      domainByCheckout.set(domain.checkout_id, domain.host)
    }
  }

  const storeByCheckout = new Map<string, string>()
  for (const store of storesResult.data ?? []) {
    if (store.default_checkout_id && !storeByCheckout.has(store.default_checkout_id)) {
      storeByCheckout.set(store.default_checkout_id, store.name)
    }
  }

  const recentOrders: DashboardOrderRow[] = (ordersResult.data ?? []).map((order) => ({
    id: order.id,
    accountId: order.account_id,
    customerName: order.customer_name ?? "Cliente",
    amount: Number(order.amount ?? 0),
    currency: normalizeCurrency(order.currency),
    status: order.status ?? "Pendente",
    date: order.date,
  }))

  const visibleCheckoutsRows = (checkoutsResult.data ?? []).map((checkout) => {
    const config =
      checkout.config && typeof checkout.config === "object" && !Array.isArray(checkout.config)
        ? checkout.config
        : {}

    const selectedStoreId =
      typeof config.selectedStoreId === "string" ? config.selectedStoreId : undefined
    const selectedDomainId =
      typeof config.selectedDomainId === "string" ? config.selectedDomainId : undefined

    const explicitStore = selectedStoreId
      ? (storesResult.data ?? []).find((store) => store.default_checkout_id === checkout.id)?.name ?? null
      : null

    const explicitDomain = selectedDomainId
      ? (domainsResult.data ?? []).find((domain) => domain.checkout_id === checkout.id)?.host ?? null
      : null

    return {
      id: checkout.id,
      accountId: checkout.account_id,
      name: checkout.name,
      status: checkout.status ?? "Ativo",
      createdAt: checkout.created_at,
      storeName: explicitStore ?? storeByCheckout.get(checkout.id) ?? null,
      domainHost: explicitDomain ?? domainByCheckout.get(checkout.id) ?? null,
    }
  })

  const totalOrders = recentOrders.length
  const paidOrders = recentOrders.filter((order) => isPaidStatus(order.status))
  const averageConversionRate =
    totalOrders > 0 ? Number(((paidOrders.length / totalOrders) * 100).toFixed(1)) : 0

  const revenueByCurrency = emptyCurrencyMap()
  const feeRevenueByCurrency = emptyCurrencyMap()
  const adminRevenueByCurrency = emptyCurrencyMap()
  const totalFeeRevenueByCurrency = emptyCurrencyMap()
  const revenueByAccount = new Map<string, DashboardCurrencyMap>()

  for (const order of paidOrders) {
    revenueByCurrency[order.currency] += order.amount

    const accountRevenue = revenueByAccount.get(order.accountId) ?? emptyCurrencyMap()
    accountRevenue[order.currency] += order.amount
    revenueByAccount.set(order.accountId, accountRevenue)

    const owner = visibleAccounts.find((account) => account.id === order.accountId)
    if (!owner) continue

    const feeValue = order.amount * (owner.feeRate / 100)
    feeRevenueByCurrency[order.currency] += feeValue

    if (owner.role === "admin") {
      adminRevenueByCurrency[order.currency] += order.amount
    } else {
      totalFeeRevenueByCurrency[order.currency] += feeValue
    }
  }

  const lastPaidWithdrawalAmountByCurrency: Partial<Record<SupportedCurrency, number>> = {}
  if (currentAccount) {
    for (const withdrawal of withdrawalsResult.data ?? []) {
      if (withdrawal.account_id !== currentAccount.id) continue
      if (!isPaidStatus(withdrawal.status)) continue

      const currency = normalizeCurrency(withdrawal.currency)
      if (lastPaidWithdrawalAmountByCurrency[currency] === undefined) {
        lastPaidWithdrawalAmountByCurrency[currency] = Number(withdrawal.amount ?? 0)
      }
    }
  }

  const taxByAccount = visibleAccounts
    .filter((account) => account.role === "user")
    .map((account) => {
      const accountRevenue = revenueByAccount.get(account.id) ?? emptyCurrencyMap()
      const accountFeeRevenue = emptyCurrencyMap()

      for (const currency of Object.keys(accountRevenue) as SupportedCurrency[]) {
        accountFeeRevenue[currency] = accountRevenue[currency] * (account.feeRate / 100)
      }

      return {
        id: account.id,
        name: account.name,
        email: account.email,
        feeRate: account.feeRate,
        feeRevenueByCurrency: accountFeeRevenue,
      }
    })

  const nonAdminFeeRates = visibleAccounts.filter((account) => account.role === "user")
  const summaryFeeRate =
    sessionRole === "admin"
      ? nonAdminFeeRates.length > 0
        ? Number(
            (
              nonAdminFeeRates.reduce((sum, account) => sum + account.feeRate, 0) /
              nonAdminFeeRates.length
            ).toFixed(2)
          )
        : 0
      : currentAccount?.feeRate ?? 0

  const currentAccountRevenueByCurrency = currentAccount
    ? revenueByAccount.get(currentAccount.id) ?? emptyCurrencyMap()
    : emptyCurrencyMap()
  const summaryFeeRevenueByCurrency =
    sessionRole === "admin" ? totalFeeRevenueByCurrency : currentAccountRevenueByCurrency

  const activeCheckouts: DashboardCheckoutRow[] = visibleCheckoutsRows
    .filter((checkout) => checkout.status === "Ativo")
    .slice(0, 5)

  return {
    role: sessionRole,
    currentAccountId: currentAccount?.id ?? null,
    summary: {
      totalCheckouts: visibleCheckoutsRows.length,
      averageConversionRate,
      totalOrders,
      revenueByCurrency,
      feeRevenueByCurrency: summaryFeeRevenueByCurrency,
      feeRate: summaryFeeRate,
      billingCycleDays: currentAccount?.billingCycleDays ?? 2,
      lastWithdrawalAmountByCurrency: lastPaidWithdrawalAmountByCurrency,
      adminRevenueByCurrency,
      totalFeeRevenueByCurrency,
      recentOrders: recentOrders.slice(0, 5),
      activeCheckouts,
      taxByAccount,
      campaigns: [],
    } satisfies DashboardSummary,
  }
}
