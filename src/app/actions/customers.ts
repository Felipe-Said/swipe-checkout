"use server"

import { getSupabaseAdmin } from "@/lib/supabase"

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
  keyFrozen: boolean
  withdrawalsEnabled: boolean
  messengerEnabled: boolean
  billingCycleDays: number
}

type SupportMessage = {
  id: string
  accountId: string
  from: "admin" | "user"
  text: string
  imageSrc: string
  createdAt: string
}

type WithdrawalItem = {
  id: string
  accountId: string
  currency: "BRL" | "USD" | "EUR" | "GBP"
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

type BankAccountMap = Record<
  string,
  Partial<
    Record<
      "BRL" | "USD" | "EUR" | "GBP",
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

async function assertAdmin(userId: string) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle()

  if (profile?.role !== "admin") {
    throw new Error("Acesso restrito ao admin.")
  }
}

export async function loadAdminCustomersData(input: { userId: string }) {
  await assertAdmin(input.userId)

  const supabaseAdmin = getSupabaseAdmin()

  const [accountsResult, profilesResult, ordersResult, withdrawalsResult, messagesResult, bankAccountsResult, signupsResult] =
    await Promise.all([
      supabaseAdmin
        .from("managed_accounts")
        .select("id, profile_id, name, fee_rate, whop_key, billing_cycle_days, key_frozen, withdrawals_enabled, messenger_enabled")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("profiles")
        .select("id, name, email, role, status, photo_url"),
      supabaseAdmin
        .from("orders")
        .select("id, account_id, amount, status"),
      supabaseAdmin
        .from("withdrawals")
        .select("id, account_id, currency, amount, status, created_at, paid_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("support_messages")
        .select("id, account_id, from_role, text, image_src, created_at")
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("bank_accounts")
        .select("account_id, currency, holder_name, document, bank_name, agency, account_number, pix_key"),
      supabaseAdmin
        .from("profiles")
        .select("id, name, email")
        .eq("status", "pending_approval")
        .order("created_at", { ascending: false }),
    ])

  if (accountsResult.error) {
    return { error: accountsResult.error.message }
  }

  const profileMap = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile])
  )

  const ordersByAccount = new Map<string, { total: number; revenue: number; paid: number }>()
  for (const order of ordersResult.data ?? []) {
    const current = ordersByAccount.get(order.account_id) ?? { total: 0, revenue: 0, paid: 0 }
    current.total += 1
    const amount = Number(order.amount ?? 0)
    if (order.status === "Pago") {
      current.revenue += amount
      current.paid += 1
    }
    ordersByAccount.set(order.account_id, current)
  }

  const accounts: AdminCustomerAccount[] = (accountsResult.data ?? []).map((account) => {
    const profile = profileMap.get(account.profile_id)
    const metrics = ordersByAccount.get(account.id) ?? { total: 0, revenue: 0, paid: 0 }

    return {
      id: account.id,
      profileId: account.profile_id,
      name: profile?.name?.trim() || account.name,
      email: profile?.email ?? "",
      photoUrl: profile?.photo_url ?? "",
      role: profile?.role === "admin" ? "admin" : "user",
      status: profile?.status === "blocked" ? "Bloqueada" : "Ativa",
      orders: metrics.total,
      conversionRate: metrics.total > 0 ? Number(((metrics.paid / metrics.total) * 100).toFixed(1)) : 0,
      revenue: metrics.revenue,
      feeRate: Number(account.fee_rate ?? 0),
      whopKey: account.whop_key ?? "",
      keyFrozen: Boolean(account.key_frozen),
      withdrawalsEnabled: account.withdrawals_enabled !== false,
      messengerEnabled: account.messenger_enabled !== false,
      billingCycleDays: account.billing_cycle_days ?? 2,
    }
  })

  const withdrawals: WithdrawalItem[] = (withdrawalsResult.data ?? []).map((withdrawal) => ({
    id: withdrawal.id,
    accountId: withdrawal.account_id,
    currency:
      withdrawal.currency === "USD" ||
      withdrawal.currency === "EUR" ||
      withdrawal.currency === "GBP"
        ? withdrawal.currency
        : "BRL",
    amount: Number(withdrawal.amount ?? 0),
    requestedAt: withdrawal.created_at,
    paidAt: withdrawal.paid_at,
    status: withdrawal.status === "paid" ? "paid" : "pending",
  }))

  const messages: SupportMessage[] = (messagesResult.data ?? []).map((message) => ({
    id: message.id,
    accountId: message.account_id,
    from: message.from_role === "admin" ? "admin" : "user",
    text: message.text ?? "",
    imageSrc: message.image_src ?? "",
    createdAt: message.created_at,
  }))

  const bankAccounts: BankAccountMap = {}
  for (const item of bankAccountsResult.data ?? []) {
    const currency =
      item.currency === "USD" || item.currency === "EUR" || item.currency === "GBP"
        ? item.currency
        : "BRL"

    bankAccounts[item.account_id] = {
      ...(bankAccounts[item.account_id] ?? {}),
      [currency]: {
        holderName: item.holder_name ?? "",
        document: item.document ?? "",
        bankName: item.bank_name ?? "",
        agency: item.agency ?? "",
        accountNumber: item.account_number ?? "",
        pixKey: item.pix_key ?? "",
      },
    }
  }

  const pendingSignups: PendingSignup[] = (signupsResult.data ?? []).map((profile) => ({
    id: profile.id,
    name: profile.name ?? "Sem nome",
    email: profile.email ?? "",
  }))

  return {
    accounts,
    withdrawals,
    messages,
    bankAccounts,
    pendingSignups,
  }
}

