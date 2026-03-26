import { supabase } from "./supabase"

export type DomainStatus = "Pronto" | "Aguardando DNS" | "Verificação pendente" | "Emitindo SSL" | "Atenção" | "Falha"
export type DomainMode = "platform" | "custom_subdomain" | "custom_apex"

export type ConnectedDomain = {
  id: string
  host: string
  mode: DomainMode
  checkoutId: string
  checkoutName: string
  status: DomainStatus
  verificationStatus: "verified" | "pending" | "failed"
  sslStatus: "active" | "pending" | "failed"
  ownershipStatus: "not_required" | "pending" | "verified"
  recordType: "A" | "CNAME" | "NS" | "TXT"
  recordName: string
  recordValue: string
  isPrimary: boolean
  lastChecked: string
}

export async function getConnectedDomains(accountId: string): Promise<ConnectedDomain[]> {
  const { data, error } = await supabase
    .from('domains')
    .select(`
      *,
      checkouts (
        name
      )
    `)
    .eq('account_id', accountId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching domains:', error)
    return []
  }

  return (data || []).map(mapDbToDomain)
}

export async function addDomain(domain: Partial<ConnectedDomain> & { account_id: string }) {
  const { error } = await supabase
    .from('domains')
    .insert({
      account_id: domain.account_id,
      host: domain.host,
      status: domain.status,
      ssl_status: domain.sslStatus === 'active' ? 'Ativo' : 'Provisionando',
      is_primary: domain.isPrimary,
      checkout_id: domain.checkoutId
    })

  if (error) throw error
}

export async function deleteDomain(id: string) {
  const { error } = await supabase
    .from('domains')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function setPrimaryDomain(accountId: string, id: string) {
  const { error: clearError } = await supabase
    .from("domains")
    .update({ is_primary: false })
    .eq("account_id", accountId)

  if (clearError) throw clearError

  const { error } = await supabase
    .from("domains")
    .update({ is_primary: true })
    .eq("id", id)

  if (error) throw error
}

function mapDbToDomain(db: any): ConnectedDomain {
  const setup = getDomainSetup(db.host, inferMode(db.host))
  return {
    id: db.id,
    host: db.host,
    mode: inferMode(db.host),
    checkoutId: db.checkout_id,
    checkoutName: db.checkouts?.name || "Desconhecido",
    status: db.status as DomainStatus,
    verificationStatus: (db.status === "Pronto" ? "verified" : "pending") as any,
    sslStatus: (db.ssl_status === "Ativo" ? "active" : "pending") as any,
    ownershipStatus: "not_required",
    recordType: setup.recordType as any,
    recordName: setup.recordName as any,
    recordValue: setup.recordValue as any,
    isPrimary: db.is_primary,
    lastChecked: db.created_at
  }
}

function inferMode(host: string): DomainMode {
  if (host.endsWith('.swipe.com.br')) return 'platform'
  const parts = host.split('.')
  return parts.length > 2 ? 'custom_subdomain' : 'custom_apex'
}

export function getDomainSetup(host: string, mode: DomainMode): Partial<ConnectedDomain> {
  if (mode === "platform") {
    return {
      recordType: "CNAME",
      recordName: host.split(".")[0],
      recordValue: "nodes.swipe.vercel.app",
      verificationStatus: "verified",
      sslStatus: "active",
      status: "Pronto",
    }
  }

  if (mode === "custom_apex") {
    return {
      recordType: "A",
      recordName: "@",
      recordValue: "76.76.21.21",
      verificationStatus: "pending",
      sslStatus: "pending",
      status: "Aguardando DNS",
    }
  }

  return {
    recordType: "CNAME",
    recordName: host.split(".")[0] || "checkout",
    recordValue: "cname.vercel-dns-0.com",
    verificationStatus: "pending",
    sslStatus: "pending",
    status: "Aguardando DNS",
  }
}

export async function getCheckouts(accountId: string) {
  const { data, error } = await supabase
    .from('checkouts')
    .select('*')
    .eq('account_id', accountId)

  if (error) {
    console.error('Error fetching checkouts:', error)
    return []
  }

  return data || []
}

// Legacy exports
export function readConnectedDomains(): ConnectedDomain[] { return [] }
export function writeConnectedDomains(domains: ConnectedDomain[]) {}
