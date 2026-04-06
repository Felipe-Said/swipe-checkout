"use server"

import { getSupabaseAdmin } from "@/lib/supabase"
import { requireServerAppSessionOrAccessToken } from "@/lib/server-app-session"
import {
  buildSafePageCsv,
  buildSafePageMembers,
  normalizeSafePageHost,
} from "@/lib/safe-page"

type SafePageState = {
  id?: string
  accountId: string
  businessName: string
  domainHost: string
  domainStatus: "none" | "pending" | "verified" | "attention"
  sslStatus: "inactive" | "pending" | "active"
  logoUrl: string
  hasSales: boolean
  salesCount: number
  demoClientCount: number
  membersPreview: ReturnType<typeof buildSafePageMembers>
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

async function assertSafePageAccess(input: {
  userId: string
  accountId: string
  accessToken?: string | null
}) {
  const actor = await requireServerAppSessionOrAccessToken(input)
  const supabaseAdmin = getSupabaseAdmin()
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", actor.userId)
    .maybeSingle()

  if (profile?.role === "admin") {
    return { supabaseAdmin, isAdmin: true, actorUserId: actor.userId }
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

  return { supabaseAdmin, isAdmin: false, actorUserId: actor.userId }
}

async function loadSafePageDomainStatus(domainHost?: string | null) {
  if (!domainHost) {
    return {
      domainStatus: "none" as const,
      sslStatus: "inactive" as const,
    }
  }

  try {
    const { project } = getVercelConfig()
    const domain = await vercelRequest<{
      verified?: boolean
      verification?: Array<{ reason?: string }>
    }>(`/v9/projects/${project}/domains/${domainHost}`)

    const hasFailure = Boolean((domain.verification ?? []).some((item) => item.reason))
    return {
      domainStatus: domain.verified
        ? ("verified" as const)
        : hasFailure
          ? ("attention" as const)
          : ("pending" as const),
      sslStatus: domain.verified ? ("active" as const) : ("pending" as const),
    }
  } catch {
    return {
      domainStatus: "attention" as const,
      sslStatus: "pending" as const,
    }
  }
}

async function loadSafePageSnapshot(input: {
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>
  accountId: string
}) {
  const { supabaseAdmin, accountId } = input

  const [{ data: safePage }, { data: account }, { data: profile }, { data: orders }] =
    await Promise.all([
      supabaseAdmin
        .from("safe_pages")
        .select("id, business_name, domain_host, demo_client_count")
        .eq("account_id", accountId)
        .maybeSingle(),
      supabaseAdmin
        .from("managed_accounts")
        .select("id, name, profile_id")
        .eq("id", accountId)
        .single(),
      supabaseAdmin
        .from("managed_accounts")
        .select("profile_id")
        .eq("id", accountId)
        .single()
        .then(async ({ data }) => {
          if (!data?.profile_id) return { data: null }
          return supabaseAdmin
            .from("profiles")
            .select("photo_url, name")
            .eq("id", data.profile_id)
            .maybeSingle()
        }),
      supabaseAdmin
        .from("orders")
        .select("id, customer_name, date")
        .eq("account_id", accountId)
        .eq("status", "Pago")
        .order("date", { ascending: false })
        .limit(250),
    ])

  const businessName =
    safePage?.business_name?.trim() || account?.name?.trim() || profile?.name?.trim() || "Atelier do Sabor"
  const domainHost = safePage?.domain_host?.trim() || ""
  const logoUrl = profile?.photo_url?.trim() || ""
  const demoClientCount = Number(safePage?.demo_client_count ?? 0)
  const membersPreview = buildSafePageMembers({
    orders: orders ?? [],
    businessName,
    domainHost,
    demoClientCount,
    logoUrl,
  })
  const domainHealth = await loadSafePageDomainStatus(domainHost)

  return {
    id: safePage?.id,
    accountId,
    businessName,
    domainHost,
    domainStatus: domainHealth.domainStatus,
    sslStatus: domainHealth.sslStatus,
    logoUrl,
    hasSales: (orders?.length ?? 0) > 0,
    salesCount: orders?.length ?? 0,
    demoClientCount,
    membersPreview,
  } satisfies SafePageState
}

export async function loadSafePageForSession(input: {
  userId: string
  accountId: string
  accessToken?: string | null
}) {
  try {
    const { supabaseAdmin } = await assertSafePageAccess(input)
    return {
      safePage: await loadSafePageSnapshot({
        supabaseAdmin,
        accountId: input.accountId,
      }),
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel carregar a Safe Page.",
      safePage: null,
    }
  }
}

export async function saveSafePageSettingsForSession(input: {
  userId: string
  accountId: string
  businessName: string
  demoClientCount: number
  accessToken?: string | null
}) {
  try {
    const { supabaseAdmin } = await assertSafePageAccess(input)
    const businessName = input.businessName.trim()

    if (!businessName) {
      return { error: "Informe o nome do negocio." }
    }

    const demoClientCount = Math.max(0, Math.min(5000, Math.trunc(input.demoClientCount || 0)))

    const { error } = await supabaseAdmin.from("safe_pages").upsert(
      {
        account_id: input.accountId,
        business_name: businessName,
        demo_client_count: demoClientCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "account_id" }
    )

    if (error) {
      return { error: error.message }
    }

    return {
      success: true,
      safePage: await loadSafePageSnapshot({ supabaseAdmin, accountId: input.accountId }),
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel salvar a Safe Page.",
    }
  }
}

export async function addSafePageDomainForSession(input: {
  userId: string
  accountId: string
  host: string
  accessToken?: string | null
}) {
  try {
    const { supabaseAdmin } = await assertSafePageAccess(input)
    const host = normalizeSafePageHost(input.host)

    if (!host) {
      return { error: "Informe um dominio valido." }
    }

    const { project } = getVercelConfig()
    await vercelRequest(`/v9/projects/${project}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: host }),
    })

    const { error } = await supabaseAdmin.from("safe_pages").upsert(
      {
        account_id: input.accountId,
        domain_host: host,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "account_id" }
    )

    if (error) {
      return { error: error.message }
    }

    return {
      success: true,
      safePage: await loadSafePageSnapshot({ supabaseAdmin, accountId: input.accountId }),
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel adicionar o dominio da Safe Page.",
    }
  }
}

export async function refreshSafePageDomainForSession(input: {
  userId: string
  accountId: string
  accessToken?: string | null
}) {
  try {
    const { supabaseAdmin } = await assertSafePageAccess(input)
    const snapshot = await loadSafePageSnapshot({ supabaseAdmin, accountId: input.accountId })

    if (!snapshot.domainHost) {
      return { error: "Nenhum dominio configurado na Safe Page." }
    }

    const { project } = getVercelConfig()
    await vercelRequest(`/v9/projects/${project}/domains/${snapshot.domainHost}/verify`, {
      method: "POST",
    })

    return {
      success: true,
      safePage: await loadSafePageSnapshot({ supabaseAdmin, accountId: input.accountId }),
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel atualizar o dominio da Safe Page.",
    }
  }
}

export async function removeSafePageDomainForSession(input: {
  userId: string
  accountId: string
  accessToken?: string | null
}) {
  try {
    const { supabaseAdmin } = await assertSafePageAccess(input)
    const snapshot = await loadSafePageSnapshot({ supabaseAdmin, accountId: input.accountId })

    if (snapshot.domainHost) {
      const { project } = getVercelConfig()
      await vercelRequest(`/v9/projects/${project}/domains/${snapshot.domainHost}`, {
        method: "DELETE",
      })
    }

    const { error } = await supabaseAdmin
      .from("safe_pages")
      .update({
        domain_host: null,
        updated_at: new Date().toISOString(),
      })
      .eq("account_id", input.accountId)

    if (error) {
      return { error: error.message }
    }

    return {
      success: true,
      safePage: await loadSafePageSnapshot({ supabaseAdmin, accountId: input.accountId }),
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel remover o dominio da Safe Page.",
    }
  }
}

export async function exportSafePageCsvForSession(input: {
  userId: string
  accountId: string
  businessName?: string
  demoClientCount?: number
  accessToken?: string | null
}) {
  try {
    const { supabaseAdmin } = await assertSafePageAccess(input)
    const snapshot = await loadSafePageSnapshot({ supabaseAdmin, accountId: input.accountId })
    const businessName = input.businessName?.trim() || snapshot.businessName
    const demoClientCount = snapshot.hasSales
      ? snapshot.demoClientCount
      : Math.max(0, Math.min(5000, Math.trunc(input.demoClientCount ?? snapshot.demoClientCount)))
    const { data: realOrders } = snapshot.hasSales
      ? await supabaseAdmin
          .from("orders")
          .select("id, customer_name, date")
          .eq("account_id", input.accountId)
          .eq("status", "Pago")
          .order("date", { ascending: false })
          .limit(250)
      : { data: [] }

    const members = buildSafePageMembers({
      orders: snapshot.hasSales ? realOrders ?? [] : [],
      businessName,
      domainHost: snapshot.domainHost,
      demoClientCount,
      logoUrl: snapshot.logoUrl,
    })

    const areaUrl = snapshot.domainHost
      ? `https://${snapshot.domainHost}`
      : "https://swipe-checkout.vercel.app"

    return {
      success: true,
      filename: `${normalizeSafePageHost(businessName).replace(/\./g, "-") || "safe-page"}-members.csv`,
      csv: buildSafePageCsv({
        businessName,
        areaUrl,
        logoUrl: snapshot.logoUrl,
        members,
      }),
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nao foi possivel exportar o CSV da Safe Page.",
    }
  }
}

export async function loadSafePageByHost(host: string) {
  const normalizedHost = normalizeSafePageHost(host)
  if (!normalizedHost) return { safePage: null }

  const supabaseAdmin = getSupabaseAdmin()
  const { data: safePage } = await supabaseAdmin
    .from("safe_pages")
    .select("account_id")
    .eq("domain_host", normalizedHost)
    .maybeSingle()

  if (!safePage?.account_id) {
    return { safePage: null }
  }

  return {
    safePage: await loadSafePageSnapshot({
      supabaseAdmin,
      accountId: safePage.account_id,
    }),
  }
}
