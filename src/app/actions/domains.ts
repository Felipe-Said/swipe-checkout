"use server"

import { getSupabaseAdmin } from "@/lib/supabase"
import { requireServerAppSession } from "@/lib/server-app-session"
import type { ConnectedDomain, DomainMode, DomainStatus } from "@/lib/domain-data"

type DomainConfigResponse = {
  configuredBy?: string
  recommendedIPv4?: Array<{ value?: string[] }>
  recommendedCNAME?: Array<{ value?: string }>
  misconfigured?: boolean
}

type ProjectDomainResponse = {
  name?: string
  verified?: boolean
  verification?: Array<{
    type?: string
    domain?: string
    value?: string
    reason?: string
  }>
}

type VerificationRecord = {
  type?: string
  name: string
  value: string
}

type CheckoutOption = {
  id: string
  name: string
}

function getVercelConfig() {
  const token = process.env.VERCEL_API_TOKEN
  const project = process.env.VERCEL_PROJECT_ID_OR_NAME || process.env.VERCEL_PROJECT_ID
  const teamId = process.env.VERCEL_TEAM_ID
  const slug = process.env.VERCEL_TEAM_SLUG

  if (!token || !project) {
    throw new Error(
      "Configure VERCEL_API_TOKEN e VERCEL_PROJECT_ID_OR_NAME para ativar dominios reais."
    )
  }

  return { token, project, teamId, slug }
}

