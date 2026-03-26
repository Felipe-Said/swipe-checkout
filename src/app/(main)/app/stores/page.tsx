"use client"

import * as React from "react"
import { 
  Plus, 
  Search,
  LayoutGrid,
  List as ListIcon,
  Filter
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ConnectedShopifyStore, 
  normalizeShopDomain, 
  readConnectedShopifyStores, 
  writeConnectedShopifyStores 
} from "@/lib/shopify-store-data"

import { ShopifyIntegrationHeader } from "@/components/shopify/shopify-integration-header"
import { ShopifyConnectionWizard, ShopifyStep } from "@/components/shopify/shopify-connection-wizard"
import { ShopifyConnectionForm } from "@/components/shopify/shopify-connection-form"
import { ShopifySetupTutorial } from "@/components/shopify/shopify-setup-tutorial"
import { ShopifyConnectedStoreCard } from "@/components/shopify/shopify-connected-store-card"
import { ShopifyCatalogSyncSummary } from "@/components/shopify/shopify-catalog-sync-summary"
import { ShopifyTroubleshootingCenter } from "@/components/shopify/shopify-troubleshooting-center"

export default function StoresPage() {
  const [stores, setStores] = React.useState<ConnectedShopifyStore[]>([])
  const [currentStep, setCurrentStep] = React.useState<ShopifyStep>("identifying")
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  React.useEffect(() => {
    setStores(readConnectedShopifyStores())
  }, [])

  const handleConnect = (storeName: string, shopDomain: string, manualToken?: string) => {
    setIsConnecting(true)
    setCurrentStep("connecting")

    // Simulation of the connection flow
    setTimeout(() => {
      setCurrentStep("authorizing")
      
      setTimeout(() => {
        setCurrentStep("syncing")
        
        setTimeout(() => {
          const normalizedDomain = normalizeShopDomain(shopDomain)
          const newStore: ConnectedShopifyStore = {
            id: `${normalizedDomain}-${Date.now()}`,
            name: storeName,
            shopDomain: normalizedDomain,
            storefrontToken: manualToken || `shptka_simulated_${Date.now()}`,
            checkoutType: "Shopify Hosted Checkout",
            status: "Conectada",
            productCount: Math.floor(Math.random() * 200) + 50,
            variantCount: Math.floor(Math.random() * 500) + 100,
            lastSync: new Date().toLocaleString("pt-BR"),
          }

          const updatedStores = [newStore, ...stores]
          setStores(updatedStores)
          writeConnectedShopifyStores(updatedStores)
          
          setCurrentStep("completed")
          setIsConnecting(false)
          
          // Reset to start after a delay so user can see completion
          setTimeout(() => {
             setCurrentStep("identifying")
          }, 3000)
          
        }, 2500) // Syncing time
      }, 2000) // Authorizing time
    }, 1500) // Connecting time
  }

  const handleSync = (id: string) => {
    const updatedStores = stores.map(s => 
      s.id === id ? { ...s, status: "Sincronizando" as const } : s
    )
    setStores(updatedStores)
    
    setTimeout(() => {
      const finalStores = stores.map(s => 
        s.id === id ? { 
          ...s, 
          status: "Conectada" as const, 
          lastSync: new Date().toLocaleString("pt-BR"),
          productCount: (s.productCount || 0) + 2 // simulate finding new products
        } : s
      )
      setStores(finalStores)
      writeConnectedShopifyStores(finalStores)
    }, 3000)
  }

  const handleDelete = (id: string) => {
    const updatedStores = stores.filter(s => s.id !== id)
    setStores(updatedStores)
    writeConnectedShopifyStores(updatedStores)
  }

  const handleReconnect = (id: string) => {
    handleSync(id) // Simple simulation
  }

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.shopDomain.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeConnections = stores.filter(s => s.status === "Conectada").length
  const hasIssues = stores.some(s => s.status === "Atenção necessária" || s.status === "Falha")

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-700">
      <ShopifyIntegrationHeader 
        connectionCount={activeConnections} 
        hasIssues={hasIssues}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
           {/* Wizard & Form Section */}
           <div className="bg-card/30 rounded-3xl border border-primary/10 p-6 backdrop-blur-sm shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                 <Plus className="h-40 w-40 text-primary" />
              </div>
              
              <div className="relative z-10 space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black uppercase tracking-tight text-primary/80">
                       Assistente de Conexão
                    </h2>
                    {isConnecting && (
                       <span className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-full animate-pulse border border-primary/20">
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

           {/* Results & Management Section */}
           <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                 <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                    Gestão de Instâncias
                    <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-md text-muted-foreground">{stores.length}</span>
                 </h2>
                 <div className="flex items-center gap-2">
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input 
                         placeholder="Buscar loja..." 
                         className="pl-9 h-9 w-[200px] bg-muted/50 border-transparent focus-visible:ring-primary/20"
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
                    filteredStores.map(store => (
                       <ShopifyConnectedStoreCard 
                         key={store.id}
                         store={store}
                         onSync={handleSync}
                         onDelete={handleDelete}
                         onReconnect={handleReconnect}
                       />
                    ))
                 ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border border-dashed text-center">
                       <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
                          <LayoutGrid className="h-8 w-8" />
                       </div>
                       <h3 className="font-bold text-lg">Nenhuma loja encontrada</h3>
                       <p className="text-sm text-muted-foreground max-w-[300px]">
                          Inicie uma nova conexão acima ou tente um termo de busca diferente.
                       </p>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Sidebar Help & Tutorials */}
        <div className="space-y-8">
           <ShopifySetupTutorial />
           <ShopifyTroubleshootingCenter />
           
           <div className="bg-primary/5 rounded-3xl border border-primary/10 p-6 space-y-4">
              <h4 className="font-black text-sm uppercase tracking-wider text-primary">Sincronização Ativa</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                 O Swipe monitora alterações de estoque e novos produtos a cada 15 minutos em sua loja Shopify.
              </p>
              <div className="flex flex-wrap gap-2">
                 <Badge variant="outline" className="text-[9px] bg-background">WEBHOOKS v2</Badge>
                 <Badge variant="outline" className="text-[9px] bg-background">REST v2024</Badge>
                 <Badge variant="outline" className="text-[9px] bg-background">GraphQL</Badge>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
