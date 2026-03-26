"use client"

import * as React from "react"
import { Plus, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { readShippingMethods, type ShippingMethod, writeShippingMethods } from "@/lib/shipping-data"

const initialForm = {
  name: "",
  description: "",
  price: "",
  eta: "",
}

export default function ShippingPage() {
  const [shippingMethods, setShippingMethods] = React.useState<ShippingMethod[]>([])
  const [form, setForm] = React.useState(initialForm)

  React.useEffect(() => {
    setShippingMethods(readShippingMethods())
  }, [])

  const handleCreateShipping = () => {
    if (!form.name || !form.description || !form.price || !form.eta) {
      return
    }

    const nextMethod: ShippingMethod = {
      id: `${form.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      name: form.name,
      description: form.description,
      price: Number(form.price),
      eta: form.eta,
      active: true,
    }

    const nextMethods = [...shippingMethods, nextMethod]
    setShippingMethods(nextMethods)
    writeShippingMethods(nextMethods)
    setForm(initialForm)
  }

  const toggleShipping = (id: string) => {
    const nextMethods = shippingMethods.map((method) =>
      method.id === id ? { ...method, active: !method.active } : method
    )
    setShippingMethods(nextMethods)
    writeShippingMethods(nextMethods)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Fretes</h1>
        <p className="text-muted-foreground">
          Crie e gerencie as opcoes de envio disponiveis para seus checkouts.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Novo Frete</CardTitle>
            <CardDescription>
              Os fretes criados aqui aparecem no editor de checkout para selecao.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shipping-name">Nome</Label>
              <Input
                id="shipping-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Entrega Premium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping-description">Descricao</Label>
              <Input
                id="shipping-description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Mais rapida e com prioridade no preparo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping-price">Valor</Label>
              <Input
                id="shipping-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="29.90"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping-eta">Prazo</Label>
              <Input
                id="shipping-eta"
                value={form.eta}
                onChange={(e) => setForm((prev) => ({ ...prev, eta: e.target.value }))}
                placeholder="1 a 2 dias uteis"
              />
            </div>
            <Button className="w-full" onClick={handleCreateShipping}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Frete
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {shippingMethods.map((method) => (
            <Card key={method.id}>
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{method.name}</h2>
                      <span className="text-xs text-muted-foreground">
                        {method.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                    <p className="text-sm text-muted-foreground">
                      R$ {method.price.toFixed(2)} • {method.eta}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => toggleShipping(method.id)}>
                  {method.active ? "Desativar" : "Ativar"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
