"use server"

import Whop from "@whop/sdk"

import { getSupabaseAdmin } from "@/lib/supabase"
import { requireServerAppSessionOrAccessToken } from "@/lib/server-app-session"

type SessionRole = "admin" | "user"

type PlatformGatewaySettingsRow = {
  id: string
  enabled: boolean | null
  whop_api_key: string | null
  whop_company_id: string | null
  fee_rate: number | null
  platform_covers_fees: boolean | null
}

type ManagedGatewayAccountRow = {
  id: string
  profile_id: string | null
  whop_key: string | null
  whop_company_id: string | null
  gateway_enabled: boolean | null
  gateway_payout_method_id: string | null
  gateway_payout_method_label: string | null
  gateway_auto_payout_enabled: boolean | null
}

export type GatewayPayoutMethod = {
  id: string
  label: string
  currency: string
  isDefault: boolean
  reference: string
}

export type GatewayAdminSettings = {
  enabled: boolean
  whopApiKey: string
  whopCompanyId: string
  feeRate: number
  platformCoversFees: boolean
}

export type GatewayUserSettings = {
  payoutMethodId: string
  payoutMethodLabel: string
  autoPayoutEnabled: boolean
  whopCompanyId: string
  whopConnected: boolean
}

export type GatewayPageData = {
  role: SessionRole
  enabled: boolean
  adminSettings: GatewayAdminSettings | null
  userSettings: GatewayUserSettings | null
  payoutMethods: GatewayPayoutMethod[]
  warnings: string[]
}

export type GatewayRuntimeSettings = {
  enabled: boolean
  feeRate: number
  platformApiKey: string
  platformCompanyId: string
  platformCoversFees: boolean
  accountId: string
  accountWhopKey: string
  accountWhopCompanyId: string
  payoutMethodId: string
  autoPayoutEnabled: boolean
}

function normalizeFeeRate(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0)
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0
  }

  return Math.min(numeric, 100)
}

async function resolveSession(input: { userId: string; accessToken?: string | null }) {
  const actor = await requireServerAppSessionOrAccessToken(input)
  const supabaseAdmin = getSupabaseAdmin()
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", actor.userId)
    .maybeSingle()

  if (!profile) {
    throw new Error("Sessao nao encontrada.")
  }

  return {
    supabaseAdmin,
    role: profile.role === "admin" ? ("admin" as const) : ("user" as const),
  }
}

async function assertAdmin(input: { userId: string; accessToken?: string | null }) {
  const { role } = await resolveSession(input)
  if (role !== "admin") {
    throw new Error("Apenas admins podem alterar o modo gateway.")
  }
}

async function readPlatformGatewaySettings() {
  const supabaseAdmin = getSupabaseAdmin()
  const result = await supabaseAdmin
    .from("platform_gateway_settings")
    .select("id, enabled, whop_api_key, whop_company_id, fee_rate, platform_covers_fees")
    .eq("id", "default")
    .maybeSingle()

  if (result.error) {
    return {
      settings: {
        enabled: false,
        whopApiKey: "",
        whopCompanyId: "",
        feeRate: 0,
        platformCoversFees: false,
      } satisfies GatewayAdminSettings,
      error: result.error.message,
    }
  }

  const row = result.data as PlatformGatewaySettingsRow | null

  return {
    settings: {
      enabled: row?.enabled === true,
      whopApiKey: row?.whop_api_key ?? "",
      whopCompanyId: row?.whop_company_id ?? "",
      feeRate: normalizeFeeRate(row?.fee_rate),
      platformCoversFees: row?.platform_covers_fees === true,
    } satisfies GatewayAdminSettings,
    error: null as string | null,
  }
}

