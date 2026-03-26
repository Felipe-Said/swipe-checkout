"use client"

import * as React from "react"
import { Store, Plus, Settings2, Info, ArrowRight, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface ShopifyConnectionFormProps {
  onConnect: (storeName: string, shopDomain: string, manualToken?: string) => void
  isConnecting?: boolean
}

export function ShopifyConnectionForm({ onConnect, isConnecting = false }: ShopifyConnectionFormProps) {
  const [storeName, setStoreName] = React.useState("")
  const [shopDomain, setShopDomain] = React.useState("")
  const [manualToken, setManualToken] = React.useState("")
  const [isAdvanced, setIsAdvanced] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeName || !shopDomain) return
    onConnect(storeName, shopDomain, isAdvanced ? manualToken : undefined)
    
    // Reset if not connecting
    if (!isConnecting) {
       setStoreName("")
       setShopDomain("")
       setManualToken("")
    }
  }

  return (
    <Card className="border-primary/10 bg-card/50 backdrop-blur-sm shadow-xl p-2">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Store className="h-6 w-6" />
               </div>
               <div>
                  <CardTitle>Conectar Nova Loja</CardTitle>
                  <CardDescription>Inicie o fluxo de integração oficial.</CardDescription>
               </div>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border">
               <span className="text-[10px] font-bold text-muted-foreground">MODO AVANÇADO</span>
               <Switch 
                 checked={isAdvanced} 
                 onCheckedChange={setIsAdvanced} 
                 className="scale-75"
               />
            </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="store-name" className="text-xs font-bold text-muted-foreground uppercase">Nome Interno</Label>
                <Popover>
                    <PopoverTrigger asChild>
                       <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </PopoverTrigger>
                    <PopoverContent className="w-60 text-[11px] leading-relaxed">
                       Apenas para identificação dentro do Swipe. Não será visível no checkout.
                    </PopoverContent>
                </Popover>
              </div>
              <Input
                id="store-name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ex: Minha Loja Principal"
                className="bg-muted/20 border-primary/5 focus-visible:ring-primary/20 h-11"
                disabled={isConnecting}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="shop-domain" className="text-xs font-bold text-muted-foreground uppercase">Domínio Shopify</Label>
                <div className="flex items-center gap-1">
                   <ShieldCheck className="h-3 w-3 text-emerald-500" />
                   <span className="text-[10px] text-emerald-500 font-bold uppercase">SSL Seguro</span>
                </div>
              </div>
              <Input
                id="shop-domain"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                placeholder="exemplo.myshopify.com"
                className="bg-muted/20 border-primary/5 focus-visible:ring-primary/20 h-11 font-mono text-sm"
                disabled={isConnecting}
              />
            </div>
          </div>

          <div className={cn(
             "space-y-4 overflow-hidden transition-all duration-300",
             isAdvanced ? "max-h-32 opacity-100 mt-2" : "max-h-0 opacity-0 py-0 overflow-hidden"
          )}>
            <div className="space-y-2">
              <Label htmlFor="manual-token" className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                 <Settings2 className="h-3 w-3" />
                 Token Manual (Storefront API)
              </Label>
              <Input
                id="manual-token"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="shptka_xxxxxxxxxxxxxxxxxxxx"
                className="bg-muted/20 border-primary/5 focus-visible:ring-primary/20 h-11 font-mono text-sm"
                disabled={isConnecting}
              />
              <p className="text-[10px] text-muted-foreground bg-amber-500/10 text-amber-500 p-2 rounded-lg border border-amber-500/20">
                Atenção: Use apenas se souber exatamente o que está fazendo. Recomendamos o fluxo automático.
              </p>
            </div>
          </div>

          <Button 
            className="w-full h-12 text-lg font-black tracking-tight group shadow-lg shadow-primary/20" 
            type="submit"
            disabled={isConnecting || !storeName || !shopDomain}
          >
            {isConnecting ? (
               <>Iniciando Conexão...</>
            ) : (
               <>
                 Conectar com Shopify
                 <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
               </>
            )}
          </Button>

          <p className="text-[11px] text-center text-muted-foreground px-4">
             Note: Ao clicar em conectar, você será redirecionado para a Shopify para autorizar o acesso do Swipe à sua loja.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
