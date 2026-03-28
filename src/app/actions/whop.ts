"use server"

import Whop from "@whop/sdk"

import { getSupabaseAdmin } from "@/lib/supabase"
import { type ManagedAccount } from "@/lib/account-metrics"
import {
  loadShopifyStorePreviewForPublishing,
  loadShopifyVariantPreviewForPublishing,
} from "@/app/actions/shopify"

const DEFAULT_CHECKOUT_AMOUNT = 1250

type EditorCheckoutConfig = {
  companyName?: string
  currency?: "BRL" | "USD" | "EUR" | "GBP"
  selectedDomainId?: string
  selectedStoreId?: string
  selectedWhopAccountId?: string
  whop?: {
    checkoutConfigurationId?: string | null
    planId?: string | null
    purchaseUrl?: string | null
    companyId?: string | null
    publishedAt?: string
    amount?: number
  }
  [key: string]: unknown
}

type ShopifyStorePreview = {
  storeName: string
  currency: "BRL" | "USD" | "EUR" | "GBP"
  productName: string
  variantLabel: string
  amount: number
  imageSrc?: string
}

type CheckoutRecord = {
  id: string
  account_id: string
  name: string
  status: string
  type: string
  config: EditorCheckoutConfig
  created_at: string
}

type WhopManagedAccount = {
  id: string
  profile_id: string | null
  name: string
  whop_key: string | null
  whop_company_id: string | null
  whop_integration_status: string | null
  whop_last_validation: string | null
  whop_permissions_valid: boolean | null
  whop_checkout_ready: boolean | null
  whop_webhook_active: boolean | null
  whop_environment: string | null
  billing_cycle_days: number | null
  payment_mode: string | null
  settlement_started_at: string | null
  fee_rate: number | null
}