async function listPayoutMethodsForCompany(input: { apiKey: string; companyId: string }) {
  if (!input.apiKey.trim() || !input.companyId.trim()) {
    return { items: [] as GatewayPayoutMethod[], error: "Credenciais da Whop incompletas." }
  }

  try {
    const client = new Whop({ apiKey: input.apiKey.trim() })
    const items: GatewayPayoutMethod[] = []

    for await (const method of client.payoutMethods.list({
      company_id: input.companyId.trim(),
      first: 25,
    })) {
      items.push({
        id: method.id,
        label:
          method.nickname ||
          method.institution_name ||
          method.destination?.name ||
          method.account_reference ||
          method.id,
        currency: (method.currency || "USD").toUpperCase(),
        isDefault: method.is_default === true,
        reference: method.account_reference || "Referencia nao informada",
      })
    }

    return { items, error: null as string | null }
  } catch (error) {
    return {
      items: [] as GatewayPayoutMethod[],
      error: error instanceof Error ? error.message : "Nao foi possivel listar os destinos de payout.",
    }
  }
}

export async function loadGatewayPageForSession(input: {
  userId: string
  accountId?: string | null
  accessToken?: string | null
}): Promise<GatewayPageData | { error: string }> {
  try {
    const { supabaseAdmin, role } = await resolveSession(input)
    const platform = await readPlatformGatewaySettings()
    const warnings: string[] = []

    if (platform.error) {
      warnings.push(platform.error)
    }

    if (role === "admin") {
      let payoutMethods: GatewayPayoutMethod[] = []

      if (
        platform.settings.enabled &&
        platform.settings.whopApiKey.trim() &&
        platform.settings.whopCompanyId.trim()
      ) {
        const methodsResult = await listPayoutMethodsForCompany({
          apiKey: platform.settings.whopApiKey,
          companyId: platform.settings.whopCompanyId,
        })
        payoutMethods = methodsResult.items
        if (methodsResult.error) {
          warnings.push(methodsResult.error)
        }
      }

      return {
        role,
        enabled: platform.settings.enabled,
        adminSettings: platform.settings,
        userSettings: null,
        payoutMethods,
        warnings,
      }
    }

    const { data: account, error: accountError } = await supabaseAdmin
      .from("managed_accounts")
      .select(
        "id, profile_id, whop_key, whop_company_id, gateway_enabled, gateway_payout_method_id, gateway_payout_method_label, gateway_auto_payout_enabled"
      )
      .eq("profile_id", input.userId)
      .maybeSingle()

    if (accountError || !account || account.profile_id !== input.userId) {
      return { error: accountError?.message || "Conta nao encontrada." }
    }

    const accountRow = account as ManagedGatewayAccountRow
    if (accountRow.gateway_enabled !== true) {
      return { error: "Gateway nao foi liberado para esta conta pelo admin." }
    }

    const whopConnected = Boolean(accountRow.whop_key && accountRow.whop_company_id)
    let payoutMethods: GatewayPayoutMethod[] = []

    if (whopConnected) {
      const methodsResult = await listPayoutMethodsForCompany({
        apiKey: accountRow.whop_key ?? "",
        companyId: accountRow.whop_company_id ?? "",
      })

      payoutMethods = methodsResult.items
      if (methodsResult.error) {
        warnings.push(methodsResult.error)
      }
    } else {
      warnings.push("Conecte sua conta Whop principal antes de configurar o Gateway.")
    }

    return {
      role,
      enabled: platform.settings.enabled,
      adminSettings: null,
      userSettings: {
        payoutMethodId: accountRow.gateway_payout_method_id ?? "",
        payoutMethodLabel: accountRow.gateway_payout_method_label ?? "",
        autoPayoutEnabled: accountRow.gateway_auto_payout_enabled === true,
        whopCompanyId: accountRow.whop_company_id ?? "",
        whopConnected,
      },
      payoutMethods,
      warnings,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel carregar o modo gateway.",
    }
  }
}

