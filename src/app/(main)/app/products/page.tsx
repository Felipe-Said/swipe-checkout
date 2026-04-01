"use client"

import * as React from "react"
import {
  Boxes,
  Link2,
  PackagePlus,
  Pencil,
  Plus,
  Store,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import {
  deleteManualProductForSession,
  loadProductsHubData,
  saveManualProductForSession,
} from "@/app/actions/products"
import type {
  CatalogProduct,
  CatalogProductCurrency,
  CatalogProductStatus,
  CatalogProductVariant,
} from "@/lib/catalog-products"
import { SWIPE_MANUAL_STORE_ID } from "@/lib/catalog-products"
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

type ProductFormVariant = {
  id: string
  name: string
  price: string
  imageSrc: string
}

type ProductFormState = {
  id?: string
  name: string
  optionName: string
  description: string
  currency: CatalogProductCurrency
  imageSrc: string
  status: CatalogProductStatus
  variants: ProductFormVariant[]
}

function createVariantFormState(): ProductFormVariant {
  return {
    id: crypto.randomUUID(),
    name: "",
    price: "",
    imageSrc: "",
  }
}

function createEmptyFormState(): ProductFormState {
  return {
    name: "",
    optionName: "Variante",
    description: "",
    currency: "BRL",
    imageSrc: "",
    status: "active",
    variants: [createVariantFormState()],
  }
}

const MAX_IMAGE_DATA_BYTES = 260_000
const MAX_PRODUCT_IMAGES_TOTAL_BYTES = 700_000

function estimateDataUrlBytes(dataUrl: string) {
  if (!dataUrl.startsWith("data:")) {
    return 0
  }
  const [, payload = ""] = dataUrl.split(",", 2)
  return Math.ceil((payload.length * 3) / 4)
}

async function readImageAsOptimizedDataUrl(file: File) {
  const fileDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
        return
      }
      reject(new Error("Nao foi possivel ler a imagem."))
    }
    reader.onerror = () => reject(new Error("Nao foi possivel ler a imagem."))
    reader.readAsDataURL(file)
  })

  if (typeof window === "undefined") {
    return fileDataUrl
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const nextImage = new window.Image()
    nextImage.onload = () => resolve(nextImage)
    nextImage.onerror = () => reject(new Error("Nao foi possivel processar a imagem."))
    nextImage.src = fileDataUrl
  })

  const maxDimension = 1400
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
  const targetWidth = Math.max(1, Math.round(image.width * scale))
  const targetHeight = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext("2d")
  if (!context) {
    return fileDataUrl
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight)

  const mimeType = "image/jpeg"
  const qualitySteps = [0.82, 0.74, 0.66, 0.58, 0.5]
  let bestDataUrl = canvas.toDataURL(mimeType, qualitySteps[0])

  for (const quality of qualitySteps) {
    const nextDataUrl = canvas.toDataURL(mimeType, quality)
    bestDataUrl = nextDataUrl
    if (estimateDataUrlBytes(nextDataUrl) <= MAX_IMAGE_DATA_BYTES) {
      return nextDataUrl
    }
  }

  return bestDataUrl
}

