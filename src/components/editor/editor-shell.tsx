"use client"

import * as React from "react"
import {
  Brush,
  ChevronLeft,
  Eye,
  Layout,
  LayoutTemplate,
  Monitor,
  Redo2,
  Save,
  Settings2,
  Smartphone,
  Undo2,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  loadCheckoutForEditor,
  loadWhopAccountForSession,
  saveCheckoutFromEditor,
} from "@/app/actions/whop"
import { loadDomainsForSession } from "@/app/actions/domains"
import { loadManualProductsForSession } from "@/app/actions/products"
import { loadShippingMethodsForSession } from "@/app/actions/shipping"
import {
  loadShopifyStoreOptionsForSession,
  loadShopifyStorePreviewForSession,
} from "@/app/actions/shopify"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ShopifyCheckout } from "../checkout-preview/shopify-checkout"
import { getCurrentAppSession } from "@/lib/app-session"
import { SWIPE_MANUAL_STORE_ID, type CatalogProduct } from "@/lib/catalog-products"
import { getManagedAccounts, type ManagedAccount } from "@/lib/account-metrics"
import { type ConnectedDomain } from "@/lib/domain-data"
import { type ShippingMethod } from "@/lib/shipping-data"
import { type ConnectedShopifyStore } from "@/lib/shopify-store-data"

type PolicyMode = "link" | "text"
type SupportedLocale = "pt-BR" | "en-US" | "es-ES" | "fr-FR" | "de-DE"
type SupportedCurrency = "BRL" | "USD" | "EUR" | "GBP"
type WhopTheme = "light" | "dark" | "system"
type WhopAccentColor =
  | "tomato"
  | "red"
  | "ruby"
  | "crimson"
  | "pink"
  | "plum"
  | "purple"
  | "violet"
  | "iris"
  | "cyan"
  | "teal"
  | "jade"
  | "green"
  | "grass"
  | "brown"
  | "blue"
  | "orange"
  | "indigo"
  | "sky"
  | "mint"
  | "yellow"
  | "amber"
  | "lime"
  | "lemon"
  | "magenta"
  | "gold"
  | "bronze"
  | "gray"

type ShopifyStorePreview = {
  storeName: string
  currency: SupportedCurrency
  productName: string
  variantLabel: string
  amount: number
  imageSrc?: string
  storeUrl?: string
}

type EditorConfig = {
  primaryColor: string
  borderRadius: string
  fontFamily: string
  showLogo: boolean
  companyName: string
  productName: string
  productVariantLabel: string
  productPrice: number
  customCss: string
  buttonText: string
  layoutStyle: "classic" | "one-page" | "daniel"
  showCheckoutSteps: boolean
  bannerFullBleed: boolean
  bannerDesktopSrc: string
  bannerMobileSrc: string
  logoSrc: string
  logoWidth: number
  logoDisplayMode: "text" | "image"
  showCouponField: boolean
  showPolicies: boolean
  refundPolicyMode: PolicyMode
  refundPolicyUrl: string
  refundPolicyText: string
  privacyPolicyMode: PolicyMode
  privacyPolicyUrl: string
  privacyPolicyText: string
  termsPolicyMode: PolicyMode
  termsPolicyUrl: string
  termsPolicyText: string
  checkoutBackgroundColor: string
  checkoutSurfaceColor: string
  checkoutTextColor: string
  checkoutMutedColor: string
  checkoutAccentColor: string
  localeMode: "manual" | "auto"
  locale: SupportedLocale
  currencyMode: "manual" | "auto"
  currency: SupportedCurrency
  thankYouDragEnabled: boolean
  thankYouCardBackgroundDesktopSrc: string
  thankYouCardBackgroundMobileSrc: string
  thankYouCardBackgroundDesktopSize: number
  thankYouCardBackgroundMobileSize: number
  thankYouShowIcon: boolean
  thankYouShowBrand: boolean
  thankYouShowTitle: boolean
  thankYouShowMessage: boolean
  thankYouShowSummary: boolean
  thankYouIconX: number
  thankYouIconY: number
  thankYouBrandX: number
  thankYouBrandY: number
  thankYouTitleX: number
  thankYouTitleY: number
  thankYouMessageX: number
  thankYouMessageY: number
  thankYouSummaryX: number
  thankYouSummaryY: number
  thankYouUpsellX: number
  thankYouUpsellY: number
  thankYouButtonX: number
  thankYouButtonY: number
  thankYouBackgroundDesktopSrc: string
  thankYouBackgroundMobileSrc: string
  thankYouTitle: string
  thankYouMessage: string
  thankYouButtonEnabled: boolean
  thankYouButtonText: string
  thankYouButtonUrl: string
  thankYouButtonTarget: "store" | "manual"
  thankYouAutoRedirectEnabled: boolean
  thankYouAutoRedirectDelaySeconds: number
  thankYouAutoRedirectTarget: "store" | "manual"
  thankYouAutoRedirectUrl: string
  upsellEnabled: boolean
  upsellOfferType: "product" | "collection" | "random"
  upsellSelection: string
  upsellHeadline: string
  upsellDescription: string
  upsellButtonText: string
  upsellPrice: number
  selectedShippingMethodIds: string[]
  selectedDomainId: string
  selectedProductId: string
  selectedVariantId: string
  selectedStoreId: string
  selectedWhopAccountId: string
  whopTheme: WhopTheme
  whopAccentColor: WhopAccentColor
  whopHighContrast: boolean
  whopHidePrice: boolean
  whopHideTermsAndConditions: boolean
  whopPaddingY: number
  whop?: {
    checkoutConfigurationId?: string | null
    planId?: string | null
    purchaseUrl?: string | null
    companyId?: string | null
    publishedAt?: string
    amount?: number
  }
}

const POLICY_TEXT_MAX_LENGTH = 1200

const initialConfig: EditorConfig = {
  primaryColor: "#000000",
  borderRadius: "4px",
  fontFamily: "font-sans",
  showLogo: true,
  companyName: "Minha Loja Premium",
  productName: "Produto principal",
  productVariantLabel: "Variante padrao",
  productPrice: 0,
  customCss: "",
  buttonText: "Finalizar Compra",
  layoutStyle: "classic",
  showCheckoutSteps: true,
  bannerFullBleed: false,
  bannerDesktopSrc: "",
  bannerMobileSrc: "",
  logoSrc: "",
  logoWidth: 180,
  logoDisplayMode: "text",
  showCouponField: true,
  showPolicies: true,
  refundPolicyMode: "text",
  refundPolicyUrl: "",
  refundPolicyText: "Reembolsos sao analisados em ate 7 dias uteis apos a solicitacao.",
  privacyPolicyMode: "text",
  privacyPolicyUrl: "",
  privacyPolicyText: "Seus dados sao utilizados apenas para processar o pedido e melhorar sua experiencia.",
  termsPolicyMode: "text",
  termsPolicyUrl: "",
  termsPolicyText: "Ao concluir a compra, voce concorda com os termos de uso e processamento do pedido.",
  checkoutBackgroundColor: "#ffffff",
  checkoutSurfaceColor: "#fafafa",
  checkoutTextColor: "#333333",
  checkoutMutedColor: "#707070",
  checkoutAccentColor: "#197bbd",
  localeMode: "manual",
  locale: "pt-BR",
  currencyMode: "manual",
  currency: "BRL",
  thankYouDragEnabled: true,
  thankYouCardBackgroundDesktopSrc: "",
  thankYouCardBackgroundMobileSrc: "",
  thankYouCardBackgroundDesktopSize: 100,
  thankYouCardBackgroundMobileSize: 100,
  thankYouShowIcon: true,
  thankYouShowBrand: true,
  thankYouShowTitle: true,
  thankYouShowMessage: true,
  thankYouShowSummary: true,
  thankYouIconX: 50,
  thankYouIconY: 10,
  thankYouBrandX: 50,
  thankYouBrandY: 22,
  thankYouTitleX: 50,
  thankYouTitleY: 32,
  thankYouMessageX: 50,
  thankYouMessageY: 43,
  thankYouSummaryX: 50,
  thankYouSummaryY: 59,
  thankYouUpsellX: 50,
  thankYouUpsellY: 79,
  thankYouButtonX: 50,
  thankYouButtonY: 92,
  thankYouBackgroundDesktopSrc: "",
  thankYouBackgroundMobileSrc: "",
  thankYouTitle: "Pedido confirmado",
  thankYouMessage: "Seu pagamento foi aprovado e ja estamos preparando tudo para a entrega.",
  thankYouButtonEnabled: true,
  thankYouButtonText: "Voltar para a loja",
  thankYouButtonUrl: "",
  thankYouButtonTarget: "store",
  thankYouAutoRedirectEnabled: false,
  thankYouAutoRedirectDelaySeconds: 10,
  thankYouAutoRedirectTarget: "store",
  thankYouAutoRedirectUrl: "",
  upsellEnabled: true,
  upsellOfferType: "product",
  upsellSelection: "premium",
  upsellHeadline: "Oferta exclusiva pos-compra",
  upsellDescription: "Adicione um produto complementar com um clique, usando os mesmos dados da compra atual.",
  upsellButtonText: "Adicionar a compra",
  upsellPrice: 97,
  selectedShippingMethodIds: [],
  selectedDomainId: "",
  selectedProductId: "",
  selectedVariantId: "",
  selectedStoreId: "",
  selectedWhopAccountId: "",
  whopTheme: "light",
  whopAccentColor: "blue",
  whopHighContrast: false,
  whopHidePrice: false,
  whopHideTermsAndConditions: false,
  whopPaddingY: 0,
}

