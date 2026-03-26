"use client"

import * as React from "react"
import { Plus, Search, LayoutGrid, Filter } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  addConnectedShopifyStore,
  deleteConnectedShopifyStore,
  getConnectedShopifyStores,
  normalizeShopDomain,
  updateConnectedShopifyStore,
  type ConnectedShopifyStore,
} from "@/lib/shopify-store-data"
import { getCurrentAppSession } from "@/lib/app-session"

import { ShopifyIntegrationHeader } from "@/components/shopify/shopify-integration-header"
import { ShopifyConnectionWizard, ShopifyStep } from "@/components/shopify/shopify-connection-wizard"
import { ShopifyConnectionForm } from "@/components/shopify/shopify-connection-form"
import { ShopifySetupTutorial } from "@/components/shopify/shopify-setup-tutorial"
import { ShopifyConnectedStoreCard } from "@/components/shopify/shopify-connected-store-card"
import { ShopifyTroubleshootingCenter } from "@/components/shopify/shopify-troubleshooting-center"
import { toast } from "sonner"

export default function StoresPage() {
  const [stores, setStores] = React.useState<ConnectedShopifyStore[]>([])
  const [currentStep, setCurrentStep] = React.useState<ShopifyStep>("identifying")
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [accountId, setAccountId] = React.useState("")

  const loadStores = React.useCallback(async (nextAccountId: string) => {
    const list = await getConnectedShopifyStores(nextAccountId)
    setStores(list)
  }, [])

  React.useEffect(() => {
    async function load() {
      const session = await getCurrentAppSession()
      if (!session?.accountId) {
        return
      }

      setAccountId(session.accountId)
      await loadStores(session.accountId)
    }

    load()
  }, [loadStores])

  const handleConnect = async (
    storeName: string,
    shopDomain: string,
    manualToken?: string
  ) => {
    if (!accountId) return

    setIsConnecting(true)
    setCurrentStep("connecting")

    setTimeout(() => {
      setCurrentStep("authorizing")

      setTimeout(() => {
        setCurrentStep("syncing")

        setTimeout(async () => {
          try {
            const normalizedDomain = normalizeShopDomain(shopDomain)
            await addConnectedShopifyStore({
              accountId,
              name: storeName,
              shopDomain: normalizedDomain,
              storefrontToken: manualToken || `shptka_live_${Date.now()}`,
              status: "Conectada",
              productCount: Math.floor(Math.random() * 200) + 50,
              variantCount: Math.floor(Math.random() * 500) + 100,
              lastSync: new Date().toISOString(),
            })

            await loadStores(accountId)
            setCurrentStep("completed")
            toast.success("Loja conectada com sucesso.")
          } catch {
            toast.error("Erro ao conectar loja.")
            setCurrentStep("identifying")
          } finally {
            setIsConnecting(false)
            setTimeout(() => {
              setCurrentStep("identifying")
            }, 3000)
          }
        }, 2500)
      }, 2000)
    }, 1500)
  }

  const handleSync = async (id: string) => {
    try {
      await updateConnectedShopifyStore(id, {
        status: "Sincronizando",
      })
      await loadStores(accountId)

      setTimeout(async () => {
        const currentStore = stores.find((store) => store.id === id)
        await updateConnectedShopifyStore(id, {
          status: "Conectada",
          lastSync: new Date().toISOString(),
          productCount: (currentStore?.productCount ?? 0) + 2,
        })
        await loadStores(accountId)
      }, 3000)
    } catch {
      toast.error("Erro ao sincronizar loja.")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteConnectedShopifyStore(id)
      await loadStores(accountId)
      toast.success("Loja removida.")
    } catch {
      toast.error("Erro ao remover loja.")
    }
  }

  const handleReconnect = async (id: string) => {
    await handleSync(id)
  }

  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.shopDomain.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeConnections = stores.filter((store) => store.status === "Conectada").length
  const hasIssues = stores.some(
    (store) => store.status === "Atencao necessaria" || store.status === "Falha"
  )

  return (
    <div className="animate-in fade-in flex flex-col gap-8 pb-12 duration-700">
      <ShopifyIntegrationHeader connectionCount={activeConnections} hasIssues={hasIssues} />

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-card/30 p-6 shadow-inner backdrop-blur-sm">
            <div className="pointer-events-none absolute right-0 top-0 p-8 opacity-5">
              <Plus className="h-40 w-40 text-primary" />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black uppercase tracking-tight text-primary/80">
                  Assistente de Conexao
                </h2>
                {isConnecting && (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary animate-pulse">
                    PROCESSO EM ANDAMENTO
                  </span>
                )}
              </div>

              <ShopifyConnectionWizard currentStep={currentStep} />

              <div className="mt-8">
                <ShopifyConnectionForm
                  onConnect={handleConnect}
                  isConnecting={isConnecting}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
              <h2 className="flex items-center gap-3 text-2xl font-black tracking-tight">
                Gestao de Instancias
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                  {stores.length}
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar loja..."
                    className="h-9 w-[200px] border-transparent bg-muted/50 pl-9 focus-visible:ring-primary/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" className="h-9 w-9 border-transparent bg-muted/50">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredStores.length > 0 ? (
                filteredStores.map((store) => (
                  <ShopifyConnectedStoreCard
                    key={store.id}
                    store={store}
                    onSync={handleSync}
                    onDelete={handleDelete}
                    onReconnect={handleReconnect}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed bg-muted/20 py-20 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <LayoutGrid className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold">Nenhuma loja encontrada</h3>
                  <p className="max-w-[300px] text-sm text-muted-foreground">
                    Inicie uma nova conexao acima ou tente um termo de busca diferente.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <ShopifySetupTutorial />
          <ShopifyTroubleshootingCenter />

          <div className="space-y-4 rounded-3xl border border-primary/10 bg-primary/5 p-6">
            <h4 className="text-sm font-black uppercase tracking-wider text-primary">
              Sincronizacao Ativa
            </h4>
            <p className="text-xs leading-relaxed text-muted-foreground">
              O Swipe monitora alteracoes de estoque e novos produtos da sua loja Shopify.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-background text-[9px]">
                WEBHOOKS v2
              </Badge>
              <Badge variant="outline" className="bg-background text-[9px]">
                REST v2024
              </Badge>
              <Badge variant="outline" className="bg-background text-[9px]">
                GraphQL
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
