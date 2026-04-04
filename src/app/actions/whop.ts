"use server"

import Whop from "@whop/sdk"

import { getSupabaseAdmin } from "@/lib/supabase"
import { requireServerAppSession } from "@/lib/server-app-session"
import { type ManagedAccount } from "@/lib/account-metrics"
import { SWIPE_MANUAL_STORE_ID } from "@/lib/catalog-products"
import {
  loadShopifyStorePreviewForPublishing,
  loadShopifyVariantPreviewForPublishing,
} from "@/app/actions/shopify"

type EditorCheckoutConfig = {
  companyName?: string
  productName?: string
  productVariantLabel?: string
  productPrice?: number
  currency?: "BRL" | "USD" | "EUR" | "GBP"
  selectedDomainId?: string
  selectedStoreId?: string
  selectedProductId?: string
  selectedVariantId?: string
  selectedWhopAccountId?: string
  whop?: {
    checkoutConfigurationId?: string | null
    planId?: string | null
    purchaseUrl?: string | null
    companyId?: string | null
    publishedAt?: string
    amount?: number
    returnToken?: string | null
    publicSessionSignature?: string | null
    redirectUrl?: string | null
    sourceUrl?: string | null
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

type CheckoutAttribution = {
  source?: string | null
  medium?: string | null
  campaign?: string | null
  content?: string | null
  term?: string | null
  gclid?: string | null
  fbclid?: string | null
  ttclid?: string | null
  referrer?: string | null
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

function hasRealShopifyStoreId(storeId?: string | null) {
  return Boolean(storeId && storeId !== SWIPE_MANUAL_STORE_ID)
}

function resolveConfiguredCheckoutAmount(config: EditorCheckoutConfig) {
  if (Number.isFinite(config.productPrice) && Number(config.productPrice) > 0) {
    return Number(config.productPrice)
  }

  if (Number.isFinite(config.whop?.amount) && Number(config.whop?.amount) > 0) {
    return Number(config.whop?.amount)
  }

  return 0
}

function resolveConfiguredCheckoutTitle(config: EditorCheckoutConfig, fallback: string) {
  return (config.productName?.trim() || fallback).slice(0, 30)
}

function buildThankYouRedirectUrl(
  checkoutId: string,
  domainHost?: string | null,
  query?: Record<string, string | null | undefined>
) {
  const base = domainHost
    ? `https://${domainHost.replace(/^https?:\/\//, "")}`
    : getAppBaseUrl()
  const url = new URL(`/checkout/${checkoutId}/thank-you`, base)

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (typeof value === "string" && value.trim()) {
      url.searchParams.set(key, value)
    }
  })

  return url.toString()
}

function createWhopReturnToken() {
  return crypto.randomUUID()
}

function buildPublicWhopSessionSignature(input: {
  checkoutId: string
  selectedWhopAccountId?: string
  selectedDomainId?: string
  selectedStoreId?: string
  selectedProductId?: string
  selectedVariantId?: string
  shopifyStoreId?: string | null
  shopifyProductId?: string | null
  shopifyVariantId?: string | null
  shopDomain?: string | null
  productName?: string | null
  variantLabel?: string | null
  imageSrc?: string | null
  amount?: number | null
  currency?: string | null
  returnToken?: string | null
  attribution?: CheckoutAttribution | null
}) {
  return JSON.stringify({
    checkoutId: input.checkoutId,
    whopAccountId: input.selectedWhopAccountId ?? null,
    domainId: input.selectedDomainId ?? null,
    storeId: input.shopifyStoreId ?? input.selectedStoreId ?? null,
    productId: input.shopifyProductId ?? input.selectedProductId ?? null,
    variantId: input.shopifyVariantId ?? input.selectedVariantId ?? null,
    shopDomain: input.shopDomain ?? null,
    productName: input.productName ?? null,
    variantLabel: input.variantLabel ?? null,
    imageSrc: input.imageSrc ?? null,
    amount: typeof input.amount === "number" && Number.isFinite(input.amount) ? input.amount : null,
    currency: input.currency ?? null,
    returnToken: input.returnToken ?? null,
    attribution: {
      source: input.attribution?.source ?? null,
      medium: input.attribution?.medium ?? null,
      campaign: input.attribution?.campaign ?? null,
      content: input.attribution?.content ?? null,
      term: input.attribution?.term ?? null,
      gclid: input.attribution?.gclid ?? null,
      fbclid: input.attribution?.fbclid ?? null,
      ttclid: input.attribution?.ttclid ?? null,
      referrer: input.attribution?.referrer ?? null,
    },
  })
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
        events: ["payment.succeeded", "payment.pending", "payment.failed"],
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

async function assertWhopAccountAccess(input: {
  accountId: string
  userId?: string | null
  accessToken?: string | null
}) {
  const supabaseAdmin = getSupabaseAdmin()
  const accessToken = input.accessToken?.trim()
  const actor = accessToken
    ? await (async () => {
        const {
          data: { user },
          error,
        } = await supabaseAdmin.auth.getUser(accessToken)

        if (error || !user) {
          throw new Error("Sessao invalida.")
        }

        if (input.userId && user.id !== input.userId) {
          throw new Error("Sessao invalida.")
        }

        return { userId: user.id }
      })()
    : await requireServerAppSession(input.userId ?? undefined)
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", actor.userId)
    .maybeSingle()

  let accountQuery = supabaseAdmin
    .from("managed_accounts")
    .select("id, profile_id")
    .eq("id", input.accountId)

  if (profile?.role !== "admin") {
    accountQuery = accountQuery.eq("profile_id", actor.userId)
  }

  const { data: account, error } = await accountQuery.maybeSingle()
  if (error || !account) {
    throw new Error("Conta operacional nao encontrada.")
  }

  return {
    actor,
    role: profile?.role === "admin" ? "admin" : "user",
    account,
    supabaseAdmin,
  }
}

export async function loadWhopAccountForSession(input: {
  accountId?: string | null
  userId: string
  accessToken?: string | null
}) {
  const supabaseAdmin = getSupabaseAdmin()
  const accessToken = input.accessToken?.trim()
  const actor = accessToken
    ? await (async () => {
        const {
          data: { user },
          error,
        } = await supabaseAdmin.auth.getUser(accessToken)

        if (error || !user || user.id !== input.userId) {
          throw new Error("Sessao invalida.")
        }

        return { userId: user.id }
      })()
    : await requireServerAppSession(input.userId)

  let resolvedAccountId = input.accountId?.trim() || ""
  if (!resolvedAccountId) {
    const { data: ownAccount } = await supabaseAdmin
      .from("managed_accounts")
      .select("id")
      .eq("profile_id", actor.userId)
      .maybeSingle()

    resolvedAccountId = ownAccount?.id ?? ""
  }

  if (!resolvedAccountId) {
    return { account: null }
  }

  const { account: authorizedAccount } = await assertWhopAccountAccess({
    accountId: resolvedAccountId,
    userId: actor.userId,
    accessToken: input.accessToken,
  })

  const { data: account, error: accountError } = await supabaseAdmin
    .from("managed_accounts")
    .select(
      "id, profile_id, name, whop_key, whop_company_id, whop_integration_status, whop_last_validation, whop_permissions_valid, whop_checkout_ready, whop_webhook_active, whop_environment, billing_cycle_days, payment_mode, settlement_started_at, fee_rate"
    )
    .eq("id", authorizedAccount.id)
    .maybeSingle()

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
  userId?: string | null
  accessToken?: string | null
}) {
  const apiKey = input.apiKey.trim()
  const manualCompanyId = input.companyId?.trim() || null
  if (!input.accountId || !apiKey) {
    return { error: "Conta e API key sao obrigatorias." }
  }

  const { supabaseAdmin } = await assertWhopAccountAccess({
    accountId: input.accountId,
    userId: input.userId,
    accessToken: input.accessToken,
  })

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
        whop_checkout_ready: false,
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
  userId?: string | null
  accessToken?: string | null
}) {
  const apiKey = input.apiKey.trim()
  const companyId = input.companyId?.trim() || null
  if (!input.accountId) {
    return { error: "Conta operacional nao encontrada." }
  }

  const { supabaseAdmin } = await assertWhopAccountAccess({
    accountId: input.accountId,
    userId: input.userId,
    accessToken: input.accessToken,
  })

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

export async function loadCheckoutsForAccount(input: {
  accountId: string
  userId?: string | null
  accessToken?: string | null
}) {
  if (!input.accountId) {
    return { checkouts: [] as CheckoutRecord[] }
  }

  const { supabaseAdmin } = await assertWhopAccountAccess({
    accountId: input.accountId,
    userId: input.userId,
    accessToken: input.accessToken,
  })
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

export async function loadCheckoutForEditor(input: {
  checkoutId: string
  accountId: string
  accessToken?: string | null
}) {
  if (!input.checkoutId || input.checkoutId === "new" || !input.accountId) {
    return { checkout: null as CheckoutRecord | null }
  }

  const { supabaseAdmin } = await assertWhopAccountAccess({
    accountId: input.accountId,
    accessToken: input.accessToken,
  })
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

export async function deleteCheckoutForAccount(input: {
  checkoutId: string
  accountId: string
  userId?: string | null
  accessToken?: string | null
}) {
  if (!input.checkoutId || !input.accountId) {
    return { error: "Checkout invalido." }
  }

  const { supabaseAdmin } = await assertWhopAccountAccess({
    accountId: input.accountId,
    userId: input.userId,
    accessToken: input.accessToken,
  })
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
  accessToken?: string | null
}) {
  if (!input.accountId || !input.name.trim()) {
    return { error: "Conta e nome do checkout sao obrigatorios." }
  }

  const { supabaseAdmin } = await assertWhopAccountAccess({
    accountId: input.accountId,
    accessToken: input.accessToken,
  })
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
        hasRealShopifyStoreId(input.config.selectedStoreId)
          ? await loadShopifyStorePreviewForPublishing({
              storeId: String(input.config.selectedStoreId),
              accountId: input.accountId,
            })
          : { preview: null as null | { amount: number; currency: string; productName: string } }

      const storePreview = storePreviewResult.preview
      if (
        hasRealShopifyStoreId(input.config.selectedStoreId) &&
        !hasValidStorePreview(storePreview as ShopifyStorePreview | null)
      ) {
        return {
          error: "Nao foi possivel resolver um produto real da Shopify para publicar este checkout.",
          checkoutId,
        }
      }

      const checkoutAmount =
        storePreview && Number.isFinite(storePreview.amount) && storePreview.amount > 0
          ? storePreview.amount
          : resolveConfiguredCheckoutAmount(input.config)
      if (!(checkoutAmount > 0)) {
        return {
          error: "Configure um valor real para o produto antes de publicar este checkout.",
          checkoutId,
        }
      }
      const checkoutCurrency = storePreview?.currency ?? input.config.currency
      const checkoutTitle = storePreview?.productName
        ? storePreview.productName.slice(0, 30)
        : resolveConfiguredCheckoutTitle(input.config, cleanName)

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
        returnToken: null,
        redirectUrl,
        sourceUrl,
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

      await supabaseAdmin
        .from("managed_accounts")
        .update({
          whop_checkout_ready: true,
        })
        .eq("id", input.config.selectedWhopAccountId)
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
  requireResolvedStorePreview?: boolean
  shopifyStoreId?: string | null
  shopifyProductId?: string | null
  shopifyVariantId?: string | null
  shopDomain?: string | null
  attribution?: CheckoutAttribution | null
  productName?: string | null
  variantLabel?: string | null
  imageSrc?: string | null
  currency?: string | null
  amount?: number | null
}) {
  if (!input.config.selectedWhopAccountId) {
    return { whop: input.config.whop ?? null }
  }

  if (
    (input.requireResolvedStorePreview || hasRealShopifyStoreId(input.config.selectedStoreId)) &&
    !hasValidStorePreview(input.storePreview)
  ) {
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
        : resolveConfiguredCheckoutAmount(input.config)
    if (!(checkoutAmount > 0)) {
      return {
        error: "Configure um valor real para o produto antes de abrir este checkout.",
      }
    }
    const checkoutCurrency = input.storePreview?.currency ?? input.config.currency
    const checkoutTitle = input.storePreview?.productName
      ? input.storePreview.productName.slice(0, 30)
      : resolveConfiguredCheckoutTitle(input.config, input.config.companyName?.trim() || "Checkout Swipe")
    const returnToken = createWhopReturnToken()
    const redirectUrl = buildThankYouRedirectUrl(input.checkoutId, selectedDomain?.host, {
      return_token: returnToken,
      shop: input.shopDomain || null,
      store:
        input.shopifyStoreId ||
        (hasRealShopifyStoreId(input.config.selectedStoreId)
          ? input.config.selectedStoreId
          : input.config.selectedStoreId || null),
      product: input.shopifyProductId || input.config.selectedProductId || null,
      variant: input.shopifyVariantId || input.config.selectedVariantId || null,
      product_name: input.productName || input.storePreview?.productName || checkoutTitle,
      variant_label:
        input.variantLabel || input.storePreview?.variantLabel || input.config.productVariantLabel || "Variante padrao",
      image: input.imageSrc || input.storePreview?.imageSrc || null,
      amount:
        typeof input.amount === "number" && Number.isFinite(input.amount)
          ? String(input.amount)
          : String(checkoutAmount),
      currency: input.currency || input.storePreview?.currency || checkoutCurrency || null,
      utm_source: input.attribution?.source || null,
      utm_medium: input.attribution?.medium || null,
      utm_campaign: input.attribution?.campaign || null,
      utm_content: input.attribution?.content || null,
      utm_term: input.attribution?.term || null,
      gclid: input.attribution?.gclid || null,
      fbclid: input.attribution?.fbclid || null,
      ttclid: input.attribution?.ttclid || null,
      referrer: input.attribution?.referrer || null,
    })
    const sourceUrl = selectedDomain?.host
      ? `https://${selectedDomain.host.replace(/^https?:\/\//, "")}`
      : `${getAppBaseUrl()}/checkout/${input.checkoutId}`
    const sessionSignature = buildPublicWhopSessionSignature({
      checkoutId: input.checkoutId,
      selectedWhopAccountId: input.config.selectedWhopAccountId,
      selectedDomainId: input.config.selectedDomainId,
      selectedStoreId: input.config.selectedStoreId,
      selectedProductId: input.config.selectedProductId,
      selectedVariantId: input.config.selectedVariantId,
      shopifyStoreId: input.shopifyStoreId,
      shopifyProductId: input.shopifyProductId,
      shopifyVariantId: input.shopifyVariantId,
      shopDomain: input.shopDomain,
      productName: input.productName || input.storePreview?.productName || checkoutTitle,
      variantLabel:
        input.variantLabel ||
        input.storePreview?.variantLabel ||
        input.config.productVariantLabel ||
        "Variante padrao",
      imageSrc: input.imageSrc || input.storePreview?.imageSrc || null,
      amount: checkoutAmount,
      currency: input.currency || input.storePreview?.currency || checkoutCurrency || null,
      returnToken,
      attribution: input.attribution,
    })

    const client = new Whop({ apiKey: whopAccount.whop_key })
    const checkoutConfiguration = await client.checkoutConfigurations.create({
      redirect_url: redirectUrl,
      source_url: sourceUrl,
      metadata: {
        swipeCheckoutId: input.checkoutId,
        swipeAccountId: input.accountId,
        swipeCheckoutName: checkoutTitle,
        swipeStoreId:
          input.shopifyStoreId ||
          (hasRealShopifyStoreId(input.config.selectedStoreId)
            ? input.config.selectedStoreId
            : input.config.selectedStoreId || null),
        swipeProductId: input.shopifyProductId || input.config.selectedProductId || null,
        swipeVariantId: input.shopifyVariantId || input.config.selectedVariantId || null,
        swipeShopDomain: input.shopDomain || null,
        swipeProductName:
          input.productName || input.storePreview?.productName || input.config.productName || checkoutTitle,
        swipeVariantLabel:
          input.variantLabel || input.storePreview?.variantLabel || input.config.productVariantLabel || "Variante padrao",
        swipeProductImage: input.imageSrc || input.storePreview?.imageSrc || null,
        swipeReturnToken: returnToken,
        swipeAmount: checkoutAmount,
        swipeCurrency: checkoutCurrency || null,
        utmSource: input.attribution?.source || null,
        utmMedium: input.attribution?.medium || null,
        utmCampaign: input.attribution?.campaign || null,
        utmContent: input.attribution?.content || null,
        utmTerm: input.attribution?.term || null,
        gclid: input.attribution?.gclid || null,
        fbclid: input.attribution?.fbclid || null,
        ttclid: input.attribution?.ttclid || null,
        referrer: input.attribution?.referrer || null,
        landingUrl: sourceUrl,
      },
      plan: {
        company_id: whopAccount.whop_company_id,
        currency: normalizeWhopCurrency(checkoutCurrency),
        plan_type: "one_time",
        initial_price: checkoutAmount,
        title: checkoutTitle,
      },
    } as any)

    const nextWhopConfig = {
        checkoutConfigurationId: checkoutConfiguration.id,
        planId: checkoutConfiguration.plan?.id ?? null,
        purchaseUrl: checkoutConfiguration.purchase_url,
        companyId: checkoutConfiguration.company_id ?? whopAccount.whop_company_id,
        publishedAt: new Date().toISOString(),
        amount: checkoutAmount,
        returnToken,
        publicSessionSignature: sessionSignature,
        redirectUrl,
        sourceUrl,
      }

    await supabaseAdmin
      .from("checkouts")
      .update({
        config: {
          ...input.config,
          whop: nextWhopConfig,
        },
      })
      .eq("id", input.checkoutId)
      .eq("account_id", input.accountId)

    await supabaseAdmin
      .from("managed_accounts")
      .update({
        whop_checkout_ready: true,
      })
      .eq("id", input.config.selectedWhopAccountId)

    return {
      whop: nextWhopConfig,
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
