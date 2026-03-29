"use client"

import * as React from "react"
import { ChevronDown, Info, ShieldCheck, ShoppingBag } from "lucide-react"
import { WhopCheckoutEmbed, useCheckoutEmbedControls } from "@whop/checkout/react"

import { cn } from "@/lib/utils"
import { trackCheckoutBehaviorEvent } from "@/lib/checkout-behavior"
import { Button } from "@/components/ui/button"
import { OrderConfirmationCard } from "@/components/ui/order-confirmation-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { type ShippingMethod } from "@/lib/shipping-data"

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

type ThankYouMeta = {
  orderId: string
  paymentMethod: string
  dateTime?: string
  paidAt?: string
}

type CheckoutBehaviorTracking = {
  enabled: boolean
  checkoutId: string
  stage: "checkout" | "thank-you"
}

const CHECKOUT_CSS_SCOPE_SELECTOR = "[data-swipe-checkout-root]"

function findMatchingBrace(source: string, openIndex: number) {
  let depth = 0

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index]

    if (char === "{") depth += 1
    if (char === "}") {
      depth -= 1
      if (depth === 0) return index
    }
  }

  return -1
}

function scopeCheckoutSelector(selector: string) {
  const trimmed = selector.trim()
  if (!trimmed) return trimmed

  const replacedGlobals = trimmed
    .replace(/:root\b/gi, CHECKOUT_CSS_SCOPE_SELECTOR)
    .replace(/\bhtml\b/gi, CHECKOUT_CSS_SCOPE_SELECTOR)
    .replace(/\bbody\b/gi, CHECKOUT_CSS_SCOPE_SELECTOR)

  if (replacedGlobals.includes(CHECKOUT_CSS_SCOPE_SELECTOR)) {
    return replacedGlobals
  }

  if (/^(from|to|\d+%)$/i.test(replacedGlobals)) {
    return replacedGlobals
  }

  return `${CHECKOUT_CSS_SCOPE_SELECTOR} ${replacedGlobals}`
}

function scopeCheckoutCss(css: string) {
  if (!css.trim()) return ""

  let index = 0
  let result = ""

  while (index < css.length) {
    const openIndex = css.indexOf("{", index)
    if (openIndex === -1) {
      result += css.slice(index)
      break
    }

    const selector = css.slice(index, openIndex)
    const closeIndex = findMatchingBrace(css, openIndex)

    if (closeIndex === -1) {
      result += css.slice(index)
      break
    }

    const blockContent = css.slice(openIndex + 1, closeIndex)
    const trimmedSelector = selector.trim()

    if (/^@(-webkit-)?keyframes\b/i.test(trimmedSelector)) {
      result += `${selector}{${blockContent}}`
    } else if (/^@(media|supports|container|layer|document)\b/i.test(trimmedSelector)) {
      result += `${selector}{${scopeCheckoutCss(blockContent)}}`
    } else if (trimmedSelector.startsWith("@")) {
      result += `${selector}{${blockContent}}`
    } else {
      const scopedSelector = selector
        .split(",")
        .map((item) => scopeCheckoutSelector(item))
        .join(", ")
      result += `${scopedSelector}{${blockContent}}`
    }

    index = closeIndex + 1
  }

  return result
}