export async function saveGatewayModeEnabled(input: {
  userId: string
  enabled: boolean
  accessToken?: string | null
}) {
  try {
    await assertAdmin(input)
    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin.from("platform_gateway_settings").upsert(
      {
        id: "default",
        enabled: input.enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel atualizar o modo gateway.",
    }
  }
}

export async function saveGatewayAdminConfig(input: {
  userId: string
  whopApiKey: string
  whopCompanyId: string
  feeRate: number
  platformCoversFees: boolean
  accessToken?: string | null
}) {
  try {
    await assertAdmin(input)
    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin.from("platform_gateway_settings").upsert(
      {
        id: "default",
        whop_api_key: input.whopApiKey.trim() || null,
        whop_company_id: input.whopCompanyId.trim() || null,
        fee_rate: normalizeFeeRate(input.feeRate),
        platform_covers_fees: input.platformCoversFees,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel salvar a configuracao do gateway.",
    }
  }
}

export async function validateGatewayAdminConfig(input: {
  userId: string
  accessToken?: string | null
}) {
  try {
    await assertAdmin(input)
    const platform = await readPlatformGatewaySettings()

    if (!platform.settings.whopApiKey.trim() || !platform.settings.whopCompanyId.trim()) {
      return { error: "Informe a API key e o Company ID da conta gateway." }
    }

    const methods = await listPayoutMethodsForCompany({
      apiKey: platform.settings.whopApiKey,
      companyId: platform.settings.whopCompanyId,
    })

    if (methods.error) {
      return { error: methods.error }
    }

    return {
      success: true,
      payoutMethods: methods.items,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel validar o gateway.",
    }
  }
}

export async function saveGatewayUserConfig(input: {
  userId: string
  accountId?: string | null
  payoutMethodId: string
  payoutMethodLabel: string
  autoPayoutEnabled: boolean
  accessToken?: string | null
}) {
  try {
    const { supabaseAdmin, role } = await resolveSession(input)
    if (role !== "user") {
      return { error: "A configuracao de destino de saque e exclusiva do usuario." }
    }

    const { data: account } = await supabaseAdmin
      .from("managed_accounts")
      .select("id, profile_id, gateway_enabled")
      .eq("profile_id", input.userId)
      .maybeSingle()

    if (!account) {
      return { error: "Conta nao encontrada." }
    }

    const platform = await readPlatformGatewaySettings()
    if (!platform.settings.enabled) {
      return { error: "O modo gateway global esta desativado." }
    }

    if (account.gateway_enabled !== true) {
      return { error: "Gateway nao foi liberado para esta conta pelo admin." }
    }

    const { error } = await supabaseAdmin
      .from("managed_accounts")
      .update({
        gateway_payout_method_id: input.payoutMethodId.trim() || null,
        gateway_payout_method_label: input.payoutMethodLabel.trim() || null,
        gateway_auto_payout_enabled: input.autoPayoutEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", account.id)

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel salvar a configuracao do Gateway.",
    }
  }
}

export async function loadGatewayRuntimeForAccount(input: {
  accountId: string
}): Promise<GatewayRuntimeSettings | null> {
  const supabaseAdmin = getSupabaseAdmin()
  const platform = await readPlatformGatewaySettings()

  if (
    platform.error ||
    !platform.settings.enabled ||
    !platform.settings.whopApiKey.trim() ||
    !platform.settings.whopCompanyId.trim()
  ) {
    return null
  }

  const { data: account } = await supabaseAdmin
    .from("managed_accounts")
    .select(
      "id, whop_key, whop_company_id, gateway_enabled, gateway_payout_method_id, gateway_auto_payout_enabled"
    )
    .eq("id", input.accountId)
    .maybeSingle()

  if (!account) {
    return null
  }

  const accountRow = account as ManagedGatewayAccountRow
  if (
    accountRow.gateway_enabled !== true ||
    !accountRow.whop_key ||
    !accountRow.whop_company_id ||
    !accountRow.gateway_payout_method_id ||
    accountRow.gateway_auto_payout_enabled !== true
  ) {
    return null
  }

  return {
    enabled: true,
    feeRate: normalizeFeeRate(platform.settings.feeRate),
    platformApiKey: platform.settings.whopApiKey,
    platformCompanyId: platform.settings.whopCompanyId,
    platformCoversFees: platform.settings.platformCoversFees,
    accountId: accountRow.id,
    accountWhopKey: accountRow.whop_key,
    accountWhopCompanyId: accountRow.whop_company_id,
    payoutMethodId: accountRow.gateway_payout_method_id,
    autoPayoutEnabled: true,
  }
}
