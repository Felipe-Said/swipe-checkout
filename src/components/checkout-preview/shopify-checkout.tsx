"use client"

import * as React from "react"
import { ChevronDown, Info, LocateFixed, ShieldCheck, ShoppingBag } from "lucide-react"
import { WhopCheckoutEmbed, useCheckoutEmbedControls } from "@whop/checkout/react"

import { cn } from "@/lib/utils"
import { SWIPE_MANUAL_STORE_ID } from "@/lib/catalog-products"
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

type ContactFormData = {
  fullName: string
  phone: string
  email: string
}

type DeliveryFormData = {
  country: string
  firstName: string
  lastName: string
  address: string
  apartment: string
  city: string
  state: string
  zip: string
}

const CHECKOUT_CSS_SCOPE_SELECTOR = "[data-swipe-checkout-root]"
const CUSTOM_LAYOUT_SELECTOR = `${CHECKOUT_CSS_SCOPE_SELECTOR}[data-swipe-custom-layout='true']`
const DANIEL_CHECKOUT_CSS = `
[data-swipe-slot="daniel-shell"] {
  width: 100%;
  max-width: 34rem;
  margin: 0 auto;
}

[data-swipe-slot="daniel-shell"] .sf-checkout {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
}

[data-swipe-slot="daniel-shell"] .sf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 0 1rem;
}

[data-swipe-slot="daniel-shell"] .sf-brand {
  display: flex;
  align-items: center;
  min-width: 0;
}

[data-swipe-slot="daniel-shell"] .sf-brand img {
  display: block;
  max-height: 3rem;
  width: auto;
  max-width: 100%;
}

[data-swipe-slot="daniel-shell"] .sf-brand-text {
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.2;
}

[data-swipe-slot="daniel-shell"] .sf-cart {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
}

[data-swipe-slot="daniel-shell"] .divider {
  width: 100%;
  height: 1px;
  background: var(--daniel-divider, rgba(0, 0, 0, 0.08));
}

[data-swipe-slot="daniel-shell"] .summary {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0;
  background: transparent;
  border: 0;
  text-align: left;
}

[data-swipe-slot="daniel-shell"] .summary-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

[data-swipe-slot="daniel-shell"] .summary-left > span:first-child {
  font-size: 0.95rem;
  font-weight: 500;
}

[data-swipe-slot="daniel-shell"] .price {
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
}

[data-swipe-slot="daniel-shell"] .summary-dropdown {
  padding: 1rem 0 1.25rem;
}

[data-swipe-slot="daniel-shell"] .section {
  padding: 1.35rem 0;
}

[data-swipe-slot="daniel-shell"] .section-title {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.25;
}

[data-swipe-slot="daniel-shell"] .section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

[data-swipe-slot="daniel-shell"] .section-header .section-title {
  margin-bottom: 0;
}

[data-swipe-slot="daniel-shell"] .location-fill-button {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 0.84rem;
  font-weight: 500;
  white-space: nowrap;
}

[data-swipe-slot="daniel-shell"] .location-fill-button:disabled {
  opacity: 0.6;
}

[data-swipe-slot="daniel-shell"] .field-wrap {
  position: relative;
  width: 100%;
  min-width: 0;
}

[data-swipe-slot="daniel-shell"] .field-wrap + .field-wrap,
[data-swipe-slot="daniel-shell"] .field-wrap + .row-2,
[data-swipe-slot="daniel-shell"] .row-2 + .field-wrap,
[data-swipe-slot="daniel-shell"] .section-title + .field-wrap,
[data-swipe-slot="daniel-shell"] .section-title + .row-2 {
  margin-top: 0.75rem;
}

[data-swipe-slot="daniel-shell"] .row-2 {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.75rem;
}

[data-swipe-slot="daniel-shell"] .field,
[data-swipe-slot="daniel-shell"] .select-field {
  width: 100%;
  min-width: 0;
  min-height: 3.3rem;
  border: 1px solid var(--daniel-border, rgba(0, 0, 0, 0.14));
  border-radius: 0.875rem;
  background: var(--daniel-field-bg, #ffffff);
  color: var(--daniel-text, #111111);
  font-size: 0.95rem;
  line-height: 1.4;
  padding: 0.95rem 1rem;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

[data-swipe-slot="daniel-shell"] .select-field.has-floating {
  appearance: none;
  padding-top: 1.55rem;
  padding-bottom: 0.5rem;
}

[data-swipe-slot="daniel-shell"] .field::placeholder {
  color: var(--daniel-muted, rgba(0, 0, 0, 0.48));
}

[data-swipe-slot="daniel-shell"] .field:focus,
[data-swipe-slot="daniel-shell"] .select-field:focus {
  border-color: var(--daniel-accent, #005bd1);
  box-shadow: 0 0 0 1px var(--daniel-accent, #005bd1);
}

[data-swipe-slot="daniel-shell"] .floating-label {
  position: absolute;
  top: 0.55rem;
  left: 1rem;
  font-size: 0.72rem;
  font-weight: 500;
  line-height: 1;
  color: var(--daniel-muted, rgba(0, 0, 0, 0.48));
  pointer-events: none;
}

[data-swipe-slot="daniel-shell"] .address-input {
  padding-right: 2.85rem;
}

[data-swipe-slot="daniel-shell"] .address-icon {
  position: absolute;
  top: 50%;
  right: 1rem;
  width: 1rem;
  height: 1rem;
  transform: translateY(-50%);
  color: var(--daniel-muted, rgba(0, 0, 0, 0.48));
  pointer-events: none;
}

[data-swipe-slot="daniel-shell"] .shipping-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--daniel-border, rgba(0, 0, 0, 0.14));
  border-radius: 1rem;
  background: var(--daniel-field-bg, #ffffff);
  text-align: left;
  transition: border-color 0.18s ease, background-color 0.18s ease;
}

[data-swipe-slot="daniel-shell"] .shipping-option.active {
  border-color: var(--daniel-accent, #005bd1);
  background: var(--daniel-accent-soft, rgba(0, 91, 209, 0.08));
}

[data-swipe-slot="daniel-shell"] .shipping-option-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

[data-swipe-slot="daniel-shell"] .shipping-radio {
  width: 0.95rem;
  height: 0.95rem;
  border-radius: 9999px;
  border: 2px solid var(--daniel-accent, #005bd1);
  background: var(--daniel-field-bg, #ffffff);
  box-shadow: inset 0 0 0 3px var(--daniel-field-bg, #ffffff);
  flex-shrink: 0;
}

[data-swipe-slot="daniel-shell"] .shipping-option.active .shipping-radio {
  background: var(--daniel-accent, #005bd1);
}

[data-swipe-slot="daniel-shell"] .shipping-name {
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.35;
}

[data-swipe-slot="daniel-shell"] .shipping-price {
  font-size: 0.92rem;
  font-weight: 600;
  white-space: nowrap;
}

[data-swipe-slot="daniel-shell"] .section-note {
  margin-top: 0.75rem;
  font-size: 0.88rem;
  line-height: 1.45;
  color: var(--daniel-muted, rgba(0, 0, 0, 0.48));
}

[data-swipe-slot="daniel-shell"] .payment-frame {
  overflow: hidden;
  border: 0;
  border-radius: 1rem;
  background: #ffffff;
  box-shadow: none;
}

[data-swipe-slot="daniel-shell"] .payment-frame iframe,
[data-swipe-slot="daniel-shell"] .payment-frame [data-whop-embed-root],
[data-swipe-slot="daniel-shell"] .payment-frame > div {
  border: 0 !important;
  box-shadow: none !important;
}

[data-swipe-slot="daniel-shell"] .payment-methods {
  margin-top: 0.95rem;
}

[data-swipe-slot="daniel-shell"] .visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

[data-swipe-slot="daniel-shell"] .list-payment {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

[data-swipe-slot="daniel-shell"] .list-payment__item {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

[data-swipe-slot="daniel-shell"] .list-payment__item svg {
  display: block;
  width: 38px;
  height: 24px;
}

@media (max-width: 640px) {
  [data-swipe-slot="daniel-shell"] .row-2 {
    grid-template-columns: 1fr;
  }
}
`

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
]

const DANIEL_COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "BR", label: "Brasil" },
  { value: "ES", label: "Espana" },
  { value: "FR", label: "France" },
  { value: "DE", label: "Deutschland" },
]

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

function buildInjectedCheckoutCss(css: string) {
  const scopedCss = scopeCheckoutCss(css)
  if (!scopedCss) return ""

  const customLayoutBaseCss = `
${CUSTOM_LAYOUT_SELECTOR} [data-swipe-slot] {
  display: none !important;
}
`

  return `${customLayoutBaseCss}\n${scopedCss}`
}