interface CheckoutConfig {
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
  layoutStyle: "classic" | "one-page"
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
  selectedStoreId?: string
  selectedWhopAccountId?: string
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

type Copy = {
  cart: string
  information: string
  payment: string
  contact: string
  fullName: string
  phone: string
  email: string
  newsletter: string
  delivery: string
  firstName: string
  lastName: string
  address: string
  city: string
  state: string
  zip: string
  paymentSafe: string
  embeddedGateway: string
  integratedPayment: string
  gatewayPlaceholder: string
  orderSummary: string
  showSummary: string
  couponPlaceholder: string
  apply: string
  subtotal: string
  shipping: string
  total: string
  shippingNextStep: string
  shippingBeforeConfirm: string
  securePayment: string
  realGatewayReady: string
  realGatewayPending: string
  refundPolicy: string
  privacyPolicy: string
  termsPolicy: string
  popupDescription: string
  variantDefault: string
  productName: string
  thankYouOrderSummary: string
  upsellBadge: string
  upsellAccepted: string
  shippingOptionsTitle: string
  shippingFillDelivery: string
}

const POLICY_TEXT_MAX_LENGTH = 1200
const FALLBACK_LOCALE: SupportedLocale = "pt-BR"
const FALLBACK_CURRENCY: SupportedCurrency = "BRL"
const UNRESOLVED_PRODUCT_NAME = "Produto da Shopify"
const UNRESOLVED_VARIANT_LABEL = "Variante real nao encontrada"

const LOCALE_TO_CURRENCY: Record<SupportedLocale, SupportedCurrency> = {
  "pt-BR": "BRL",
  "en-US": "USD",
  "es-ES": "EUR",
  "fr-FR": "EUR",
  "de-DE": "EUR",
}

const COPY: Record<SupportedLocale, Copy> = {
  "pt-BR": {
    cart: "Carrinho",
    information: "Informacoes",
    payment: "Pagamento",
    contact: "Contato",
    fullName: "Nome completo",
    phone: "Telefone",
    email: "E-mail",
    newsletter: "Quero receber novidades e ofertas exclusivas por e-mail",
    delivery: "Entrega",
    firstName: "Nome",
    lastName: "Sobrenome",
    address: "Endereco",
    city: "Cidade",
    state: "Estado",
    zip: "CEP",
    paymentSafe: "Todas as transacoes sao seguras e criptografadas.",
    embeddedGateway: "Whop Embedded Checkout",
    integratedPayment: "Pagamento integrado",
    gatewayPlaceholder: "O gateway de pagamento sera exibido aqui com seguranca.",
    orderSummary: "Resumo do pedido",
    showSummary: "Exibir resumo do pedido",
    couponPlaceholder: "Cupom ou desconto",
    apply: "Aplicar",
    subtotal: "Subtotal",
    shipping: "Frete",
    total: "Total",
    shippingNextStep: "Frete calculado no proximo passo",
    shippingBeforeConfirm: "Frete e taxas aparecem antes da confirmacao final.",
    securePayment: "Pagamento seguro e protegido.",
    realGatewayReady: "Checkout Whop real conectado e pronto para receber pagamentos.",
    realGatewayPending: "Conta Whop selecionada. Salve o checkout para publicar a sessao real.",
    refundPolicy: "Politica de reembolso",
    privacyPolicy: "Politica de privacidade",
    termsPolicy: "Termos de servico",
    popupDescription: "Conteudo exibido sem sair do checkout.",
    variantDefault: "Variante padrao",
    productName: "Produto",
    thankYouOrderSummary: "Resumo do pedido confirmado",
    upsellBadge: "Oferta adicional",
    upsellAccepted: "Oferta adicionada automaticamente ao pedido",
    shippingOptionsTitle: "Frete",
    shippingFillDelivery: "Preencha os dados de entrega para visualizar as opcoes de frete.",
  },
  "en-US": {
    cart: "Cart",
    information: "Information",
    payment: "Payment",
    contact: "Contact",
    fullName: "Full name",
    phone: "Phone",
    email: "Email",
    newsletter: "I want to receive updates and exclusive offers by email",
    delivery: "Delivery",
    firstName: "First name",
    lastName: "Last name",
    address: "Address",
    city: "City",
    state: "State",
    zip: "ZIP code",
    paymentSafe: "All transactions are secure and encrypted.",
    embeddedGateway: "Embedded checkout",
    integratedPayment: "Integrated payment",
    gatewayPlaceholder: "The payment gateway will be displayed here securely.",
    orderSummary: "Order summary",
    showSummary: "Show order summary",
    couponPlaceholder: "Gift card or discount code",
    apply: "Apply",
    subtotal: "Subtotal",
    shipping: "Shipping",
    total: "Total",
    shippingNextStep: "Shipping calculated on the next step",
    shippingBeforeConfirm: "Shipping and fees appear before final confirmation.",
    securePayment: "Secure and protected payment.",
    realGatewayReady: "Real Whop checkout connected and ready to receive payments.",
    realGatewayPending: "Whop account selected. Save the checkout to publish the real session.",
    refundPolicy: "Refund policy",
    privacyPolicy: "Privacy policy",
    termsPolicy: "Terms of service",
    popupDescription: "Content displayed without leaving checkout.",
    variantDefault: "Default variant",
    productName: "Product",
    thankYouOrderSummary: "Confirmed order summary",
    upsellBadge: "Additional offer",
    upsellAccepted: "Offer added automatically to the order",
    shippingOptionsTitle: "Shipping",
    shippingFillDelivery: "Fill in the delivery details to see available shipping options.",
  },
  "es-ES": {
    cart: "Carrito",
    information: "Informacion",
    payment: "Pago",
    contact: "Contacto",
    fullName: "Nombre completo",
    phone: "Telefono",
    email: "Correo electronico",
    newsletter: "Quiero recibir novedades y ofertas exclusivas por correo",
    delivery: "Entrega",
    firstName: "Nombre",
    lastName: "Apellido",
    address: "Direccion",
    city: "Ciudad",
    state: "Provincia",
    zip: "Codigo postal",
    paymentSafe: "Todas las transacciones son seguras y cifradas.",
    embeddedGateway: "Checkout embebido",
    integratedPayment: "Pago integrado",
    gatewayPlaceholder: "La pasarela de pago se mostrara aqui de forma segura.",
    orderSummary: "Resumen del pedido",
    showSummary: "Mostrar resumen del pedido",
    couponPlaceholder: "Cupon o descuento",
    apply: "Aplicar",
    subtotal: "Subtotal",
    shipping: "Envio",
    total: "Total",
    shippingNextStep: "El envio se calcula en el siguiente paso",
    shippingBeforeConfirm: "El envio y las tasas aparecen antes de la confirmacion final.",
    securePayment: "Pago seguro y protegido.",
    realGatewayReady: "Checkout real de Whop conectado y listo para recibir pagos.",
    realGatewayPending: "Cuenta de Whop seleccionada. Guarda el checkout para publicar la sesion real.",
    refundPolicy: "Politica de reembolso",
    privacyPolicy: "Politica de privacidad",
    termsPolicy: "Terminos del servicio",
    popupDescription: "Contenido mostrado sin salir del checkout.",
    variantDefault: "Variante predeterminada",
    productName: "Producto",
    thankYouOrderSummary: "Resumen del pedido confirmado",
    upsellBadge: "Oferta adicional",
    upsellAccepted: "Oferta agregada automaticamente al pedido",
    shippingOptionsTitle: "Envio",
    shippingFillDelivery: "Completa los datos de entrega para ver las opciones de envio.",
  },
  "fr-FR": {
    cart: "Panier",
    information: "Informations",
    payment: "Paiement",
    contact: "Contact",
    fullName: "Nom complet",
    phone: "Telephone",
    email: "E-mail",
    newsletter: "Je souhaite recevoir des nouveautes et offres exclusives par e-mail",
    delivery: "Livraison",
    firstName: "Prenom",
    lastName: "Nom",
    address: "Adresse",
    city: "Ville",
    state: "Region",
    zip: "Code postal",
    paymentSafe: "Toutes les transactions sont securisees et chiffrees.",
    embeddedGateway: "Checkout integre",
    integratedPayment: "Paiement integre",
    gatewayPlaceholder: "La passerelle de paiement sera affichee ici en toute securite.",
    orderSummary: "Resume de la commande",
    showSummary: "Afficher le resume de la commande",
    couponPlaceholder: "Code promo ou reduction",
    apply: "Appliquer",
    subtotal: "Sous-total",
    shipping: "Livraison",
    total: "Total",
    shippingNextStep: "Livraison calculee a l'etape suivante",
    shippingBeforeConfirm: "La livraison et les frais apparaissent avant la confirmation finale.",
    securePayment: "Paiement securise et protege.",
    realGatewayReady: "Checkout Whop reel connecte et pret a recevoir les paiements.",
    realGatewayPending: "Compte Whop selectionne. Enregistrez le checkout pour publier la session reelle.",
    refundPolicy: "Politique de remboursement",
    privacyPolicy: "Politique de confidentialite",
    termsPolicy: "Conditions d'utilisation",
    popupDescription: "Contenu affiche sans quitter le checkout.",
    variantDefault: "Variante par defaut",
    productName: "Produit",
    thankYouOrderSummary: "Resume de commande confirme",
    upsellBadge: "Offre additionnelle",
    upsellAccepted: "Offre ajoutee automatiquement a la commande",
    shippingOptionsTitle: "Livraison",
    shippingFillDelivery: "Renseignez les informations de livraison pour voir les options disponibles.",
  },
  "de-DE": {
    cart: "Warenkorb",
    information: "Informationen",
    payment: "Zahlung",
    contact: "Kontakt",
    fullName: "Vollstandiger Name",
    phone: "Telefon",
    email: "E-Mail",
    newsletter: "Ich mochte Neuigkeiten und exklusive Angebote per E-Mail erhalten",
    delivery: "Lieferung",
    firstName: "Vorname",
    lastName: "Nachname",
    address: "Adresse",
    city: "Stadt",
    state: "Bundesland",
    zip: "PLZ",
    paymentSafe: "Alle Transaktionen sind sicher und verschlusselt.",
    embeddedGateway: "Eingebetteter Checkout",
    integratedPayment: "Integrierte Zahlung",
    gatewayPlaceholder: "Das Zahlungs-Gateway wird hier sicher angezeigt.",
    orderSummary: "Bestellubersicht",
    showSummary: "Bestellubersicht anzeigen",
    couponPlaceholder: "Gutschein oder Rabattcode",
    apply: "Anwenden",
    subtotal: "Zwischensumme",
    shipping: "Versand",
    total: "Gesamt",
    shippingNextStep: "Versand wird im nachsten Schritt berechnet",
    shippingBeforeConfirm: "Versand und Gebuhren erscheinen vor der finalen Bestatigung.",
    securePayment: "Sichere und geschutzte Zahlung.",
    realGatewayReady: "Realer Whop-Checkout ist verbunden und bereit fur Zahlungen.",
    realGatewayPending: "Whop-Konto ausgewahlt. Speichern Sie den Checkout, um die echte Sitzung zu veroffentlichen.",
    refundPolicy: "Ruckerstattungsrichtlinie",
    privacyPolicy: "Datenschutzrichtlinie",
    termsPolicy: "Nutzungsbedingungen",
    popupDescription: "Inhalt wird angezeigt, ohne den Checkout zu verlassen.",
    variantDefault: "Standardvariante",
    productName: "Produkt",
    thankYouOrderSummary: "Bestatigte Bestellubersicht",
    upsellBadge: "Zusatzangebot",
    upsellAccepted: "Angebot wurde automatisch zur Bestellung hinzugefugt",
    shippingOptionsTitle: "Versand",
    shippingFillDelivery: "Fullen Sie die Lieferdaten aus, um verfugbare Versandoptionen zu sehen.",
  },
}

export function ShopifyCheckout({
  config,
  device,
  previewPage,
  shippingMethods,
  storePreview,
  onConfigUpdate,
  behaviorTracking,
  thankYouMeta,
}: {
  config: CheckoutConfig
  device: "desktop" | "mobile"
  previewPage: "checkout" | "thank-you"
  shippingMethods: ShippingMethod[]
  storePreview?: ShopifyStorePreview | null
  onConfigUpdate?: (key: keyof CheckoutConfig, value: string | boolean | number) => void
  behaviorTracking?: CheckoutBehaviorTracking
  thankYouMeta?: ThankYouMeta
}) {
  const [isSummaryOpen, setIsSummaryOpen] = React.useState(false)
  const [resolvedLocale, setResolvedLocale] = React.useState<SupportedLocale>(config.locale)
  const [resolvedCurrency, setResolvedCurrency] = React.useState<SupportedCurrency>(config.currency)
  const [contactData, setContactData] = React.useState({
    fullName: "",
    phone: "",
    email: "",
  })
  const [deliveryData, setDeliveryData] = React.useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  })
  const [selectedShippingId, setSelectedShippingId] = React.useState<string | null>(null)
  const isMobile = device === "mobile"
  const isOnePage = config.layoutStyle === "one-page"
  const behaviorEnabled = Boolean(behaviorTracking?.enabled && behaviorTracking.checkoutId)

  React.useEffect(() => {
    const locale = resolveLocale(config.localeMode, config.locale)
    const currency = resolveCurrency(config.currencyMode, config.currency, locale)
    setResolvedLocale(locale)
    setResolvedCurrency(currency)
  }, [config.currency, config.currencyMode, config.locale, config.localeMode])

  React.useEffect(() => {
    const fullName = contactData.fullName.trim()
    if (!fullName) return

    setDeliveryData((prev) => {
      if (prev.firstName.trim() || prev.lastName.trim()) {
        return prev
      }

      const parts = fullName.split(/\s+/).filter(Boolean)
      if (parts.length === 0) {
        return prev
      }

      const [firstName, ...rest] = parts
      return {
        ...prev,
        firstName,
        lastName: rest.join(" "),
      }
    })
  }, [contactData.fullName])

  React.useEffect(() => {
    if (typeof document === "undefined") return

    const previousHtmlLang = document.documentElement.lang
    const previousBodyLang = document.body.lang

    document.documentElement.lang = resolvedLocale
    document.body.lang = resolvedLocale

    return () => {
      document.documentElement.lang = previousHtmlLang
      document.body.lang = previousBodyLang
    }
  }, [resolvedLocale])

  const copy = COPY[resolvedLocale] ?? COPY[FALLBACK_LOCALE]
  const availableShippingMethods = shippingMethods.filter(
    (method) =>
      method.active && config.selectedShippingMethodIds.includes(method.id)
  )
  const hasRealWhopPayment = Boolean(config.whop?.checkoutConfigurationId || config.whop?.planId)
  const deliveryCompleted = Object.values(deliveryData).every((value) => value.trim().length > 0)
  const selectedShipping =
    availableShippingMethods.find((method) => method.id === selectedShippingId) ?? null
  const effectiveCurrency = storePreview?.currency ?? resolvedCurrency
  const hasSelectedStore = Boolean(config.selectedStoreId)
  const productName =
    storePreview?.productName ||
    (hasSelectedStore ? UNRESOLVED_PRODUCT_NAME : resolveConfiguredProductName(config, copy))
  const variantLabel =
    storePreview?.variantLabel ||
    (hasSelectedStore ? UNRESOLVED_VARIANT_LABEL : resolveConfiguredVariantLabel(config, copy))
  const productImageSrc = storePreview?.imageSrc
  const basePrice =
    storePreview?.amount ?? (hasSelectedStore ? 0 : resolveConfiguredBasePrice(config))
  const shippingPrice = selectedShipping?.price ?? 0
  const totalPrice = basePrice + shippingPrice
  const formattedPrice = formatPrice(basePrice, resolvedLocale, effectiveCurrency)
  const formattedTotalPrice = formatPrice(totalPrice, resolvedLocale, effectiveCurrency)
  const scopedCustomCss = React.useMemo(() => scopeCheckoutCss(config.customCss ?? ""), [config.customCss])

  React.useEffect(() => {
    if (!behaviorEnabled || !behaviorTracking) return

    if (behaviorTracking.stage === "checkout") {
      void trackCheckoutBehaviorEvent({
        checkoutId: behaviorTracking.checkoutId,
        eventType: "checkout_viewed",
        metadata: {
          device,
          layoutStyle: config.layoutStyle,
        },
      })
      return
    }

    if (behaviorTracking.stage === "thank-you") {
      void trackCheckoutBehaviorEvent({
        checkoutId: behaviorTracking.checkoutId,
        eventType: "order_completed",
        metadata: {
          device,
          layoutStyle: config.layoutStyle,
        },
      })
    }
  }, [behaviorEnabled, behaviorTracking, config.layoutStyle, device])

  React.useEffect(() => {
    if (!behaviorEnabled || previewPage !== "checkout" || !behaviorTracking) return

    const hasStartedContact = Object.values(contactData).some((value) => value.trim().length > 0)
    if (!hasStartedContact) return

    void trackCheckoutBehaviorEvent({
      checkoutId: behaviorTracking.checkoutId,
      eventType: "contact_started",
      metadata: {
        device,
      },
    })
  }, [behaviorEnabled, behaviorTracking, contactData, device, previewPage])

  React.useEffect(() => {
    if (!behaviorEnabled || previewPage !== "checkout" || !behaviorTracking) return

    const hasTypedDelivery =
      deliveryData.address.trim().length > 0 ||
      deliveryData.city.trim().length > 0 ||
      deliveryData.state.trim().length > 0 ||
      deliveryData.zip.trim().length > 0 ||
      (!contactData.fullName.trim() &&
        (deliveryData.firstName.trim().length > 0 || deliveryData.lastName.trim().length > 0))

    if (!hasTypedDelivery) return

    void trackCheckoutBehaviorEvent({
      checkoutId: behaviorTracking.checkoutId,
      eventType: "delivery_started",
      metadata: {
        device,
      },
    })
  }, [behaviorEnabled, behaviorTracking, contactData.fullName, deliveryData, device, previewPage])

  if (previewPage === "thank-you") {
    return (
      <ThankYouPage
        config={config}
        formattedPrice={formattedTotalPrice}
        device={device}
        storePreview={storePreview}
        thankYouMeta={thankYouMeta}
      />
    )
  }

  return (
    <div
      className={cn("min-h-full", config.fontFamily)}
      data-swipe-checkout-root=""
      data-swipe-device={device}
      data-swipe-layout-style={config.layoutStyle}
      data-swipe-page="checkout"
      style={{ backgroundColor: config.checkoutBackgroundColor, color: config.checkoutTextColor }}
    >
      {scopedCustomCss ? <style dangerouslySetInnerHTML={{ __html: scopedCustomCss }} /> : null}
      {isMobile && !isOnePage ? (
        <div className="border-b p-4" style={{ backgroundColor: config.checkoutSurfaceColor, borderColor: config.checkoutMutedColor }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <ShoppingBag className="h-4 w-4" />
              <button onClick={() => setIsSummaryOpen(!isSummaryOpen)} className="flex items-center gap-1" style={{ color: config.checkoutAccentColor }}>
                {copy.showSummary}
                <ChevronDown className={cn("h-4 w-4 transition-transform", isSummaryOpen && "rotate-180")} />
              </button>
            </div>
            <span className="text-lg font-medium">{formattedPrice}</span>
          </div>
          {isSummaryOpen ? (
            <div className="mt-4 space-y-4">
              <OrderItem config={config} name={productName} price={formattedPrice} variantLabel={variantLabel} imageSrc={productImageSrc} />
              <Separator style={{ backgroundColor: config.checkoutMutedColor }} />
              <SummaryRows copy={copy} config={config} subtotalPrice={formattedPrice} shippingPrice={shippingPrice} totalPrice={formattedTotalPrice} locale={resolvedLocale} currency={effectiveCurrency} />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={cn("min-h-full", isOnePage ? "mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10" : isMobile ? "px-6 py-7" : "flex min-h-full")}>
        {isOnePage ? (
          <div className={cn("grid gap-8", isMobile ? "grid-cols-1" : "grid-cols-[minmax(0,1.2fr)_380px]")}>
            <div className="space-y-8">
              <CheckoutBrand config={config} />
              <CheckoutTopBlock config={config} copy={copy} accentColor={config.checkoutAccentColor} isMobile={isMobile} />
              <ContactSection
                config={config}
                compact={isMobile}
                copy={copy}
                contactData={contactData}
                onChange={setContactData}
              />
              <DeliverySection config={config} compact={isMobile} copy={copy} deliveryData={deliveryData} onChange={setDeliveryData} />
              <ShippingSection
                config={config}
                copy={copy}
                deliveryCompleted={deliveryCompleted}
                methods={availableShippingMethods}
                selectedShippingId={selectedShippingId}
                onSelect={setSelectedShippingId}
                locale={resolvedLocale}
                currency={effectiveCurrency}
              />
              <PaymentSection
                config={config}
                copy={copy}
                locale={resolvedLocale}
                contactData={contactData}
                deliveryData={deliveryData}
                onPaymentViewed={
                  behaviorEnabled && behaviorTracking
                    ? () =>
                        trackCheckoutBehaviorEvent({
                          checkoutId: behaviorTracking.checkoutId,
                          eventType: "payment_viewed",
                          metadata: {
                            device,
                          },
                        })
                    : undefined
                }
                onPaymentStarted={
                  behaviorEnabled && behaviorTracking
                    ? () =>
                        trackCheckoutBehaviorEvent({
                          checkoutId: behaviorTracking.checkoutId,
                          eventType: "payment_started",
                          metadata: {
                            device,
                          },
                        })
                    : undefined
                }
              />
              <CheckoutFooter compact={isMobile} config={config} copy={copy} />
            </div>

            <aside className="h-fit rounded-2xl border p-5 lg:sticky lg:top-8" style={{ backgroundColor: config.checkoutSurfaceColor, borderColor: config.checkoutMutedColor }}>
              <div className="space-y-6">
                <div className="border-b pb-4" style={{ borderColor: config.checkoutMutedColor }}>
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: config.checkoutMutedColor }}>{copy.orderSummary}</p>
                </div>
                <OrderItem config={config} name={productName} price={formattedPrice} variantLabel={variantLabel} imageSrc={productImageSrc} />
                {config.showCouponField ? <CouponBar config={config} copy={copy} /> : null}
                <SummaryRows copy={copy} config={config} subtotalPrice={formattedPrice} shippingPrice={shippingPrice} totalPrice={formattedTotalPrice} locale={resolvedLocale} currency={effectiveCurrency} />
                <InfoBanner config={config} text={copy.shippingBeforeConfirm} />
                {!hasRealWhopPayment ? <BuyButton config={config} label={config.buttonText} /> : null}
                <PolicyLinks config={config} compact={isMobile} copy={copy} />
              </div>
            </aside>
          </div>
        ) : (
          <>
            <div className={cn("flex-1", isMobile ? "" : "max-w-[60%] p-12 pr-8")}>
            <div className={cn("mx-auto space-y-8", isMobile ? "max-w-none" : "max-w-[600px]")}>
              <CheckoutBrand config={config} />
              <CheckoutTopBlock config={config} copy={copy} accentColor={config.checkoutAccentColor} isMobile={isMobile} />
              <ContactSection
                config={config}
                compact={isMobile}
                copy={copy}
                contactData={contactData}
                onChange={setContactData}
              />
              <DeliverySection config={config} compact={isMobile} copy={copy} deliveryData={deliveryData} onChange={setDeliveryData} />
                <ShippingSection
                  config={config}
                  copy={copy}
                  deliveryCompleted={deliveryCompleted}
                  methods={availableShippingMethods}
                  selectedShippingId={selectedShippingId}
                  onSelect={setSelectedShippingId}
                  locale={resolvedLocale}
                  currency={effectiveCurrency}
                />
                <PaymentSection
                  config={config}
                  copy={copy}
                  locale={resolvedLocale}
                  contactData={contactData}
                  deliveryData={deliveryData}
                  onPaymentViewed={
                    behaviorEnabled && behaviorTracking
                      ? () =>
                          trackCheckoutBehaviorEvent({
                            checkoutId: behaviorTracking.checkoutId,
                            eventType: "payment_viewed",
                            metadata: {
                              device,
                            },
                          })
                      : undefined
                  }
                  onPaymentStarted={
                    behaviorEnabled && behaviorTracking
                      ? () =>
                          trackCheckoutBehaviorEvent({
                            checkoutId: behaviorTracking.checkoutId,
                            eventType: "payment_started",
                            metadata: {
                              device,
                            },
                          })
                      : undefined
                  }
                />
                {!hasRealWhopPayment ? (
                  <div className="pt-6">
                    <BuyButton config={config} label={config.buttonText} />
                  </div>
                ) : null}
                <PolicyLinks config={config} compact={isMobile} copy={copy} />
                <CheckoutFooter compact={isMobile} config={config} copy={copy} />
              </div>
            </div>

            {!isMobile ? (
              <div className="flex-1 border-l p-12 pl-8" style={{ backgroundColor: config.checkoutSurfaceColor, borderColor: config.checkoutMutedColor }}>
                <div className="max-w-[400px] space-y-6">
                  <OrderItem config={config} name={productName} price={formattedPrice} variantLabel={variantLabel} imageSrc={productImageSrc} />
                  {config.showCouponField ? <CouponBar config={config} copy={copy} /> : null}
                  <SummaryRows copy={copy} config={config} subtotalPrice={formattedPrice} shippingPrice={shippingPrice} totalPrice={formattedTotalPrice} locale={resolvedLocale} currency={effectiveCurrency} />
                  <InfoBanner config={config} text={copy.shippingNextStep} />
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

function ThankYouPage({
  config,
  formattedPrice,
  device,
  storePreview,
  thankYouMeta,
}: {
  config: CheckoutConfig
  formattedPrice: string
  device: "desktop" | "mobile"
  storePreview?: ShopifyStorePreview | null
  thankYouMeta?: ThankYouMeta
}) {
  const locale = resolveLocale(config.localeMode, config.locale)
  const copy = COPY[locale] ?? COPY[FALLBACK_LOCALE]
  const thankYouBackgroundSrc =
    device === "mobile"
      ? config.thankYouBackgroundMobileSrc
      : config.thankYouBackgroundDesktopSrc
  const thankYouCardBackgroundSrc =
    device === "mobile"
      ? config.thankYouCardBackgroundMobileSrc
      : config.thankYouCardBackgroundDesktopSrc
  const thankYouCardBackgroundSize =
    device === "mobile"
      ? config.thankYouCardBackgroundMobileSize
      : config.thankYouCardBackgroundDesktopSize
  const thankYouTitle = config.thankYouTitle?.trim() || "Pedido confirmado com sucesso"
  const thankYouMessage = config.thankYouMessage?.trim()
  const thankYouButtonText = config.thankYouButtonText?.trim() || "Ir para minha conta"
  const resolvedStoreUrl = normalizeThankYouUrl(storePreview?.storeUrl)
  const thankYouButtonHref = resolveThankYouTargetUrl({
    mode: config.thankYouButtonTarget,
    manualUrl: config.thankYouButtonUrl,
    storeUrl: resolvedStoreUrl,
  })
  const autoRedirectHref = resolveThankYouTargetUrl({
    mode: config.thankYouAutoRedirectTarget,
    manualUrl: config.thankYouAutoRedirectUrl,
    storeUrl: resolvedStoreUrl,
  })
  const autoRedirectDelaySeconds =
    Number.isFinite(config.thankYouAutoRedirectDelaySeconds) &&
    config.thankYouAutoRedirectDelaySeconds > 0
      ? Math.round(config.thankYouAutoRedirectDelaySeconds)
      : 10
  const autoRedirectEnabled = Boolean(config.thankYouAutoRedirectEnabled && autoRedirectHref)
  const [secondsRemaining, setSecondsRemaining] = React.useState(autoRedirectDelaySeconds)
  const formattedDateTime = React.useMemo(() => {
    if (thankYouMeta?.paidAt) {
      try {
        return new Intl.DateTimeFormat(locale, {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(thankYouMeta.paidAt))
      } catch {
        return thankYouMeta.dateTime ?? new Date().toLocaleString(locale)
      }
    }

    return thankYouMeta?.dateTime ?? new Date().toLocaleString(locale)
  }, [locale, thankYouMeta?.dateTime, thankYouMeta?.paidAt])

  React.useEffect(() => {
    setSecondsRemaining(autoRedirectDelaySeconds)
  }, [autoRedirectDelaySeconds, autoRedirectHref])

  React.useEffect(() => {
    if (!autoRedirectEnabled || !autoRedirectHref || typeof window === "undefined") {
      return
    }

    const startedAt = Date.now()
    const countdown = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000)
      const nextRemaining = Math.max(autoRedirectDelaySeconds - elapsedSeconds, 0)
      setSecondsRemaining(nextRemaining)
    }, 250)

    const timeout = window.setTimeout(() => {
      window.location.href = autoRedirectHref
    }, autoRedirectDelaySeconds * 1000)

    return () => {
      window.clearInterval(countdown)
      window.clearTimeout(timeout)
    }
  }, [autoRedirectDelaySeconds, autoRedirectEnabled, autoRedirectHref])

  const countdownText = autoRedirectEnabled
    ? locale === "en-US"
      ? `Redirecting automatically in ${secondsRemaining}s.`
      : locale === "es-ES"
        ? `Redireccionamiento automatico en ${secondsRemaining}s.`
        : locale === "fr-FR"
          ? `Redirection automatique dans ${secondsRemaining}s.`
          : locale === "de-DE"
            ? `Automatische Weiterleitung in ${secondsRemaining}s.`
            : `Redirecionando automaticamente em ${secondsRemaining}s.`
    : undefined
  const scopedCustomCss = React.useMemo(() => scopeCheckoutCss(config.customCss ?? ""), [config.customCss])
  const confirmationCard = (
    <OrderConfirmationCard
      orderId={thankYouMeta?.orderId ?? "SWIPE"}
      paymentMethod={thankYouMeta?.paymentMethod ?? "Whop"}
      dateTime={formattedDateTime}
      totalAmount={formattedPrice}
      productName={storePreview?.productName}
      productVariant={storePreview?.variantLabel}
      title={thankYouTitle}
      description={thankYouMessage}
      buttonText={thankYouButtonText}
      buttonVisible={Boolean(config.thankYouButtonEnabled && thankYouButtonHref)}
      labels={{
        orderId: locale === "en-US" ? "Order ID" : locale === "es-ES" ? "Pedido" : locale === "fr-FR" ? "Commande" : locale === "de-DE" ? "Bestellung" : "Pedido",
        paymentMethod:
          locale === "en-US"
            ? "Payment Method"
            : locale === "es-ES"
              ? "Metodo de pago"
              : locale === "fr-FR"
                ? "Paiement"
                : locale === "de-DE"
                  ? "Zahlungsart"
                  : "Pagamento",
        dateTime:
          locale === "en-US"
            ? "Date & Time"
            : locale === "es-ES"
              ? "Fecha y hora"
              : locale === "fr-FR"
                ? "Date et heure"
                : locale === "de-DE"
                  ? "Datum und Uhrzeit"
                  : "Data e hora",
        total: copy.total,
        product:
          locale === "en-US"
            ? "Product"
            : locale === "es-ES"
              ? "Producto"
              : locale === "fr-FR"
                ? "Produit"
                : locale === "de-DE"
                  ? "Produkt"
                  : "Produto",
      }}
      countdownText={countdownText}
      borderRadius={config.borderRadius}
      surfaceColor={config.checkoutSurfaceColor}
      borderColor={config.checkoutMutedColor}
      textColor={config.checkoutTextColor}
      mutedColor={withAlpha(config.checkoutTextColor, 0.7)}
      accentColor={config.primaryColor || config.checkoutAccentColor}
      icon={<CheckCircleBadge accentColor={config.checkoutAccentColor} />}
      onGoToAccount={() => {
        if (typeof window === "undefined" || !thankYouButtonHref) return
        window.location.href = thankYouButtonHref
      }}
      className="max-w-[420px] shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
    />
  )

  return (
    <div
      className={cn("flex min-h-full items-center justify-center px-4 py-8 sm:px-6 sm:py-10", config.fontFamily)}
      data-swipe-checkout-root=""
      data-swipe-device={device}
      data-swipe-layout-style={config.layoutStyle}
      data-swipe-page="thank-you"
      style={{
        backgroundColor: config.checkoutBackgroundColor,
        color: config.checkoutTextColor,
        backgroundImage: thankYouBackgroundSrc ? `url(${thankYouBackgroundSrc})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {scopedCustomCss ? <style dangerouslySetInnerHTML={{ __html: scopedCustomCss }} /> : null}
      <div
        className="w-full max-w-[520px] rounded-[28px] border p-5 text-center shadow-sm sm:p-8"
        style={{
          backgroundColor: config.checkoutSurfaceColor,
          borderColor: config.checkoutMutedColor,
          backgroundImage: thankYouCardBackgroundSrc ? `url(${thankYouCardBackgroundSrc})` : undefined,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: `${thankYouCardBackgroundSize}%`,
        }}
      >
        <div className="mx-auto flex min-h-full w-full max-w-[420px] items-center justify-center py-3 sm:py-6">
          {confirmationCard}
        </div>
      </div>
    </div>
  )
}

function normalizeThankYouUrl(value?: string | null) {
  if (!value) return ""
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed.replace(/^\/+/, "")}`
}

function resolveThankYouTargetUrl(input: {
  mode?: "store" | "manual"
  manualUrl?: string | null
  storeUrl?: string | null
}) {
  if (input.mode === "store") {
    return normalizeThankYouUrl(input.storeUrl)
  }

  if (input.mode === "manual") {
    return normalizeThankYouUrl(input.manualUrl)
  }

  return normalizeThankYouUrl(input.manualUrl) || normalizeThankYouUrl(input.storeUrl) || "/app"
}

function CheckCircleBadge({ accentColor }: { accentColor: string }) {
  return (
    <div
      className="flex h-16 w-16 items-center justify-center rounded-full border"
      style={{
        borderColor: withAlpha(accentColor, 0.2),
        backgroundColor: withAlpha(accentColor, 0.08),
        color: accentColor,
      }}
    >
      <ShieldCheck className="h-8 w-8" />
    </div>
  )
}

function CheckoutBrand({ config }: { config: CheckoutConfig }) {
  return config.showLogo ? (
    config.logoDisplayMode === "image" && config.logoSrc ? (
      <div className="flex items-center">
        <img src={config.logoSrc} alt={config.companyName} className="h-auto max-w-full object-contain" style={{ width: `${config.logoWidth}px` }} />
      </div>
    ) : (
      <div className="text-2xl font-bold tracking-tight" style={{ color: config.checkoutTextColor }}>
        {config.companyName}
      </div>
    )
  ) : (
    <div className="h-0" />
  )
}

function CheckoutTopBlock({
  config,
  copy,
  accentColor,
  isMobile,
}: {
  config: CheckoutConfig
  copy: Copy
  accentColor: string
  isMobile: boolean
}) {
  if (config.showCheckoutSteps) {
    return <CheckoutProgress copy={copy} accentColor={accentColor} />
  }

  const bannerSrc = isMobile ? config.bannerMobileSrc : config.bannerDesktopSrc

  if (bannerSrc) {
    return (
      <div
        className={cn("overflow-hidden bg-white", config.bannerFullBleed ? "-mx-6 rounded-none border-0 sm:-mx-8 lg:-mx-10" : "rounded-2xl border")}
        style={{ borderColor: config.checkoutMutedColor }}
      >
        <img
          src={bannerSrc}
          alt="Banner do checkout"
          className="h-auto w-full object-cover"
          style={{ aspectRatio: isMobile ? "375 / 140" : "1200 / 220" }}
        />
      </div>
    )
  }

  return null
}

function CheckoutProgress({ copy, accentColor }: { copy: Copy; accentColor: string }) {
  return (
    <nav className="flex items-center gap-2 text-xs" style={{ color: accentColor }}>
      <span>{copy.cart}</span>
      <ChevronDown className="h-3 w-3 -rotate-90" />
      <span className="font-medium">{copy.information}</span>
      <ChevronDown className="h-3 w-3 -rotate-90" />
      <span>{copy.payment}</span>
    </nav>
  )
}

function ContactSection({
  config,
  compact,
  copy,
  contactData,
  onChange,
}: {
  config: CheckoutConfig
  compact: boolean
  copy: Copy
  contactData: {
    fullName: string
    phone: string
    email: string
  }
  onChange: React.Dispatch<
    React.SetStateAction<{
      fullName: string
      phone: string
      email: string
    }>
  >
}) {
  return (
    <section className="space-y-4">
      <div className={cn("gap-2", compact ? "space-y-2" : "flex items-center justify-between")}>
        <h2 className="text-lg font-medium" style={{ color: config.checkoutTextColor }}>{copy.contact}</h2>
      </div>
      <Input
        placeholder={copy.fullName}
        className="h-11"
        style={{ borderColor: config.checkoutMutedColor }}
        autoComplete="name"
        value={contactData.fullName}
        onChange={(e) => onChange((prev) => ({ ...prev, fullName: e.target.value }))}
      />
      <Input
        placeholder={copy.phone}
        className="h-11"
        style={{ borderColor: config.checkoutMutedColor }}
        autoComplete="tel"
        value={contactData.phone}
        onChange={(e) => onChange((prev) => ({ ...prev, phone: e.target.value }))}
      />
      <Input
        placeholder={copy.email}
        className="h-11"
        style={{ borderColor: config.checkoutMutedColor }}
        autoComplete="email"
        value={contactData.email}
        onChange={(e) => onChange((prev) => ({ ...prev, email: e.target.value }))}
      />
      <div className={cn("flex items-start gap-2", compact && "leading-5")}>
        <input type="checkbox" id="newsletter" className="mt-1 h-4 w-4 rounded" style={{ accentColor: config.checkoutAccentColor }} />
        <Label htmlFor="newsletter" className="text-sm font-normal" style={{ color: config.checkoutTextColor }}>{copy.newsletter}</Label>
      </div>
    </section>
  )
}

function DeliverySection({
  config,
  compact,
  copy,
  deliveryData,
  onChange,
}: {
  config: CheckoutConfig
  compact: boolean
  copy: Copy
  deliveryData: {
    firstName: string
    lastName: string
    address: string
    city: string
    state: string
    zip: string
  }
  onChange: React.Dispatch<
    React.SetStateAction<{
      firstName: string
      lastName: string
      address: string
      city: string
      state: string
      zip: string
    }>
  >
}) {
  return (
    <section className="space-y-4 pt-4">
      <h2 className="text-lg font-medium" style={{ color: config.checkoutTextColor }}>{copy.delivery}</h2>
      <div className={cn("gap-4", compact ? "grid grid-cols-1" : "grid grid-cols-2")}>
        <Input placeholder={copy.firstName} className="h-11" style={{ borderColor: config.checkoutMutedColor }} autoComplete="given-name" value={deliveryData.firstName} onChange={(e) => onChange((prev) => ({ ...prev, firstName: e.target.value }))} />
        <Input placeholder={copy.lastName} className="h-11" style={{ borderColor: config.checkoutMutedColor }} autoComplete="family-name" value={deliveryData.lastName} onChange={(e) => onChange((prev) => ({ ...prev, lastName: e.target.value }))} />
      </div>
      <Input placeholder={copy.address} className="h-11" style={{ borderColor: config.checkoutMutedColor }} autoComplete="address-line1" value={deliveryData.address} onChange={(e) => onChange((prev) => ({ ...prev, address: e.target.value }))} />
      <div className={cn("gap-4", compact ? "grid grid-cols-1" : "grid grid-cols-3")}>
        <Input placeholder={copy.city} className="h-11" style={{ borderColor: config.checkoutMutedColor }} autoComplete="address-level2" value={deliveryData.city} onChange={(e) => onChange((prev) => ({ ...prev, city: e.target.value }))} />
        <Input placeholder={copy.state} className="h-11" style={{ borderColor: config.checkoutMutedColor }} autoComplete="address-level1" value={deliveryData.state} onChange={(e) => onChange((prev) => ({ ...prev, state: e.target.value }))} />
        <Input placeholder={copy.zip} className="h-11" style={{ borderColor: config.checkoutMutedColor }} autoComplete="postal-code" value={deliveryData.zip} onChange={(e) => onChange((prev) => ({ ...prev, zip: e.target.value }))} />
      </div>
    </section>
  )
}

function ShippingSection({
  config,
  copy,
  deliveryCompleted,
  methods,
  selectedShippingId,
  onSelect,
  locale,
  currency,
}: {
  config: CheckoutConfig
  copy: Copy
  deliveryCompleted: boolean
  methods: ShippingMethod[]
  selectedShippingId: string | null
  onSelect: (value: string) => void
  locale: SupportedLocale
  currency: SupportedCurrency
}) {
  return (
    <section className="space-y-4 pt-4">
      <h2 className="text-lg font-medium" style={{ color: config.checkoutTextColor }}>
        {copy.shippingOptionsTitle}
      </h2>
      {!deliveryCompleted ? (
        <div className="rounded-md border p-4 text-sm" style={{ borderColor: config.checkoutMutedColor, color: config.checkoutMutedColor, backgroundColor: config.checkoutSurfaceColor }}>
          {copy.shippingFillDelivery}
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelect(method.id)}
              className="flex w-full items-start justify-between rounded-xl border p-4 text-left transition-colors"
              style={{
                borderColor:
                  selectedShippingId === method.id
                    ? config.checkoutAccentColor
                    : config.checkoutMutedColor,
                backgroundColor:
                  selectedShippingId === method.id
                    ? withAlpha(config.checkoutAccentColor, 0.08)
                    : config.checkoutSurfaceColor,
              }}
            >
              <div className="space-y-1">
                <div className="font-medium" style={{ color: config.checkoutTextColor }}>
                  {method.name}
                </div>
                <div className="text-sm" style={{ color: config.checkoutMutedColor }}>
                  {method.description}
                </div>
                <div className="text-xs" style={{ color: config.checkoutMutedColor }}>
                  {method.eta}
                </div>
              </div>
              <div className="text-sm font-semibold" style={{ color: config.checkoutTextColor }}>
                {formatPrice(method.price, locale, currency)}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function PaymentSection({
  config,
  copy,
  locale,
  contactData,
  deliveryData,
  onPaymentViewed,
  onPaymentStarted,
}: {
  config: CheckoutConfig
  copy: Copy
  locale: SupportedLocale
  contactData: {
    fullName: string
    phone: string
    email: string
  }
  deliveryData: {
    firstName: string
    lastName: string
    address: string
    city: string
    state: string
    zip: string
  }
  onPaymentViewed?: () => void | Promise<void>
  onPaymentStarted?: () => void | Promise<void>
}) {
  const hasRealWhopCheckout = Boolean(config.whop?.purchaseUrl)
  const hasSelectedWhopAccount = Boolean(config.selectedWhopAccountId)
  const hasEmbeddedSession = Boolean(config.whop?.checkoutConfigurationId || config.whop?.planId)
  const embedControls = useCheckoutEmbedControls()
  const paymentSectionRef = React.useRef<HTMLElement | null>(null)
  const inferredFullName = contactData.fullName.trim() || `${deliveryData.firstName} ${deliveryData.lastName}`.trim()
  const shouldHideEmbedEmail = Boolean(contactData.email.trim())
  const embedKey = [
    locale,
    config.whop?.checkoutConfigurationId ?? config.whop?.planId ?? "default",
    config.whopTheme,
    config.whopAccentColor,
    config.whopHighContrast ? "contrast" : "normal",
    config.whopHidePrice ? "hide-price" : "show-price",
    config.whopHideTermsAndConditions ? "hide-terms" : "show-terms",
    config.whopPaddingY,
  ].join(":")
  const embedPrefill = React.useMemo(
    () => ({
      email: contactData.email.trim() || undefined,
      address: {
        name: inferredFullName || undefined,
        country: resolveWhopCountry(locale),
        line1: deliveryData.address.trim() || undefined,
        city: deliveryData.city.trim() || undefined,
        state: deliveryData.state.trim() || undefined,
        postalCode: deliveryData.zip.trim() || undefined,
      },
    }),
    [contactData.email, deliveryData.address, deliveryData.city, deliveryData.state, deliveryData.zip, inferredFullName, locale]
  )
  const embedReturnUrl = config.whop?.purchaseUrl ?? undefined
  const embedThemeOptions = React.useMemo(
    () => ({
      accentColor: config.whopAccentColor,
      highContrast: config.whopHighContrast,
    }),
    [config.whopAccentColor, config.whopHighContrast]
  )
  const embedStyles = React.useMemo(
    () => ({
      container: {
        paddingY: config.whopPaddingY,
      },
    }),
    [config.whopPaddingY]
  )
  const handleEmbeddedCheckoutSubmit = React.useCallback(() => {
    void onPaymentStarted?.()
    void embedControls.current?.submit()
  }, [embedControls, onPaymentStarted])

  React.useEffect(() => {
    if (!onPaymentViewed || typeof IntersectionObserver === "undefined") return

    const node = paymentSectionRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        void onPaymentViewed()
        observer.disconnect()
      },
      {
        threshold: 0.45,
      }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [onPaymentViewed])

  return (
    <section ref={paymentSectionRef} className="space-y-4 pt-4">
      <h2 className="text-lg font-medium" style={{ color: config.checkoutTextColor }}>{copy.payment}</h2>
      <p className="text-sm" style={{ color: config.checkoutMutedColor }}>{copy.paymentSafe}</p>
      {hasEmbeddedSession ? (
        <div
          className="overflow-hidden rounded-md border bg-white"
          style={{ borderColor: config.checkoutMutedColor }}
        >
          {config.whop?.checkoutConfigurationId ? (
            <WhopCheckoutEmbed
              key={embedKey}
              ref={embedControls}
              sessionId={config.whop.checkoutConfigurationId}
              theme={config.whopTheme}
              themeOptions={embedThemeOptions}
              styles={embedStyles}
              hidePrice={config.whopHidePrice}
              hideSubmitButton
              hideTermsAndConditions={config.whopHideTermsAndConditions}
              skipRedirect
              hideEmail={shouldHideEmbedEmail}
              disableEmail={shouldHideEmbedEmail}
              hideAddressForm={false}
              prefill={embedPrefill}
              returnUrl={embedReturnUrl}
            />
          ) : (
            <WhopCheckoutEmbed
              key={embedKey}
              ref={embedControls}
              planId={config.whop?.planId ?? ""}
              theme={config.whopTheme}
              themeOptions={embedThemeOptions}
              styles={embedStyles}
              hidePrice={config.whopHidePrice}
              hideSubmitButton
              hideTermsAndConditions={config.whopHideTermsAndConditions}
              skipRedirect
              hideEmail={shouldHideEmbedEmail}
              disableEmail={shouldHideEmbedEmail}
              hideAddressForm={false}
              prefill={embedPrefill}
              returnUrl={embedReturnUrl}
            />
          )}
          <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: config.checkoutMutedColor }}>
            <BuyButton
              config={config}
              label={config.buttonText}
              onClick={handleEmbeddedCheckoutSubmit}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-md border p-8 text-center" style={{ borderColor: config.checkoutMutedColor, backgroundColor: config.checkoutSurfaceColor, color: config.checkoutMutedColor }}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border bg-white" style={{ borderColor: config.checkoutMutedColor }}>
            <ShieldCheck className="h-8 w-8" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: config.checkoutTextColor }}>
            {config.layoutStyle === "one-page" ? copy.integratedPayment : copy.embeddedGateway}
          </p>
          <p className="mt-2 text-xs">
            {hasRealWhopCheckout
              ? copy.realGatewayReady
              : hasSelectedWhopAccount
                ? copy.realGatewayPending
                : copy.gatewayPlaceholder}
          </p>
        </div>
      )}
    </section>
  )
}

function CouponBar({ config, copy }: { config: CheckoutConfig; copy: Copy }) {
  return (
    <div className="flex gap-2">
      <Input placeholder={copy.couponPlaceholder} className="h-11 bg-white" style={{ borderColor: config.checkoutMutedColor }} />
      <Button variant="outline" className="h-11" style={{ backgroundColor: config.checkoutBackgroundColor, borderColor: config.checkoutMutedColor, color: config.checkoutMutedColor }}>
        {copy.apply}
      </Button>
    </div>
  )
}

function InfoBanner({ config, text }: { config: CheckoutConfig; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border p-4" style={{ backgroundColor: withAlpha(config.checkoutAccentColor, 0.08), borderColor: withAlpha(config.checkoutAccentColor, 0.18), color: config.checkoutAccentColor }}>
      <Info className="h-4 w-4" />
      <p className="text-xs">{text}</p>
    </div>
  )
}

function BuyButton({
  config,
  label,
  href,
  onClick,
}: {
  config: CheckoutConfig
  label: string
  href?: string
  onClick?: () => void
}) {
  const resolvedHref = href?.trim()

  if (resolvedHref) {
    return (
      <Button
        asChild
        className="h-14 w-full text-lg font-semibold text-white"
        style={{ backgroundColor: config.primaryColor, borderRadius: config.borderRadius }}
      >
        <a href={resolvedHref}>{label}</a>
      </Button>
    )
  }

  return (
    <Button
      className="h-14 w-full text-lg font-semibold text-white"
      style={{ backgroundColor: config.primaryColor, borderRadius: config.borderRadius }}
      onClick={onClick}
    >
      {label}
    </Button>
  )
}

function resolveUpsellLabel(config: CheckoutConfig) {
  const labels = {
    product: {
      premium: "Produto Premium",
      "fast-track": "Entrega Prioritaria",
      "vip-support": "Suporte VIP",
    },
    collection: {
      "starter-pack": "Colecao Starter Pack",
      "growth-pack": "Colecao Growth Pack",
      "lifetime-bundle": "Colecao Lifetime Bundle",
    },
    random: {
      "smart-offer": "Oferta automatica inteligente",
      "highest-conv": "Oferta com maior conversao",
      seasonal: "Oferta sazonal",
    },
  } as const

  return labels[config.upsellOfferType][config.upsellSelection as keyof typeof labels[typeof config.upsellOfferType]] ?? config.upsellSelection
}

function CheckoutFooter({ compact, config, copy }: { compact: boolean; config: CheckoutConfig; copy: Copy }) {
  if (compact) {
    return null
  }

  return (
    <footer className="border-t pb-12 pt-8 text-xs" style={{ borderColor: config.checkoutMutedColor, color: config.checkoutMutedColor }}>
      <div className={cn("gap-4", compact ? "grid grid-cols-1" : "flex")}>
        <span>{copy.securePayment}</span>
      </div>
    </footer>
  )
}

function PolicyLinks({ config, compact, copy }: { config: CheckoutConfig; compact: boolean; copy: Copy }) {
  if (!config.showPolicies) return null

  const items = [
    { label: copy.refundPolicy, mode: config.refundPolicyMode, url: config.refundPolicyUrl, text: config.refundPolicyText },
    { label: copy.privacyPolicy, mode: config.privacyPolicyMode, url: config.privacyPolicyUrl, text: config.privacyPolicyText },
    { label: copy.termsPolicy, mode: config.termsPolicyMode, url: config.termsPolicyUrl, text: config.termsPolicyText },
  ]

  return (
    <div className={cn("pt-4 text-xs", compact ? "space-y-3" : "space-y-2")} style={{ color: config.checkoutMutedColor }}>
      {items.map((item) => (
        <PolicyLink
          key={item.label}
          accentColor={config.checkoutAccentColor}
          label={item.label}
          mode={item.mode}
          mutedColor={config.checkoutMutedColor}
          popupDescription={copy.popupDescription}
          surfaceColor={config.checkoutSurfaceColor}
          text={item.text}
          textColor={config.checkoutTextColor}
          url={item.url}
        />
      ))}
    </div>
  )
}

function PolicyLink({
  accentColor,
  label,
  mode,
  mutedColor,
  popupDescription,
  surfaceColor,
  text,
  textColor,
  url,
}: {
  accentColor: string
  label: string
  mode: PolicyMode
  mutedColor: string
  popupDescription: string
  surfaceColor: string
  text: string
  textColor: string
  url: string
}) {
  const safeText = text.slice(0, POLICY_TEXT_MAX_LENGTH)

  if (mode === "link" && url.trim()) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block cursor-pointer hover:underline" style={{ color: accentColor }}>
        {label}
      </a>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="block cursor-pointer text-left hover:underline" style={{ color: accentColor }}>
          {label}
        </button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[min(560px,calc(100vw-2rem))] rounded-2xl p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)]" style={{ borderColor: mutedColor, backgroundColor: surfaceColor }}>
        <DialogHeader className="border-b px-5 py-4" style={{ borderColor: mutedColor, backgroundColor: "#ffffff" }}>
          <DialogTitle className="text-base font-semibold" style={{ color: textColor }}>{label}</DialogTitle>
          <DialogDescription className="text-xs" style={{ color: mutedColor }}>{popupDescription}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[min(65vh,520px)] overflow-auto px-5 py-4 text-sm leading-6" style={{ color: textColor }}>
          <div className="whitespace-pre-wrap rounded-lg border p-4" style={{ borderColor: mutedColor, backgroundColor: "#ffffff" }}>
            {safeText}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function OrderItem({
  config,
  name,
  price,
  variantLabel,
  imageSrc,
}: {
  config: CheckoutConfig
  name: string
  price: string
  variantLabel: string
  imageSrc?: string
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-md border bg-white" style={{ borderColor: config.checkoutMutedColor }}>
        {imageSrc ? (
          // External product image from Shopify catalog.
          <img
            src={imageSrc}
            alt={name}
            className="h-full w-full rounded-md object-cover"
          />
        ) : (
          <ShoppingBag className="h-8 w-8" style={{ color: config.checkoutMutedColor }} />
        )}
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white" style={{ backgroundColor: config.checkoutMutedColor }}>
          1
        </span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: config.checkoutTextColor }}>{name}</p>
        <p className="text-xs" style={{ color: config.checkoutMutedColor }}>{variantLabel}</p>
      </div>
      <span className="text-sm font-medium" style={{ color: config.checkoutTextColor }}>{price}</span>
    </div>
  )
}

function SummaryRows({
  copy,
  config,
  subtotalPrice,
  shippingPrice,
  totalPrice,
  locale,
  currency,
}: {
  copy: Copy
  config: CheckoutConfig
  subtotalPrice: string
  shippingPrice: number
  totalPrice: string
  locale: SupportedLocale
  currency: SupportedCurrency
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span style={{ color: config.checkoutMutedColor }}>{copy.subtotal}</span>
        <span className="font-medium" style={{ color: config.checkoutTextColor }}>{subtotalPrice}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span style={{ color: config.checkoutMutedColor }}>{copy.shipping}</span>
        <span style={{ color: config.checkoutMutedColor }}>
          {shippingPrice > 0 ? formatPrice(shippingPrice, locale, currency) : "--"}
        </span>
      </div>
      <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold" style={{ borderColor: config.checkoutMutedColor, color: config.checkoutTextColor }}>
        <span>{copy.total}</span>
        <div className="text-right">
          <span className="mr-2 text-xs font-normal" style={{ color: config.checkoutMutedColor }}>{currency}</span>
          <span>{totalPrice}</span>
        </div>
      </div>
    </div>
  )
}

function resolveLocale(mode: CheckoutConfig["localeMode"], manualLocale: SupportedLocale): SupportedLocale {
  if (mode === "manual") return manualLocale
  if (typeof navigator === "undefined") return manualLocale ?? FALLBACK_LOCALE

  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const candidate of candidates) {
    const normalized = normalizeLocale(candidate)
    if (normalized) return normalized
  }

  return manualLocale ?? FALLBACK_LOCALE
}

function resolveCurrency(
  mode: CheckoutConfig["currencyMode"],
  manualCurrency: SupportedCurrency,
  locale: SupportedLocale
): SupportedCurrency {
  if (mode === "manual") return manualCurrency
  return LOCALE_TO_CURRENCY[locale] ?? manualCurrency ?? FALLBACK_CURRENCY
}

function resolveConfiguredProductName(config: CheckoutConfig, copy: Copy) {
  return config.productName?.trim() || config.companyName?.trim() || copy.productName
}

function resolveConfiguredVariantLabel(config: CheckoutConfig, copy: Copy) {
  return config.productVariantLabel?.trim() || copy.variantDefault
}

function resolveConfiguredBasePrice(config: CheckoutConfig) {
  if (Number.isFinite(config.productPrice) && Number(config.productPrice) >= 0) {
    return Number(config.productPrice)
  }

  if (Number.isFinite(config.whop?.amount) && Number(config.whop?.amount) >= 0) {
    return Number(config.whop?.amount)
  }

  return 0
}

function normalizeLocale(locale: string): SupportedLocale | null {
  const value = locale.toLowerCase()
  if (value.startsWith("pt")) return "pt-BR"
  if (value.startsWith("en")) return "en-US"
  if (value.startsWith("es")) return "es-ES"
  if (value.startsWith("fr")) return "fr-FR"
  if (value.startsWith("de")) return "de-DE"
  return null
}

function resolveWhopCountry(locale: SupportedLocale) {
  switch (locale) {
    case "pt-BR":
      return "BR"
    case "en-US":
      return "US"
    case "es-ES":
      return "ES"
    case "fr-FR":
      return "FR"
    case "de-DE":
      return "DE"
    default:
      return "BR"
  }
}

function formatPrice(amount: number, locale: SupportedLocale, currency: SupportedCurrency) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return new Intl.NumberFormat(FALLBACK_LOCALE, {
      style: "currency",
      currency: FALLBACK_CURRENCY,
      maximumFractionDigits: 2,
    }).format(amount)
  }
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "")
  if (normalized.length !== 6) return hex

  const value = Number.parseInt(normalized, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