const THANK_YOU_DEFAULT_POSITIONS = {
  thankYouIconX: 50,
  thankYouIconY: 10,
  thankYouBrandX: 50,
  thankYouBrandY: 22,
  thankYouTitleX: 50,
  thankYouTitleY: 32,
  thankYouMessageX: 50,
  thankYouMessageY: 43,
  thankYouSummaryX: 50,
  thankYouSummaryY: 59,
  thankYouUpsellX: 50,
  thankYouUpsellY: 79,
  thankYouButtonX: 50,
  thankYouButtonY: 92,
} satisfies Partial<EditorConfig>

const deviceOptions = [
  { value: "desktop" as const, icon: Monitor, label: "Desktop" },
  { value: "mobile" as const, icon: Smartphone, label: "Mobile" },
]

const layoutOptions = [
  { value: "classic" as const, label: "Classico" },
  { value: "daniel" as const, label: "Swipe" },
]

const localeOptions: Array<{ value: SupportedLocale; label: string }> = [
  { value: "pt-BR", label: "Portugues (Brasil)" },
  { value: "en-US", label: "English (US)" },
  { value: "es-ES", label: "Espanol" },
  { value: "fr-FR", label: "Francais" },
  { value: "de-DE", label: "Deutsch" },
]

const currencyOptions: Array<{ value: SupportedCurrency; label: string }> = [
  { value: "BRL", label: "BRL - Real" },
  { value: "USD", label: "USD - Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - Pound" },
]

const whopThemeOptions: Array<{ value: WhopTheme; label: string }> = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
]

const whopAccentOptions: Array<{ value: WhopAccentColor; label: string }> = [
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "red", label: "Red" },
  { value: "orange", label: "Orange" },
  { value: "purple", label: "Purple" },
  { value: "pink", label: "Pink" },
  { value: "indigo", label: "Indigo" },
  { value: "cyan", label: "Cyan" },
  { value: "teal", label: "Teal" },
  { value: "yellow", label: "Yellow" },
  { value: "amber", label: "Amber" },
  { value: "gray", label: "Gray" },
]

const upsellSelections = {
  product: [
    { value: "premium", label: "Produto Premium" },
    { value: "fast-track", label: "Entrega Prioritaria" },
    { value: "vip-support", label: "Suporte VIP" },
  ],
  collection: [
    { value: "starter-pack", label: "Colecao Starter Pack" },
    { value: "growth-pack", label: "Colecao Growth Pack" },
    { value: "lifetime-bundle", label: "Colecao Lifetime Bundle" },
  ],
  random: [
    { value: "smart-offer", label: "Oferta automatica inteligente" },
    { value: "highest-conv", label: "Oferta com maior conversao" },
    { value: "seasonal", label: "Oferta sazonal" },
  ],
} as const

