export type DomainStatus =
  | "Pronto"
  | "Aguardando DNS"
  | "Verificação pendente"
  | "Emitindo SSL"
  | "Atenção"
  | "Falha"

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
  verificationRecordType?: "TXT"
  verificationRecordName?: string
  verificationRecordValue?: string
  secondaryRecordType?: "CNAME"
  secondaryRecordName?: string
  secondaryRecordValue?: string
  isPrimary: boolean
  lastChecked: string
}