function getAppBaseUrl() {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL

  if (explicit) {
    return explicit.replace(/\/$/, "")
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return "http://localhost:3000"
}

function normalizeWhopCurrency(currency: string | undefined) {
  const fallback = "brl"
  if (!currency) return fallback
  return currency.toLowerCase() as
    | "brl"
    | "usd"
    | "eur"
    | "gbp"
}

function hasValidStorePreview(preview?: ShopifyStorePreview | null) {
  return Boolean(preview && Number.isFinite(preview.amount) && preview.amount > 0 && preview.productName)
}

function buildThankYouRedirectUrl(checkoutId: string, domainHost?: string | null) {
  if (domainHost) {
    return `https://${domainHost.replace(/^https?:\/\//, "")}`
  }

  return `${getAppBaseUrl()}/app/checkouts/${checkoutId}/editor?mode=preview`
}

async function ensureWebhook(client: Whop, companyId?: string | null) {
  const webhookUrl = `${getAppBaseUrl()}/api/webhooks/whop`

  if (companyId) {
    for await (const webhook of client.webhooks.list({ company_id: companyId, first: 100 })) {
      if (webhook.url === webhookUrl) {
        return {
          id: webhook.id,
          active: webhook.enabled,
          companyId,
        }
      }
    }
  }

  const createdWebhook = await client.webhooks.create({
    url: webhookUrl,
    resource_id: companyId || undefined,
    enabled: true,
    api_version: "v1",
    events: ["payment.succeeded", "payment.pending", "payment.failed", "invoice.paid"],
  })

  return {
    id: createdWebhook.id,
    active: createdWebhook.enabled,
    companyId: createdWebhook.resource_id,
  }
}

function mapCheckoutRecord(row: any): CheckoutRecord {
  return {
    id: row.id,
    account_id: row.account_id,
    name: row.name,
    status: row.status ?? "Ativo",
    type: row.type ?? "Custom",
    config:
      row.config && typeof row.config === "object" && !Array.isArray(row.config)
        ? (row.config as EditorCheckoutConfig)
        : {},
    created_at: row.created_at,
  }
}

function mapManagedAccountToWhopState(row: WhopManagedAccount, profile?: any): ManagedAccount {
  return {
    id: row.id,
    profile_id: row.profile_id ?? undefined,
    name: row.name,
    email: profile?.email,
    role: profile?.role === "admin" ? "admin" : "user",
    status: profile?.status === "blocked" ? "Bloqueada" : "Ativa",
    feeRate: Number(row.fee_rate ?? 0),
    billingCycleDays: row.billing_cycle_days ?? 2,
    paymentMode: "manual" as const,
    settlementStartedAt: row.settlement_started_at ?? undefined,
    whopKey: row.whop_key ?? undefined,
    whopCompanyId: row.whop_company_id ?? undefined,
    whopIntegrationStatus: (row.whop_integration_status ?? "Pendente") as
      | "Pronto"
      | "Em validação"
      | "Atenção"
      | "Pendente"
      | "Falha",
    whopLastValidation: row.whop_last_validation ?? undefined,
    whopPermissionsValid: !!row.whop_permissions_valid,
    whopCheckoutReady: !!row.whop_checkout_ready,
    whopWebhookActive: !!row.whop_webhook_active,
    whopEnvironment: (row.whop_environment ?? "Sandbox") as "Produção" | "Sandbox",
    keyFrozen: false,
    orders: 0,
    conversionRate: 0,
    revenue: 0,
    estimatedDailyRevenueByCurrency: { BRL: 0, USD: 0, EUR: 0, GBP: 0 },
  }
}

export async function loadWhopAccountForSession(input: { accountId?: string | null; userId: string }) {
  const supabaseAdmin = getSupabaseAdmin()

  let accountQuery = supabaseAdmin
    .from("managed_accounts")
    .select(
      "id, profile_id, name, whop_key, whop_company_id, whop_integration_status, whop_last_validation, whop_permissions_valid, whop_checkout_ready, whop_webhook_active, whop_environment, billing_cycle_days, payment_mode, settlement_started_at, fee_rate"
    )

  if (input.accountId) {
    accountQuery = accountQuery.eq("id", input.accountId)
  } else {
    accountQuery = accountQuery.eq("profile_id", input.userId)
  }

  const { data: account, error: accountError } = await accountQuery.maybeSingle()

  if (accountError || !account) {
    return { account: null }
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email, role, status")
    .eq("id", account.profile_id)
    .maybeSingle()

  return {
    account: mapManagedAccountToWhopState(account as WhopManagedAccount, profile),
  }
}

export async function validateWhopAccount(input: {
  accountId: string
  apiKey: string
  companyId?: string
}) {
  const apiKey = input.apiKey.trim()
  const manualCompanyId = input.companyId?.trim() || null
  if (!input.accountId || !apiKey) {
    return { error: "Conta e API key sao obrigatorias." }
  }

  const supabaseAdmin = getSupabaseAdmin()

  const { data: account, error: accountError } = await supabaseAdmin
    .from("managed_accounts")
    .select("id, name, whop_company_id")
    .eq("id", input.accountId)
    .single()

  if (accountError || !account) {
    return { error: "Conta operacional nao encontrada." }
  }

  try {
    const client = new Whop({ apiKey })
    const webhook = await ensureWebhook(client, manualCompanyId || account.whop_company_id)

    const { error: updateError } = await supabaseAdmin
      .from("managed_accounts")
      .update({
        whop_key: apiKey,
        whop_company_id: webhook.companyId || manualCompanyId,
        whop_integration_status: "Pronto",
        whop_last_validation: new Date().toISOString(),
        whop_permissions_valid: true,
        whop_checkout_ready: true,
        whop_webhook_active: webhook.active,
        whop_environment: "Produção",
      })
      .eq("id", input.accountId)

    if (updateError) {
      return { error: updateError.message }
    }

    return {
      success: true,
      company: {
        id: webhook.companyId || manualCompanyId,
        title: null,
        route: null,
      },
      webhookId: webhook.id,
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nao foi possivel validar a API key da Whop."

    let normalizedMessage = message
    if (message.includes("company:basic:read")) {
      normalizedMessage =
        "A API key ainda esta sem permissao para ler a empresa na Whop. Se essa permissao nao aparecer para voce, preencha manualmente o Company ID no modo avancado e valide novamente."
    } else if (message.includes("Please provide a resource id or have a current company in context")) {
      normalizedMessage =
        "A Whop nao identificou automaticamente a empresa desta API key. Preencha o Company ID no modo avancado e valide novamente."
    }

    await supabaseAdmin
      .from("managed_accounts")
      .update({
        whop_key: apiKey,
        whop_integration_status: "Falha",
        whop_last_validation: new Date().toISOString(),
        whop_permissions_valid: false,
        whop_checkout_ready: false,
        whop_webhook_active: false,
      })
      .eq("id", input.accountId)

    return {
      error: normalizedMessage,
    }
  }
}

export async function saveWhopAccountCredentials(input: {
  accountId: string
  apiKey: string
  companyId?: string
}) {
  const apiKey = input.apiKey.trim()
  const companyId = input.companyId?.trim() || null
  if (!input.accountId) {
    return { error: "Conta operacional nao encontrada." }
  }

  const supabaseAdmin = getSupabaseAdmin()

  const { data: account, error: accountError } = await supabaseAdmin
    .from("managed_accounts")
    .select("id")
    .eq("id", input.accountId)
    .single()

  if (accountError || !account) {
    return { error: "Conta operacional nao encontrada." }
  }

  const { error: updateError } = await supabaseAdmin
    .from("managed_accounts")
    .update({
      whop_key: apiKey,
      whop_company_id: companyId,
      whop_integration_status: "Pendente",
      whop_permissions_valid: false,
      whop_checkout_ready: false,
      whop_webhook_active: false,
    })
    .eq("id", input.accountId)

  if (updateError) {
    return { error: updateError.message }
  }

  return { success: true }
}

export async function loadCheckoutsForAccount(input: { accountId: string }) {
  if (!input.accountId) {
    return { checkouts: [] as CheckoutRecord[] }
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from("checkouts")
    .select("id, account_id, name, status, type, config, created_at")
    .eq("account_id", input.accountId)
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message, checkouts: [] as CheckoutRecord[] }
  }

  return {
    checkouts: (data || []).map(mapCheckoutRecord),
  }
}

export async function loadCheckoutForEditor(input: { checkoutId: string; accountId: string }) {
  if (!input.checkoutId || input.checkoutId === "new" || !input.accountId) {
    return { checkout: null as CheckoutRecord | null }
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from("checkouts")
    .select("id, account_id, name, status, type, config, created_at")
    .eq("id", input.checkoutId)
    .eq("account_id", input.accountId)
    .maybeSingle()

  if (error) {
    return { error: error.message, checkout: null as CheckoutRecord | null }
  }

  return {
    checkout: data ? mapCheckoutRecord(data) : null,
  }
}

export async function deleteCheckoutForAccount(input: { checkoutId: string; accountId: string }) {
  if (!input.checkoutId || !input.accountId) {
    return { error: "Checkout invalido." }
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin
    .from("checkouts")
    .delete()
    .eq("id", input.checkoutId)
    .eq("account_id", input.accountId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function saveCheckoutFromEditor(input: {
  checkoutId: string
  accountId: string
  name: string
  config: EditorCheckoutConfig
}) {
  if (!input.accountId || !input.name.trim()) {
    return { error: "Conta e nome do checkout sao obrigatorios." }
  }

  const supabaseAdmin = getSupabaseAdmin()
  const cleanName = input.name.trim()
  const status = "Ativo"

  let checkoutId = input.checkoutId
  let currentConfig = input.config

  if (checkoutId && checkoutId !== "new") {
    const { error } = await supabaseAdmin
      .from("checkouts")
      .update({
        name: cleanName,
        status,
        type: input.config.selectedWhopAccountId ? "Whop Hosted" : "Custom",
        config: currentConfig,
      })
      .eq("id", checkoutId)
      .eq("account_id", input.accountId)

    if (error) {
      return { error: error.message }
    }
  } else {
    const { data, error } = await supabaseAdmin
      .from("checkouts")
      .insert({
        account_id: input.accountId,
        name: cleanName,
        status,
        type: input.config.selectedWhopAccountId ? "Whop Hosted" : "Custom",
        config: currentConfig,
      })
      .select("id")
      .single()

    if (error || !data) {
      return { error: error?.message || "Nao foi possivel criar o checkout." }
    }

    checkoutId = data.id
  }

  if (!checkoutId) {
    return { error: "Checkout nao encontrado apos o salvamento." }
  }

  let purchaseUrl: string | null = null
  let publishedWhopConfig: EditorCheckoutConfig["whop"] | null = null

  if (input.config.selectedWhopAccountId) {
    const { data: whopAccount, error: whopAccountError } = await supabaseAdmin
      .from("managed_accounts")
      .select("id, whop_key, whop_company_id, whop_checkout_ready")
      .eq("id", input.config.selectedWhopAccountId)
      .single()

    if (whopAccountError || !whopAccount?.whop_key || !whopAccount?.whop_company_id) {
      return {
        error: "A conta Whop selecionada ainda nao esta validada.",
        checkoutId,
      }
    }

    try {
      const { data: selectedDomain } = input.config.selectedDomainId
        ? await supabaseAdmin
            .from("domains")
            .select("host")
            .eq("id", input.config.selectedDomainId)
            .maybeSingle()
        : { data: null }

      const storePreviewResult =
        input.config.selectedStoreId
          ? await loadShopifyStorePreviewForPublishing({
              storeId: input.config.selectedStoreId,
              accountId: input.accountId,
            })
          : { preview: null as null | { amount: number; currency: string; productName: string } }

      const storePreview = storePreviewResult.preview
      if (input.config.selectedStoreId && !hasValidStorePreview(storePreview as ShopifyStorePreview | null)) {
        return {
          error: "Nao foi possivel resolver um produto real da Shopify para publicar este checkout.",
          checkoutId,
        }
      }
      const checkoutAmount =
        storePreview && Number.isFinite(storePreview.amount) && storePreview.amount > 0
          ? storePreview.amount
          : DEFAULT_CHECKOUT_AMOUNT
      const checkoutCurrency = storePreview?.currency ?? input.config.currency
      const checkoutTitle = (storePreview?.productName || cleanName).slice(0, 30)

      const redirectUrl = buildThankYouRedirectUrl(checkoutId, selectedDomain?.host)
      const sourceUrl = selectedDomain?.host
        ? `https://${selectedDomain.host.replace(/^https?:\/\//, "")}`
        : `${getAppBaseUrl()}/app/checkouts/${checkoutId}/editor`
      const client = new Whop({ apiKey: whopAccount.whop_key })
      const checkoutConfiguration = await client.checkoutConfigurations.create({
        redirect_url: redirectUrl,
        source_url: sourceUrl,
        metadata: {
          swipeCheckoutId: checkoutId,
          swipeAccountId: input.accountId,
          swipeCheckoutName: cleanName,
        },
        plan: {
          company_id: whopAccount.whop_company_id,
          currency: normalizeWhopCurrency(checkoutCurrency),
          plan_type: "one_time",
          initial_price: checkoutAmount,
          title: checkoutTitle,
        },
      } as any)

      purchaseUrl = checkoutConfiguration.purchase_url
      publishedWhopConfig = {
        checkoutConfigurationId: checkoutConfiguration.id,
        planId: checkoutConfiguration.plan?.id ?? null,
        purchaseUrl: checkoutConfiguration.purchase_url,
        companyId: checkoutConfiguration.company_id ?? whopAccount.whop_company_id,
        publishedAt: new Date().toISOString(),
        amount: checkoutAmount,
      }
      currentConfig = {
        ...currentConfig,
        whop: publishedWhopConfig,
      }

      const { error: publishError } = await supabaseAdmin
        .from("checkouts")
        .update({
          name: cleanName,
          status,
          type: "Whop Hosted",
          config: currentConfig,
        })
        .eq("id", checkoutId)
        .eq("account_id", input.accountId)

      if (publishError) {
        return { error: publishError.message, checkoutId }
      }
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel publicar o checkout na Whop.",
        checkoutId,
      }
    }
  }

  return {
    success: true,
    checkoutId,
    purchaseUrl,
    whop: publishedWhopConfig,
  }
}

export async function createPublicWhopCheckoutSession(input: {
  checkoutId: string
  accountId: string
  config: EditorCheckoutConfig
  storePreview?: ShopifyStorePreview | null
}) {
  if (!input.config.selectedWhopAccountId) {
    return { whop: input.config.whop ?? null }
  }

  if (input.config.selectedStoreId && !hasValidStorePreview(input.storePreview)) {
    return {
      error: "Nao foi possivel resolver o produto real da Shopify para este checkout.",
      whop: null,
    }
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data: whopAccount, error: whopAccountError } = await supabaseAdmin
    .from("managed_accounts")
    .select("id, whop_key, whop_company_id")
    .eq("id", input.config.selectedWhopAccountId)
    .single()

  if (whopAccountError || !whopAccount?.whop_key || !whopAccount?.whop_company_id) {
    return { error: "A conta Whop selecionada ainda nao esta validada." }
  }

  try {
    const { data: selectedDomain } = input.config.selectedDomainId
      ? await supabaseAdmin
          .from("domains")
          .select("host")
          .eq("id", input.config.selectedDomainId)
          .maybeSingle()
      : { data: null }

    const checkoutAmount =
      input.storePreview && Number.isFinite(input.storePreview.amount) && input.storePreview.amount > 0
        ? input.storePreview.amount
        : DEFAULT_CHECKOUT_AMOUNT
    const checkoutCurrency = input.storePreview?.currency ?? input.config.currency
    const checkoutTitle = (input.storePreview?.productName || "Checkout Swipe").slice(0, 30)
    const redirectUrl = buildThankYouRedirectUrl(input.checkoutId, selectedDomain?.host)
    const sourceUrl = selectedDomain?.host
      ? `https://${selectedDomain.host.replace(/^https?:\/\//, "")}`
      : `${getAppBaseUrl()}/checkout/${input.checkoutId}`

    const client = new Whop({ apiKey: whopAccount.whop_key })
    const checkoutConfiguration = await client.checkoutConfigurations.create({
      redirect_url: redirectUrl,
      source_url: sourceUrl,
      metadata: {
        swipeCheckoutId: input.checkoutId,
        swipeAccountId: input.accountId,
        swipeCheckoutName: checkoutTitle,
      },
      plan: {
        company_id: whopAccount.whop_company_id,
        currency: normalizeWhopCurrency(checkoutCurrency),
        plan_type: "one_time",
        initial_price: checkoutAmount,
        title: checkoutTitle,
      },
    } as any)

    return {
      whop: {
        checkoutConfigurationId: checkoutConfiguration.id,
        planId: checkoutConfiguration.plan?.id ?? null,
        purchaseUrl: checkoutConfiguration.purchase_url,
        companyId: checkoutConfiguration.company_id ?? whopAccount.whop_company_id,
        publishedAt: new Date().toISOString(),
        amount: checkoutAmount,
      },
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel publicar a sessao real da Whop.",
    }
  }
}
