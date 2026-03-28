"use client"

import * as React from "react"
import { supabase } from "@/lib/supabase"
import { getCurrentAppSession, readAppSession, writeAppSession } from "@/lib/app-session"
import { loadSettingsForSession, saveSettingsProfile } from "@/app/actions/settings"
import { SettingsHeader } from "@/components/settings/settings-header"
import { SettingsProfileCard } from "@/components/settings/settings-profile-card"
import { SettingsSecurityCard } from "@/components/settings/settings-security-card"
import { SettingsCurrentSessionCard } from "@/components/settings/settings-current-session-card"
import { SettingsLoginHistoryCard } from "@/components/settings/settings-login-history-card"
import { SettingsPreferencesCard } from "@/components/settings/settings-preferences-card"
import { useI18n } from "@/lib/i18n"

type LoginHistoryItem = {
  id: string
  device: string
  city: string
  date: string
  current: boolean
}

export default function SettingsPage() {
  const { t } = useI18n()
  const [session, setSession] = React.useState<any | null>(null)
  const [profileName, setProfileName] = React.useState("")
  const [profileEmail, setProfileEmail] = React.useState("")
  const [profileImage, setProfileImage] = React.useState<string | undefined>(undefined)
  const [totalRevenue, setTotalRevenue] = React.useState(0)
  const [loginHistory, setLoginHistory] = React.useState<LoginHistoryItem[]>([])
  const [isSaving, setIsSaving] = React.useState(false)
  const [isChangingPassword, setIsChangingPassword] = React.useState(false)

  React.useEffect(() => {
    async function load() {
      const appSession = await getCurrentAppSession()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!appSession) {
        return
      }

      setSession({
        ...(user ?? {
          id: appSession.userId,
          email: appSession.email,
          user_metadata: {
            name: appSession.name,
          },
        }),
        appSession,
      })

      const result = await loadSettingsForSession({
        userId: appSession.userId,
        accountId: appSession.accountId,
      })

      if (result.error || !result.profile) {
        return
      }

      setProfileName(result.profile.name)
      setProfileEmail(result.profile.email)
      setProfileImage(result.profile.photoUrl)
      setTotalRevenue(result.totalRevenue || 0)
      setLoginHistory(
        (result.loginHistory || []).map((item, index) => ({
          id: item.id,
          device: item.device,
          city: item.location || "Local nao informado",
          date: formatDateTime(item.logged_at),
          current: index === 0,
        })),
      )
    }

    void load()
  }, [])

  const handleSaveProfile = async () => {
    if (!session?.appSession) {
      return
    }

    setIsSaving(true)

    const nextName = profileName.trim()
    const nextEmail = profileEmail.trim()

    const profileResult = await saveSettingsProfile({
      userId: session.id,
      name: nextName,
      email: nextEmail,
      photoUrl: profileImage || null,
    })

    if (!profileResult.error && nextEmail && nextEmail !== session.email && session.id) {
      const { error: authEmailError } = await supabase.auth.updateUser({
        email: nextEmail,
      })

      if (authEmailError) {
        setIsSaving(false)
        return
      }
    }

    if (!profileResult.error && nextName && nextName !== session.user_metadata?.name && session.id) {
      await supabase.auth.updateUser({
        data: {
          name: nextName,
        },
      })
    }

    if (!profileResult.error) {
      writeAppSession({
        ...session.appSession,
        name: nextName,
        email: nextEmail,
      })

      setSession((current: any) =>
        current
          ? {
              ...current,
              email: nextEmail,
              user_metadata: {
                ...(current.user_metadata || {}),
                name: nextName,
              },
            }
          : current,
      )

      window.dispatchEvent(
        new CustomEvent("swipe-profile-photo-updated", {
          detail: { photoUrl: profileImage || "" },
        }),
      )
    }

    setIsSaving(false)
  }

  const handleUpdatePassword = async (current: string, next: string) => {
    if (!session?.email) {
      return
    }

    setIsChangingPassword(true)

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: session.email,
      password: current,
    })

    if (!verifyError) {
      await supabase.auth.updateUser({ password: next })
    }

    setIsChangingPassword(false)
  }

  if (!session) {
    return null
  }

  const currentAccess =
    loginHistory.find((item) => item.current) ??
    loginHistory[0] ?? {
      id: "current",
      device: detectDeviceLabel(),
      city: Intl.DateTimeFormat().resolvedOptions().timeZone || "Local nao informado",
      date: "Agora",
      current: true,
    }

  const isAdmin = session.appSession?.role === "admin"
  const revenueCaption = isAdmin
    ? "Receita real de todas as contas gerenciadas"
    : "Receita real da sua conta"
  const sessionCaption = `Sessao em ${currentAccess.device}`

  return (
    <div className="flex flex-col gap-10 pb-10">
      <SettingsHeader
        name={profileName}
        email={profileEmail}
        totalRevenue={totalRevenue}
        lastAccess={currentAccess.date}
        revenueCaption={revenueCaption}
        sessionCaption={sessionCaption}
        profileImage={profileImage}
      />

      <div className="grid gap-10 xl:grid-cols-[1fr_400px]">
        <div className="space-y-10">
          <SettingsProfileCard
            name={profileName}
            email={profileEmail}
            profileImage={profileImage}
            onNameChange={setProfileName}
            onEmailChange={setProfileEmail}
            onImageChange={setProfileImage}
            onImageRemove={() => setProfileImage(undefined)}
            onSave={handleSaveProfile}
            isLoading={isSaving}
          />

          <SettingsPreferencesCard />

          <SettingsSecurityCard
            onUpdatePassword={handleUpdatePassword}
            isLoading={isChangingPassword}
          />
        </div>

        <div className="space-y-10">
          <SettingsCurrentSessionCard
            device={currentAccess.device}
            city={currentAccess.city}
            date={currentAccess.date}
            deviceDetails={currentAccess.device}
            locationDetails={currentAccess.city}
            sessionDetails={currentAccess.current ? "Sessao atual" : "Acesso recente"}
          />

          <SettingsLoginHistoryCard history={loginHistory} />

          <div className="rounded-3xl border border-primary/10 bg-primary/5 p-6 shadow-lg">
            <h4 className="mb-2 text-sm font-black uppercase tracking-tight">
              {t("nav.account_security")}
            </h4>
            <p className="text-xs font-medium leading-relaxed text-muted-foreground">
              {t("nav.account_security_desc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Agora"
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function detectDeviceLabel() {
  if (typeof window === "undefined") {
    return "Dispositivo"
  }

  const userAgent = window.navigator.userAgent || ""
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "Safari (iPhone)"
  if (/Android/i.test(userAgent)) return "Android"
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "Chrome (MacBook)"
  if (/Windows/i.test(userAgent)) return "Chrome (Windows)"
  return "Navegador"
}
