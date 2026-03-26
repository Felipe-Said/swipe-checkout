"use client"

import * as React from "react"

export type Language = "pt-BR" | "en-US" | "es-ES"
export type Currency = "BRL" | "USD" | "EUR"

interface Translations {
  [key: string]: {
    [lang in Language]: string
  }
}

export const translations: Translations = {
  // Dashboard
  "dash.welcome": { "pt-BR": "Bem-vindo de volta!", "en-US": "Welcome back!", "es-ES": "¡Bienvenido de nuevo!" },
  "dash.subtitle": { "pt-BR": "Aqui está o que está acontecendo com sua operação hoje.", "en-US": "Here is what is happening with your operation today.", "es-ES": "Aquí está lo que está sucediendo con su operación hoy." },
  "dash.date_ref": { "pt-BR": "Data de referência", "en-US": "Reference date", "es-ES": "Fecha de referencia" },
  "dash.period": { "pt-BR": "Período", "en-US": "Period", "es-ES": "Periodo" },
  "dash.today": { "pt-BR": "Hoje", "en-US": "Today", "es-ES": "Hoy" },
  "dash.7days": { "pt-BR": "7 dias", "en-US": "7 days", "es-ES": "7 días" },
  "dash.30days": { "pt-BR": "30 dias", "en-US": "30 days", "es-ES": "30 días" },
  "dash.90days": { "pt-BR": "90 dias", "en-US": "90 days", "es-ES": "90 días" },
  "dash.total_checkouts": { "pt-BR": "Total de Checkouts", "en-US": "Total Checkouts", "es-ES": "Total de Checkouts" },
  "dash.avg_conversion": { "pt-BR": "Conversão Média", "en-US": "Avg Conversion", "es-ES": "Conversión Media" },
  "dash.total_orders": { "pt-BR": "Pedidos Totais", "en-US": "Total Orders", "es-ES": "Pedidos Totales" },
  "dash.revenue": { "pt-BR": "Receita", "en-US": "Revenue", "es-ES": "Ingresos" },
  "dash.fee_rate": { "pt-BR": "Taxa de Transação", "en-US": "Transaction Fee", "es-ES": "Tasa de Transacción" },
  "dash.billing_cycle": { "pt-BR": "Ciclo de cobrança: a cada 2 dias", "en-US": "Billing cycle: every 2 days", "es-ES": "Ciclo de facturación: cada 2 días" },
  "dash.last_withdrawal": { "pt-BR": "Último saque", "en-US": "Last withdrawal", "es-ES": "Último retiro" },
  "dash.recent_sales": { "pt-BR": "Vendas Recentes", "en-US": "Recent Sales", "es-ES": "Ventas Recientes" },
  "dash.active_checkouts": { "pt-BR": "Checkouts Ativos", "en-US": "Active Checkouts", "es-ES": "Checkouts Activos" },
  "dash.campaigns": { "pt-BR": "Campanhas", "en-US": "Campaigns", "es-ES": "Campañas" },
  "dash.updated_at": { "pt-BR": "Atualizado em", "en-US": "Updated at", "es-ES": "Actualizado en" },

  // Sidebar
  "nav.dashboard": { "pt-BR": "Dashboard", "en-US": "Dashboard", "es-ES": "Panel" },
  "nav.checkouts": { "pt-BR": "Checkouts", "en-US": "Checkouts", "es-ES": "Checkouts" },
  "nav.orders": { "pt-BR": "Pedidos", "en-US": "Orders", "es-ES": "Pedidos" },
  "nav.shipping": { "pt-BR": "Fretes", "en-US": "Shipping", "es-ES": "Envíos" },
  "nav.customers": { "pt-BR": "Clientes", "en-US": "Customers", "es-ES": "Clientes" },
  "nav.domains": { "pt-BR": "Domínios", "en-US": "Domains", "es-ES": "Dominios" },
  "nav.stores": { "pt-BR": "Lojas", "en-US": "Stores", "es-ES": "Tiendas" },
  "nav.withdrawals": { "pt-BR": "Saques", "en-US": "Withdrawals", "es-ES": "Retiros" },
  "nav.settings": { "pt-BR": "Configurações", "en-US": "Settings", "es-ES": "Configuraciones" },
  "nav.whop": { "pt-BR": "Whop", "en-US": "Whop", "es-ES": "Whop" },
  "nav.all_checkouts": { "pt-BR": "Todos os Checkouts", "en-US": "All Checkouts", "es-ES": "Todos los Checkouts" },
  "nav.create_new": { "pt-BR": "Criar Novo", "en-US": "Create New", "es-ES": "Crear Nuevo" },
  "nav.messenger": { "pt-BR": "Messenger", "en-US": "Messenger", "es-ES": "Messenger" },
  "nav.account_active": { "pt-BR": "Conta Ativa", "en-US": "Account Active", "es-ES": "Cuenta Activa" },
  "nav.device": { "pt-BR": "Dispositivo", "en-US": "Device", "es-ES": "Dispositivo" },
  "nav.location": { "pt-BR": "Localização", "en-US": "Location", "es-ES": "Ubicación" },
  "nav.connected_ago": { "pt-BR": "Conectado há", "en-US": "Connected", "es-ES": "Conectado hace" },
  "nav.minutes_ago": { "pt-BR": "minutos", "en-US": "minutes ago", "es-ES": "minutos" },
  "nav.revoke": { "pt-BR": "REVOGAR ACESSO", "en-US": "REVOKE ACCESS", "es-ES": "REVOCAR ACCESO" },
  "nav.this_session": { "pt-BR": "ESTA SESSÃO", "en-US": "THIS SESSION", "es-ES": "ESTA SESIÓN" },
  "nav.view_history": { "pt-BR": "Ver Histórico Completo", "en-US": "View Full History", "es-ES": "Ver Historial Completo" },
  "nav.secure_session": { "pt-BR": "Sessão Segura", "en-US": "Secure Session", "es-ES": "Sesión Segura" },
  "nav.secure_desc": { "pt-BR": "Esta conexão está protegida por criptografia de ponta a ponta e MFA ativo.", "en-US": "This connection is protected by end-to-end encryption and active MFA.", "es-ES": "Esta conexión está protegida por cifrado de extremo a extremo y MFA activo." },
  "nav.verified": { "pt-BR": "VERIFICADO", "en-US": "VERIFIED", "es-ES": "VERIFICADO" },
  "nav.security_tip": { "pt-BR": "Sua senha é criptografada e nunca será exibida para ninguém.", "en-US": "Your password is encrypted and will never be displayed to anyone.", "es-ES": "Su contraseña está cifrada y nunca se mostrará a nadie." },
  "nav.account_security": { "pt-BR": "Segurança da Conta", "en-US": "Account Security", "es-ES": "Seguridad de la Cuenta" },
  "nav.account_security_desc": { "pt-BR": "Recomendamos a alteração de senha a cada 90 dias e o uso de autenticação em duas etapas para garantir a máxima proteção do seu faturamento e dados.", "en-US": "We recommend changing your password every 90 days and using two-factor authentication to ensure maximum protection of your revenue and data.", "es-ES": "Recomendamos cambiar su contraseña cada 90 dias y usar la autenticación de dos factores para garantizar la máxima protección de sus ingresos y datos." },

  // Settings Page
  "settings.title": { "pt-BR": "Configurações", "en-US": "Settings", "es-ES": "Configuraciones" },
  "settings.subtitle": { "pt-BR": "Gerencie seu perfil, segurança da conta e histórico de acessos.", "en-US": "Manage your profile, account security and access history.", "es-ES": "Administre su perfil, seguridad de cuenta e historial de acceso." },
  "settings.account_summary": { "pt-BR": "Resumo da Conta", "en-US": "Account Summary", "es-ES": "Resumen de Cuenta" },
  "settings.total_revenue": { "pt-BR": "Faturamento Total", "en-US": "Total Revenue", "es-ES": "Ingresos Totales" },
  "settings.last_access": { "pt-BR": "Último Acesso", "en-US": "Last Access", "es-ES": "Último Acceso" },
  "settings.profile.title": { "pt-BR": "Perfil", "en-US": "Profile", "es-ES": "Perfil" },
  "settings.profile.desc": { "pt-BR": "Gerencie suas informações básicas e foto de perfil.", "en-US": "Manage your basic information and profile photo.", "es-ES": "Administre su información básica y foto de perfil." },
  "settings.profile.name": { "pt-BR": "Nome Completo", "en-US": "Full Name", "es-ES": "Nombre Completo" },
  "settings.profile.email": { "pt-BR": "E-mail de Acesso", "en-US": "Access Email", "es-ES": "Email de Acceso" },
  "settings.profile.save": { "pt-BR": "Salvar Alterações", "en-US": "Save Changes", "es-ES": "Guardar Cambios" },
  "settings.profile.saving": { "pt-BR": "Salvando...", "en-US": "Saving...", "es-ES": "Guardando..." },
  "settings.security.title": { "pt-BR": "Segurança", "en-US": "Security", "es-ES": "Seguridad" },
  "settings.security.desc": { "pt-BR": "Atualize sua senha de acesso ao painel Swipe.", "en-US": "Update your Swipe dashboard access password.", "es-ES": "Actualice su contraseña de acceso al panel Swipe." },
  "settings.security.current_password": { "pt-BR": "Senha Atual", "en-US": "Current Password", "es-ES": "Contraseña Actual" },
  "settings.security.new_password": { "pt-BR": "Nova Senha", "en-US": "New Password", "es-ES": "Nueva Contraseña" },
  "settings.security.confirm_password": { "pt-BR": "Confirmar Nova Senha", "en-US": "Confirm New Password", "es-ES": "Confirmar Nueva Contraseña" },
  "settings.security.update": { "pt-BR": "Atualizar Senha", "en-US": "Update Password", "es-ES": "Actualizar Contraseña" },
  "settings.session.title": { "pt-BR": "Sessão Atual", "en-US": "Current Session", "es-ES": "Sesión Actual" },
  "settings.session.desc": { "pt-BR": "Informações da sessão aberta neste momento.", "en-US": "Information about the currently open session.", "es-ES": "Información sobre la sesión abierta en este momento." },
  "settings.history.title": { "pt-BR": "Histórico de Logins", "en-US": "Login History", "es-ES": "Historial de Inicios de Sesión" },
  "settings.history.terminate_all": { "pt-BR": "Encerrar Todas as Sessões", "en-US": "Terminate All Sessions", "es-ES": "Cerrar Todas las Sesiones" },
  
  // New Preferences Card
  "settings.preferences.title": { "pt-BR": "Preferências do Painel", "en-US": "Dashboard Preferences", "es-ES": "Preferencias del Panel" },
  "settings.preferences.desc": { "pt-BR": "Personalize o idioma e a exibição de moeda do seu painel.", "en-US": "Customize the language and currency display of your dashboard.", "es-ES": "Personalice el idioma y la visualización de la moneda de su panel." },
  "settings.preferences.language": { "pt-BR": "Idioma do Sistema", "en-US": "System Language", "es-ES": "Idioma del Sistema" },
  "settings.preferences.currency": { "pt-BR": "Moeda Padrão", "en-US": "Default Currency", "es-ES": "Moneda Predeterminada" },
  
  // Domains Page
  "domains.title": { "pt-BR": "Domínios do Checkout", "en-US": "Checkout Domains", "es-ES": "Dominios de Checkout" },
  "domains.subtitle": { "pt-BR": "Conecte domínios, acompanhe verificação e aponte o checkout corretamente na Vercel.", "en-US": "Connect domains, track verification and point checkout correctly on Vercel.", "es-ES": "Conecte dominios, realice un seguimiento de la verificación y apunte el pago correctamente en Vercel." },
  "domains.setup_title": { "pt-BR": "Novo domínio do checkout", "en-US": "New Checkout Domain", "es-ES": "Nuevo Dominio de Checkout" },
  "domains.setup_desc": { "pt-BR": "Conecte um domínio e aponte para a plataforma.", "en-US": "Connect a domain and point it to the platform.", "es-ES": "Conecte un dominio y apunte a la plataforma." },
}

