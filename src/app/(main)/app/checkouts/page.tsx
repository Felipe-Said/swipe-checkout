"use client"

import * as React from "react"
import {
  CheckCircle2,
  Eye,
  Filter,
  Loader2,
  MoreHorizontal,
  Bell,
  ScanSearch,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import Link from "next/link"

import {
  loadCheckoutPixelConfigsForSession,
  loadCheckoutPushcutConfigsForSession,
  saveCheckoutPixelConfigForSession,
  saveCheckoutPushcutConfigForSession,
} from "@/app/actions/checkout-integrations"
import { deleteCheckoutForAccount, loadCheckoutsForAccount } from "@/app/actions/whop"
import { loadDomainsForSession } from "@/app/actions/domains"
import { getCurrentAppSession } from "@/lib/app-session"
import { type ConnectedDomain } from "@/lib/domain-data"
import { supabase } from "@/lib/supabase"
import { type PushcutCheckoutConfig } from "@/lib/pushcut-data"
import { type CheckoutPixelConfig } from "@/lib/pixels-data"
import { type ConnectedShopifyStore } from "@/lib/shopify-store-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { loadShopifyStoresForSession } from "@/app/actions/shopify"

type CheckoutRow = {
  id: string
  name: string
  status: "Ativo" | "Rascunho" | "Pausado"
  selectedStoreId: string
  selectedDomainId: string
  conversions: string
  total: string
  date: string
}

export default function CheckoutsPage() {
  const [checkouts, setCheckouts] = React.useState<CheckoutRow[]>([])
  const [domains, setDomains] = React.useState<ConnectedDomain[]>([])
  const [stores, setStores] = React.useState<ConnectedShopifyStore[]>([])
  const [pushcutConfigs, setPushcutConfigs] = React.useState<PushcutCheckoutConfig[]>([])
  const [pixelConfigs, setPixelConfigs] = React.useState<CheckoutPixelConfig[]>([])
  const [selectedCheckout, setSelectedCheckout] = React.useState<CheckoutRow | null>(null)
  const [dialogType, setDialogType] = React.useState<"pushcut" | "pixels" | null>(null)
  const [pushcutUrlsValue, setPushcutUrlsValue] = React.useState("")
  const [metaPixelIdsValue, setMetaPixelIdsValue] = React.useState("")
  const [googleAdsIdsValue, setGoogleAdsIdsValue] = React.useState("")
  const [tiktokPixelIdsValue, setTiktokPixelIdsValue] = React.useState("")
  const [trackCampaignSource, setTrackCampaignSource] = React.useState(true)
  const [accountId, setAccountId] = React.useState("")
  const [userId, setUserId] = React.useState("")

  React.useEffect(() => {
    async function load() {
      const session = await getCurrentAppSession()
      setAccountId(session?.accountId ?? "")
      setUserId(session?.userId ?? "")

      if (!session?.accountId) {
        return
      }

      const [domainsResult, storesResult, pushcutResult, pixelsResult] = await Promise.all([
        loadDomainsForSession({
          accountId: session.accountId,
          userId: session.userId,
        }),
        loadShopifyStoresForSession({
          accountId: session.accountId,
          userId: session.userId,
        }),
        loadCheckoutPushcutConfigsForSession({
          accountId: session.accountId,
          userId: session.userId,
        }),
        loadCheckoutPixelConfigsForSession({
          accountId: session.accountId,
          userId: session.userId,
        }),
      ])

      if (!domainsResult.error) {
        setDomains(domainsResult.domains)
      }
      if (!storesResult.error) {
        setStores(storesResult.stores)
      }
      if (!pushcutResult.error) {
        setPushcutConfigs(pushcutResult.configs)
      }
      if (!pixelsResult.error) {
        setPixelConfigs(pixelsResult.configs)
      }

      const { data: orders } = await supabase
        .from("orders")
        .select("checkout_id,total,paid")
        .eq("account_id", session.accountId)

      const result = await loadCheckoutsForAccount({ accountId: session.accountId })
      const nextCheckouts = (result.checkouts || []).map((checkout) => ({
        id: checkout.id,
        name: checkout.name,
        status: normalizeStatus(checkout.status),
        selectedStoreId: String(checkout.config?.selectedStoreId || ""),
        selectedDomainId: String(checkout.config?.selectedDomainId || ""),
        conversions: "0%",
        total: formatCheckoutTotal(
          orders
            ?.filter((order) => order.checkout_id === checkout.id && order.paid !== false)
            .reduce((sum, order) => sum + Number(order.total ?? 0), 0) ?? 0,
          checkout.config?.currency
        ),
        date: formatCheckoutDate(checkout.created_at),
      }))

      setCheckouts(nextCheckouts)
    }

    void load()
  }, [])

  const handleDeleteCheckout = (checkoutId: string) => {
    if (accountId) {
      void deleteCheckoutForAccount({ checkoutId, accountId })
    }

    setCheckouts((currentCheckouts) => currentCheckouts.filter((checkout) => checkout.id !== checkoutId))
  }

  const handleOpenPushcut = (checkout: CheckoutRow) => {
    const existingConfig = pushcutConfigs.find((config) => config.checkoutId === checkout.id)
    setSelectedCheckout(checkout)
    setDialogType("pushcut")
    setPushcutUrlsValue(existingConfig?.webhookUrls.join("\n") ?? "")
  }

  const handleOpenPixels = (checkout: CheckoutRow) => {
    const existingConfig = pixelConfigs.find((config) => config.checkoutId === checkout.id)
    setSelectedCheckout(checkout)
    setDialogType("pixels")
    setMetaPixelIdsValue((existingConfig?.metaPixelIds ?? []).join("\n"))
    setGoogleAdsIdsValue((existingConfig?.googleAdsIds ?? []).join("\n"))
    setTiktokPixelIdsValue((existingConfig?.tiktokPixelIds ?? []).join("\n"))
    setTrackCampaignSource(existingConfig?.trackCampaignSource ?? true)
  }

  const handleSavePushcut = async () => {
    if (!selectedCheckout) {
      return
    }

    const webhookUrls = pushcutUrlsValue
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean)

    if (!accountId || !userId) {
      return
    }

    const result = await saveCheckoutPushcutConfigForSession({
      accountId,
      userId,
      checkoutId: selectedCheckout.id,
      webhookUrls,
    })

    if (result.error || !result.config) {
      return
    }

    setPushcutConfigs((currentConfigs) => {
      const existingIndex = currentConfigs.findIndex((config) => config.checkoutId === selectedCheckout.id)
      if (existingIndex >= 0) {
        const nextConfigs = [...currentConfigs]
        nextConfigs[existingIndex] = result.config
        return nextConfigs
      }

      return [...currentConfigs, result.config]
    })

    handleCloseDialog()
  }

  const handleSavePixels = async () => {
    if (!selectedCheckout) {
      return
    }

    if (!accountId || !userId) {
      return
    }

    const result = await saveCheckoutPixelConfigForSession({
      accountId,
      userId,
      checkoutId: selectedCheckout.id,
      metaPixelIds: parseMultiValueField(metaPixelIdsValue),
      googleAdsIds: parseMultiValueField(googleAdsIdsValue),
      tiktokPixelIds: parseMultiValueField(tiktokPixelIdsValue),
      trackCampaignSource,
    })

    if (result.error || !result.config) {
      return
    }

    setPixelConfigs((currentConfigs) => {
      const existingIndex = currentConfigs.findIndex((config) => config.checkoutId === selectedCheckout.id)
      if (existingIndex >= 0) {
        const nextConfigs = [...currentConfigs]
        nextConfigs[existingIndex] = result.config as CheckoutPixelConfig
        return nextConfigs
      }

      return [...currentConfigs, result.config as CheckoutPixelConfig]
    })

    handleCloseDialog()
  }

  const handleCloseDialog = () => {
    setSelectedCheckout(null)
    setDialogType(null)
    setPushcutUrlsValue("")
    setMetaPixelIdsValue("")
    setGoogleAdsIdsValue("")
    setTiktokPixelIdsValue("")
    setTrackCampaignSource(true)
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">Meus Checkouts</h1>
            <p className="text-muted-foreground">
              Gerencie e otimize seus fluxos de pagamento.
            </p>
          </div>
          <Button asChild>
            <Link href="/app/checkouts/new/editor">
              <Plus className="mr-2 h-4 w-4" /> Criar Checkout
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar checkouts..." className="pl-8" />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Filtros
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Conexoes</TableHead>
                  <TableHead>Conversao</TableHead>
                  <TableHead>Vendas Totais</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[84px] pr-4 text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkouts.map((checkout) => (
                  <TableRow key={checkout.id}>
                    <TableCell className="font-medium">{checkout.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          checkout.status === "Ativo"
                            ? "default"
                            : checkout.status === "Rascunho"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {checkout.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-[280px] text-muted-foreground">
                      <ConnectionsCell
                        store={resolveCheckoutStore(checkout, stores)}
                        domain={resolveCheckoutDomain(checkout, domains)}
                      />
                    </TableCell>
                    <TableCell>{checkout.conversions}</TableCell>
                    <TableCell>{checkout.total}</TableCell>
                    <TableCell>{checkout.date}</TableCell>
                    <TableCell className="w-[84px] pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/app/checkouts/${checkout.id}/editor?mode=preview`}>
                              <Eye className="h-4 w-4" />
                              Visualizar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/app/checkouts/${checkout.id}/editor`}>
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenPushcut(checkout)}>
                            <Bell className="h-4 w-4" />
                            PushCut
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenPixels(checkout)}>
                            <ScanSearch className="h-4 w-4" />
                            Pixels
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteCheckout(checkout.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Apagar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={selectedCheckout !== null} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-md p-4">
          <DialogHeader>
            <DialogTitle>{dialogType === "pixels" ? "Pixels" : "PushCut"}</DialogTitle>
            <DialogDescription>
              {dialogType === "pixels"
                ? "Configure os pixels de anuncios para receber apenas eventos de compra concluida deste checkout."
                : "Configure os links do PushCut para receber notificacoes apenas das vendas deste checkout."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border p-3 text-xs text-muted-foreground">
              Checkout selecionado: <span className="font-medium text-foreground">{selectedCheckout?.name}</span>
            </div>

            {dialogType === "pixels" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="meta-pixel">Meta Pixel</Label>
                  <Textarea
                    id="meta-pixel"
                    rows={4}
                    value={metaPixelIdsValue}
                    onChange={(e) => setMetaPixelIdsValue(e.target.value)}
                    placeholder={"123456789012345\n987654321098765"}
                  />
                  <p className="text-xs text-muted-foreground">Adicione um Pixel ID por linha.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="google-pixel">Google Ads</Label>
                  <Textarea
                    id="google-pixel"
                    rows={4}
                    value={googleAdsIdsValue}
                    onChange={(e) => setGoogleAdsIdsValue(e.target.value)}
                    placeholder={"AW-123456789\nAW-123456789/abcDEFghiJKlMNopQ"}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use um ID por linha. Para conversao de compra, voce pode informar `AW-.../LABEL`.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktok-pixel">TikTok Pixel</Label>
                  <Textarea
                    id="tiktok-pixel"
                    rows={4}
                    value={tiktokPixelIdsValue}
                    onChange={(e) => setTiktokPixelIdsValue(e.target.value)}
                    placeholder={"C1A2B3C4D5E6F7G8\nZ9Y8X7W6V5U4T3S2"}
                  />
                  <p className="text-xs text-muted-foreground">Adicione um Pixel ID por linha.</p>
                </div>
                <div className="flex items-center justify-between rounded-xl border p-3 text-xs">
                  <div>
                    <div className="font-medium text-foreground">Rastrear campanha de origem</div>
                    <div className="text-muted-foreground">
                      Identifica de qual campanha a compra concluida veio antes de enviar os eventos.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={trackCampaignSource}
                    onChange={(e) => setTrackCampaignSource(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
                <div className="space-y-3 rounded-xl border p-3 text-xs">
                  <div className="font-medium">Tutorial de configuracao</div>
                  <div className="space-y-2 text-muted-foreground">
                    <p>1. Cole um ou mais IDs por plataforma para que este checkout dispare eventos reais em todos eles.</p>
                    <p>2. O checkout envia `PageView`, `ViewContent`, `InitiateCheckout` e `Purchase` com valor, moeda e item reais.</p>
                    <p>3. Quando o rastreio de campanha estiver ativo, o checkout preserva `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` e `gclid/fbclid/ttclid`.</p>
                    <p>4. Para Google Ads com conversao de compra, use `AW-.../LABEL` quando houver label especifica.</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pushcut-links">Links do PushCut</Label>
                  <Textarea
                    id="pushcut-links"
                    rows={4}
                    value={pushcutUrlsValue}
                    onChange={(e) => setPushcutUrlsValue(e.target.value)}
                    placeholder={"https://api.pushcut.io/seu-secret/notifications/vendas\nhttps://api.pushcut.io/seu-secret/notifications/checkout-vip"}
                  />
                  <p className="text-xs text-muted-foreground">
                    Adicione um link por linha. Apenas as vendas deste checkout devem disparar para os links salvos aqui.
                  </p>
                </div>

                <div className="space-y-3 rounded-xl border p-3 text-xs">
                  <div className="font-medium">Tutorial de configuracao</div>
                  <div className="space-y-2 text-muted-foreground">
                    <p>1. No Pushcut, crie uma notificacao e copie o webhook URL dela.</p>
                    <p>2. Cole esse link neste checkout para que somente as vendas dele usem esse endpoint.</p>
                    <p>3. Para exibir o valor da venda na notificacao, envie a chamada com JSON e sobrescreva `title` e `text` dinamicamente.</p>
                    <p>4. Um payload de exemplo para a venda pode seguir este formato:</p>
                  </div>
                  <pre className="overflow-x-auto rounded-lg bg-muted p-2 text-[11px] text-foreground">
{`{
  "title": "Nova venda aprovada",
  "text": "Checkout: {{checkout_name}} | Valor: {{sale_total}}",
  "input": "{{order_id}}"
}`}
                  </pre>
                  <p className="text-muted-foreground">
                    O Pushcut aceita disparo por webhook e permite ajustar `title` e `text` por JSON no envio, o que e o caminho certo para mostrar o valor da venda na notificacao do celular.
                  </p>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseDialog}>
                Fechar
              </Button>
              <Button onClick={dialogType === "pixels" ? handleSavePixels : handleSavePushcut}>
                {dialogType === "pixels" ? "Salvar pixels" : "Salvar links"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function resolveCheckoutStore(
  checkout: CheckoutRow,
  stores: ConnectedShopifyStore[]
) {
  if (checkout.selectedStoreId) {
    const selectedStore = stores.find((store) => store.id === checkout.selectedStoreId)
    if (selectedStore) {
      return selectedStore
    }
  }

  return (
    stores.find((store) => store.defaultCheckoutId === checkout.id) ??
    undefined
  )
}

function resolveCheckoutDomain(
  checkout: CheckoutRow,
  domains: ConnectedDomain[]
) {
  if (checkout.selectedDomainId) {
    const selectedDomain = domains.find((domain) => domain.id === checkout.selectedDomainId)
    if (selectedDomain) {
      return selectedDomain
    }
  }

  return (
    domains.find((domain) => domain.checkoutId === checkout.id && domain.isPrimary) ??
    domains.find((domain) => domain.checkoutId === checkout.id) ??
    undefined
  )
}

function normalizeStatus(value: string): "Ativo" | "Rascunho" | "Pausado" {
  if (value === "Pausado") return "Pausado"
  if (value === "Rascunho") return "Rascunho"
  return "Ativo"
}

function parseMultiValueField(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatCheckoutDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value))
}

function formatCheckoutTotal(amount: number, currency: unknown) {
  const normalized =
    currency === "USD" || currency === "EUR" || currency === "GBP" ? currency : "BRL"
  const locale =
    normalized === "USD"
      ? "en-US"
      : normalized === "GBP"
        ? "en-GB"
        : normalized === "EUR"
          ? "de-DE"
          : "pt-BR"

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: normalized,
  }).format(amount)
}

function ConnectionsCell({
  store,
  domain,
}: {
  store?: ConnectedShopifyStore
  domain?: ConnectedDomain
}) {
  const storeConnected = store?.status === "Conectada" || store?.status === "Pronta"
  const domainConnected = domain?.status === "Pronto"

  return (
    <div className="space-y-2 py-1">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-foreground">
          Loja: {store?.name ?? "Nao configurada"}
        </span>
        <ConnectionBadge done={storeConnected} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-foreground">
          Dominio: {domain?.host ?? "Nao configurado"}
        </span>
        <ConnectionBadge done={domainConnected} />
      </div>
    </div>
  )
}

function ConnectionBadge({ done }: { done: boolean }) {
  return (
    <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-medium">
      {done ? (
        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-muted-foreground" />
      )}
      {done ? "Done" : "In Process"}
    </Badge>
  )
}