function shouldUseCustomLayoutMode(css: string) {
  const trimmed = css.trim()
  if (!trimmed) return false

  return (
    /\[data-swipe-slot(?:=|\])/i.test(trimmed) ||
    /data-swipe-custom-layout/i.test(trimmed) ||
    /\/\*\s*swipe-layout-mode\s*\*\//i.test(trimmed)
  )
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
  thankYouLayoutStyle: "default" | "shopsfi"
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
  selectedProductId?: string
  selectedVariantId?: string
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
  const [contactData, setContactData] = React.useState<ContactFormData>({
    fullName: "",
    phone: "",
    email: "",
  })
  const [deliveryData, setDeliveryData] = React.useState<DeliveryFormData>({
    country: resolveDanielCountryValue(config.locale),
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zip: "",
  })
  const [selectedShippingId, setSelectedShippingId] = React.useState<string | null>(null)
  const [isResolvingLocation, setIsResolvingLocation] = React.useState(false)
  const [locationFillError, setLocationFillError] = React.useState<string | null>(null)
  const isMobile = device === "mobile"
  const isOnePage = config.layoutStyle === "one-page"
  const isDanielStyle = config.layoutStyle === "daniel"
  const behaviorEnabled = Boolean(behaviorTracking?.enabled && behaviorTracking.checkoutId)

  React.useEffect(() => {
    const locale = resolveLocale(config.localeMode, config.locale)
    const currency = resolveCurrency(config.currencyMode, config.currency, locale)
    setResolvedLocale(locale)
    setResolvedCurrency(currency)
  }, [config.currency, config.currencyMode, config.locale, config.localeMode])

  React.useEffect(() => {
    const nextCountry = resolveDanielCountryValue(resolvedLocale)
    setDeliveryData((prev) => {
      if (prev.country.trim()) {
        return prev
      }

      return {
        ...prev,
        country: nextCountry,
      }
    })
  }, [resolvedLocale])

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
  const deliveryCompleted =
    deliveryData.firstName.trim().length > 0 &&
    deliveryData.lastName.trim().length > 0 &&
    deliveryData.address.trim().length > 0 &&
    deliveryData.city.trim().length > 0 &&
    deliveryData.state.trim().length > 0 &&
    deliveryData.zip.trim().length > 0
  const selectedShipping =
    availableShippingMethods.find((method) => method.id === selectedShippingId) ?? null
  const effectiveCurrency = storePreview?.currency ?? resolvedCurrency
  const hasSelectedStore = Boolean(config.selectedStoreId && config.selectedStoreId !== SWIPE_MANUAL_STORE_ID)
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
  const hasCustomLayout = shouldUseCustomLayoutMode(config.customCss ?? "")
  const injectedCustomCss = React.useMemo(() => buildInjectedCheckoutCss(config.customCss ?? ""), [config.customCss])
  const handleUseCurrentLocation = React.useCallback(async () => {
    if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationFillError(resolveDanielLocationError(resolvedLocale, "unsupported"))
      return
    }

    setIsResolvingLocation(true)
    setLocationFillError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 300000,
        })
      })

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${position.coords.latitude}&lon=${position.coords.longitude}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      )

      if (!response.ok) {
        throw new Error(`reverse_geocode_${response.status}`)
      }

      const payload = (await response.json()) as {
        address?: Record<string, string | undefined>
      }

      const address = payload.address ?? {}
      const stateValue = resolveDanielStateValue(address)

      setDeliveryData((prev) => ({
        ...prev,
        country: resolveDanielCountryFromAddress(address) || prev.country,
        address: buildDanielAddressLine(address) || prev.address,
        city:
          address.city ||
          address.town ||
          address.village ||
          address.municipality ||
          prev.city,
        state: stateValue || prev.state,
        zip: address.postcode || prev.zip,
      }))
    } catch (error) {
      const code =
        typeof error === "object" &&
        error &&
        "code" in error &&
        typeof (error as { code?: unknown }).code === "number"
          ? (error as { code: number }).code
          : undefined

      setLocationFillError(resolveDanielLocationError(resolvedLocale, code))
    } finally {
      setIsResolvingLocation(false)
    }
  }, [resolvedLocale])

  React.useEffect(() => {
    if (availableShippingMethods.length === 0) {
      if (selectedShippingId !== null) {
        setSelectedShippingId(null)
      }
      return
    }

    const hasSelectedMethod = availableShippingMethods.some((method) => method.id === selectedShippingId)
    if (!hasSelectedMethod) {
      setSelectedShippingId(availableShippingMethods[0]?.id ?? null)
    }
  }, [availableShippingMethods, selectedShippingId])

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
      data-swipe-custom-layout={hasCustomLayout ? "true" : "false"}
      data-swipe-device={device}
      data-swipe-layout-style={config.layoutStyle}
      data-swipe-page="checkout"
      style={{ backgroundColor: config.checkoutBackgroundColor, color: config.checkoutTextColor }}
    >
      {config.customCss?.trim() ? (
        <style
          dangerouslySetInnerHTML={{
            __html: hasCustomLayout ? injectedCustomCss : scopeCheckoutCss(config.customCss),
          }}
        />
      ) : null}
      {isMobile && !isOnePage && !isDanielStyle ? (
        <div data-swipe-slot="mobile-summary" className="border-b p-4" style={{ backgroundColor: config.checkoutSurfaceColor, borderColor: config.checkoutMutedColor }}>
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

      <div data-swipe-slot="checkout-shell" className={cn("min-h-full", isDanielStyle ? "mx-auto w-full max-w-[760px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10" : isOnePage ? "mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10" : isMobile ? "px-6 py-7" : "flex min-h-full")}>
        {isDanielStyle ? (
          <div
            data-swipe-slot="daniel-shell"
            style={
              {
                "--daniel-accent": config.checkoutAccentColor,
                "--daniel-accent-soft": withAlpha(config.checkoutAccentColor, 0.08),
                "--daniel-border": config.checkoutMutedColor,
                "--daniel-divider": withAlpha(config.checkoutMutedColor, 0.3),
                "--daniel-text": config.checkoutTextColor,
                "--daniel-muted": config.checkoutMutedColor,
                "--daniel-field-bg": config.checkoutSurfaceColor,
              } as React.CSSProperties
            }
          >
            <style>{scopeCheckoutCss(DANIEL_CHECKOUT_CSS)}</style>
            <div className="sf-checkout">
              <div className="sf-header" data-swipe-slot="daniel-header">
                <DanielBrandLockup config={config} />
                <div className="sf-cart" aria-hidden="true" style={{ color: config.checkoutAccentColor }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" stroke="currentColor" fill="none" viewBox="0 0 14 14">
                    <path d="m2.007 10.156.387-4.983a1 1 0 0 1 .997-.923h7.218a1 1 0 0 1 .997.923l.387 4.983c.11 1.403-1.16 2.594-2.764 2.594H4.771c-1.605 0-2.873-1.19-2.764-2.594" />
                    <path d="M5 3.5c0-1.243.895-2.25 2-2.25S9 2.257 9 3.5V5c0 1.243-.895 2.25-2 2.25S5 6.243 5 5z" />
                  </svg>
                </div>
              </div>

              <div className="divider" />

              <button
                type="button"
                className="summary"
                data-swipe-slot="daniel-summary-toggle"
                onClick={() => setIsSummaryOpen((current) => !current)}
                style={{ color: config.checkoutTextColor }}
              >
                <div className="summary-left">
                  <span>{copy.orderSummary}</span>
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", isSummaryOpen && "rotate-180")}
                    style={{ color: config.checkoutAccentColor }}
                  />
                </div>
                <div className="price">{formattedTotalPrice}</div>
              </button>

              {isSummaryOpen ? (
                <>
                  <div className="summary-dropdown" id="dropdown" data-swipe-slot="daniel-summary-dropdown">
                    <div className="space-y-4">
                      <OrderItem
                        config={config}
                        name={productName}
                        price={formattedPrice}
                        variantLabel={variantLabel}
                        imageSrc={productImageSrc}
                      />
                      <SummaryRows
                        copy={copy}
                        config={config}
                        subtotalPrice={formattedPrice}
                        shippingPrice={shippingPrice}
                        totalPrice={formattedTotalPrice}
                        locale={resolvedLocale}
                        currency={effectiveCurrency}
                      />
                    </div>
                  </div>
                  <div className="divider" />
                </>
              ) : (
                <div className="divider" />
              )}

              <section className="section" data-swipe-slot="daniel-contact">
                <h2 className="section-title" style={{ color: config.checkoutTextColor }}>
                  {copy.contact}
                </h2>
                <div className="field-wrap">
                  <input
                    id="daniel-email"
                    className="field"
                    type="email"
                    placeholder={copy.email}
                    autoComplete="email"
                    value={contactData.email}
                    onChange={(event) =>
                      setContactData((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                  />
                </div>
              </section>

              <div className="divider" />

              <section className="section" data-swipe-slot="daniel-delivery">
                <div className="section-header">
                  <h2 className="section-title" style={{ color: config.checkoutTextColor }}>
                    {copy.delivery}
                  </h2>
                  <button
                    type="button"
                    className="location-fill-button"
                    onClick={() => void handleUseCurrentLocation()}
                    disabled={isResolvingLocation}
                    style={{ color: config.checkoutAccentColor }}
                  >
                    <LocateFixed className="h-4 w-4" />
                    <span>
                      {isResolvingLocation
                        ? resolveDanielLocationLoadingLabel(resolvedLocale)
                        : resolveDanielLocationActionLabel(resolvedLocale)}
                    </span>
                  </button>
                </div>
                {locationFillError ? (
                  <p className="section-note" style={{ marginTop: 0, marginBottom: "0.9rem" }}>
                    {locationFillError}
                  </p>
                ) : null}
                <div className="field-wrap">
                  <label className="floating-label" htmlFor="daniel-country">
                    {resolveDanielCountryRegionLabel(resolvedLocale)}
                  </label>
                  <select
                    id="daniel-country"
                    className="select-field has-floating"
                    value={deliveryData.country}
                    aria-label={resolveDanielCountryRegionLabel(resolvedLocale)}
                    onChange={(event) =>
                      setDeliveryData((prev) => ({
                        ...prev,
                        country: event.target.value,
                        state: prev.country !== event.target.value ? "" : prev.state,
                      }))
                    }
                  >
                    {DANIEL_COUNTRIES.map((country) => (
                      <option key={country.value} value={country.value}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="row-2">
                  <div className="field-wrap">
                    <input
                      id="daniel-first-name"
                      className="field"
                      type="text"
                      placeholder={resolveDanielFirstNamePlaceholder(resolvedLocale)}
                      autoComplete="given-name"
                      value={deliveryData.firstName}
                      onChange={(event) =>
                        setDeliveryData((prev) => ({
                          ...prev,
                          firstName: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="field-wrap">
                    <input
                      id="daniel-last-name"
                      className="field"
                      type="text"
                      placeholder={copy.lastName}
                      autoComplete="family-name"
                      value={deliveryData.lastName}
                      onChange={(event) =>
                        setDeliveryData((prev) => ({
                          ...prev,
                          lastName: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="field-wrap">
                  <input
                    id="daniel-address"
                    className="field address-input"
                    type="text"
                    placeholder={copy.address}
                    autoComplete="address-line1"
                    value={deliveryData.address}
                    onChange={(event) =>
                      setDeliveryData((prev) => ({
                        ...prev,
                        address: event.target.value,
                      }))
                    }
                  />
                  <svg className="address-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20L17 17" />
                  </svg>
                </div>
                <div className="field-wrap">
                  <input
                    id="daniel-apartment"
                    className="field"
                    type="text"
                    placeholder={resolveDanielApartmentPlaceholder(resolvedLocale)}
                    autoComplete="address-line2"
                    value={deliveryData.apartment}
                    onChange={(event) =>
                      setDeliveryData((prev) => ({
                        ...prev,
                        apartment: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="field-wrap">
                  <input
                    id="daniel-city"
                    className="field"
                    type="text"
                    placeholder={copy.city}
                    autoComplete="address-level2"
                    value={deliveryData.city}
                    onChange={(event) =>
                      setDeliveryData((prev) => ({
                        ...prev,
                        city: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="field-wrap">
                  <label className="floating-label" htmlFor="daniel-state">
                    {copy.state}
                  </label>
                  {deliveryData.country === "US" ? (
                    <select
                      id="daniel-state"
                      className="select-field has-floating"
                      autoComplete="address-level1"
                      value={deliveryData.state}
                      onChange={(event) =>
                        setDeliveryData((prev) => ({
                          ...prev,
                          state: event.target.value,
                        }))
                      }
                    >
                      <option value="">{resolveDanielSelectStateLabel(resolvedLocale)}</option>
                      {US_STATES.map((state) => (
                        <option key={state.value} value={state.value}>
                          {state.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="daniel-state"
                      className="field"
                      type="text"
                      placeholder={copy.state}
                      autoComplete="address-level1"
                      value={deliveryData.state}
                      onChange={(event) =>
                        setDeliveryData((prev) => ({
                          ...prev,
                          state: event.target.value,
                        }))
                      }
                    />
                  )}
                </div>
                <div className="field-wrap">
                  <input
                    id="daniel-zip"
                    className="field"
                    type="text"
                    placeholder={copy.zip}
                    autoComplete="postal-code"
                    value={deliveryData.zip}
                    onChange={(event) =>
                      setDeliveryData((prev) => ({
                        ...prev,
                        zip: event.target.value,
                      }))
                    }
                  />
                </div>
              </section>

              <div className="divider" />

              <section className="section" data-swipe-slot="daniel-shipping">
                <h2 className="section-title" style={{ color: config.checkoutTextColor }}>
                  {resolveDanielShippingMethodTitle(resolvedLocale)}
                </h2>
                {availableShippingMethods.length > 0 ? (
                  <div className="space-y-3">
                    {availableShippingMethods.map((method, index) => {
                      const isActive = selectedShippingId ? selectedShippingId === method.id : index === 0
                      return (
                        <button
                          key={method.id}
                          type="button"
                          className={cn("shipping-option", isActive && "active")}
                          onClick={() => setSelectedShippingId(method.id)}
                          style={{ color: config.checkoutTextColor }}
                        >
                          <div className="shipping-option-left">
                            <div className="shipping-radio" aria-hidden="true" />
                            <div className="shipping-name">{method.name}</div>
                          </div>
                          <div className="shipping-price">
                            {method.price <= 0 ? resolveDanielFreeLabel(resolvedLocale) : formatPrice(method.price, resolvedLocale, effectiveCurrency)}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="section-note">{copy.shippingFillDelivery}</p>
                )}
              </section>

              <div className="divider" />

              <section className="section" data-swipe-slot="daniel-payment">
                <PaymentSection
                  config={config}
                  copy={copy}
                  locale={resolvedLocale}
                  contactData={contactData}
                  deliveryData={deliveryData}
                  hideTitle
                  variant="daniel"
                  onPaymentViewed={
                    behaviorEnabled && behaviorTracking
                      ? () =>
                          trackCheckoutBehaviorEvent({
                            checkoutId: behaviorTracking.checkoutId,
                            eventType: "payment_viewed",
                            metadata: {
                              device,
                              layoutStyle: config.layoutStyle,
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
                              layoutStyle: config.layoutStyle,
                            },
                          })
                      : undefined
                  }
                />
              </section>
            </div>
          </div>
        ) : isOnePage ? (
          <div data-swipe-slot="checkout-layout" className={cn("grid gap-8", isMobile ? "grid-cols-1" : "grid-cols-[minmax(0,1.2fr)_380px]")}>
            <div data-swipe-slot="checkout-main" className="space-y-8">
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

            <aside data-swipe-slot="summary-sidebar" className="h-fit rounded-2xl border p-5 lg:sticky lg:top-8" style={{ backgroundColor: config.checkoutSurfaceColor, borderColor: config.checkoutMutedColor }}>
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
            <div data-swipe-slot="checkout-main-column" className={cn("flex-1", isMobile ? "" : "max-w-[60%] p-12 pr-8")}>
            <div data-swipe-slot="checkout-main" className={cn("mx-auto space-y-8", isMobile ? "max-w-none" : "max-w-[600px]")}>
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
              <div data-swipe-slot="summary-sidebar" className="flex-1 border-l p-12 pl-8" style={{ backgroundColor: config.checkoutSurfaceColor, borderColor: config.checkoutMutedColor }}>
                <div data-swipe-slot="summary-content" className="max-w-[400px] space-y-6">
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
  const thankYouLayoutStyle = config.thankYouLayoutStyle === "shopsfi" ? "shopsfi" : "default"
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
  const [mobileSummaryOpen, setMobileSummaryOpen] = React.useState(false)
  const hasCustomLayout = shouldUseCustomLayoutMode(config.customCss ?? "")
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
    setMobileSummaryOpen(false)
  }, [device, thankYouLayoutStyle, storePreview?.productName, formattedPrice])

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
  const injectedCustomCss = React.useMemo(() => buildInjectedCheckoutCss(config.customCss ?? ""), [config.customCss])
  const shopsfiSuccessColor = "#008060"
  const detailLabels = {
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
  }
  const shopsfiSummaryLabels = {
    summary: copy.thankYouOrderSummary,
    shipping:
      locale === "en-US"
        ? "Shipping"
        : locale === "es-ES"
          ? "Envio"
          : locale === "fr-FR"
            ? "Livraison"
            : locale === "de-DE"
              ? "Versand"
              : "Frete",
    backToStore:
      locale === "en-US"
        ? "Back to store"
        : locale === "es-ES"
          ? "Volver a la tienda"
          : locale === "fr-FR"
            ? "Retour a la boutique"
            : locale === "de-DE"
              ? "Zuruck zum Shop"
              : "Voltar para a loja",
  }
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
      labels={detailLabels}
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
  const shopsfiMobileLayout = (
    <div data-swipe-slot="thank-you-shopsfi-shell" className="mx-auto w-full max-w-[420px]">
      <div className="mb-4 overflow-hidden rounded-[14px] border bg-white" style={{ borderColor: "#d9d9d9", color: "#1f1f1f" }}>
        <button
          type="button"
          onClick={() => setMobileSummaryOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <div className="flex min-w-0 items-center gap-2">
            <ShoppingBag className="h-4 w-4 shrink-0" style={{ color: "#616161" }} />
            <span className="truncate text-sm font-medium">{copy.thankYouOrderSummary}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-semibold">{formattedPrice}</span>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", mobileSummaryOpen ? "rotate-180" : "")}
              style={{ color: "#616161" }}
            />
          </div>
        </button>
        {mobileSummaryOpen ? (
          <div className="border-t px-4 py-4" style={{ borderColor: "#e5e5e5" }}>
            <div className="rounded-[12px] border bg-white p-4" style={{ borderColor: "#e5e5e5" }}>
              <div className="flex items-start gap-4">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border bg-[#f6f6f7]"
                  style={{ borderColor: "#e5e5e5" }}
                >
                  {storePreview?.imageSrc ? (
                    <img src={storePreview.imageSrc} alt={storePreview.productName} className="h-full w-full object-cover" />
                  ) : (
                    <ShoppingBag className="h-5 w-5 text-[#8a8a8a]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{storePreview?.productName ?? config.productName}</p>
                  <p className="mt-1 text-xs text-[#6d7175]">{storePreview?.variantLabel ?? config.productVariantLabel}</p>
                </div>
                <p className="text-sm font-medium">{formattedPrice}</p>
              </div>
              <div className="mt-4 space-y-3 border-t pt-4 text-sm" style={{ borderColor: "#e5e5e5" }}>
                <div className="flex items-center justify-between">
                  <span className="text-[#6d7175]">{detailLabels.product}</span>
                  <span>{formattedPrice}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6d7175]">{shopsfiSummaryLabels.shipping}</span>
                  <span>-</span>
                </div>
                <div className="flex items-center justify-between border-t pt-3 font-semibold" style={{ borderColor: "#e5e5e5" }}>
                  <span>{copy.total}</span>
                  <span>{formattedPrice}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-[18px] border bg-white p-5" style={{ borderColor: "#d9d9d9", color: "#1f1f1f" }}>
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "#e5e5e5" }}>
            <div className="min-w-0 flex-1">
              <ThankYouBrand config={config} />
            </div>
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border"
              style={{
                borderColor: withAlpha(shopsfiSuccessColor, 0.18),
                backgroundColor: withAlpha(shopsfiSuccessColor, 0.08),
                color: shopsfiSuccessColor,
              }}
            >
              <ShopsfiConfirmationIcon color={shopsfiSuccessColor} />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium" style={{ color: shopsfiSuccessColor }}>
              {locale === "en-US" ? "Confirmed" : locale === "es-ES" ? "Confirmado" : locale === "fr-FR" ? "Confirme" : locale === "de-DE" ? "Bestatigt" : "Confirmado"}
            </p>
            <h1 className="text-[2rem] font-semibold tracking-[-0.03em] leading-tight">{thankYouTitle}</h1>
            {config.thankYouShowMessage && thankYouMessage ? (
              <p className="text-sm leading-7 text-[#6d7175]">{thankYouMessage}</p>
            ) : null}
          </div>

          <div className="rounded-[16px] border bg-white p-4" style={{ borderColor: "#e5e5e5" }}>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6d7175]">{detailLabels.orderId}</p>
                <p className="text-base font-semibold">{thankYouMeta?.orderId ?? "SWIPE"}</p>
              </div>
              <div className="grid gap-4 border-t pt-4" style={{ borderColor: "#e5e5e5" }}>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{detailLabels.dateTime}</p>
                  <p className="text-sm text-[#6d7175]">{formattedDateTime}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{detailLabels.paymentMethod}</p>
                  <p className="text-sm text-[#6d7175]">{thankYouMeta?.paymentMethod ?? "Whop"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{detailLabels.product}</p>
                  <p className="text-sm text-[#6d7175]">{storePreview?.productName ?? config.productName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {locale === "en-US" ? "Variant" : locale === "es-ES" ? "Variante" : locale === "fr-FR" ? "Variante" : locale === "de-DE" ? "Variante" : "Variante"}
                  </p>
                  <p className="text-sm text-[#6d7175]">{storePreview?.variantLabel ?? config.productVariantLabel}</p>
                </div>
              </div>
            </div>
          </div>

          {config.thankYouButtonEnabled && thankYouButtonHref ? (
            <div className="rounded-[16px] border bg-white p-4" style={{ borderColor: "#e5e5e5" }}>
              <Button
                onClick={() => {
                  if (typeof window === "undefined") return
                  window.location.href = thankYouButtonHref
                }}
                className="h-12 w-full"
                size="lg"
                style={{
                  borderRadius: "12px",
                  backgroundColor: "#111111",
                  color: "#ffffff",
                }}
              >
                {thankYouButtonText || shopsfiSummaryLabels.backToStore}
              </Button>
              {countdownText ? <p className="mt-3 text-center text-xs leading-5 text-[#6d7175]">{countdownText}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )

  const shopsfiDesktopLayout = (
    <div data-swipe-slot="thank-you-shopsfi-shell" className="w-full max-w-[1220px]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.46fr)]">
        <div
          data-swipe-slot="thank-you-shopsfi-main"
          className="min-w-0 space-y-6 rounded-[18px] border bg-white p-5 sm:p-7 lg:rounded-r-none lg:border-r-0 lg:p-10"
          style={{ color: "#1f1f1f", borderColor: "#d9d9d9" }}
        >
          <div className="flex items-center justify-between gap-4 border-b pb-5" style={{ borderColor: "#e5e5e5" }}>
            <ThankYouBrand config={config} />
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full border"
              style={{
                borderColor: withAlpha(shopsfiSuccessColor, 0.18),
                backgroundColor: withAlpha(shopsfiSuccessColor, 0.08),
                color: shopsfiSuccessColor,
              }}
            >
              <ShopsfiConfirmationIcon color={shopsfiSuccessColor} />
            </div>
          </div>

          <div data-swipe-slot="thank-you-shopsfi-header" className="space-y-3 pt-1">
            <p className="text-sm font-medium" style={{ color: shopsfiSuccessColor }}>
              {locale === "en-US" ? "Confirmed" : locale === "es-ES" ? "Confirmado" : locale === "fr-FR" ? "Confirme" : locale === "de-DE" ? "Bestatigt" : "Confirmado"}
            </p>
            <h1 className="text-[2rem] font-semibold tracking-[-0.03em] sm:text-[2.35rem]">{thankYouTitle}</h1>
            {config.thankYouShowMessage && thankYouMessage ? (
              <p className="max-w-2xl text-sm leading-7 sm:text-base" style={{ color: "#6d7175" }}>
                {thankYouMessage}
              </p>
            ) : null}
          </div>

          <div data-swipe-slot="thank-you-shopsfi-details" className="space-y-5">
            <div className="rounded-[16px] border bg-white p-5" style={{ borderColor: "#e5e5e5" }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6d7175]">
                    {detailLabels.orderId}
                  </p>
                  <p className="mt-2 text-lg font-semibold">{thankYouMeta?.orderId ?? "SWIPE"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6d7175]">
                    {detailLabels.dateTime}
                  </p>
                  <p className="mt-2 text-sm font-medium">{formattedDateTime}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[16px] border bg-white p-5" style={{ borderColor: "#e5e5e5" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6d7175]">
                {locale === "en-US" ? "Information" : locale === "es-ES" ? "Informacion" : locale === "fr-FR" ? "Informations" : locale === "de-DE" ? "Informationen" : "Informacoes"}
              </p>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{detailLabels.paymentMethod}</p>
                  <p className="text-sm text-[#6d7175]">{thankYouMeta?.paymentMethod ?? "Whop"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{detailLabels.total}</p>
                  <p className="text-sm text-[#6d7175]">{formattedPrice}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{detailLabels.product}</p>
                  <p className="text-sm text-[#6d7175]">{storePreview?.productName ?? config.productName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {locale === "en-US" ? "Variant" : locale === "es-ES" ? "Variante" : locale === "fr-FR" ? "Variante" : locale === "de-DE" ? "Variante" : "Variante"}
                  </p>
                  <p className="text-sm text-[#6d7175]">{storePreview?.variantLabel ?? config.productVariantLabel}</p>
                </div>
              </div>
            </div>

            {config.thankYouButtonEnabled && thankYouButtonHref ? (
              <div className="rounded-[16px] border bg-white p-5" style={{ borderColor: "#e5e5e5" }}>
                <Button
                  onClick={() => {
                    if (typeof window === "undefined") return
                    window.location.href = thankYouButtonHref
                  }}
                  className="h-12 w-full"
                  size="lg"
                  style={{
                    borderRadius: "12px",
                    backgroundColor: "#111111",
                    color: "#ffffff",
                  }}
                >
                  {thankYouButtonText || shopsfiSummaryLabels.backToStore}
                </Button>
                {countdownText ? <p className="mt-3 text-center text-xs leading-5 text-[#6d7175]">{countdownText}</p> : null}
              </div>
            ) : null}
          </div>
        </div>

        <aside
          data-swipe-slot="thank-you-shopsfi-summary"
          className="border bg-white p-5 sm:p-7 lg:rounded-l-none lg:border-l lg:p-8"
          style={{
            borderColor: "#d9d9d9",
            color: "#1f1f1f",
          }}
        >
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#6d7175]">
                {shopsfiSummaryLabels.summary}
              </p>
              <h2 className="text-2xl font-semibold">{copy.total}</h2>
            </div>

            <div className="rounded-[16px] border p-4" style={{ borderColor: "#e5e5e5" }}>
              <div className="flex items-start gap-4">
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border bg-[#f6f6f7]"
                  style={{ borderColor: "#e5e5e5" }}
                >
                  {storePreview?.imageSrc ? (
                    <img
                      src={storePreview.imageSrc}
                      alt={storePreview.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="h-6 w-6 text-[#8a8a8a]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold">{storePreview?.productName ?? config.productName}</p>
                  <p className="mt-1 text-sm text-[#6d7175]">
                    {storePreview?.variantLabel ?? config.productVariantLabel}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formattedPrice}</p>
              </div>
            </div>

            <div className="space-y-4 rounded-[16px] border p-4" style={{ borderColor: "#e5e5e5" }}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6d7175]">{detailLabels.product}</span>
                <span className="font-medium">{formattedPrice}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6d7175]">{shopsfiSummaryLabels.shipping}</span>
                <span className="font-medium">-</span>
              </div>
              <div className="h-px w-full bg-[#e5e5e5]" />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>{copy.total}</span>
                <span>{formattedPrice}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )

  const shopsfiLayout = device === "mobile" ? shopsfiMobileLayout : shopsfiDesktopLayout

  return (
    <div
      className={cn("flex min-h-full items-center justify-center px-4 py-8 sm:px-6 sm:py-10", config.fontFamily)}
      data-swipe-checkout-root=""
      data-swipe-custom-layout={hasCustomLayout ? "true" : "false"}
      data-swipe-device={device}
      data-swipe-layout-style={config.layoutStyle}
      data-swipe-page="thank-you"
      style={{
        backgroundColor: thankYouLayoutStyle === "shopsfi" ? "#f1f1f1" : config.checkoutBackgroundColor,
        color: thankYouLayoutStyle === "shopsfi" ? "#1f1f1f" : config.checkoutTextColor,
        backgroundImage:
          thankYouLayoutStyle === "shopsfi"
            ? undefined
            : thankYouBackgroundSrc
              ? `url(${thankYouBackgroundSrc})`
              : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {config.customCss?.trim() ? (
        <style
          dangerouslySetInnerHTML={{
            __html: hasCustomLayout ? injectedCustomCss : scopeCheckoutCss(config.customCss),
          }}
        />
      ) : null}
      <div
        data-swipe-slot={thankYouLayoutStyle === "shopsfi" ? "thank-you-layout-container" : "thank-you-shell"}
        className="w-full"
      >
        {thankYouLayoutStyle === "shopsfi" ? (
          shopsfiLayout
        ) : (
          <div
            data-swipe-slot="thank-you-shell"
            className="mx-auto w-full max-w-[520px] rounded-[28px] border p-5 text-center shadow-sm sm:p-8"
            style={{
              backgroundColor: config.checkoutSurfaceColor,
              borderColor: config.checkoutMutedColor,
              backgroundImage: thankYouCardBackgroundSrc ? `url(${thankYouCardBackgroundSrc})` : undefined,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundSize: `${thankYouCardBackgroundSize}%`,
            }}
          >
            <div
              data-swipe-slot="thank-you-confirmation"
              className="mx-auto flex min-h-full w-full max-w-[420px] items-center justify-center py-3 sm:py-6"
            >
              {confirmationCard}
            </div>
          </div>
        )}
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

function ShopsfiConfirmationIcon({ color }: { color: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 50 50"
      focusable="false"
      aria-hidden="true"
      className="h-6 w-6"
      style={{ color }}
    >
      <path
        strokeWidth="2"
        d="M49 25c0 13.255-10.745 24-24 24S1 38.255 1 25 11.745 1 25 1s24 10.745 24 24Z"
        style={{ stroke: "currentcolor" }}
      />
      <path
        strokeWidth="2"
        d="m15 24.511 7.307 7.307L35.125 19"
        style={{ stroke: "currentcolor" }}
      />
    </svg>
  )
}

function ThankYouBrand({ config }: { config: CheckoutConfig }) {
  if (!config.showLogo) {
    return (
      <div className="text-lg font-semibold tracking-tight" style={{ color: config.checkoutTextColor }}>
        {config.companyName}
      </div>
    )
  }

  if (config.logoDisplayMode === "image" && config.logoSrc) {
    return (
      <div className="flex items-center">
        <img
          src={config.logoSrc}
          alt={config.companyName}
          className="h-auto max-w-full object-contain"
          style={{ width: `${Math.min(config.logoWidth, 220)}px` }}
        />
      </div>
    )
  }

  return (
    <div className="text-lg font-semibold tracking-tight" style={{ color: config.checkoutTextColor }}>
      {config.companyName}
    </div>
  )
}

function CheckoutBrand({ config }: { config: CheckoutConfig }) {
  return config.showLogo ? (
    config.logoDisplayMode === "image" && config.logoSrc ? (
      <div data-swipe-slot="brand" className="flex items-center">
        <img src={config.logoSrc} alt={config.companyName} className="h-auto max-w-full object-contain" style={{ width: `${config.logoWidth}px` }} />
      </div>
    ) : (
      <div data-swipe-slot="brand" className="text-2xl font-bold tracking-tight" style={{ color: config.checkoutTextColor }}>
        {config.companyName}
      </div>
    )
  ) : (
    <div data-swipe-slot="brand" className="h-0" />
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
        data-swipe-slot="top-block"
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
    <nav data-swipe-slot="top-block" className="flex items-center gap-2 text-xs" style={{ color: accentColor }}>
      <span>{copy.cart}</span>
      <ChevronDown className="h-3 w-3 -rotate-90" />
      <span className="font-medium">{copy.information}</span>
      <ChevronDown className="h-3 w-3 -rotate-90" />
      <span>{copy.payment}</span>
    </nav>
  )
}

function DanielBrandLockup({ config }: { config: CheckoutConfig }) {
  if (config.showLogo && config.logoDisplayMode === "image" && config.logoSrc) {
    return (
      <div className="sf-brand">
        <img
          src={config.logoSrc}
          alt={config.companyName}
          style={{ maxWidth: `${Math.max(96, config.logoWidth)}px` }}
        />
      </div>
    )
  }

  return (
    <div className="sf-brand">
      <span className="sf-brand-text" style={{ color: config.checkoutTextColor }}>
        {config.companyName}
      </span>
    </div>
  )
}

function resolveDanielCountryRegionLabel(locale: SupportedLocale) {
  switch (locale) {
    case "pt-BR":
      return "Pais/Regiao"
    case "es-ES":
      return "Pais/Region"
    case "fr-FR":
      return "Pays/Region"
    case "de-DE":
      return "Land/Region"
    default:
      return "Country/Region"
  }
}

function resolveDanielCountryName(locale: SupportedLocale) {
  switch (locale) {
    case "pt-BR":
      return "Brasil"
    case "es-ES":
      return "Espana"
    case "fr-FR":
      return "France"
    case "de-DE":
      return "Deutschland"
    default:
      return "United States"
  }
}

function resolveDanielCountryValue(locale: SupportedLocale) {
  switch (locale) {
    case "pt-BR":
      return "BR"
    case "es-ES":
      return "ES"
    case "fr-FR":
      return "FR"
    case "de-DE":
      return "DE"
    default:
      return "US"
  }
}

function resolveDanielCountryFromAddress(address: Record<string, string | undefined>) {
  const code = (address.country_code || "").trim().toUpperCase()
  if (DANIEL_COUNTRIES.some((country) => country.value === code)) {
    return code
  }

  return ""
}

function resolveDanielFirstNamePlaceholder(locale: SupportedLocale) {
  switch (locale) {
    case "en-US":
      return "First name (optional)"
    case "es-ES":
      return "Nombre (opcional)"
    case "fr-FR":
      return "Prenom (optionnel)"
    case "de-DE":
      return "Vorname (optional)"
    default:
      return "Nome (opcional)"
  }
}

function resolveDanielApartmentPlaceholder(locale: SupportedLocale) {
  switch (locale) {
    case "en-US":
      return "Apartment, suite, etc. (optional)"
    case "es-ES":
      return "Apartamento, suite, etc. (opcional)"
    case "fr-FR":
      return "Appartement, suite, etc. (optionnel)"
    case "de-DE":
      return "Wohnung, Suite usw. (optional)"
    default:
      return "Apartamento, suite, etc. (opcional)"
  }
}

function resolveDanielSelectStateLabel(locale: SupportedLocale) {
  switch (locale) {
    case "pt-BR":
      return "Selecione o estado"
    case "es-ES":
      return "Selecciona el estado"
    case "fr-FR":
      return "Selectionnez la region"
    case "de-DE":
      return "Bundesland auswahlen"
    default:
      return "Select state"
  }
}

function resolveDanielShippingMethodTitle(locale: SupportedLocale) {
  switch (locale) {
    case "pt-BR":
      return "Metodo de entrega"
    case "es-ES":
      return "Metodo de envio"
    case "fr-FR":
      return "Mode de livraison"
    case "de-DE":
      return "Versandart"
    default:
      return "Shipping method"
  }
}

function resolveDanielFreeLabel(locale: SupportedLocale) {
  switch (locale) {
    case "pt-BR":
      return "GRATIS"
    case "es-ES":
      return "GRATIS"
    case "fr-FR":
      return "GRATUIT"
    case "de-DE":
      return "KOSTENLOS"
    default:
      return "FREE"
  }
}

function resolveDanielBuyButtonLabel(locale: SupportedLocale, configuredLabel?: string) {
  const trimmed = configuredLabel?.trim()
  if (trimmed) {
    return trimmed
  }

  switch (locale) {
    case "pt-BR":
      return "Finalizar compra"
    case "es-ES":
      return "Finalizar compra"
    case "fr-FR":
      return "Finaliser l'achat"
    case "de-DE":
      return "Kauf abschliessen"
    default:
      return "Complete purchase"
  }
}

function resolveDanielLocationActionLabel(locale: SupportedLocale) {
  switch (locale) {
    case "pt-BR":
      return "Usar localizacao atual"
    case "es-ES":
      return "Usar ubicacion actual"
    case "fr-FR":
      return "Utiliser la position actuelle"
    case "de-DE":
      return "Aktuellen Standort verwenden"
    default:
      return "Use current location"
  }
}

function resolveDanielLocationLoadingLabel(locale: SupportedLocale) {
  switch (locale) {
    case "pt-BR":
      return "Localizando..."
    case "es-ES":
      return "Ubicando..."
    case "fr-FR":
      return "Localisation..."
    case "de-DE":
      return "Standort wird ermittelt..."
    default:
      return "Locating..."
  }
}

function resolveDanielLocationError(locale: SupportedLocale, code?: number | string) {
  if (code === 1) {
    switch (locale) {
      case "pt-BR":
        return "Permita o acesso a localizacao para preencher os dados de entrega."
      case "es-ES":
        return "Permite el acceso a la ubicacion para completar la entrega."
      case "fr-FR":
        return "Autorisez la localisation pour remplir la livraison."
      case "de-DE":
        return "Erlaube den Standortzugriff fur die Lieferdaten."
      default:
        return "Allow location access to fill the delivery details."
    }
  }

  switch (locale) {
    case "pt-BR":
      return "Nao foi possivel preencher a entrega com a sua localizacao agora."
    case "es-ES":
      return "No fue posible completar la entrega con tu ubicacion ahora."
    case "fr-FR":
      return "Impossible de remplir la livraison avec votre position pour le moment."
    case "de-DE":
      return "Die Lieferdaten konnten gerade nicht uber deinen Standort ausgefullt werden."
    default:
      return "We could not fill the delivery details from your location right now."
  }
}

function DanielPaymentMethodsStrip() {
  return (
    <div className="payment-methods">
      <span className="visually-hidden">Payment methods</span>
      <ul className="list-payment" role="list" aria-label="Payment methods">
        <li className="list-payment__item">
          <svg className="icon icon--full-color" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="pi-american_express" viewBox="0 0 38 24" width="38" height="24">
            <title id="pi-american_express">American Express</title>
            <path fill="#000" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3Z" opacity=".07" />
            <path fill="#006FCF" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32Z" />
            <path fill="#FFF" d="M22.012 19.936v-8.421L37 11.528v2.326l-1.732 1.852L37 17.573v2.375h-2.766l-1.47-1.622-1.46 1.628-9.292-.02Z" />
            <path fill="#006FCF" d="M23.013 19.012v-6.57h5.572v1.513h-3.768v1.028h3.678v1.488h-3.678v1.01h3.768v1.531h-5.572Z" />
            <path fill="#006FCF" d="m28.557 19.012 3.083-3.289-3.083-3.282h2.386l1.884 2.083 1.89-2.082H37v.051l-3.017 3.23L37 18.92v.093h-2.307l-1.917-2.103-1.898 2.104h-2.321Z" />
            <path fill="#FFF" d="M22.71 4.04h3.614l1.269 2.881V4.04h4.46l.77 2.159.771-2.159H37v8.421H19l3.71-8.421Z" />
            <path fill="#006FCF" d="m23.395 4.955-2.916 6.566h2l.55-1.315h2.98l.55 1.315h2.05l-2.904-6.566h-2.31Zm.25 3.777.875-2.09.873 2.09h-1.748Z" />
            <path fill="#006FCF" d="M28.581 11.52V4.953l2.811.01L32.84 9l1.456-4.046H37v6.565l-1.74.016v-4.51l-1.644 4.494h-1.59L30.35 7.01v4.51h-1.768Z" />
          </svg>
        </li>
        <li className="list-payment__item">
          <svg className="icon icon--full-color" version="1.1" xmlns="http://www.w3.org/2000/svg" role="img" x="0" y="0" width="38" height="24" viewBox="0 0 165.521 105.965" xmlSpace="preserve" aria-labelledby="pi-apple_pay">
            <title id="pi-apple_pay">Apple Pay</title>
            <path fill="#000" d="M150.698 0H14.823c-.566 0-1.133 0-1.698.003-.477.004-.953.009-1.43.022-1.039.028-2.087.09-3.113.274a10.51 10.51 0 0 0-2.958.975 9.932 9.932 0 0 0-4.35 4.35 10.463 10.463 0 0 0-.975 2.96C.113 9.611.052 10.658.024 11.696a70.22 70.22 0 0 0-.022 1.43C0 13.69 0 14.256 0 14.823v76.318c0 .567 0 1.132.002 1.699.003.476.009.953.022 1.43.028 1.036.09 2.084.275 3.11a10.46 10.46 0 0 0 .974 2.96 9.897 9.897 0 0 0 1.83 2.52 9.874 9.874 0 0 0 2.52 1.83c.947.483 1.917.79 2.96.977 1.025.183 2.073.245 3.112.273.477.011.953.017 1.43.02.565.004 1.132.004 1.698.004h135.875c.565 0 1.132 0 1.697-.004.476-.002.952-.009 1.431-.02 1.037-.028 2.085-.09 3.113-.273a10.478 10.478 0 0 0 2.958-.977 9.955 9.955 0 0 0 4.35-4.35c.483-.947.789-1.917.974-2.96.186-1.026.246-2.074.274-3.11.013-.477.02-.954.022-1.43.004-.567.004-1.132.004-1.699V14.824c0-.567 0-1.133-.004-1.699a63.067 63.067 0 0 0-.022-1.429c-.028-1.038-.088-2.085-.274-3.112a10.4 10.4 0 0 0-.974-2.96 9.94 9.94 0 0 0-4.35-4.35A10.52 10.52 0 0 0 156.939.3c-1.028-.185-2.076-.246-3.113-.274a71.417 71.417 0 0 0-1.431-.022C151.83 0 151.263 0 150.698 0z" />
            <path fill="#FFF" d="M150.698 3.532l1.672.003c.452.003.905.008 1.36.02.793.022 1.719.065 2.583.22.75.135 1.38.34 1.984.648a6.392 6.392 0 0 1 2.804 2.807c.306.6.51 1.226.645 1.983.154.854.197 1.783.218 2.58.013.45.019.9.02 1.36.005.557.005 1.113.005 1.671v76.318c0 .558 0 1.114-.004 1.682-.002.45-.008.9-.02 1.35-.022.796-.065 1.725-.221 2.589a6.855 6.855 0 0 1-.645 1.975 6.397 6.397 0 0 1-2.808 2.807c-.6.306-1.228.511-1.971.645-.881.157-1.847.2-2.574.22-.457.01-.912.017-1.379.019-.555.004-1.113.004-1.669.004H14.801c-.55 0-1.1 0-1.66-.004a74.993 74.993 0 0 1-1.35-.018c-.744-.02-1.71-.064-2.584-.22a6.938 6.938 0 0 1-1.986-.65 6.337 6.337 0 0 1-1.622-1.18 6.355 6.355 0 0 1-1.178-1.623 6.935 6.935 0 0 1-.646-1.985c-.156-.863-.2-1.788-.22-2.578a66.088 66.088 0 0 1-.02-1.355l-.003-1.327V14.474l.002-1.325a66.7 66.7 0 0 1 .02-1.357c.022-.792.065-1.717.222-2.587a6.924 6.924 0 0 1 .646-1.981c.304-.598.7-1.144 1.18-1.623a6.386 6.386 0 0 1 1.624-1.18 6.96 6.96 0 0 1 1.98-.646c.865-.155 1.792-.198 2.586-.22.452-.012.905-.017 1.354-.02l1.677-.003h135.875Z" />
            <g>
              <g>
                <path fill="#000" d="M43.508 35.77c1.404-1.755 2.356-4.112 2.105-6.52-2.054.102-4.56 1.355-6.012 3.112-1.303 1.504-2.456 3.959-2.156 6.266 2.306.2 4.61-1.152 6.063-2.858" />
                <path fill="#000" d="M45.587 39.079c-3.35-.2-6.196 1.9-7.795 1.9-1.6 0-4.049-1.8-6.698-1.751-3.447.05-6.645 2-8.395 5.1-3.598 6.2-.95 15.4 2.55 20.45 1.699 2.5 3.747 5.25 6.445 5.151 2.55-.1 3.549-1.65 6.647-1.65 3.097 0 3.997 1.65 6.696 1.6 2.798-.05 4.548-2.5 6.247-5 1.95-2.85 2.747-5.6 2.797-5.75-.05-.05-5.396-2.101-5.446-8.251-.05-5.15 4.198-7.6 4.398-7.751-2.399-3.548-6.147-3.948-7.447-4.048" />
              </g>
              <g>
                <path fill="#000" d="M78.973 32.11c7.278 0 12.347 5.017 12.347 12.321 0 7.33-5.173 12.373-12.529 12.373h-8.058V69.62h-5.822V32.11h14.062zm-8.24 19.807h6.68c5.07 0 7.954-2.729 7.954-7.46 0-4.73-2.885-7.434-7.928-7.434h-6.706v14.894z" />
                <path fill="#000" d="M92.764 61.847c0-4.809 3.665-7.564 10.423-7.98l7.252-.442v-2.08c0-3.04-2.001-4.704-5.562-4.704-2.938 0-5.07 1.507-5.51 3.82h-5.252c.157-4.86 4.731-8.395 10.918-8.395 6.654 0 10.995 3.483 10.995 8.89v18.663h-5.38v-4.497h-.13c-1.534 2.937-4.914 4.782-8.579 4.782-5.406 0-9.175-3.222-9.175-8.057zm17.675-2.417v-2.106l-6.472.416c-3.64.234-5.536 1.585-5.536 3.95 0 2.288 1.975 3.77 5.068 3.77 3.95 0 6.94-2.522 6.94-6.03z" />
                <path fill="#000" d="M120.975 79.652v-4.496c.364.051 1.247.103 1.715.103 2.573 0 4.029-1.09 4.913-3.899l.52-1.663-9.852-27.293h6.082l6.863 22.146h.13l6.862-22.146h5.927l-10.216 28.67c-2.34 6.577-5.017 8.735-10.683 8.735-.442 0-1.872-.052-2.261-.157z" />
              </g>
            </g>
          </svg>
        </li>
        <li className="list-payment__item">
          <svg className="icon icon--full-color" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" role="img" width="38" height="24" aria-labelledby="pi-diners_club">
            <title id="pi-diners_club">Diners Club</title>
            <path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" />
            <path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32" />
            <path d="M12 12v3.7c0 .3-.2.3-.5.2-1.9-.8-3-3.3-2.3-5.4.4-1.1 1.2-2 2.3-2.4.4-.2.5-.1.5.2V12zm2 0V8.3c0-.3 0-.3.3-.2 2.1.8 3.2 3.3 2.4 5.4-.4 1.1-1.2 2-2.3 2.4-.4.2-.4.1-.4-.2V12zm7.2-7H13c3.8 0 6.8 3.1 6.8 7s-3 7-6.8 7h8.2c3.8 0 6.8-3.1 6.8-7s-3-7-6.8-7z" fill="#3086C8" />
          </svg>
        </li>
        <li className="list-payment__item">
          <svg className="icon icon--full-color" viewBox="0 0 38 24" width="38" height="24" role="img" aria-labelledby="pi-discover" fill="none" xmlns="http://www.w3.org/2000/svg">
            <title id="pi-discover">Discover</title>
            <path fill="#000" opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" />
            <path d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32z" fill="#fff" />
            <path d="M3.57 7.16H2v5.5h1.57c.83 0 1.43-.2 1.96-.63.63-.52 1-1.3 1-2.11-.01-1.63-1.22-2.76-2.96-2.76zm1.26 4.14c-.34.3-.77.44-1.47.44h-.29V8.1h.29c.69 0 1.11.12 1.47.44.37.33.59.84.59 1.37 0 .53-.22 1.06-.59 1.39zm2.19-4.14h1.07v5.5H7.02v-5.5zm3.69 2.11c-.64-.24-.83-.4-.83-.69 0-.35.34-.61.8-.61.32 0 .59.13.86.45l.56-.73c-.46-.4-1.01-.61-1.62-.61-.97 0-1.72.68-1.72 1.58 0 .76.35 1.15 1.35 1.51.42.15.63.25.74.31.21.14.32.34.32.57 0 .45-.35.78-.83.78-.51 0-.92-.26-1.17-.73l-.69.67c.49.73 1.09 1.05 1.9 1.05 1.11 0 1.9-.74 1.9-1.81.02-.89-.35-1.29-1.57-1.74zm1.92.65c0 1.62 1.27 2.87 2.9 2.87.46 0 .86-.09 1.34-.32v-1.26c-.43.43-.81.6-1.29.6-1.08 0-1.85-.78-1.85-1.9 0-1.06.79-1.89 1.8-1.89.51 0 .9.18 1.34.62V7.38c-.47-.24-.86-.34-1.32-.34-1.61 0-2.92 1.28-2.92 2.88zm12.76.94l-1.47-3.7h-1.17l2.33 5.64h.58l2.37-5.64h-1.16l-1.48 3.7zm3.13 1.8h3.04v-.93h-1.97v-1.48h1.9v-.93h-1.9V8.1h1.97v-.94h-3.04v5.5zm7.29-3.87c0-1.03-.71-1.62-1.95-1.62h-1.59v5.5h1.07v-2.21h.14l1.48 2.21h1.32l-1.73-2.32c.81-.17 1.26-.72 1.26-1.56zm-2.16.91h-.31V8.03h.33c.67 0 1.03.28 1.03.82 0 .55-.36.85-1.05.85z" fill="#231F20" />
            <path d="M20.16 12.86a2.931 2.931 0 100-5.862 2.931 2.931 0 000 5.862z" fill="url(#pi-paint0_linear)" />
            <path opacity=".65" d="M20.16 12.86a2.931 2.931 0 100-5.862 2.931 2.931 0 000 5.862z" fill="url(#pi-paint1_linear)" />
            <path d="M36.57 7.506c0-.1-.07-.15-.18-.15h-.16v.48h.12v-.19l.14.19h.14l-.16-.2c.06-.01.1-.06.1-.13zm-.2.07h-.02v-.13h.02c.06 0 .09.02.09.06 0 .05-.03.07-.09.07z" fill="#231F20" />
            <path d="M36.41 7.176c-.23 0-.42.19-.42.42 0 .23.19.42.42.42.23 0 .42-.19.42-.42 0-.23-.19-.42-.42-.42zm0 .77c-.18 0-.34-.15-.34-.35 0-.19.15-.35.34-.35.18 0 .33.16.33.35 0 .19-.15.35-.33.35z" fill="#231F20" />
            <path d="M37 12.984S27.09 19.873 8.976 23h26.023a2 2 0 002-1.984l.024-3.02L37 12.985z" fill="#F48120" />
            <defs>
              <linearGradient id="pi-paint0_linear" x1="21.657" y1="12.275" x2="19.632" y2="9.104" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F89F20" />
                <stop offset=".25" stopColor="#F79A20" />
                <stop offset=".533" stopColor="#F68D20" />
                <stop offset=".62" stopColor="#F58720" />
                <stop offset=".723" stopColor="#F48120" />
                <stop offset="1" stopColor="#F37521" />
              </linearGradient>
              <linearGradient id="pi-paint1_linear" x1="21.338" y1="12.232" x2="18.378" y2="6.446" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F58720" />
                <stop offset=".359" stopColor="#E16F27" />
                <stop offset=".703" stopColor="#D4602C" />
                <stop offset=".982" stopColor="#D05B2E" />
              </linearGradient>
            </defs>
          </svg>
        </li>
        <li className="list-payment__item">
          <svg className="icon icon--full-color" xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 38 24" width="38" height="24" aria-labelledby="pi-google_pay">
            <title id="pi-google_pay">Google Pay</title>
            <path d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" fill="#000" opacity=".07" />
            <path d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32" fill="#FFF" />
            <path d="M18.093 11.976v3.2h-1.018v-7.9h2.691a2.447 2.447 0 0 1 1.747.692 2.28 2.28 0 0 1 .11 3.224l-.11.116c-.47.447-1.098.69-1.747.674l-1.673-.006zm0-3.732v2.788h1.698c.377.012.741-.135 1.005-.404a1.391 1.391 0 0 0-1.005-2.354l-1.698-.03zm6.484 1.348c.65-.03 1.286.188 1.778.613.445.43.682 1.03.65 1.649v3.334h-.969v-.766h-.049a1.93 1.93 0 0 1-1.673.931 2.17 2.17 0 0 1-1.496-.533 1.667 1.667 0 0 1-.613-1.324 1.606 1.606 0 0 1 .613-1.336 2.746 2.746 0 0 1 1.698-.515c.517-.02 1.03.093 1.49.331v-.208a1.134 1.134 0 0 0-.417-.901 1.416 1.416 0 0 0-.98-.368 1.545 1.545 0 0 0-1.319.717l-.895-.564a2.488 2.488 0 0 1 2.182-1.06zM23.29 13.52a.79.79 0 0 0 .337.662c.223.176.5.269.785.263.429-.001.84-.17 1.146-.472.305-.286.478-.685.478-1.103a2.047 2.047 0 0 0-1.324-.374 1.716 1.716 0 0 0-1.03.294.883.883 0 0 0-.392.73zm9.286-3.75l-3.39 7.79h-1.048l1.281-2.728-2.224-5.062h1.103l1.612 3.885 1.569-3.885h1.097z" fill="#5F6368" />
            <path d="M13.986 11.284c0-.308-.024-.616-.073-.92h-4.29v1.747h2.451a2.096 2.096 0 0 1-.9 1.373v1.134h1.464a4.433 4.433 0 0 0 1.348-3.334z" fill="#4285F4" />
            <path d="M9.629 15.721a4.352 4.352 0 0 0 3.01-1.097l-1.466-1.14a2.752 2.752 0 0 1-4.094-1.44H5.577v1.17a4.53 4.53 0 0 0 4.052 2.507z" fill="#34A853" />
            <path d="M7.079 12.05a2.709 2.709 0 0 1 0-1.735v-1.17H5.577a4.505 4.505 0 0 0 0 4.075l1.502-1.17z" fill="#FBBC04" />
            <path d="M9.629 8.44a2.452 2.452 0 0 1 1.74.68l1.3-1.293a4.37 4.37 0 0 0-3.065-1.183 4.53 4.53 0 0 0-4.027 2.5l1.502 1.171a2.715 2.715 0 0 1 2.55-1.875z" fill="#EA4335" />
          </svg>
        </li>
        <li className="list-payment__item">
          <svg className="icon icon--full-color" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" role="img" width="38" height="24" aria-labelledby="pi-master">
            <title id="pi-master">Mastercard</title>
            <path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" />
            <path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32" />
            <circle fill="#EB001B" cx="15" cy="12" r="7" />
            <circle fill="#F79E1B" cx="23" cy="12" r="7" />
            <path fill="#FF5F00" d="M22 12c0-2.4-1.2-4.5-3-5.7-1.8 1.3-3 3.4-3 5.7s1.2 4.5 3 5.7c1.8-1.2 3-3.3 3-5.7z" />
          </svg>
        </li>
        <li className="list-payment__item">
          <svg className="icon icon--full-color" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" role="img" width="38" height="24" aria-labelledby="pi-visa">
            <title id="pi-visa">Visa</title>
            <path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" />
            <path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32" />
            <path d="M28.3 10.1H28c-.4 1-.7 1.5-1 3h1.9c-.3-1.5-.3-2.2-.6-3zm2.9 5.9h-1.7c-.1 0-.1 0-.2-.1l-.2-.9-.1-.2h-2.4c-.1 0-.2 0-.2.2l-.3.9c0 .1-.1.1-.1.1h-2.1l.2-.5L27 8.7c0-.5.3-.7.8-.7h1.5c.1 0 .2 0 .2.2l1.4 6.5c.1.4.2.7.2 1.1.1.1.1.1.1.2zm-13.4-.3l.4-1.8c.1 0 .2.1.2.1.7.3 1.4.5 2.1.4.2 0 .5-.1.7-.2.5-.2.5-.7.1-1.1-.2-.2-.5-.3-.8-.5-.4-.2-.8-.4-1.1-.7-1.2-1-.8-2.4-.1-3.1.6-.4.9-.8 1.7-.8 1.2 0 2.5 0 3.1.2h.1c-.1.6-.2 1.1-.4 1.7-.5-.2-1-.4-1.5-.4-.3 0-.6 0-.9.1-.2 0-.3.1-.4.2-.2.2-.2.5 0 .7l.5.4c.4.2.8.4 1.1.6.5.3 1 .8 1.1 1.4.2.9-.1 1.7-.9 2.3-.5.4-.7.6-1.4.6-1.4 0-2.5.1-3.4-.2-.1.2-.1.2-.2.1zm-3.5.3c.1-.7.1-.7.2-1 .5-2.2 1-4.5 1.4-6.7.1-.2.1-.3.3-.3H18c-.2 1.2-.4 2.1-.7 3.2-.3 1.5-.6 3-1 4.5 0 .2-.1.2-.3.2M5 8.2c0-.1.2-.2.3-.2h3.4c.5 0 .9.3 1 .8l.9 4.4c0 .1 0 .1.1.2 0-.1.1-.1.1-.1l2.1-5.1c-.1-.1 0-.2.1-.2h2.1c0 .1 0 .1-.1.2l-3.1 7.3c-.1.2-.1.3-.2.4-.1.1-.3 0-.5 0H9.7c-.1 0-.2 0-.2-.2L7.9 9.5c-.2-.2-.5-.5-.9-.6-.6-.3-1.7-.5-1.9-.5L5 8.2z" fill="#142688" />
          </svg>
        </li>
      </ul>
    </div>
  )
}

function buildDanielAddressLine(address: Record<string, string | undefined>) {
  const streetParts = [
    address.house_number,
    address.road || address.pedestrian || address.cycleway || address.footway,
  ].filter(Boolean)

  if (streetParts.length > 0) {
    return streetParts.join(" ")
  }

  return (
    address.suburb ||
    address.neighbourhood ||
    address.hamlet ||
    address.quarter ||
    ""
  )
}

function resolveDanielStateValue(address: Record<string, string | undefined>) {
  const stateCode = (address.state_code || "").trim().toUpperCase()
  if (stateCode && US_STATES.some((state) => state.value === stateCode)) {
    return stateCode
  }

  const stateName = (address.state || "").trim().toLowerCase()
  if (!stateName) {
    return ""
  }

  const match = US_STATES.find((state) => state.label.toLowerCase() === stateName)
  return match?.value ?? ""
}

function ContactSection({
  config,
  compact,
  copy,
  contactData,
  onChange,
  hideTitle = false,
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
  hideTitle?: boolean
}) {
  return (
    <section data-swipe-slot="contact" className="space-y-4">
      {!hideTitle ? (
        <div className={cn("gap-2", compact ? "space-y-2" : "flex items-center justify-between")}>
          <h2 className="text-lg font-medium" style={{ color: config.checkoutTextColor }}>{copy.contact}</h2>
        </div>
      ) : null}
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
  hideTitle = false,
}: {
  config: CheckoutConfig
  compact: boolean
  copy: Copy
  deliveryData: DeliveryFormData
  onChange: React.Dispatch<React.SetStateAction<DeliveryFormData>>
  hideTitle?: boolean
}) {
  return (
    <section data-swipe-slot="delivery" className={cn("space-y-4", hideTitle ? "" : "pt-4")}>
      {!hideTitle ? (
        <h2 className="text-lg font-medium" style={{ color: config.checkoutTextColor }}>{copy.delivery}</h2>
      ) : null}
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
  hideTitle = false,
}: {
  config: CheckoutConfig
  copy: Copy
  deliveryCompleted: boolean
  methods: ShippingMethod[]
  selectedShippingId: string | null
  onSelect: (value: string) => void
  locale: SupportedLocale
  currency: SupportedCurrency
  hideTitle?: boolean
}) {
  return (
    <section data-swipe-slot="shipping" className={cn("space-y-4", hideTitle ? "" : "pt-4")}>
      {!hideTitle ? (
        <h2 className="text-lg font-medium" style={{ color: config.checkoutTextColor }}>
          {copy.shippingOptionsTitle}
        </h2>
      ) : null}
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
  hideTitle = false,
  variant = "default",
}: {
  config: CheckoutConfig
  copy: Copy
  locale: SupportedLocale
  contactData: ContactFormData
  deliveryData: DeliveryFormData
  onPaymentViewed?: () => void | Promise<void>
  onPaymentStarted?: () => void | Promise<void>
  hideTitle?: boolean
  variant?: "default" | "daniel"
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
        country: resolveWhopCountry(deliveryData.country || resolveDanielCountryValue(locale)),
        line1: deliveryData.address.trim() || undefined,
        line2: deliveryData.apartment.trim() || undefined,
        city: deliveryData.city.trim() || undefined,
        state: deliveryData.state.trim() || undefined,
        postalCode: deliveryData.zip.trim() || undefined,
      },
    }),
    [
      contactData.email,
      deliveryData.address,
      deliveryData.apartment,
      deliveryData.city,
      deliveryData.country,
      deliveryData.state,
      deliveryData.zip,
      inferredFullName,
      locale,
    ]
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
  const resolvedButtonLabel = resolveDanielBuyButtonLabel(locale, config.buttonText)
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
    <section data-swipe-slot="payment" ref={paymentSectionRef} className={cn("space-y-4", hideTitle ? "" : "pt-4")}>
      {!hideTitle ? <h2 className="text-lg font-medium" style={{ color: config.checkoutTextColor }}>{copy.payment}</h2> : null}
      {variant !== "daniel" ? (
        <p className="text-sm" style={{ color: config.checkoutMutedColor }}>{copy.paymentSafe}</p>
      ) : null}
      {hasEmbeddedSession ? (
        <div
          className={cn(
            variant === "daniel" ? "payment-frame" : "overflow-hidden rounded-md border bg-white"
          )}
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
          {variant === "daniel" ? (
            <div className="px-1 pb-1 pt-3">
              <BuyButton
                config={config}
                label={resolvedButtonLabel}
                onClick={handleEmbeddedCheckoutSubmit}
              />
              <DanielPaymentMethodsStrip />
            </div>
          ) : (
            <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: config.checkoutMutedColor }}>
              <BuyButton
                config={config}
                label={config.buttonText}
                onClick={handleEmbeddedCheckoutSubmit}
              />
            </div>
          )}
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
    <div data-swipe-slot="coupon" className="flex gap-2">
      <Input placeholder={copy.couponPlaceholder} className="h-11 bg-white" style={{ borderColor: config.checkoutMutedColor }} />
      <Button variant="outline" className="h-11" style={{ backgroundColor: config.checkoutBackgroundColor, borderColor: config.checkoutMutedColor, color: config.checkoutMutedColor }}>
        {copy.apply}
      </Button>
    </div>
  )
}

function InfoBanner({ config, text }: { config: CheckoutConfig; text: string }) {
  return (
    <div data-swipe-slot="info-banner" className="flex items-center gap-2 rounded-md border p-4" style={{ backgroundColor: withAlpha(config.checkoutAccentColor, 0.08), borderColor: withAlpha(config.checkoutAccentColor, 0.18), color: config.checkoutAccentColor }}>
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
    <footer data-swipe-slot="footer" className="border-t pb-12 pt-8 text-xs" style={{ borderColor: config.checkoutMutedColor, color: config.checkoutMutedColor }}>
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
    <div data-swipe-slot="policies" className={cn("pt-4 text-xs", compact ? "space-y-3" : "space-y-2")} style={{ color: config.checkoutMutedColor }}>
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
    <div data-swipe-slot="order-item" className="flex items-center gap-4">
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
    <div data-swipe-slot="summary-rows" className="space-y-2">
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

function resolveWhopCountry(value: SupportedLocale | string) {
  switch (value) {
    case "BR":
    case "pt-BR":
      return "BR"
    case "US":
    case "en-US":
      return "US"
    case "ES":
    case "es-ES":
      return "ES"
    case "FR":
    case "fr-FR":
      return "FR"
    case "DE":
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
