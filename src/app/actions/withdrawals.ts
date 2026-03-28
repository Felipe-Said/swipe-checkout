"use server"

import { getSupabaseAdmin } from "@/lib/supabase"
import type {
  BankAccountDetails,
  SupportedWithdrawalCurrency,
} from "@/lib/withdrawals-data"

type SessionRole = "admin" | "user"

type WithdrawalAccount = {
  id: string
  profileId: string | null
  name: string
  email: string
  role: SessionRole
  feeRate: number
  billingCycleDays: number
}

type WithdrawalItem = {
  id: string
  accountId: string
  currency: SupportedWithdrawalCurrency
  amount: number
  requestedAt: string
  paidAt: string | null
  status: "pending" | "paid"
}

type WithdrawalPageData = {
  role: SessionRole
  currentAccountId: string | null
  accounts: WithdrawalAccount[]
  bankAccounts: Partial<Record<SupportedWithdrawalCurrency, BankAccountDetails>>
  withdrawals: WithdrawalItem[]
  adminPendingWithdrawals: WithdrawalItem[]
  adminPaidTotal: number
  adminCurrentDailyProfit: number
  availableByCurrency: Record<SupportedWithdrawalCurrency, number>
}

const supportedCurrencies: SupportedWithdrawalCurrency[] = ["BRL", "USD", "EUR", "GBP"]

function normalizeCurrency(value: string | null | undefined): SupportedWithdrawalCurrency {
  return value === "USD" || value === "EUR" || value === "GBP" ? value : "BRL"
}

function normalizeWithdrawalStatus(value: string | null | undefined): "pending" | "paid" {
  const normalized = (value ?? "").toLowerCase()
  return normalized === "paid" || normalized === "pago" ? "paid" : "pending"
}

function emptyAvailableMap() {
  return {
    BRL: 0,
    USD: 0,
    EUR: 0,
    GBP: 0,
  } satisfies Record<SupportedWithdrawalCurrency, number>
}

async function resolveSession(input: { userId: string }) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, role, email")
    .eq("id", input.userId)
    .maybeSingle()

  if (!profile) {
    throw new Error("Sessao nao encontrada.")
  }

  return {
    supabaseAdmin,
    profile,
    role: profile.role === "admin" ? ("admin" as const) : ("user" as const),
  }
}

async function resolveAccountForUser(input: {
  userId: string
  accountId?: string | null
}) {
  const { supabaseAdmin, role } = await resolveSession({ userId: input.userId })

  if (role === "admin") {
    if (!input.accountId) {
      return null
    }

    const { data: account } = await supabaseAdmin
      .from("managed_accounts")
      .select("id, profile_id")
      .eq("id", input.accountId)
      .maybeSingle()

    return account
  }

  let query = supabaseAdmin
    .from("managed_accounts")
    .select("id, profile_id")
    .eq("profile_id", input.userId)

  if (input.accountId) {
    query = query.eq("id", input.accountId)
  }

  const { data: account } = await query.maybeSingle()
  return account
}

