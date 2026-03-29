"use client"

import * as React from "react"
import { Plus, Truck } from "lucide-react"
import { toast } from "sonner"

import {
  createShippingMethodForSession,
  loadShippingMethodsForSession,
  updateShippingMethodStatusForSession,
} from "@/app/actions/shipping"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCurrentAppSession } from "@/lib/app-session"
import { type ShippingMethod } from "@/lib/shipping-data"

const initialForm = {
  name: "",
  description: "",
  price: "",
  eta: "",
}

export default function ShippingPage() {
  const [shippingMethods, setShippingMethods] = React.useState<ShippingMethod[]>([])
  const [form, setForm] = React.useState(initialForm)
  const [accountId, setAccountId] = React.useState<string | null>(null)
  const [userId, setUserId] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    async function loadPageData() {
      const session = await getCurrentAppSession()
      setAccountId(session?.accountId ?? null)
      setUserId(session?.userId ?? null)

      if (!session?.accountId || !session.userId) {
        setShippingMethods([])
        return
      }

      const result = await loadShippingMethodsForSession({
        accountId: session.accountId,
        userId: session.userId,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      setShippingMethods(result.methods)
    }

    void loadPageData()
  }, [])

  const handleCreateShipping = async () => {
    if (!form.name || !form.description || !form.price || !form.eta) {
      toast.error("Preencha todos os campos do frete.")
      return
    }

    if (!accountId || !userId) {
      toast.error("Sessao invalida para criar frete.")
      return
    }

    setIsSubmitting(true)
    const result = await createShippingMethodForSession({
      accountId,
      userId,
      name: form.name,
      description: form.description,
      price: Number(form.price),
      eta: form.eta,
    })
    setIsSubmitting(false)

    if (result.error || !result.method) {
      toast.error(result.error || "Nao foi possivel criar o frete.")
      return
    }

    setShippingMethods((prev) => [...prev, result.method])
    setForm(initialForm)
    toast.success("Frete criado com sucesso.")
  }

  const toggleShipping = async (id: string) => {
    const currentMethod = shippingMethods.find((method) => method.id === id)
    if (!currentMethod || !accountId || !userId) {
      return
    }

    const result = await updateShippingMethodStatusForSession({
      accountId,
      userId,
      shippingId: id,
      active: !currentMethod.active,
    })

    if (result.error || !result.method) {
      toast.error(result.error || "Nao foi possivel atualizar o frete.")
      return
    }

    setShippingMethods((prev) =>
      prev.map((method) => (method.id === id ? result.method! : method))
    )
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
            <Button className="w-full" onClick={handleCreateShipping} disabled={isSubmitting}>
              <Plus className="mr-2 h-4 w-4" />
              {isSubmitting ? "Criando..." : "Criar Frete"}
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
