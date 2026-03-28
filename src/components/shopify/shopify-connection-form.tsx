"use client"

import * as React from "react"
import { Store, Settings2, Info, ArrowRight, ShieldCheck, KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ShopifyConnectionFormProps {
  onConnect: (storeName: string, shopDomain: string, clientId: string, clientSecret: string) => void
  isConnecting?: boolean
}

export function ShopifyConnectionForm({
  onConnect,
  isConnecting = false,
}: ShopifyConnectionFormProps) {
  const [storeName, setStoreName] = React.useState("")
  const [shopDomain, setShopDomain] = React.useState("")
  const [clientId, setClientId] = React.useState("")
  const [clientSecret, setClientSecret] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeName || !shopDomain || !clientId || !clientSecret) return
    onConnect(storeName, shopDomain, clientId, clientSecret)

    if (!isConnecting) {
      setStoreName("")
      setShopDomain("")
      setClientId("")
      setClientSecret("")
    }
  }

  return (
    <Card className="border-primary/10 bg-card/50 p-2 shadow-xl backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Conectar Nova Loja</CardTitle>
              <CardDescription>Valide o dominio e as credenciais do app da loja Shopify.</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5">
            <span className="text-[10px] font-bold text-muted-foreground">DEV DASHBOARD</span>
            <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="store-name" className="text-xs font-bold uppercase text-muted-foreground">
                  Nome Interno
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                  </PopoverTrigger>
                  <PopoverContent className="w-60 text-[11px] leading-relaxed">
                    Apenas para identificacao dentro do Swipe. Nao sera visivel no checkout.
                  </PopoverContent>
                </Popover>
              </div>
              <Input
                id="store-name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ex: Minha Loja Principal"
                className="h-11 border-primary/5 bg-muted/20 focus-visible:ring-primary/20"
                disabled={isConnecting}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="shop-domain" className="text-xs font-bold uppercase text-muted-foreground">
                  Dominio Shopify
                </Label>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  <span className="text-[10px] font-bold uppercase text-emerald-500">SSL Seguro</span>
                </div>
              </div>
              <Input
                id="shop-domain"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                placeholder="exemplo.myshopify.com"
                className="h-11 border-primary/5 bg-muted/20 font-mono text-sm focus-visible:ring-primary/20"
                disabled={isConnecting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="client-id"
                className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"
              >
                <KeyRound className="h-3 w-3" />
                Client ID
              </Label>
              <Input
                id="client-id"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Client ID do app Shopify"
                className="h-11 border-primary/5 bg-muted/20 font-mono text-sm focus-visible:ring-primary/20"
                disabled={isConnecting}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="client-secret"
                className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"
              >
                <KeyRound className="h-3 w-3" />
                Secret
              </Label>
              <Input
                id="client-secret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Secret do app Shopify"
                className="h-11 border-primary/5 bg-muted/20 font-mono text-sm focus-visible:ring-primary/20"
                disabled={isConnecting}
              />
            </div>
          </div>

          <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-[10px] text-amber-500">
            Use o Client ID e o Secret do app da loja Shopify. Para esse app, os escopos obrigatorios sao read_products, write_products e write_draft_orders.
          </p>

          <Button
            className="group h-12 w-full text-lg font-black tracking-tight shadow-lg shadow-primary/20"
            type="submit"
            disabled={isConnecting || !storeName || !shopDomain || !clientId || !clientSecret}
          >
            {isConnecting ? (
              <>Iniciando Conexao...</>
            ) : (
              <>
                Conectar com Shopify
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>

          <p className="px-4 text-center text-[11px] text-muted-foreground">
            O Swipe valida o dominio da loja e tenta adquirir o token de acesso do app Shopify antes de salvar a conexao.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
