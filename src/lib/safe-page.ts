export type SafePageMember = {
  id: string
  name: string
  accessEmail: string
  deliveredAt: string
  status: "delivered"
  source: "members_access"
  logoUrl?: string
}

type MemberSeed = {
  id: string
  customerName?: string | null
  date?: string | null
}

export function normalizeSafePageHost(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
}

function slugifySegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function resolveMemberEmailDomain(domainHost?: string | null) {
  const normalized = domainHost ? normalizeSafePageHost(domainHost) : ""
  return normalized || "safepage.members"
}

const SAFE_PAGE_FIRST_NAMES = [
  "Oliver",
  "George",
  "Harry",
  "Jack",
  "Noah",
  "Charlie",
  "Theo",
  "Arthur",
  "Henry",
  "Freddie",
  "Amelia",
  "Olivia",
  "Isla",
  "Sophia",
  "Lily",
  "Emily",
  "Grace",
  "Ella",
  "Ava",
  "Chloe",
  "James",
  "William",
  "Benjamin",
  "Lucas",
  "Mason",
  "Logan",
  "Ethan",
  "Daniel",
  "Samuel",
  "Alexander",
  "Charlotte",
  "Mia",
  "Harper",
  "Evelyn",
  "Abigail",
  "Scarlett",
  "Hannah",
  "Victoria",
  "Sophie",
  "Lucy",
]

const SAFE_PAGE_LAST_NAMES = [
  "Bennett",
  "Thompson",
  "Carter",
  "Reed",
  "Foster",
  "Morgan",
  "Parker",
  "Turner",
  "Brooks",
  "Hayes",
  "Collins",
  "Walker",
  "Murphy",
  "Sullivan",
  "Cooper",
  "Mitchell",
  "Campbell",
  "Roberts",
  "Howard",
  "Bailey",
  "Ward",
  "Peterson",
  "Richardson",
  "Bell",
  "Gray",
  "Powell",
  "Watson",
  "Hughes",
  "Price",
  "Long",
]

function buildDemoMemberName(index: number) {
  const firstName = SAFE_PAGE_FIRST_NAMES[index % SAFE_PAGE_FIRST_NAMES.length]
  const lastName =
    SAFE_PAGE_LAST_NAMES[(index * 3 + 7) % SAFE_PAGE_LAST_NAMES.length]

  return `${firstName} ${lastName}`
}

function buildDemoDeliveredAt(index: number) {
  const now = new Date()
  const daysAgo = index % 7
  const hoursAgo = (index * 5) % 24
  const minutesAgo = (index * 17) % 60
  const deliveredDate = new Date(now)

  deliveredDate.setDate(now.getDate() - daysAgo)
  deliveredDate.setHours(Math.max(8, 20 - hoursAgo), minutesAgo, 0, 0)

  return formatDeliveredAt(deliveredDate.toISOString())
}

function formatDeliveredAt(value?: string | null) {
  const date = value ? new Date(value) : new Date()
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

export function buildSafePageMembers(input: {
  orders: MemberSeed[]
  businessName: string
  domainHost?: string | null
  demoClientCount: number
  logoUrl?: string | null
}) {
  const emailDomain = resolveMemberEmailDomain(input.domainHost)

  if (input.orders.length > 0) {
    return input.orders.map((order, index) => {
      const displayName = order.customerName?.trim() || `Cliente ${index + 1}`
      const localPart = slugifySegment(displayName) || `cliente-${index + 1}`

      return {
        id: order.id,
        name: displayName,
        accessEmail: `${localPart}@${emailDomain}`,
        deliveredAt: formatDeliveredAt(order.date),
        status: "delivered" as const,
        source: "members_access" as const,
        logoUrl: input.logoUrl ?? undefined,
      }
    })
  }

  const total = Math.max(0, Math.min(5000, Math.trunc(input.demoClientCount || 0)))
  const businessSlug = slugifySegment(input.businessName) || "negocio"

  return Array.from({ length: total }, (_, index) => {
    const position = index + 1
    const displayName = buildDemoMemberName(index)
    const localPart = slugifySegment(displayName) || `${businessSlug}-${position.toString().padStart(3, "0")}`

    return {
      id: `demo-${position}`,
      name: displayName,
      accessEmail: `${localPart}@${emailDomain}`,
      deliveredAt: buildDemoDeliveredAt(index),
      status: "delivered" as const,
      source: "members_access" as const,
      logoUrl: input.logoUrl ?? undefined,
    }
  })
}

export function buildSafePageCsv(input: {
  businessName: string
  areaUrl: string
  logoUrl?: string | null
  members: SafePageMember[]
}) {
  const rows = [
    [
      "business_name",
      "member_name",
      "access_email",
      "delivery_status",
      "delivered_at",
      "members_area_url",
      "logo_url",
      "source",
    ],
    ...input.members.map((member) => [
      input.businessName,
      member.name,
      member.accessEmail,
      member.status,
      member.deliveredAt,
      input.areaUrl,
      input.logoUrl || member.logoUrl || "",
      member.source,
    ]),
  ]

  return rows
    .map((columns) =>
      columns
        .map((column) => `"${String(column ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n")
}