export async function loadWithdrawalsForSession(input: {
  userId: string
  accountId?: string | null
}): Promise<WithdrawalPageData | { error: string }> {
  try {
    const { supabaseAdmin, role } = await resolveSession({ userId: input.userId })

    const accountsResult = await supabaseAdmin
      .from("managed_accounts")
      .select("id, profile_id, name, fee_rate, billing_cycle_days")
      .order("created_at", { ascending: false })

    if (accountsResult.error) {
      return { error: accountsResult.error.message }
    }

    const accountsRaw = accountsResult.data ?? []
    const profileIds = accountsRaw
      .map((account) => account.profile_id)
      .filter((value): value is string => Boolean(value))

    const profilesResult = profileIds.length
      ? await supabaseAdmin
          .from("profiles")
          .select("id, email, role")
          .in("id", profileIds)
      : { data: [], error: null }

    if (profilesResult.error) {
      return { error: profilesResult.error.message }
    }

    const profileMap = new Map(
      (profilesResult.data ?? []).map((profile) => [profile.id, profile])
    )

    const accounts: WithdrawalAccount[] = accountsRaw.map((account) => {
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

    const currentAccount =
      role === "admin"
        ? accounts.find((account) => account.id === input.accountId) ?? accounts[0] ?? null
        : accounts.find((account) => account.profileId === input.userId) ?? null

    const withdrawalsQuery =
      role === "admin"
        ? supabaseAdmin
            .from("withdrawals")
            .select("id, account_id, currency, amount, status, created_at, paid_at")
            .order("created_at", { ascending: false })
        : supabaseAdmin
            .from("withdrawals")
            .select("id, account_id, currency, amount, status, created_at, paid_at")
            .eq("account_id", currentAccount?.id ?? "")
            .order("created_at", { ascending: false })

    const bankAccountsQuery =
      role === "admin"
        ? Promise.resolve({ data: [], error: null as { message: string } | null })
        : supabaseAdmin
            .from("bank_accounts")
            .select("currency, holder_name, document, bank_name, agency, account_number, pix_key")
            .eq("account_id", currentAccount?.id ?? "")

    const ordersQuery =
      role === "admin"
        ? supabaseAdmin
            .from("orders")
            .select("account_id, amount, currency, status, date")
            .order("date", { ascending: false })
        : supabaseAdmin
            .from("orders")
            .select("account_id, amount, currency, status, date")
            .eq("account_id", currentAccount?.id ?? "")
            .order("date", { ascending: false })

    const [withdrawalsResult, bankAccountsResult, ordersResult] = await Promise.all([
      withdrawalsQuery,
      bankAccountsQuery,
      ordersQuery,
    ])

    if (withdrawalsResult.error) {
      return { error: withdrawalsResult.error.message }
    }

    if (bankAccountsResult.error) {
      return { error: bankAccountsResult.error.message }
    }

    if (ordersResult.error) {
      return { error: ordersResult.error.message }
    }

    const withdrawals: WithdrawalItem[] = (withdrawalsResult.data ?? []).map((withdrawal) => ({
      id: withdrawal.id,
      accountId: withdrawal.account_id,
      currency: normalizeCurrency(withdrawal.currency),
      amount: Number(withdrawal.amount ?? 0),
      requestedAt: withdrawal.created_at,
      paidAt: withdrawal.paid_at,
      status: normalizeWithdrawalStatus(withdrawal.status),
    }))

    const bankAccounts = (bankAccountsResult.data ?? []).reduce<
      Partial<Record<SupportedWithdrawalCurrency, BankAccountDetails>>
    >((acc, item) => {
      const currency = normalizeCurrency(item.currency)
      acc[currency] = {
        holderName: item.holder_name ?? "",
        document: item.document ?? "",
        bankName: item.bank_name ?? "",
        agency: item.agency ?? "",
        accountNumber: item.account_number ?? "",
        pixKey: item.pix_key ?? "",
      }
      return acc
    }, {})

    const availableByCurrency = emptyAvailableMap()
    const now = Date.now()
    const accountMap = new Map(accounts.map((account) => [account.id, account]))

    for (const order of ordersResult.data ?? []) {
      const account = accountMap.get(order.account_id)
      if (!account) {
        continue
      }

      const status = (order.status ?? "").toLowerCase()
      if (status !== "pago" && status !== "paid") {
        continue
      }

      const currency = normalizeCurrency(order.currency)
      const amount = Number(order.amount ?? 0)
      const orderDate = order.date ? new Date(order.date) : null
      if (!orderDate || !Number.isFinite(orderDate.getTime())) {
        continue
      }

      const releaseMs = account.billingCycleDays * 24 * 60 * 60 * 1000
      if (orderDate.getTime() + releaseMs <= now) {
        availableByCurrency[currency] += amount
      }
    }

    for (const withdrawal of withdrawals) {
      if (role === "admin" || withdrawal.accountId === currentAccount?.id) {
        availableByCurrency[withdrawal.currency] = Math.max(
          availableByCurrency[withdrawal.currency] - withdrawal.amount,
          0
        )
      }
    }

    const adminPendingWithdrawals =
      role === "admin" ? withdrawals.filter((withdrawal) => withdrawal.status === "pending") : []

    const adminPaidTotal =
      role === "admin"
        ? withdrawals
            .filter((withdrawal) => withdrawal.status === "paid")
            .reduce((sum, withdrawal) => sum + withdrawal.amount, 0)
        : 0

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const adminCurrentDailyProfit =
      role === "admin"
        ? (ordersResult.data ?? []).reduce((sum, order) => {
            const account = accountMap.get(order.account_id)
            const status = (order.status ?? "").toLowerCase()
            const orderDate = order.date ? new Date(order.date) : null
            if (!account || account.role !== "user" || !orderDate) {
              return sum
            }
            if ((status !== "pago" && status !== "paid") || orderDate < startOfToday) {
              return sum
            }
            return sum + Number(order.amount ?? 0) * (account.feeRate / 100)
          }, 0)
        : 0

    return {
      role,
      currentAccountId: currentAccount?.id ?? null,
      accounts,
      bankAccounts,
      withdrawals,
      adminPendingWithdrawals,
      adminPaidTotal,
      adminCurrentDailyProfit,
      availableByCurrency,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel carregar saques.",
    }
  }
}

export async function saveBankAccountForSession(input: {
  userId: string
  accountId?: string | null
  currency: SupportedWithdrawalCurrency
  details: BankAccountDetails
}) {
  try {
    const { supabaseAdmin } = await resolveSession({ userId: input.userId })
    const account = await resolveAccountForUser({
      userId: input.userId,
      accountId: input.accountId,
    })

    if (!account) {
      return { error: "Conta nao encontrada." }
    }

    const { error } = await supabaseAdmin.from("bank_accounts").upsert(
      {
        account_id: account.id,
        currency: input.currency,
        holder_name: input.details.holderName,
        document: input.details.document,
        bank_name: input.details.bankName,
        agency: input.details.agency,
        account_number: input.details.accountNumber,
        pix_key: input.details.pixKey,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "account_id,currency",
      }
    )

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel salvar a conta bancaria.",
    }
  }
}

export async function createWithdrawalForSession(input: {
  userId: string
  accountId?: string | null
  currency: SupportedWithdrawalCurrency
  amount: number
}) {
  try {
    const { supabaseAdmin } = await resolveSession({ userId: input.userId })
    const account = await resolveAccountForUser({
      userId: input.userId,
      accountId: input.accountId,
    })

    if (!account) {
      return { error: "Conta nao encontrada." }
    }

    const { data: bankAccount } = await supabaseAdmin
      .from("bank_accounts")
      .select("pix_key")
      .eq("account_id", account.id)
      .eq("currency", input.currency)
      .maybeSingle()

    const { error } = await supabaseAdmin.from("withdrawals").insert({
      account_id: account.id,
      amount: input.amount,
      currency: input.currency,
      status: "pending",
      pix_key: bankAccount?.pix_key ?? null,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel solicitar o saque.",
    }
  }
}
