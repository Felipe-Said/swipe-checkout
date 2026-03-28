import { getSupabaseAdmin } from "@/lib/supabase"

type PushcutNotificationInput = {
  accountId: string
  checkoutId: string | null
  checkoutName: string | null
  orderId: string
  customerName: string
  amount: number
  currency: string
  status: "Pago" | "Pendente" | "Falha"
  sourceUrl?: string | null
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(amount)
  } catch {
    return `${currency || "BRL"} ${amount.toFixed(2)}`
  }
}

function buildNotificationCopy(input: PushcutNotificationInput) {
  const checkoutLabel = input.checkoutName || "Checkout Swipe"
  const customerLabel = input.customerName || "Cliente"
  const amountLabel = formatMoney(input.amount, input.currency)

  switch (input.status) {
    case "Pago":
      return {
        title: "Nova venda aprovada",
        text: `${checkoutLabel}: ${amountLabel} - ${customerLabel}`,
      }
    case "Pendente":
      return {
        title: "Pagamento pendente",
        text: `${checkoutLabel}: ${amountLabel} - ${customerLabel}`,
      }
    default:
      return {
        title: "Pagamento falhou",
        text: `${checkoutLabel}: ${amountLabel} - ${customerLabel}`,
      }
  }
}

export async function sendPushcutNotificationsForCheckout(input: PushcutNotificationInput) {
  if (!input.checkoutId) {
    return { success: false as const, skipped: "missing_checkout" as const }
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data: config, error } = await supabaseAdmin
    .from("checkout_pushcut_configs")
    .select("webhook_urls")
    .eq("checkout_id", input.checkoutId)
    .maybeSingle()

  if (error) {
    return { success: false as const, skipped: "config_error" as const, error: error.message }
  }

  const webhookUrls = Array.isArray(config?.webhook_urls)
    ? config.webhook_urls.map((value) => String(value ?? "").trim()).filter(Boolean)
    : []

  if (!webhookUrls.length) {
    return { success: false as const, skipped: "no_urls" as const }
  }

  const copy = buildNotificationCopy(input)
  const payload = {
    title: copy.title,
    text: copy.text,
    input: input.sourceUrl || "",
    source: "Swipe",
    status: input.status,
    orderId: input.orderId,
    checkoutId: input.checkoutId,
    accountId: input.accountId,
    customerName: input.customerName,
    amount: input.amount,
    currency: input.currency,
    checkoutName: input.checkoutName,
    sourceUrl: input.sourceUrl || null,
  }

  const results = await Promise.allSettled(
    webhookUrls.map(async (url) => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Pushcut respondeu ${response.status}`)
      }
    })
  )

  const failures = results.filter((result) => result.status === "rejected")
  if (failures.length === results.length) {
    return {
      success: false as const,
      skipped: "all_failed" as const,
      error: failures
        .map((result) => (result.status === "rejected" ? String(result.reason) : ""))
        .filter(Boolean)
        .join("; "),
    }
  }

  return {
    success: true as const,
    delivered: results.length - failures.length,
    failed: failures.length,
  }
}