interface I18nContextType {
  language: Language
  currency: Currency
  setLanguage: (lang: Language) => void
  setCurrency: (curr: Currency) => void
  t: (key: keyof typeof translations) => string
  formatCurrency: (value: number) => string
}

const I18nContext = React.createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<Language>("pt-BR")
  const [currency, setCurrencyState] = React.useState<Currency>("BRL")

  React.useEffect(() => {
    const savedLang = localStorage.getItem("swipe-language") as Language
    const savedCurr = localStorage.getItem("swipe-currency") as Currency
    if (savedLang) setLanguageState(savedLang)
    if (savedCurr) setCurrencyState(savedCurr)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("swipe-language", lang)
  }

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr)
    localStorage.setItem("swipe-currency", curr)
  }

  const t = (key: keyof typeof translations): string => {
    return (translations[key][language] as string) || (key as string)
  }

  const formatCurrency = (value: number) => {
    const locales: { [curr in Currency]: string } = {
       BRL: "pt-BR",
       USD: "en-US",
       EUR: "de-DE"
    }
    return new Intl.NumberFormat(locales[currency], {
      style: "currency",
      currency: currency,
    }).format(value)
  }

  return (
    <I18nContext.Provider value={{ language, currency, setLanguage, setCurrency, t, formatCurrency }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = React.useContext(I18nContext)
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}