export function EditorShell() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [activeDevice, setActiveDevice] = React.useState<"desktop" | "mobile">("desktop")
  const [previewPage, setPreviewPage] = React.useState<"checkout" | "thank-you">("checkout")
  const [config, setConfig] = React.useState(initialConfig)
  const configHistoryRef = React.useRef<EditorConfig[]>([initialConfig])
  const historyIndexRef = React.useRef(0)
  const [historyState, setHistoryState] = React.useState({ canUndo: false, canRedo: false })
  const [shippingMethods, setShippingMethods] = React.useState<ShippingMethod[]>([])
  const [domains, setDomains] = React.useState<ConnectedDomain[]>([])
  const [manualProducts, setManualProducts] = React.useState<CatalogProduct[]>([])
  const [stores, setStores] = React.useState<ConnectedShopifyStore[]>([])
  const [storePreview, setStorePreview] = React.useState<ShopifyStorePreview | null>(null)
  const [whopAccounts, setWhopAccounts] = React.useState<ManagedAccount[]>([])
  const [sessionAccountId, setSessionAccountId] = React.useState("")
  const [sessionUserId, setSessionUserId] = React.useState("")
  const [checkoutName, setCheckoutName] = React.useState("Checkout Premium")
  const [isSaving, setIsSaving] = React.useState(false)
  const isDanielLayout = previewPage === "checkout" && config.layoutStyle === "daniel"
  const isSwipeManualStore = config.selectedStoreId === SWIPE_MANUAL_STORE_ID
  const selectedManualProduct = React.useMemo(
    () => manualProducts.find((product) => product.id === config.selectedProductId) ?? null,
    [config.selectedProductId, manualProducts]
  )
  const selectedManualVariant = React.useMemo(() => {
    if (!selectedManualProduct) {
      return null
    }

    return (
      selectedManualProduct.variants.find((variant) => variant.id === config.selectedVariantId) ??
      selectedManualProduct.variants[0] ??
      null
    )
  }, [config.selectedVariantId, selectedManualProduct])

  const syncHistoryState = React.useCallback(() => {
    setHistoryState({
      canUndo: historyIndexRef.current > 0,
      canRedo: historyIndexRef.current < configHistoryRef.current.length - 1,
    })
  }, [])

  const updateConfig = React.useCallback(
    (
      updater: EditorConfig | ((prev: EditorConfig) => EditorConfig),
      options?: { trackHistory?: boolean }
    ) => {
      const trackHistory = options?.trackHistory ?? true

      setConfig((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater
        if (JSON.stringify(next) === JSON.stringify(prev)) {
          return prev
        }

        if (trackHistory) {
          const nextHistory = configHistoryRef.current.slice(0, historyIndexRef.current + 1)
          nextHistory.push(next)
          configHistoryRef.current = nextHistory
          historyIndexRef.current = nextHistory.length - 1
          syncHistoryState()
        }

        return next
      })
    },
    [syncHistoryState]
  )

  React.useEffect(() => {
    async function loadEditorData() {
      const session = await getCurrentAppSession()
      setSessionAccountId(session?.accountId ?? "")
      setSessionUserId(session?.userId ?? "")

      if (session?.accountId && session.userId) {
        const availableShippingMethods = await loadShippingMethodsForSession({
          accountId: session.accountId,
          userId: session.userId,
        })
        setShippingMethods(availableShippingMethods.methods ?? [])
      } else {
        setShippingMethods([])
      }

      const availableAccounts = await getManagedAccounts()
      const serverWhopAccount = session?.userId
        ? await loadWhopAccountForSession({
            accountId: session.accountId,
            userId: session.userId,
          })
        : { account: null }
      const currentAccount =
        serverWhopAccount.account ??
        availableAccounts.find(
          (account) => account.profile_id === session?.userId || account.id === session?.accountId
        )
      const availableDomainsResult = session?.accountId && session?.userId
        ? await loadDomainsForSession({
            accountId: session.accountId,
            userId: session.userId,
          })
        : { domains: [] as ConnectedDomain[] }
      const availableDomains = availableDomainsResult.domains ?? []
      const availableStoresResult = session?.accountId && session?.userId
        ? await loadShopifyStoreOptionsForSession({
            accountId: session.accountId,
            userId: session.userId,
          })
        : { stores: [] as ConnectedShopifyStore[] }
      const availableManualProductsResult = session?.accountId && session?.userId
        ? await loadManualProductsForSession({
            accountId: session.accountId,
            userId: session.userId,
          })
        : { products: [] as CatalogProduct[] }
      const availableStores = availableStoresResult.stores ?? []
      const availableManualProducts = availableManualProductsResult.products ?? []
      const availableWhopAccounts =
        session?.role === "admin"
          ? [
              ...(serverWhopAccount.account?.whopKey?.trim() ? [serverWhopAccount.account] : []),
              ...availableAccounts.filter(
                (account) =>
                  account.id !== serverWhopAccount.account?.id && account.whopKey?.trim()
              ),
            ]
          : currentAccount && !currentAccount.keyFrozen && currentAccount.whopKey?.trim()
            ? [currentAccount]
            : []

      setDomains(availableDomains)
      setManualProducts(availableManualProducts)
      setStores(availableStores)
      setWhopAccounts(availableWhopAccounts)
      if (availableDomains[0] && !config.selectedDomainId) {
        updateConfig((prev) => ({ ...prev, selectedDomainId: availableDomains[0].id }), {
          trackHistory: false,
        })
      }
      if (availableStores[0] && !config.selectedStoreId && !config.selectedProductId) {
        updateConfig((prev) => ({ ...prev, selectedStoreId: availableStores[0].id }), {
          trackHistory: false,
        })
      }
      if (availableWhopAccounts[0] && !config.selectedWhopAccountId) {
        updateConfig((prev) => ({ ...prev, selectedWhopAccountId: availableWhopAccounts[0].id }), {
          trackHistory: false,
        })
      }

      if (session?.accountId && params?.id && params.id !== "new") {
        const result = await loadCheckoutForEditor({
          checkoutId: params.id,
          accountId: session.accountId,
        })

        if (result.checkout) {
          setCheckoutName(result.checkout.name)
          const resolvedLayoutStyle =
            result.checkout.config?.layoutStyle === "daniel" ||
            result.checkout.config?.layoutStyle === "classic"
              ? result.checkout.config.layoutStyle
              : "classic"

          const nextConfig: EditorConfig = {
            ...initialConfig,
            ...result.checkout.config,
            layoutStyle: resolvedLayoutStyle,
          }
          configHistoryRef.current = [nextConfig]
          historyIndexRef.current = 0
          setConfig(nextConfig)
          syncHistoryState()
        }
      }
    }

    loadEditorData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id])

  React.useEffect(() => {
    async function loadStorePreview() {
      if (
        !config.selectedStoreId ||
        config.selectedStoreId === SWIPE_MANUAL_STORE_ID ||
        !sessionAccountId ||
        !sessionUserId
      ) {
        setStorePreview(null)
        return
      }

      const result = await loadShopifyStorePreviewForSession({
        storeId: config.selectedStoreId,
        accountId: sessionAccountId,
        userId: sessionUserId,
      })

      if (result.preview) {
        const selectedStore = stores.find((store) => store.id === config.selectedStoreId)
        setStorePreview({
          ...result.preview,
          storeUrl: selectedStore?.shopDomain ? `https://${selectedStore.shopDomain}` : undefined,
        })
        updateConfig(
          (prev) => ({
            ...prev,
            currencyMode: "manual",
            currency: result.preview?.currency ?? prev.currency,
          }),
          { trackHistory: false }
        )
        return
      }

      setStorePreview(null)
    }

    loadStorePreview()
  }, [config.selectedStoreId, sessionAccountId, sessionUserId, stores, updateConfig])

  React.useEffect(() => {
    if (!isSwipeManualStore || config.selectedProductId || manualProducts.length === 0) {
      return
    }

    const firstProduct = manualProducts[0]
    const firstVariant = firstProduct?.variants[0]
    if (!firstProduct || !firstVariant) {
      return
    }

    updateConfig(
      (prev) => ({
        ...prev,
        selectedProductId: firstProduct.id,
        selectedVariantId: firstVariant.id,
        productName: firstProduct.name,
        productVariantLabel: firstVariant.name || prev.productVariantLabel,
        productPrice: firstVariant.price,
        currencyMode: "manual",
        currency: firstProduct.currency,
      }),
      { trackHistory: false }
    )
  }, [config.selectedProductId, isSwipeManualStore, manualProducts, updateConfig])

  React.useEffect(() => {
    if (!config.selectedProductId) {
      return
    }

    if (!selectedManualProduct) {
      return
    }

    const nextVariant =
      selectedManualProduct.variants.find((variant) => variant.id === config.selectedVariantId) ??
      selectedManualProduct.variants[0] ??
      null
    if (!nextVariant) {
      return
    }

    updateConfig(
      (prev) => ({
        ...prev,
        selectedStoreId: SWIPE_MANUAL_STORE_ID,
        selectedVariantId: nextVariant.id,
        productName: selectedManualProduct.name,
        productVariantLabel: nextVariant.name || prev.productVariantLabel,
        productPrice: nextVariant.price,
        currencyMode: "manual",
        currency: selectedManualProduct.currency,
      }),
      { trackHistory: false }
    )
  }, [config.selectedProductId, config.selectedVariantId, selectedManualProduct, updateConfig])

  React.useEffect(() => {
    if (!selectedManualProduct || !selectedManualVariant || !isSwipeManualStore) {
      return
    }

    updateConfig(
      (prev) => ({
        ...prev,
        productName: selectedManualProduct.name,
        productVariantLabel: selectedManualVariant.name || prev.productVariantLabel,
        productPrice: selectedManualVariant.price,
        currencyMode: "manual",
        currency: selectedManualProduct.currency,
      }),
      { trackHistory: false }
    )
  }, [isSwipeManualStore, selectedManualProduct, selectedManualVariant, updateConfig])

  const handleUpdate = (key: keyof EditorConfig, value: string | boolean | number) => {
    if (key === "thankYouDragEnabled") {
      updateConfig((prev) => ({
        ...prev,
        thankYouDragEnabled: Boolean(value),
        ...THANK_YOU_DEFAULT_POSITIONS,
      }))
      return
    }

    if (key === "selectedStoreId") {
      const nextStoreId = String(value)
      updateConfig((prev) => ({
        ...prev,
        selectedStoreId: nextStoreId,
        selectedProductId: nextStoreId === SWIPE_MANUAL_STORE_ID ? prev.selectedProductId : "",
        selectedVariantId: nextStoreId === SWIPE_MANUAL_STORE_ID ? prev.selectedVariantId : "",
      }))
      return
    }

    if (key === "selectedProductId") {
      const nextProductId = String(value)
      const nextProduct = manualProducts.find((product) => product.id === nextProductId) ?? null
      updateConfig((prev) => ({
        ...prev,
        selectedProductId: nextProductId,
        selectedVariantId: nextProduct?.variants[0]?.id ?? "",
        selectedStoreId: nextProductId ? SWIPE_MANUAL_STORE_ID : "",
      }))
      return
    }

    if (key === "selectedVariantId") {
      updateConfig((prev) => ({
        ...prev,
        selectedVariantId: String(value),
        selectedStoreId: prev.selectedProductId ? SWIPE_MANUAL_STORE_ID : prev.selectedStoreId,
      }))
      return
    }

    updateConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleUndo = () => {
    if (historyIndexRef.current === 0) return
    historyIndexRef.current -= 1
    setConfig(configHistoryRef.current[historyIndexRef.current] ?? initialConfig)
    syncHistoryState()
  }

  const handleRedo = () => {
    if (historyIndexRef.current >= configHistoryRef.current.length - 1) return
    historyIndexRef.current += 1
    setConfig(configHistoryRef.current[historyIndexRef.current] ?? initialConfig)
    syncHistoryState()
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isValidType = ["image/png", "image/svg+xml", "image/jpeg"].includes(file.type)
    if (!isValidType) {
      event.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === "string") {
        updateConfig((prev) => ({
          ...prev,
          logoSrc: result,
          logoDisplayMode: "image",
        }))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    updateConfig((prev) => ({
      ...prev,
      logoSrc: "",
      logoDisplayMode: "text",
    }))
  }

  const handleBannerUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    target: "bannerDesktopSrc" | "bannerMobileSrc"
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isValidType = ["image/png", "image/svg+xml", "image/jpeg"].includes(file.type)
    if (!isValidType) {
      event.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === "string") {
        updateConfig((prev) => ({
          ...prev,
          [target]: result,
          showCheckoutSteps: false,
        }))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveBanner = (target: "bannerDesktopSrc" | "bannerMobileSrc") => {
    updateConfig((prev) => ({
      ...prev,
      [target]: "",
    }))
  }

  const handleCustomCssUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isValidType =
      file.type === "text/css" ||
      file.name.toLowerCase().endsWith(".css") ||
      file.type === ""

    if (!isValidType) {
      event.target.value = ""
      toast.error("Envie um arquivo CSS valido.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === "string") {
        updateConfig((prev) => ({
          ...prev,
          customCss: result,
        }))
        event.target.value = ""
        toast.success("CSS carregado no checkout.")
      }
    }
    reader.onerror = () => {
      event.target.value = ""
      toast.error("Nao foi possivel ler o arquivo CSS.")
    }
    reader.readAsText(file)
  }

  const handleThankYouBackgroundUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    target: "thankYouBackgroundDesktopSrc" | "thankYouBackgroundMobileSrc"
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isValidType = ["image/png", "image/svg+xml", "image/jpeg"].includes(file.type)
    if (!isValidType) {
      event.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === "string") {
        updateConfig((prev) => ({
          ...prev,
          [target]: result,
        }))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveThankYouBackground = (
    target: "thankYouBackgroundDesktopSrc" | "thankYouBackgroundMobileSrc"
  ) => {
    updateConfig((prev) => ({
      ...prev,
      [target]: "",
    }))
  }

  const handleThankYouCardBackgroundUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    target: "thankYouCardBackgroundDesktopSrc" | "thankYouCardBackgroundMobileSrc"
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isValidType = ["image/png", "image/svg+xml", "image/jpeg"].includes(file.type)
    if (!isValidType) {
      event.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === "string") {
        updateConfig((prev) => ({
          ...prev,
          [target]: result,
        }))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveThankYouCardBackground = (
    target: "thankYouCardBackgroundDesktopSrc" | "thankYouCardBackgroundMobileSrc"
  ) => {
    updateConfig((prev) => ({
      ...prev,
      [target]: "",
    }))
  }

  const handleToggleShippingMethod = (shippingId: string) => {
    updateConfig((prev) => ({
      ...prev,
      selectedShippingMethodIds: prev.selectedShippingMethodIds.includes(shippingId)
        ? prev.selectedShippingMethodIds.filter((id) => id !== shippingId)
        : [...prev.selectedShippingMethodIds, shippingId],
    }))
  }

  const handleSaveCheckout = async () => {
    if (!sessionAccountId) {
      toast.error("Conta operacional nao encontrada para salvar este checkout.")
      return
    }

    setIsSaving(true)
    const result = await saveCheckoutFromEditor({
      checkoutId: typeof params?.id === "string" ? params.id : "new",
      accountId: sessionAccountId,
      name: checkoutName,
      config,
    })
    setIsSaving(false)

    if (result?.error) {
      toast.error(result.error)
      return
    }

    if (result?.checkoutId && result.checkoutId !== params?.id) {
      router.replace(`/app/checkouts/${result.checkoutId}/editor`)
    }

    if (result?.purchaseUrl) {
      if (result.whop) {
        updateConfig((prev) => ({ ...prev, whop: result.whop ?? undefined }), {
          trackHistory: false,
        })
      }
      toast.success("Checkout publicado na Whop com link real gerado.")
      return
    }

    toast.success("Checkout salvo com sucesso.")
  }

  const activeDeviceIndex = deviceOptions.findIndex((option) => option.value === activeDevice)

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app/checkouts">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold leading-none">Editor de Checkout</h1>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              Shopify Collection • Draft
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative mr-4 flex items-center rounded-md border bg-muted p-1">
            <div
              className="absolute bottom-1 top-1 w-8 rounded-[6px] bg-background shadow-sm transition-transform duration-250 ease-out"
              style={{ transform: `translateX(${activeDeviceIndex * 2}rem)` }}
            />
            {deviceOptions.map((option) => {
              const Icon = option.icon
              const isActive = activeDevice === option.value
              return (
                <Button
                  key={option.value}
                  variant="ghost"
                  size="icon"
                  className={cn("relative z-10 h-8 w-8 transition-colors duration-200", isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
                  onClick={() => setActiveDevice(option.value)}
                  aria-pressed={isActive}
                  aria-label={option.label}
                >
                  <Icon className={cn("h-4 w-4 transition-transform duration-200", isActive && "scale-105")} />
                </Button>
              )
            })}
          </div>
          <Button variant="outline" size="icon" onClick={handleUndo} disabled={!historyState.canUndo} aria-label="Desfazer">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleRedo} disabled={!historyState.canRedo} aria-label="Refazer">
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" /> Visualizar
          </Button>
          <Button size="sm" onClick={handleSaveCheckout} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" /> {isSaving ? "Salvando" : "Salvar"}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex min-h-0 w-80 flex-col border-r bg-muted/30">
          <Tabs defaultValue="style" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="h-12 w-full justify-start rounded-none border-b bg-transparent px-4">
              <TabsTrigger value="style" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                <Brush className="mr-2 h-4 w-4" />
                Estilo
              </TabsTrigger>
              <TabsTrigger value="layout" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                <Layout className="mr-2 h-4 w-4" />
                Layout
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                <Settings2 className="mr-2 h-4 w-4" />
                Config
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="min-h-0 flex-1 px-4 py-6">
              <TabsContent value="style" className="m-0 space-y-6">
                <div className="space-y-4">
                  <Label>Preview Atual</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant={previewPage === "checkout" ? "default" : "outline"} size="sm" onClick={() => setPreviewPage("checkout")}>
                      Checkout
                    </Button>
                    <Button variant={previewPage === "thank-you" ? "default" : "outline"} size="sm" onClick={() => setPreviewPage("thank-you")}>
                      Agradecimento
                    </Button>
                  </div>
                </div>
                {previewPage === "checkout" ? (
                  <>
                    <div className="space-y-4">
                      <Label>Nome do Checkout</Label>
                      <Input value={checkoutName} onChange={(e) => setCheckoutName(e.target.value)} />
                    </div>
                    <ColorField label="Cor Principal" value={config.primaryColor} onChange={(value) => handleUpdate("primaryColor", value)} />
                    <div className="space-y-4">
                      <Label>Arredondamento (Button)</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {["0px", "4px", "8px", "9999px"].map((radius) => (
                          <Button key={radius} variant={config.borderRadius === radius ? "default" : "outline"} size="sm" className="text-[10px]" onClick={() => handleUpdate("borderRadius", radius)}>
                            {radius === "9999px" ? "Total" : radius}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label>Texto do Botao</Label>
                      <Input value={config.buttonText} onChange={(e) => handleUpdate("buttonText", e.target.value)} />
                    </div>
                  </>
                ) : null}

                <div className="space-y-4 rounded-lg border p-4">
                  <Label>Pagina de Agradecimento</Label>
                  <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                    Esta pagina segue automaticamente as cores, a moeda e o idioma do checkout principal. Aqui voce edita o conteudo, o fundo e os redirects do thank-you.
                  </div>

                  <div className="space-y-3 rounded-lg border p-3">
                    <div className="space-y-1">
                      <Label htmlFor="thank-you-card-bg-desktop">Fundo do Card Desktop</Label>
                      <p className="text-xs text-muted-foreground">640 x 760 px</p>
                    </div>
                    <Input id="thank-you-card-bg-desktop" type="file" accept=".png,.svg,.jpg,.jpeg,image/png,image/svg+xml,image/jpeg" onChange={(event) => handleThankYouCardBackgroundUpload(event, "thankYouCardBackgroundDesktopSrc")} />
                    {config.thankYouCardBackgroundDesktopSrc ? (
                      <Button variant="outline" size="sm" onClick={() => handleRemoveThankYouCardBackground("thankYouCardBackgroundDesktopSrc")}>
                        Apagar fundo do card desktop
                      </Button>
                    ) : null}
                  </div>

                  <div className="space-y-3 rounded-lg border p-3">
                    <div className="space-y-1">
                      <Label htmlFor="thank-you-card-bg-mobile">Fundo do Card Mobile</Label>
                      <p className="text-xs text-muted-foreground">360 x 640 px</p>
                    </div>
                    <Input id="thank-you-card-bg-mobile" type="file" accept=".png,.svg,.jpg,.jpeg,image/png,image/svg+xml,image/jpeg" onChange={(event) => handleThankYouCardBackgroundUpload(event, "thankYouCardBackgroundMobileSrc")} />
                    {config.thankYouCardBackgroundMobileSrc ? (
                      <Button variant="outline" size="sm" onClick={() => handleRemoveThankYouCardBackground("thankYouCardBackgroundMobileSrc")}>
                        Apagar fundo do card mobile
                      </Button>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="thank-you-card-bg-size-desktop">Tamanho do card desktop</Label>
                      <span className="text-xs text-muted-foreground">{config.thankYouCardBackgroundDesktopSize}%</span>
                    </div>
                    <input
                      id="thank-you-card-bg-size-desktop"
                      type="range"
                      min="50"
                      max="150"
                      step="5"
                      value={config.thankYouCardBackgroundDesktopSize}
                      onChange={(e) => handleUpdate("thankYouCardBackgroundDesktopSize", Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="thank-you-card-bg-size-mobile">Tamanho do card mobile</Label>
                      <span className="text-xs text-muted-foreground">{config.thankYouCardBackgroundMobileSize}%</span>
                    </div>
                    <input
                      id="thank-you-card-bg-size-mobile"
                      type="range"
                      min="50"
                      max="150"
                      step="5"
                      value={config.thankYouCardBackgroundMobileSize}
                      onChange={(e) => handleUpdate("thankYouCardBackgroundMobileSize", Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-3 rounded-lg border p-3">
                    <div className="space-y-1">
                      <Label htmlFor="thank-you-bg-desktop">Fundo Desktop</Label>
                      <p className="text-xs text-muted-foreground">1440 x 900 px</p>
                    </div>
                    <Input id="thank-you-bg-desktop" type="file" accept=".png,.svg,.jpg,.jpeg,image/png,image/svg+xml,image/jpeg" onChange={(event) => handleThankYouBackgroundUpload(event, "thankYouBackgroundDesktopSrc")} />
                    {config.thankYouBackgroundDesktopSrc ? (
                      <Button variant="outline" size="sm" onClick={() => handleRemoveThankYouBackground("thankYouBackgroundDesktopSrc")}>
                        Apagar fundo desktop
                      </Button>
                    ) : null}
                  </div>

                  <div className="space-y-3 rounded-lg border p-3">
                    <div className="space-y-1">
                      <Label htmlFor="thank-you-bg-mobile">Fundo Mobile</Label>
                      <p className="text-xs text-muted-foreground">390 x 844 px</p>
                    </div>
                    <Input id="thank-you-bg-mobile" type="file" accept=".png,.svg,.jpg,.jpeg,image/png,image/svg+xml,image/jpeg" onChange={(event) => handleThankYouBackgroundUpload(event, "thankYouBackgroundMobileSrc")} />
                    {config.thankYouBackgroundMobileSrc ? (
                      <Button variant="outline" size="sm" onClick={() => handleRemoveThankYouBackground("thankYouBackgroundMobileSrc")}>
                        Apagar fundo mobile
                      </Button>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thank-you-title">Titulo</Label>
                    <Input
                      id="thank-you-title"
                      value={config.thankYouTitle}
                      onChange={(e) => handleUpdate("thankYouTitle", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thank-you-message">Mensagem</Label>
                    <Textarea
                      id="thank-you-message"
                      rows={4}
                      value={config.thankYouMessage}
                      onChange={(e) => handleUpdate("thankYouMessage", e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="thank-you-button-enabled">Exibir botao final</Label>
                    <input
                      type="checkbox"
                      id="thank-you-button-enabled"
                      checked={config.thankYouButtonEnabled}
                      onChange={(e) => handleUpdate("thankYouButtonEnabled", e.target.checked)}
                      className="h-4 w-4"
                    />
                  </div>
                  {config.thankYouButtonEnabled ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="thank-you-button">Texto do Botao</Label>
                        <Input
                          id="thank-you-button"
                          value={config.thankYouButtonText}
                          onChange={(e) => handleUpdate("thankYouButtonText", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="thank-you-button-target">Destino do Botao</Label>
                        <select
                          id="thank-you-button-target"
                          value={config.thankYouButtonTarget}
                          onChange={(e) => handleUpdate("thankYouButtonTarget", e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="store">Site da loja conectada</option>
                          <option value="manual">Link manual</option>
                        </select>
                      </div>
                      {config.thankYouButtonTarget === "manual" ? (
                        <div className="space-y-2">
                          <Label htmlFor="thank-you-button-url">Link do Botao</Label>
                          <Input
                            id="thank-you-button-url"
                            placeholder="https://sualoja.com"
                            value={config.thankYouButtonUrl}
                            onChange={(e) => handleUpdate("thankYouButtonUrl", e.target.value)}
                          />
                        </div>
                      ) : (
                        <div className="rounded-lg border p-3 text-xs text-muted-foreground">
                          O botao usara automaticamente o dominio principal da loja Shopify conectada a este checkout.
                        </div>
                      )}
                    </>
                  ) : null}

                  <div className="space-y-3 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="thank-you-auto-redirect-enabled">Redirecionar automaticamente</Label>
                      <input
                        type="checkbox"
                        id="thank-you-auto-redirect-enabled"
                        checked={config.thankYouAutoRedirectEnabled}
                        onChange={(e) => handleUpdate("thankYouAutoRedirectEnabled", e.target.checked)}
                        className="h-4 w-4"
                      />
                    </div>
                    {config.thankYouAutoRedirectEnabled ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="thank-you-auto-redirect-delay">Tempo do redirect</Label>
                          <Input
                            id="thank-you-auto-redirect-delay"
                            type="number"
                            min={1}
                            step={1}
                            value={config.thankYouAutoRedirectDelaySeconds}
                            onChange={(e) => handleUpdate("thankYouAutoRedirectDelaySeconds", Number(e.target.value) || 10)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Use `10` para redirecionar automaticamente apos dez segundos.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="thank-you-auto-redirect-target">Destino automatico</Label>
                          <select
                            id="thank-you-auto-redirect-target"
                            value={config.thankYouAutoRedirectTarget}
                            onChange={(e) => handleUpdate("thankYouAutoRedirectTarget", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="store">Site da loja conectada</option>
                            <option value="manual">Link manual</option>
                          </select>
                        </div>
                        {config.thankYouAutoRedirectTarget === "manual" ? (
                          <div className="space-y-2">
                            <Label htmlFor="thank-you-auto-redirect-url">Link do redirect automatico</Label>
                            <Input
                              id="thank-you-auto-redirect-url"
                              placeholder="https://sualoja.com"
                              value={config.thankYouAutoRedirectUrl}
                              onChange={(e) => handleUpdate("thankYouAutoRedirectUrl", e.target.value)}
                            />
                          </div>
                        ) : (
                          <div className="rounded-lg border p-3 text-xs text-muted-foreground">
                            O redirect automatico usara o dominio principal da loja Shopify conectada.
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="upsell-enabled">One-click upsell</Label>
                    <input
                      type="checkbox"
                      id="upsell-enabled"
                      checked={config.upsellEnabled}
                      onChange={(e) => handleUpdate("upsellEnabled", e.target.checked)}
                      className="h-4 w-4"
                    />
                  </div>

                  {config.upsellEnabled ? (
                    <div className="space-y-4 rounded-lg border p-3">
                      <div className="space-y-2">
                        <Label htmlFor="upsell-offer-type">Tipo de oferta</Label>
                        <select
                          id="upsell-offer-type"
                          value={config.upsellOfferType}
                          onChange={(e) => {
                            const nextType = e.target.value as EditorConfig["upsellOfferType"]
                            handleUpdate("upsellOfferType", nextType)
                            handleUpdate("upsellSelection", upsellSelections[nextType][0].value)
                          }}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="product">Produto existente</option>
                          <option value="collection">Colecao</option>
                          <option value="random">Aleatorio</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="upsell-selection">Oferta selecionada</Label>
                        <select
                          id="upsell-selection"
                          value={config.upsellSelection}
                          onChange={(e) => handleUpdate("upsellSelection", e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          {upsellSelections[config.upsellOfferType].map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="upsell-headline">Titulo da oferta</Label>
                        <Input
                          id="upsell-headline"
                          value={config.upsellHeadline}
                          onChange={(e) => handleUpdate("upsellHeadline", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="upsell-description">Descricao</Label>
                        <Textarea
                          id="upsell-description"
                          rows={3}
                          value={config.upsellDescription}
                          onChange={(e) => handleUpdate("upsellDescription", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="upsell-button-text">Texto do botao do upsell</Label>
                        <Input
                          id="upsell-button-text"
                          value={config.upsellButtonText}
                          onChange={(e) => handleUpdate("upsellButtonText", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="upsell-price">Preco adicional</Label>
                        <Input
                          id="upsell-price"
                          type="number"
                          min="0"
                          step="1"
                          value={config.upsellPrice}
                          onChange={(e) => handleUpdate("upsellPrice", Number(e.target.value || 0))}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </TabsContent>

              <TabsContent value="layout" className="m-0 space-y-6">
                {previewPage === "thank-you" ? (
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                    Quando `Agradecimento` estiver ativo, os campos editaveis desta pagina ficam concentrados na aba `Estilo`.
                  </div>
                ) : (
                  <>
                <div className="space-y-4">
                  <Label>Nome da Marca</Label>
                  <Input value={config.companyName} onChange={(e) => handleUpdate("companyName", e.target.value)} />
                </div>

                <div className="space-y-4 rounded-lg border p-4">
                  <div className="space-y-2">
                    <Label>Produto da Swipe</Label>
                    {manualProducts.length > 0 ? (
                      <select
                        value={config.selectedProductId}
                        onChange={(e) => handleUpdate("selectedProductId", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Usar preenchimento manual</option>
                        {manualProducts.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.currency} {product.price.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <button
                        type="button"
                        onClick={() => router.push("/app/products")}
                        className="w-full rounded-md border border-dashed px-3 py-3 text-left text-sm text-muted-foreground hover:bg-muted"
                      >
                        Nenhum produto proprio ainda. Clique aqui para criar um produto da Swipe.
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Use este catalogo para vender em landing pages e campanhas fora da Shopify.
                    </p>
                  </div>

                  {selectedManualProduct ? (
                    <div className="space-y-2">
                      <Label>Variante da Swipe</Label>
                      <select
                        value={config.selectedVariantId}
                        onChange={(e) => handleUpdate("selectedVariantId", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {selectedManualProduct.variants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.name} ({selectedManualProduct.currency} {variant.price.toFixed(2)})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Cada variante tem preco, imagem e link de checkout proprios.
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label>Produto principal</Label>
                    <Input
                      value={config.productName}
                      onChange={(e) => handleUpdate("productName", e.target.value)}
                      placeholder="Nome do produto vendido"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Variante principal</Label>
                    <Input
                      value={config.productVariantLabel}
                      onChange={(e) => handleUpdate("productVariantLabel", e.target.value)}
                      placeholder="Ex.: Padrao / Preto / 40"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Valor do produto</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={config.productPrice}
                      onChange={(e) => handleUpdate("productPrice", Number(e.target.value || 0))}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Usado no checkout quando nao houver produto real da Shopify.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border p-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-css-upload">Arquivo CSS</Label>
                    <Input
                      id="custom-css-upload"
                      type="file"
                      accept=".css,text/css"
                      onChange={handleCustomCssUpload}
                    />
                    <p className="text-xs text-muted-foreground">
                      Envie um arquivo CSS para personalizar o checkout publicado e o preview.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom-css-editor">CSS customizado</Label>
                    <Textarea
                      id="custom-css-editor"
                      value={config.customCss}
                      onChange={(e) => handleUpdate("customCss", e.target.value)}
                      placeholder={`[data-swipe-checkout-root] {\n  --meu-gap: 20px;\n}\n\n[data-swipe-device='mobile'] .meu-bloco {\n  padding: 16px;\n}\n\n@media (min-width: 1024px) {\n  [data-swipe-checkout-root] .meu-bloco {\n    max-width: 520px;\n  }\n}`}
                      className="min-h-[240px] font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use os seletores `data-swipe-checkout-root`, `data-swipe-device=&quot;desktop&quot;` e `data-swipe-device=&quot;mobile&quot;`
                      para manter o CSS responsivo no preview e na pagina publicada.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Estilo do Checkout</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {layoutOptions.map((option) => (
                      <Button key={option.value} variant={config.layoutStyle === option.value ? "default" : "outline"} size="sm" onClick={() => handleUpdate("layoutStyle", option.value)}>
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {!isDanielLayout ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-checkout-steps">Exibir Etapas</Label>
                      <input
                        type="checkbox"
                        id="show-checkout-steps"
                        checked={config.showCheckoutSteps}
                        onChange={(e) => handleUpdate("showCheckoutSteps", e.target.checked)}
                        className="h-4 w-4"
                      />
                    </div>

                    <div className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="banner-full-bleed">Sem bordas</Label>
                        <input
                          type="checkbox"
                          id="banner-full-bleed"
                          checked={config.bannerFullBleed}
                          onChange={(e) => handleUpdate("bannerFullBleed", e.target.checked)}
                          className="h-4 w-4"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="banner-desktop-upload">Banner Desktop</Label>
                          <p className="text-xs text-muted-foreground">1200 x 220 px</p>
                        </div>
                        <Input
                          id="banner-desktop-upload"
                          type="file"
                          accept=".png,.svg,.jpg,.jpeg,image/png,image/svg+xml,image/jpeg"
                          onChange={(event) => handleBannerUpload(event, "bannerDesktopSrc")}
                        />
                        {config.bannerDesktopSrc ? (
                          <Button variant="outline" size="sm" onClick={() => handleRemoveBanner("bannerDesktopSrc")}>
                            Apagar banner desktop
                          </Button>
                        ) : null}
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="banner-mobile-upload">Banner Mobile</Label>
                          <p className="text-xs text-muted-foreground">375 x 140 px</p>
                        </div>
                        <Input
                          id="banner-mobile-upload"
                          type="file"
                          accept=".png,.svg,.jpg,.jpeg,image/png,image/svg+xml,image/jpeg"
                          onChange={(event) => handleBannerUpload(event, "bannerMobileSrc")}
                        />
                        {config.bannerMobileSrc ? (
                          <Button variant="outline" size="sm" onClick={() => handleRemoveBanner("bannerMobileSrc")}>
                            Apagar banner mobile
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                    O layout `Daniel` mostra apenas os campos que realmente afetam essa versao do checkout.
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-logo">Exibir Logo/Texto</Label>
                  <input type="checkbox" id="show-logo" checked={config.showLogo} onChange={(e) => handleUpdate("showLogo", e.target.checked)} className="h-4 w-4" />
                </div>

                {config.showLogo ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Exibicao da Marca</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant={config.logoDisplayMode === "text" ? "default" : "outline"} size="sm" onClick={() => handleUpdate("logoDisplayMode", "text")}>
                          Texto
                        </Button>
                        <Button variant={config.logoDisplayMode === "image" ? "default" : "outline"} size="sm" onClick={() => handleUpdate("logoDisplayMode", "image")} disabled={!config.logoSrc}>
                          Imagem
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logo-upload">Arquivo da Logo</Label>
                      <Input id="logo-upload" type="file" accept=".png,.svg,.jpg,.jpeg,image/png,image/svg+xml,image/jpeg" onChange={handleLogoUpload} />
                    </div>

                    {config.logoSrc ? (
                      <>
                        <Button variant="outline" size="sm" onClick={handleRemoveLogo}>
                          Apagar imagem
                        </Button>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="logo-width">Tamanho da Logo</Label>
                            <span className="text-xs text-muted-foreground">{config.logoWidth}px</span>
                          </div>
                          <input
                            id="logo-width"
                            type="range"
                            min="80"
                            max="320"
                            step="4"
                            value={config.logoWidth}
                            onChange={(e) => handleUpdate("logoWidth", Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : null}

                <ColorField label="Fundo do Checkout" value={config.checkoutBackgroundColor} onChange={(value) => handleUpdate("checkoutBackgroundColor", value)} />
                <ColorField label="Fundo de Blocos" value={config.checkoutSurfaceColor} onChange={(value) => handleUpdate("checkoutSurfaceColor", value)} />
                <ColorField label="Cor do Texto" value={config.checkoutTextColor} onChange={(value) => handleUpdate("checkoutTextColor", value)} />
                <ColorField label="Cor Secundaria" value={config.checkoutMutedColor} onChange={(value) => handleUpdate("checkoutMutedColor", value)} />
                <ColorField label="Cor de Destaque" value={config.checkoutAccentColor} onChange={(value) => handleUpdate("checkoutAccentColor", value)} />
                  </>
                )}
              </TabsContent>

              <TabsContent value="settings" className="m-0 space-y-6">
                {previewPage === "thank-you" ? (
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                    Quando `Agradecimento` estiver ativo, os campos desta pagina ficam disponiveis na aba `Estilo`.
                  </div>
                ) : (
                  <>
                <div className="space-y-2">
                  <Label>Dominio do Checkout</Label>
                  {domains.length > 0 ? (
                    <select
                      value={config.selectedDomainId}
                      onChange={(e) => handleUpdate("selectedDomainId", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {domains.map((domain) => (
                        <option key={domain.id} value={domain.id}>
                          {domain.host}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      type="button"
                      onClick={() => router.push("/app/domains")}
                      className="w-full rounded-md border border-dashed px-3 py-3 text-left text-sm text-muted-foreground hover:bg-muted"
                    >
                      Nenhum dominio configurado. Clique aqui para adicionar um novo dominio.
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Loja do Checkout</Label>
                  {stores.length > 0 || manualProducts.length > 0 ? (
                    <select
                      value={config.selectedStoreId}
                      onChange={(e) => handleUpdate("selectedStoreId", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Sem loja Shopify</option>
                      <option value={SWIPE_MANUAL_STORE_ID}>Meu Swipe</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name} ({store.shopDomain})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      type="button"
                      onClick={() => router.push("/app/stores")}
                      className="w-full rounded-md border border-dashed px-3 py-3 text-left text-sm text-muted-foreground hover:bg-muted"
                    >
                      Nenhuma loja configurada. Clique aqui para adicionar uma nova loja.
                    </button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Se `Meu Swipe` estiver selecionado, este checkout usa apenas os produtos criados dentro da plataforma Swipe. Uma loja Shopify real continua tendo prioridade apenas quando ela for a opcao selecionada.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Conta Whop do Checkout</Label>
                  {whopAccounts.length > 0 ? (
                    <select
                      value={config.selectedWhopAccountId}
                      onChange={(e) => handleUpdate("selectedWhopAccountId", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {whopAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      type="button"
                      onClick={() => router.push("/app/whop")}
                      className="w-full rounded-md border border-dashed px-3 py-3 text-left text-sm text-muted-foreground hover:bg-muted"
                    >
                      Nenhuma conta Whop disponivel. Clique aqui para configurar uma nova conta.
                    </button>
                  )}
                </div>

                {config.selectedWhopAccountId ? (
                  <div className="space-y-4 rounded-lg border p-3">
                    <div className="space-y-1">
                      <Label>Aparencia do Box Whop</Label>
                      <p className="text-xs text-muted-foreground">
                        Controles reais suportados pelo embed da Whop.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whop-theme">Tema do box</Label>
                      <select
                        id="whop-theme"
                        value={config.whopTheme}
                        onChange={(e) => handleUpdate("whopTheme", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {whopThemeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whop-accent-color">Cor de destaque</Label>
                      <select
                        id="whop-accent-color"
                        value={config.whopAccentColor}
                        onChange={(e) => handleUpdate("whopAccentColor", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {whopAccentOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="whop-high-contrast">Alto contraste</Label>
                        <p className="text-xs text-muted-foreground">
                          Melhor quando a cor de destaque for `gray`.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        id="whop-high-contrast"
                        checked={config.whopHighContrast}
                        onChange={(e) => handleUpdate("whopHighContrast", e.target.checked)}
                        className="h-4 w-4"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="whop-hide-price">Ocultar preco no box</Label>
                      <input
                        type="checkbox"
                        id="whop-hide-price"
                        checked={config.whopHidePrice}
                        onChange={(e) => handleUpdate("whopHidePrice", e.target.checked)}
                        className="h-4 w-4"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="whop-hide-terms">Ocultar termos e condicoes</Label>
                      <input
                        type="checkbox"
                        id="whop-hide-terms"
                        checked={config.whopHideTermsAndConditions}
                        onChange={(e) => handleUpdate("whopHideTermsAndConditions", e.target.checked)}
                        className="h-4 w-4"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="whop-padding-y">Espacamento vertical do box</Label>
                        <span className="text-xs text-muted-foreground">
                          {config.whopPaddingY}px
                        </span>
                      </div>
                      <input
                        id="whop-padding-y"
                        type="range"
                        min="0"
                        max="32"
                        step="2"
                        value={config.whopPaddingY}
                        onChange={(e) => handleUpdate("whopPaddingY", Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="locale-mode">Idioma do Checkout</Label>
                  <select
                    id="locale-mode"
                    value={config.localeMode}
                    onChange={(e) => handleUpdate("localeMode", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="manual">Manual</option>
                    <option value="auto">Deteccao por acesso</option>
                  </select>
                </div>

                {config.localeMode === "manual" ? (
                  <div className="space-y-2">
                    <Label htmlFor="locale">Idioma</Label>
                    <select
                      id="locale"
                      value={config.locale}
                      onChange={(e) => handleUpdate("locale", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {localeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Usa o idioma preferido do navegador do cliente com fallback seguro para o idioma manual configurado.
                  </p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="currency-mode">Moeda do Checkout</Label>
                  <select
                    id="currency-mode"
                    value={config.currencyMode}
                    onChange={(e) => handleUpdate("currencyMode", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="manual">Manual</option>
                    <option value="auto">Deteccao por acesso</option>
                  </select>
                </div>

                {config.currencyMode === "manual" ? (
                  <div className="space-y-2">
                    <Label htmlFor="currency">Moeda</Label>
                    <select
                      id="currency"
                      value={config.currency}
                      onChange={(e) => handleUpdate("currency", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {currencyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Usa mapeamento seguro por idioma detectado: `pt-BR` para `BRL`, `en-US` para `USD` e idiomas europeus para `EUR`.
                  </p>
                )}

                {isDanielLayout ? (
                  <div className="space-y-2">
                    <Label htmlFor="daniel-button-text">Texto do botao de compra</Label>
                    <Input
                      id="daniel-button-text"
                      value={config.buttonText}
                      onChange={(e) => handleUpdate("buttonText", e.target.value)}
                      placeholder="Finalizar compra"
                    />
                    <p className="text-xs text-muted-foreground">
                      Se ficar vazio, o checkout usa automaticamente o texto do idioma selecionado.
                    </p>
                  </div>
                ) : null}

                <div className="space-y-3 rounded-lg border p-3">
                  <Label>Fretes visiveis no checkout</Label>
                  <div className="space-y-2">
                    {shippingMethods.filter((method) => method.active).map((method) => (
                      <label key={method.id} className="flex items-start gap-3 rounded-md border p-3">
                        <input
                          type="checkbox"
                          checked={config.selectedShippingMethodIds.includes(method.id)}
                          onChange={() => handleToggleShippingMethod(method.id)}
                          className="mt-1 h-4 w-4"
                        />
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{method.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {method.description}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            R$ {method.price.toFixed(2)} • {method.eta}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {!isDanielLayout ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-policies">Exibir Politicas</Label>
                      <input type="checkbox" id="show-policies" checked={config.showPolicies} onChange={(e) => handleUpdate("showPolicies", e.target.checked)} className="h-4 w-4" />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-coupon-field">Exibir campo de cupom</Label>
                      <input
                        type="checkbox"
                        id="show-coupon-field"
                        checked={config.showCouponField}
                        onChange={(e) => handleUpdate("showCouponField", e.target.checked)}
                        className="h-4 w-4"
                      />
                    </div>

                    {config.showPolicies ? (
                      <div className="space-y-6">
                        <PolicyEditor
                          title="Politica de reembolso"
                          mode={config.refundPolicyMode}
                          url={config.refundPolicyUrl}
                          text={config.refundPolicyText}
                          onModeChange={(value) => handleUpdate("refundPolicyMode", value)}
                          onUrlChange={(value) => handleUpdate("refundPolicyUrl", value)}
                          onTextChange={(value) => handleUpdate("refundPolicyText", value)}
                        />
                        <PolicyEditor
                          title="Politica de privacidade"
                          mode={config.privacyPolicyMode}
                          url={config.privacyPolicyUrl}
                          text={config.privacyPolicyText}
                          onModeChange={(value) => handleUpdate("privacyPolicyMode", value)}
                          onUrlChange={(value) => handleUpdate("privacyPolicyUrl", value)}
                          onTextChange={(value) => handleUpdate("privacyPolicyText", value)}
                        />
                        <PolicyEditor
                          title="Termos de servico"
                          mode={config.termsPolicyMode}
                          url={config.termsPolicyUrl}
                          text={config.termsPolicyText}
                          onModeChange={(value) => handleUpdate("termsPolicyMode", value)}
                          onUrlChange={(value) => handleUpdate("termsPolicyUrl", value)}
                          onTextChange={(value) => handleUpdate("termsPolicyText", value)}
                        />
                      </div>
                    ) : null}
                  </>
                ) : null}
                  </>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </aside>

        <main className="flex flex-1 flex-col items-center justify-center overflow-auto bg-muted/50 p-8">
          <div className={cn("overflow-hidden border bg-white shadow-2xl transition-all duration-300 ease-in-out", activeDevice === "desktop" ? "h-[800px] w-full max-w-[1200px] rounded-lg" : "h-[667px] w-[375px] rounded-[2rem] border-[8px] border-zinc-900")}>
            <ScrollArea className="h-full w-full">
              <ShopifyCheckout
                config={config}
                device={activeDevice}
                previewPage={previewPage}
                shippingMethods={shippingMethods}
                storePreview={storePreview}
                onConfigUpdate={handleUpdate}
              />
            </ScrollArea>
          </div>

          <div className="mt-8 flex items-center gap-4 rounded-full border bg-background px-4 py-2 text-xs text-muted-foreground shadow-sm">
            <div className="flex items-center gap-1">
              <LayoutTemplate className="h-3 w-3" />
              <span>
                Baseado em: Shopify Checkout Extensibility {config.layoutStyle === "daniel" ? "• Swipe" : ""}
              </span>
            </div>
            <Separator orientation="vertical" className="h-3" />
            <span>{activeDevice === "desktop" ? "1280 x 800" : "375 x 667"}</span>
          </div>
        </main>
      </div>
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 p-1" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  )
}

function PolicyEditor({
  title,
  mode,
  url,
  text,
  onModeChange,
  onUrlChange,
  onTextChange,
}: {
  title: string
  mode: PolicyMode
  url: string
  text: string
  onModeChange: (value: PolicyMode) => void
  onUrlChange: (value: string) => void
  onTextChange: (value: string) => void
}) {
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <Label>{title}</Label>
      <div className="grid grid-cols-2 gap-2">
        <Button variant={mode === "text" ? "default" : "outline"} size="sm" onClick={() => onModeChange("text")}>
          Popup
        </Button>
        <Button variant={mode === "link" ? "default" : "outline"} size="sm" onClick={() => onModeChange("link")}>
          Link
        </Button>
      </div>

      {mode === "link" ? (
        <Input placeholder="https://..." value={url} onChange={(e) => onUrlChange(e.target.value)} />
      ) : (
        <div className="space-y-2">
          <Textarea rows={4} maxLength={POLICY_TEXT_MAX_LENGTH} value={text} onChange={(e) => onTextChange(e.target.value)} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Maximo de 1200 caracteres para manter o popup estavel em mobile e desktop.</span>
            <span>{text.length}/{POLICY_TEXT_MAX_LENGTH}</span>
          </div>
        </div>
      )}
    </div>
  )
}
