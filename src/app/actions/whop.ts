"use server"

import Whop from "@whop/sdk"

import { getSupabaseAdmin } from "@/lib/supabase"

const DEFAULT_CHECKOUT_AMOUNT = 1250

type EditorCheckoutConfig = {
  companyName?: string
  currency?: "BRL" | "USD" | "EUR" | "GBP"
  selectedDomainId?: string
  selectedStoreId?: string
  selectedWhopAccountId?: string
  [key: string]: unknown
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

      const redirectUrl = buildThankYouRedirectUrl(checkoutId, selectedDomain?.host)
      const client = new Whop({ apiKey: whopAccount.whop_key })
      const checkoutConfiguration = await client.checkoutConfigurations.create({
        redirect_url: redirectUrl,
        source_url: redirectUrl,
        metadata: {
          swipeCheckoutId: checkoutId,
          swipeAccountId: input.accountId,
          swipeCheckoutName: cleanName,
        },
        plan: {
          company_id: whopAccount.whop_company_id,
          currency: normalizeWhopCurrency(input.config.currency),
          plan_type: "one_time",
          release_method: "buy_now",
          initial_price: DEFAULT_CHECKOUT_AMOUNT,
          renewal_price: 0,
          visibility: "hidden",
          title: cleanName.slice(0, 30),
          product: {
            external_identifier: `swipe-checkout:${checkoutId}`,
            title: cleanName.slice(0, 40),
            description: `${cleanName} publicado pelo Swipe.`,
            headline: cleanName.slice(0, 80),
            redirect_purchase_url: redirectUrl,
            visibility: "hidden",
          },
        },
      } as any)

      purchaseUrl = checkoutConfiguration.purchase_url
      currentConfig = {
        ...currentConfig,
        whop: {
          checkoutConfigurationId: checkoutConfiguration.id,
          planId: checkoutConfiguration.plan?.id ?? null,
          purchaseUrl: checkoutConfiguration.purchase_url,
          companyId: checkoutConfiguration.company_id,
          publishedAt: new Date().toISOString(),
          amount: DEFAULT_CHECKOUT_AMOUNT,
        },
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
  }
}