function withVercelQuery(path: string) {
  const { teamId, slug } = getVercelConfig()
  const params = new URLSearchParams()
  if (teamId) params.set("teamId", teamId)
  if (slug) params.set("slug", slug)
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

async function vercelRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { token } = getVercelConfig()
  const response = await fetch(`https://api.vercel.com${withVercelQuery(path)}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  })

  if (!response.ok) {
    let message = "Erro ao comunicar com a Vercel."
    try {
      const body = await response.json()
      message = body.error?.message || body.message || message
    } catch {}
    throw new Error(message)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}

function inferMode(host: string): DomainMode {
  if (host.endsWith(".swipe.com.br")) return "platform"
  const parts = host.split(".")
  return parts.length > 2 ? "custom_subdomain" : "custom_apex"
}

function toRecordName(host: string, mode: DomainMode) {
  if (mode === "platform") {
    return host.split(".")[0] || host
  }

  if (mode === "custom_apex") {
    return "@"
  }

  return host.split(".")[0] || host
}

function mapRealtimeState(input: {
  host: string
  mode: DomainMode
  dbStatus: string | null | undefined
  dbSslStatus: string | null | undefined
  config?: DomainConfigResponse | null
  projectDomain?: ProjectDomainResponse | null
}): {
  status: ConnectedDomain["status"]
  verificationStatus: ConnectedDomain["verificationStatus"]
  sslStatus: ConnectedDomain["sslStatus"]
  ownershipStatus: ConnectedDomain["ownershipStatus"]
  recordType: ConnectedDomain["recordType"]
  recordName: ConnectedDomain["recordName"]
  recordValue: ConnectedDomain["recordValue"]
  verificationRecord?: VerificationRecord
  secondaryRecordValue: string
} {
  const verified = Boolean(input.projectDomain?.verified)
  const hasVerificationFailure = (input.projectDomain?.verification ?? []).some((item) =>
    Boolean(item.reason)
  )
  const misconfigured = Boolean(input.config?.misconfigured)

  const recommendedCname = input.config?.recommendedCNAME?.[0]?.value
  const recommendedIPv4 = input.config?.recommendedIPv4?.[0]?.value?.[0]
  const configuredBy = (input.config?.configuredBy ?? "").toUpperCase()

  const isApex = input.mode === "custom_apex"
  const recordType =
    isApex || configuredBy === "A"
      ? ("A" as const)
      : ("CNAME" as const)
  const recordValue =
    recordType === "A"
      ? recommendedIPv4 || ""
      : recommendedCname || ""
  const verificationItem = (input.projectDomain?.verification ?? []).find(
    (item) => item.type === "TXT" && item.domain && item.value
  )

  let status: DomainStatus = "Verificação pendente"
  if (verified) {
    status = "Pronto"
  } else if (hasVerificationFailure || misconfigured) {
    status = "Atenção"
  } else if ((input.dbStatus ?? "").toLowerCase().includes("falha")) {
    status = "Falha"
  } else {
    status = "Aguardando DNS"
  }

  return {
    status,
    verificationStatus: verified ? "verified" : hasVerificationFailure ? "failed" : "pending",
    sslStatus: verified ? "active" : "pending",
    ownershipStatus: verified ? "verified" : input.mode === "platform" ? "not_required" : "pending",
    recordType,
    recordName: toRecordName(input.host, input.mode),
    recordValue,
    verificationRecord: verificationItem
      ? {
          type: "TXT",
          name: verificationItem.domain ?? "_vercel",
          value: verificationItem.value ?? "",
        }
      : undefined,
    secondaryRecordValue:
      input.mode === "custom_apex" && recordType === "A" ? recommendedCname || "" : "",
  }
}

async function syncDomainRecord(input: {
  id: string
  host: string
  mode: DomainMode
  dbStatus: string | null | undefined
  dbSslStatus: string | null | undefined
}) {
  if (input.mode === "platform") {
    return {
      status: "Pronto" as const,
      verificationStatus: "verified" as const,
      sslStatus: "active" as const,
      ownershipStatus: "not_required" as const,
      recordType: "CNAME" as const,
      recordName: input.host.split(".")[0] || input.host,
      recordValue: "swipe.com.br",
      verificationRecord: undefined,
      secondaryRecordValue: "",
      persistedStatus: "Pronto" as const,
      persistedSslStatus: "Ativo" as const,
    }
  }

  let projectDomain: ProjectDomainResponse | null = null
  let config: DomainConfigResponse | null = null

  try {
    const { project } = getVercelConfig()
    ;[projectDomain, config] = await Promise.all([
      vercelRequest<ProjectDomainResponse>(`/v9/projects/${project}/domains/${input.host}`),
      vercelRequest<DomainConfigResponse>(`/v6/domains/${input.host}/config`),
    ])
  } catch {
    projectDomain = null
    config = null
  }

  const realtime = mapRealtimeState({
    host: input.host,
    mode: input.mode,
    dbStatus: input.dbStatus,
    dbSslStatus: input.dbSslStatus,
    config,
    projectDomain,
  })

  return {
    ...realtime,
    persistedStatus: realtime.status,
    persistedSslStatus: realtime.sslStatus === "active" ? "Ativo" : "Provisionando",
  }
}

async function assertDomainAccess(input: { userId: string; accountId: string }) {
  const actor = await requireServerAppSession(input.userId)
  const supabaseAdmin = getSupabaseAdmin()
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", actor.userId)
    .maybeSingle()

  if (profile?.role === "admin") {
    return { supabaseAdmin, isAdmin: true }
  }

  const { data: account } = await supabaseAdmin
    .from("managed_accounts")
    .select("id")
    .eq("id", input.accountId)
    .eq("profile_id", actor.userId)
    .maybeSingle()

  if (!account) {
    throw new Error("Conta nao encontrada.")
  }

  return { supabaseAdmin, isAdmin: false }
}

export async function loadDomainsForSession(input: {
  userId: string
  accountId: string
}) {
  try {
    const { supabaseAdmin } = await assertDomainAccess(input)

    const { data, error } = await supabaseAdmin
      .from("domains")
      .select(
        `
        id,
        host,
        status,
        ssl_status,
        is_primary,
        checkout_id,
        created_at,
        checkouts (
          name
        )
      `
      )
      .eq("account_id", input.accountId)
      .order("created_at", { ascending: false })

    if (error) {
      return { error: error.message, domains: [] as ConnectedDomain[] }
    }

    const domains = await Promise.all(
      (data ?? []).map(async (domain) => {
        const mode = inferMode(domain.host)
        const realtime = await syncDomainRecord({
          id: domain.id,
          host: domain.host,
          mode,
          dbStatus: domain.status,
          dbSslStatus: domain.ssl_status,
        })

        await supabaseAdmin
          .from("domains")
          .update({
            status: realtime.persistedStatus,
            ssl_status: realtime.persistedSslStatus,
          })
          .eq("id", domain.id)

        return {
          id: domain.id,
          host: domain.host,
          mode,
          checkoutId: domain.checkout_id,
          checkoutName:
            Array.isArray(domain.checkouts) && domain.checkouts[0]?.name
              ? domain.checkouts[0].name
              : (domain.checkouts as { name?: string } | null)?.name || "Desconhecido",
          status: realtime.status,
          verificationStatus: realtime.verificationStatus,
          sslStatus: realtime.sslStatus,
          ownershipStatus: realtime.ownershipStatus,
          recordType: realtime.recordType,
          recordName: realtime.recordName,
          recordValue: realtime.recordValue,
          verificationRecordType: realtime.verificationRecord?.type as "TXT" | undefined,
          verificationRecordName: realtime.verificationRecord?.name,
          verificationRecordValue: realtime.verificationRecord?.value,
          secondaryRecordType:
            mode === "custom_apex" && realtime.secondaryRecordValue ? ("CNAME" as const) : undefined,
          secondaryRecordName:
            mode === "custom_apex" && realtime.secondaryRecordValue ? "www" : undefined,
          secondaryRecordValue: realtime.secondaryRecordValue || undefined,
          isPrimary: Boolean(domain.is_primary),
          lastChecked: new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date()),
        } satisfies ConnectedDomain
      })
    )

    return { domains }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel carregar os dominios.",
      domains: [] as ConnectedDomain[],
    }
  }
}

export async function loadCheckoutOptionsForDomainSession(input: {
  userId: string
  accountId: string
}) {
  try {
    const { supabaseAdmin } = await assertDomainAccess(input)

    const { data, error } = await supabaseAdmin
      .from("checkouts")
      .select("id, name")
      .eq("account_id", input.accountId)
      .order("created_at", { ascending: false })

    if (error) {
      return { error: error.message, checkouts: [] as CheckoutOption[] }
    }

    return {
      checkouts: (data ?? []).map((item) => ({
        id: item.id,
        name: item.name || "Checkout sem nome",
      })),
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel carregar os checkouts.",
      checkouts: [] as CheckoutOption[],
    }
  }
}

export async function addDomainForSession(input: {
  userId: string
  accountId: string
  host: string
  checkoutId: string
  isPrimary: boolean
}) {
  try {
    const { supabaseAdmin } = await assertDomainAccess(input)

    const mode = inferMode(input.host)
    if (mode !== "platform") {
      const { project } = getVercelConfig()

      await vercelRequest(`/v9/projects/${project}/domains`, {
        method: "POST",
        body: JSON.stringify({ name: input.host }),
      })
    }

    const realtime = await syncDomainRecord({
      id: "",
      host: input.host,
      mode,
      dbStatus: null,
      dbSslStatus: null,
    })

    if (input.isPrimary) {
      await supabaseAdmin
        .from("domains")
        .update({ is_primary: false })
        .eq("account_id", input.accountId)
    }

    const { error } = await supabaseAdmin.from("domains").insert({
      account_id: input.accountId,
      host: input.host,
      status: realtime.persistedStatus,
      ssl_status: realtime.persistedSslStatus,
      is_primary: input.isPrimary,
      checkout_id: input.checkoutId,
    })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      setup: {
        mode,
        recordType: realtime.recordType,
        recordName: realtime.recordName,
        recordValue: realtime.recordValue,
        verificationRecordType: realtime.verificationRecord?.type as "TXT" | undefined,
        verificationRecordName: realtime.verificationRecord?.name,
        verificationRecordValue: realtime.verificationRecord?.value,
        secondaryRecordType:
          mode === "custom_apex" ? ("CNAME" as const) : undefined,
        secondaryRecordName:
          mode === "custom_apex" ? "www" : undefined,
        secondaryRecordValue:
          mode === "custom_apex"
            ? realtime.secondaryRecordValue || "cname.vercel-dns-0.com"
            : undefined,
      },
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel adicionar o dominio.",
    }
  }
}

export async function refreshDomainForSession(input: {
  userId: string
  accountId: string
  domainId: string
}) {
  try {
    const { supabaseAdmin } = await assertDomainAccess(input)
    const { project } = getVercelConfig()

    const { data: domain, error } = await supabaseAdmin
      .from("domains")
      .select("id, host, status, ssl_status")
      .eq("id", input.domainId)
      .eq("account_id", input.accountId)
      .maybeSingle()

    if (error || !domain) {
      throw new Error("Dominio nao encontrado.")
    }

    if (inferMode(domain.host) !== "platform") {
      await vercelRequest(`/v9/projects/${project}/domains/${domain.host}/verify`, {
        method: "POST",
      })
    }

    const realtime = await syncDomainRecord({
      id: domain.id,
      host: domain.host,
      mode: inferMode(domain.host),
      dbStatus: domain.status,
      dbSslStatus: domain.ssl_status,
    })

    await supabaseAdmin
      .from("domains")
      .update({
        status: realtime.persistedStatus,
        ssl_status: realtime.persistedSslStatus,
      })
      .eq("id", input.domainId)

    return { success: true }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel atualizar o dominio.",
    }
  }
}

export async function deleteDomainForSession(input: {
  userId: string
  accountId: string
  domainId: string
}) {
  try {
    const { supabaseAdmin } = await assertDomainAccess(input)

    const { data: domain, error } = await supabaseAdmin
      .from("domains")
      .select("host")
      .eq("id", input.domainId)
      .eq("account_id", input.accountId)
      .maybeSingle()

    if (error || !domain) {
      throw new Error("Dominio nao encontrado.")
    }

    if (inferMode(domain.host) !== "platform") {
      const { project } = getVercelConfig()
      await vercelRequest(`/v9/projects/${project}/domains/${domain.host}`, {
        method: "DELETE",
      })
    }

    const { error: deleteError } = await supabaseAdmin
      .from("domains")
      .delete()
      .eq("id", input.domainId)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    return { success: true }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel remover o dominio.",
    }
  }
}

export async function setPrimaryDomainForSession(input: {
  userId: string
  accountId: string
  domainId: string
}) {
  try {
    const { supabaseAdmin } = await assertDomainAccess(input)

    const { error: clearError } = await supabaseAdmin
      .from("domains")
      .update({ is_primary: false })
      .eq("account_id", input.accountId)

    if (clearError) {
      throw new Error(clearError.message)
    }

    const { error } = await supabaseAdmin
      .from("domains")
      .update({ is_primary: true })
      .eq("id", input.domainId)
      .eq("account_id", input.accountId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Nao foi possivel definir o dominio principal.",
    }
  }
}