export default function ProductsPage() {
  const [accountId, setAccountId] = React.useState("")
  const [userId, setUserId] = React.useState("")
  const [manualProducts, setManualProducts] = React.useState<CatalogProduct[]>([])
  const [storeCatalogs, setStoreCatalogs] = React.useState<StoreCatalogGroup[]>([])
  const [checkoutTargetsByProductId, setCheckoutTargetsByProductId] = React.useState<
    Record<string, { checkoutId: string; domainHost: string | null }>
  >({})
  const [manualProductsError, setManualProductsError] = React.useState("")
  const [loaded, setLoaded] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [editingProductId, setEditingProductId] = React.useState("")
  const [form, setForm] = React.useState<ProductFormState>(createEmptyFormState())
  const [origin, setOrigin] = React.useState("")

  const loadData = React.useCallback(async (nextAccountId: string, nextUserId: string) => {
    const result = await loadProductsHubData({
      accountId: nextAccountId,
      userId: nextUserId,
    })

    setManualProducts(result.manualProducts ?? [])
    setStoreCatalogs((result.storeCatalogs ?? []) as StoreCatalogGroup[])
    setCheckoutTargetsByProductId(result.checkoutTargetsByProductId ?? {})
    setManualProductsError(result.manualProductsError ?? "")
    setLoaded(true)
  }, [])

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
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
    setForm(createEmptyFormState())
    setDialogOpen(true)
  }

  const openEditDialog = (product: CatalogProduct) => {
    setEditingProductId(product.id)
    setForm({
      id: product.id,
      name: product.name,
      optionName: product.optionName || "Variante",
      description: product.description,
      currency: product.currency,
      imageSrc: product.imageSrc,
      status: product.status,
      variants:
        product.variants.length > 0
          ? product.variants.map((variant) => ({
              id: variant.id,
              name: variant.name,
              price: variant.price.toString(),
              imageSrc: variant.imageSrc,
            }))
          : [createVariantFormState()],
    })
    setDialogOpen(true)
  }

  const updateVariant = (variantId: string, key: keyof ProductFormVariant, value: string) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === variantId ? { ...variant, [key]: value } : variant
      ),
    }))
  }

  const addVariant = () => {
    setForm((current) => ({
      ...current,
      variants: [...current.variants, createVariantFormState()],
    }))
  }

  const removeVariant = (variantId: string) => {
    setForm((current) => ({
      ...current,
      variants:
        current.variants.length === 1
          ? current.variants
          : current.variants.filter((variant) => variant.id !== variantId),
    }))
  }

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    onLoaded: (base64: string) => void
  ) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    void readImageAsOptimizedDataUrl(file)
      .then((dataUrl) => {
        onLoaded(dataUrl)
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar a imagem.")
      })
  }

  const handleSave = async () => {
    if (!accountId || !userId) {
      return
    }

    const totalImagePayloadBytes =
      estimateDataUrlBytes(form.imageSrc) +
      form.variants.reduce((total, variant) => total + estimateDataUrlBytes(variant.imageSrc), 0)

    if (totalImagePayloadBytes > MAX_PRODUCT_IMAGES_TOTAL_BYTES) {
      toast.error("As imagens desse produto ainda estao pesadas demais. Reduza a quantidade ou use arquivos menores.")
      return
    }

    try {
      setIsSaving(true)
      const result = await saveManualProductForSession({
        id: editingProductId || undefined,
        accountId,
        userId,
        name: form.name,
        optionName: form.optionName,
        description: form.description,
        price: Number(form.variants[0]?.price || 0),
        currency: form.currency,
        imageSrc: form.imageSrc,
        status: form.status,
        variants: form.variants.map(
          (variant) =>
            ({
              id: variant.id,
              name: variant.name,
              price: Number(variant.price || 0),
              imageSrc: variant.imageSrc,
            }) satisfies CatalogProductVariant
        ),
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      setDialogOpen(false)
      setEditingProductId("")
      setForm(createEmptyFormState())
      await loadData(accountId, userId)
      toast.success(editingProductId ? "Produto atualizado." : "Produto criado.")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel salvar o produto agora."
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!accountId || !userId) {
      return
    }

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
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
            <DialogHeader>
              <DialogTitle>{editingProductId ? "Editar produto" : "Criar produto"}</DialogTitle>
              <DialogDescription>
                Este produto fica disponivel para usar os checkouts da Swipe fora da Shopify.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-2">
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
                  <Label htmlFor="product-option-name">Titulo das variantes</Label>
                  <Input
                    id="product-option-name"
                    value={form.optionName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, optionName: event.target.value }))
                    }
                    placeholder="Ex.: Tamanho, Cor, Plano"
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
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="product-image-upload">Imagem do produto</Label>
                  <Input
                    id="product-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handleImageUpload(event, (base64) =>
                        setForm((current) => ({ ...current, imageSrc: base64 }))
                      )
                    }
                  />
                  <Input
                    value={form.imageSrc}
                    onChange={(event) => setForm((current) => ({ ...current, imageSrc: event.target.value }))}
                    placeholder="Ou cole uma URL da imagem"
                  />
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

              {form.imageSrc ? (
                <div className="rounded-xl border p-3">
                  <img
                    src={form.imageSrc}
                    alt={form.name || "Produto"}
                    className="h-40 w-full rounded-lg object-cover"
                  />
                </div>
              ) : null}

              <div className="grid gap-3 rounded-xl border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label>Variantes do produto</Label>
                    <p className="text-xs text-muted-foreground">
                      Cada variante pode ter preco, imagem e link de checkout proprios.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar variante
                  </Button>
                </div>

                <div className="space-y-4">
                  {form.variants.map((variant, index) => (
                    <div key={variant.id} className="grid gap-4 rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium">
                          {form.optionName || "Variante"} {index + 1}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariant(variant.id)}
                          disabled={form.variants.length === 1}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label>Nome da variante</Label>
                          <Input
                            value={variant.name}
                            onChange={(event) => updateVariant(variant.id, "name", event.target.value)}
                            placeholder="Ex.: 38, Preto, Premium"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label>Preco da variante</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.price}
                            onChange={(event) => updateVariant(variant.id, "price", event.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label>Imagem da variante</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            handleImageUpload(event, (base64) =>
                              updateVariant(variant.id, "imageSrc", base64)
                            )
                          }
                        />
                        <Input
                          value={variant.imageSrc}
                          onChange={(event) => updateVariant(variant.id, "imageSrc", event.target.value)}
                          placeholder="Ou cole uma URL da imagem"
                        />
                      </div>

                      {variant.imageSrc ? (
                        <img
                          src={variant.imageSrc}
                          alt={variant.name || `Variante ${index + 1}`}
                          className="h-28 w-full rounded-lg border object-cover"
                        />
                      ) : null}
                    </div>
                  ))}
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
                      <TableHead>Preco base</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[140px] text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manualProducts.flatMap((product) => {
                      const checkoutTarget = checkoutTargetsByProductId[product.id]
                      const headerRow = (
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
                                  {product.optionName}: {product.variants.map((variant) => variant.name).join(", ")}
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
                      )

                      const variantRows = product.variants.map((variant) => {
                        const checkoutBaseUrl =
                          checkoutTarget?.domainHost
                            ? `https://${checkoutTarget.domainHost.replace(/^https?:\/\//, "")}`
                            : origin
                        const checkoutLink =
                          checkoutTarget?.checkoutId && checkoutBaseUrl
                            ? `${checkoutBaseUrl}/checkout/${checkoutTarget.checkoutId}?store=${SWIPE_MANUAL_STORE_ID}&product=${product.id}&variant=${variant.id}`
                            : ""

                        return (
                          <TableRow key={`${product.id}-${variant.id}`}>
                            <TableCell colSpan={4} className="bg-muted/20">
                              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-3">
                                  {variant.imageSrc ? (
                                    <img
                                      src={variant.imageSrc}
                                      alt={variant.name}
                                      className="h-10 w-10 rounded-lg border object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
                                      <Boxes className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-sm font-medium">{variant.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatPrice(variant.price, product.currency)}
                                    </div>
                                  </div>
                                </div>

                                {checkoutLink ? (
                                  <div className="flex min-w-0 items-center gap-2">
                                    <Input readOnly value={checkoutLink} className="min-w-[260px]" />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        void navigator.clipboard.writeText(checkoutLink)
                                        toast.success("Link da variante copiado.")
                                      }}
                                    >
                                      <Link2 className="mr-2 h-4 w-4" />
                                      Copiar link
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground">
                                    Para gerar os links, selecione <span className="font-medium">Meu Swipe</span> em{" "}
                                    <span className="font-medium">Loja do Checkout</span>, escolha este produto e salve um checkout.
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })

                      return [headerRow, ...variantRows]
                    })}
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
                        <div className="truncate text-xs text-muted-foreground">{product.variantLabel}</div>
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