export async function adminUpdateCustomerAccount(input: {
  userId: string
  accountId: string
  patch: {
    feeRate?: number
    whopKey?: string
    keyFrozen?: boolean
    withdrawalsEnabled?: boolean
    messengerEnabled?: boolean
    status?: "Ativa" | "Bloqueada"
  }
}) {
  await assertAdmin(input.userId)

  const supabaseAdmin = getSupabaseAdmin()

  const { data: account } = await supabaseAdmin
    .from("managed_accounts")
    .select("profile_id")
    .eq("id", input.accountId)
    .maybeSingle()

  if (!account) {
    return { error: "Conta nao encontrada." }
  }

  const managedAccountPatch: Record<string, unknown> = {}
  if (input.patch.feeRate !== undefined) managedAccountPatch.fee_rate = input.patch.feeRate
  if (input.patch.whopKey !== undefined) managedAccountPatch.whop_key = input.patch.whopKey
  if (input.patch.keyFrozen !== undefined) managedAccountPatch.key_frozen = input.patch.keyFrozen
  if (input.patch.withdrawalsEnabled !== undefined) managedAccountPatch.withdrawals_enabled = input.patch.withdrawalsEnabled
  if (input.patch.messengerEnabled !== undefined) managedAccountPatch.messenger_enabled = input.patch.messengerEnabled

  if (Object.keys(managedAccountPatch).length > 0) {
    const { error } = await supabaseAdmin
      .from("managed_accounts")
      .update(managedAccountPatch)
      .eq("id", input.accountId)

    if (error) {
      return { error: error.message }
    }
  }

  if (input.patch.status && account.profile_id) {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        status: input.patch.status === "Bloqueada" ? "blocked" : "approved",
      })
      .eq("id", account.profile_id)

    if (error) {
      return { error: error.message }
    }
  }

  return { success: true }
}

export async function adminSendSupportMessage(input: {
  userId: string
  accountId: string
  text: string
  imageSrc: string
}) {
  await assertAdmin(input.userId)

  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin.from("support_messages").insert({
    account_id: input.accountId,
    from_role: "admin",
    text: input.text,
    image_src: input.imageSrc,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function adminMarkWithdrawalPaid(input: {
  userId: string
  withdrawalId: string
}) {
  await assertAdmin(input.userId)

  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin
    .from("withdrawals")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", input.withdrawalId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function adminHandleSignup(input: {
  userId: string
  profileId: string
  nextStatus: "approved" | "rejected"
}) {
  await assertAdmin(input.userId)

  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ status: input.nextStatus })
    .eq("id", input.profileId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function loadSupportMessagesForSession(input: {
  userId: string
  accountId: string
}) {
  const supabaseAdmin = getSupabaseAdmin()

  const { data: account } = await supabaseAdmin
    .from("managed_accounts")
    .select("id, profile_id, messenger_enabled")
    .eq("id", input.accountId)
    .maybeSingle()

  if (!account || account.profile_id !== input.userId) {
    return { error: "Conta nao encontrada.", messages: [] as SupportMessage[] }
  }

  if (account.messenger_enabled === false) {
    return { error: "Messenger desativado para esta conta.", messages: [] as SupportMessage[] }
  }

  const { data, error } = await supabaseAdmin
    .from("support_messages")
    .select("id, account_id, from_role, text, image_src, created_at")
    .eq("account_id", input.accountId)
    .order("created_at", { ascending: true })

  if (error) {
    return { error: error.message, messages: [] as SupportMessage[] }
  }

  return {
    messages: (data ?? []).map((message) => ({
      id: message.id,
      accountId: message.account_id,
      from: message.from_role === "admin" ? "admin" : "user",
      text: message.text ?? "",
      imageSrc: message.image_src ?? "",
      createdAt: message.created_at,
    })),
  }
}

export async function sendSupportMessageForSession(input: {
  userId: string
  accountId: string
  text: string
  imageSrc: string
}) {
  const supabaseAdmin = getSupabaseAdmin()

  const { data: account } = await supabaseAdmin
    .from("managed_accounts")
    .select("id, profile_id, messenger_enabled")
    .eq("id", input.accountId)
    .maybeSingle()

  if (!account || account.profile_id !== input.userId) {
    return { error: "Conta nao encontrada." }
  }

  if (account.messenger_enabled === false) {
    return { error: "Messenger desativado para esta conta." }
  }

  const { error } = await supabaseAdmin
    .from("support_messages")
    .insert({
      account_id: input.accountId,
      from_role: "user",
      text: input.text,
      image_src: input.imageSrc,
    })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
