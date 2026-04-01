"use client"

import * as React from "react"
import { Boxes, PackagePlus, Pencil, Plus, Store, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  deleteManualProductForSession,
  loadProductsHubData,
  saveManualProductForSession,
} from "@/app/actions/products"
import type { CatalogProduct, CatalogProductCurrency, CatalogProductStatus } from "@/lib/catalog-products"
import { getCurrentAppSession } from "@/lib/app-session"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

type StoreCatalogGroup = {
  store: {
    id: string
    name: string
    shopDomain: string
  }
  products: Array<{
    id: string
    storeId: string
    storeName: string
    title: string
    variantLabel: string
    price: number
    currency: CatalogProductCurrency
    imageSrc: string
  }>
  error: string
}

type ProductFormState = {
  id?: string
  name: string
  variantLabel: string
  description: string
  price: string
  currency: CatalogProductCurrency
  imageSrc: string
  status: CatalogProductStatus
}

const initialFormState: ProductFormState = {
  name: "",
  variantLabel: "",
  description: "",
  price: "",
  currency: "BRL",
  imageSrc: "",
  status: "active",
}

export default function ProductsPage() {
  const [accountId, setAccountId] = React.useState("")
  const [userId, setUserId] = React.useState("")
  const [manualProducts, setManualProducts] = React.useState<CatalogProduct[]>([])
  const [storeCatalogs, setStoreCatalogs] = React.useState<StoreCatalogGroup[]>([])
  const [manualProductsError, setManualProductsError] = React.useState("")
  const [loaded, setLoaded] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [editingProductId, setEditingProductId] = React.useState("")
  const [form, setForm] = React.useState<ProductFormState>(initialFormState)

  const loadData = React.useCallback(async (nextAccountId: string, nextUserId: string) => {
    const result = await loadProductsHubData({
      accountId: nextAccountId,
      userId: nextUserId,
    })

    setManualProducts(result.manualProducts ?? [])
    setStoreCatalogs((result.storeCatalogs ?? []) as StoreCatalogGroup[])
    setManualProductsError(result.manualProductsError ?? "")
    setLoaded(true)
  }, [])

  React.useEffect(() => {
    async function loadSession() {
      const session = await getCurrentAppSession()
      if (!session?.accountId || !session?.userId) {
        setLoaded(true)
        return
      }

      setAccountId(session.accountId)
      setUserId(session.userId)
      await loadData(session.accountId, session.userId)
    }

    void loadSession()
  }, [loadData])

  const openCreateDialog = () => {
    setEditingProductId("")
    setForm(initialFormState)
    setDialogOpen(true)
  }

  const openEditDialog = (product: CatalogProduct) => {
    setEditingProductId(product.id)
    setForm({
      id: product.id,
      name: product.name,
      variantLabel: product.variantLabel,
      description: product.description,
      price: product.price.toString(),
      currency: product.currency,
      imageSrc: product.imageSrc,
      status: product.status,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!accountId || !userId) return

    setIsSaving(true)
    const result = await saveManualProductForSession({
      id: editingProductId || undefined,
      accountId,
      userId,
      name: form.name,
      variantLabel: form.variantLabel,
      description: form.description,
      price: Number(form.price || 0),
      currency: form.currency,
      imageSrc: form.imageSrc,
      status: form.status,
    })

    setIsSaving(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    setDialogOpen(false)
    setForm(initialFormState)
    setEditingProductId("")
    await loadData(accountId, userId)
    toast.success(editingProductId ? "Produto atualizado." : "Produto criado.")
  }

  const handleDelete = async (productId: string) => {
    if (!accountId || !userId) return

    const result = await deleteManualProductForSession({
      id: productId,
      accountId,
      userId,
    })

    if (result.error) {
      toast.error(result.error)
      return
    }

    await loadData(accountId, userId)
    toast.success("Produto removido.")
  }

  if (!loaded) {
    return <div className="min-h-[320px]" />
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie produtos proprios da Swipe e visualize o catalogo vivo separado por loja.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Criar produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[640px]">
            <DialogHeader>
              <DialogTitle>{editingProductId ? "Editar produto" : "Criar produto"}</DialogTitle>
              <DialogDescription>
                Este produto fica disponivel para usar os checkouts da Swipe fora da Shopify.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="product-name">Nome do produto</Label>
                <Input
                  id="product-name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Nome comercial do produto"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="product-variant">Variante</Label>
                  <Input
                    id="product-variant"
                    value={form.variantLabel}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, variantLabel: event.target.value }))
                    }
                    placeholder="Ex: Oferta unica"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="product-image">Imagem do produto</Label>
                  <Input
                    id="product-image"
                    value={form.imageSrc}
                    onChange={(event) => setForm((current) => ({ ...current, imageSrc: event.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="product-price">Preco</Label>
                  <Input
                    id="product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Moeda</Label>
                  <Select
                    value={form.currency}
                    onValueChange={(value: CatalogProductCurrency) =>
                      setForm((current) => ({ ...current, currency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">BRL</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value: CatalogProductStatus) =>
                      setForm((current) => ({ ...current, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="draft">Rascunho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="product-description">Descricao</Label>
                <Textarea
                  id="product-description"
                  rows={4}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Resumo do produto, oferta ou entrega"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Salvando..." : editingProductId ? "Salvar alteracoes" : "Criar produto"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Produtos da Swipe</CardTitle>
              <CardDescription>
                Catalogo proprio para landing pages, trafego direto e operacoes fora da Shopify.
              </CardDescription>
            </div>
            <Badge variant="outline">{manualProducts.length} itens</Badge>
          </CardHeader>
          <CardContent>
            {manualProductsError ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                {manualProductsError}
              </div>
            ) : manualProducts.length > 0 ? (
              <div className="rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Preco</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[140px] text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manualProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.imageSrc ? (
                              <img
                                src={product.imageSrc}
                                alt={product.name}
                                className="h-12 w-12 rounded-lg border object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted">
                                <Boxes className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="space-y-1">
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {product.variantLabel || "Sem variante"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatPrice(product.price, product.currency)}</TableCell>
                        <TableCell>
                          <Badge variant={product.status === "active" ? "default" : "outline"}>
                            {product.status === "active" ? "Ativo" : "Rascunho"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => openEditDialog(product)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => void handleDelete(product.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
                <PackagePlus className="mb-4 h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Nenhum produto proprio ainda</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  Crie o primeiro produto da Swipe para usar checkouts em landing pages fora da Shopify.
                </p>
                <Button className="mt-4" onClick={openCreateDialog}>
                  Criar primeiro produto
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {storeCatalogs.map((group) => (
            <Card key={group.store.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      {group.store.name}
                    </CardTitle>
                    <CardDescription>{group.store.shopDomain}</CardDescription>
                  </div>
                  <Badge variant="outline">{group.products.length} produtos</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.error ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    {group.error}
                  </div>
                ) : group.products.length > 0 ? (
                  group.products.map((product) => (
                    <div
                      key={`${group.store.id}-${product.id}`}
                      className="flex items-center gap-3 rounded-xl border p-3"
                    >
                      {product.imageSrc ? (
                        <img
                          src={product.imageSrc}
                          alt={product.title}
                          className="h-14 w-14 rounded-lg border object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg border bg-muted">
                          <Store className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{product.title}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {product.variantLabel}
                        </div>
                        <div className="mt-1 text-sm font-semibold">
                          {formatPrice(product.price, product.currency)}
                        </div>
                      </div>
                      <Badge variant="secondary">Shopify</Badge>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Nenhum produto ativo foi encontrado nessa loja no momento.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {storeCatalogs.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Produtos por loja</CardTitle>
                <CardDescription>
                  Quando houver lojas Shopify conectadas, os produtos vao aparecer separados por loja aqui.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Nenhuma loja conectada ainda. Conecte uma loja em <span className="font-medium">Lojas</span> para visualizar o catalogo vivo.
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function formatPrice(value: number, currency: CatalogProductCurrency) {
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
  }).format(value)
}
