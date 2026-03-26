import { supabase } from "./supabase"

export type ManagedAccount = {
  id: string
  profile_id?: string
  name: string
  email?: string
  role?: "admin" | "user"
  status?: "Ativa" | "Bloqueada"
  orders?: number
  conversionRate?: number
  revenue?: number
  feeRate?: number
  whopKey?: string
  whopCompanyId?: string
  whopIntegrationStatus?: "Pronto" | "Em validação" | "Atenção" | "Pendente" | "Falha"
  whopLastValidation?: string
  whopPermissionsValid?: boolean
  whopCheckoutReady?: boolean
  whopWebhookActive?: boolean
  whopEnvironment?: "Produção" | "Sandbox"
  keyFrozen?: boolean
  billingCycleDays?: number
  paymentMode?: "manual"
  settlementStartedAt?: string
  estimatedDailyRevenueByCurrency?: Partial<Record<"BRL" | "USD" | "EUR" | "GBP", number>>
}

const DEFAULT_USER_FEE_RATE = 15

export async function getManagedAccounts(): Promise<ManagedAccount[]> {
  const { data, error } = await supabase
    .from('managed_accounts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching accounts:', error)
    return []
  }

  return (data || []).map(mapDbToAccount)
}

export async function updateManagedAccount(id: string, updates: Partial<ManagedAccount>) {
  const dbUpdates = mapAccountToDb(updates)
  const { error } = await supabase
    .from('managed_accounts')
    .update(dbUpdates)
    .eq('id', id)

  if (error) {
    throw error
  }
}

function mapDbToAccount(db: any): ManagedAccount {
  return {
    id: db.id,
    profile_id: db.profile_id,
    name: db.name,
    feeRate: Number(db.fee_rate),
    billingCycleDays: db.billing_cycle_days,
    paymentMode: db.payment_mode,
    settlementStartedAt: db.settlement_started_at,
    whopKey: db.whop_key,
    whopIntegrationStatus: db.whop_integration_status,
    whopLastValidation: db.whop_last_validation,
    whopPermissionsValid: db.whop_permissions_valid,
    whopCheckoutReady: db.whop_checkout_ready,
    whopWebhookActive: db.whop_webhook_active,
    whopCompanyId: db.whop_company_id,
    whopEnvironment: db.whop_environment,
    // Fields not in table yet or handled via joins/aggregates
    role: "user",
    status: "Ativa",
    orders: 0,
    conversionRate: 0,
    revenue: 0,
    keyFrozen: false,
    estimatedDailyRevenueByCurrency: { BRL: 0, USD: 0, EUR: 0, GBP: 0 }
  }
}

function mapAccountToDb(account: Partial<ManagedAccount>): any {
  const db: any = {}
  if (account.name !== undefined) db.name = account.name
  if (account.feeRate !== undefined) db.fee_rate = account.feeRate
  if (account.billingCycleDays !== undefined) db.billing_cycle_days = account.billingCycleDays
  if (account.paymentMode !== undefined) db.payment_mode = account.paymentMode
  if (account.settlementStartedAt !== undefined) db.settlement_started_at = account.settlementStartedAt
  if (account.whopKey !== undefined) db.whop_key = account.whopKey
  if (account.whopIntegrationStatus !== undefined) db.whop_integration_status = account.whopIntegrationStatus
  if (account.whopLastValidation !== undefined) db.whop_last_validation = account.whopLastValidation
  if (account.whopPermissionsValid !== undefined) db.whop_permissions_valid = account.whopPermissionsValid
  if (account.whopCheckoutReady !== undefined) db.whop_checkout_ready = account.whopCheckoutReady
  if (account.whopWebhookActive !== undefined) db.whop_webhook_active = account.whopWebhookActive
  if (account.whopCompanyId !== undefined) db.whop_company_id = account.whopCompanyId
  if (account.whopEnvironment !== undefined) db.whop_environment = account.whopEnvironment
  return db
}

// Deprecated legacy functions (keeping signatures for now to prevent build break)
export function readManagedAccounts(): ManagedAccount[] {
  console.warn("readManagedAccounts is deprecated. Use getManagedAccounts (async).")
  return []
}

export function writeManagedAccounts(accounts: ManagedAccount[]) {
  console.warn("writeManagedAccounts is deprecated. Use updateManagedAccount (async).")
}

export function calculateFeeValue(account: ManagedAccount) {
  return (account.revenue ?? 0) * ((account.feeRate ?? 0) / 100)
}
