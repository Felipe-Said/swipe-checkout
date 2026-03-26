"use client"

import * as React from "react"
import { supabase } from "@/lib/supabase"
import { getManagedAccounts } from "@/lib/account-metrics"
import { SettingsHeader } from "@/components/settings/settings-header"
import { SettingsProfileCard } from "@/components/settings/settings-profile-card"
import { SettingsSecurityCard } from "@/components/settings/settings-security-card"
import { SettingsCurrentSessionCard } from "@/components/settings/settings-current-session-card"
import { SettingsLoginHistoryCard } from "@/components/settings/settings-login-history-card"
import { SettingsPreferencesCard } from "@/components/settings/settings-preferences-card"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const loginHistory = [
  {
    id: "1",
    device: "Chrome (Windows)",
    city: "São Paulo, BR",
    date: "25/03/2026 09:42",
    current: true,
  },
  {
    id: "2",
    device: "Safari (iPhone)",
    city: "Campinas, BR",
    date: "24/03/2026 21:14",
    current: false,
  },
  {
    id: "3",
    device: "Chrome (MacBook)",
    city: "Curitiba, BR",
    date: "22/03/2026 18:07",
    current: false,
  },
]

export default function SettingsPage() {
  const { t } = useI18n()
  const [session, setSession] = React.useState<any | null>(null)
  const [profileName, setProfileName] = React.useState("")
  const [profileEmail, setProfileEmail] = React.useState("")
  const [profileImage, setProfileImage] = React.useState<string | undefined>(undefined)
  const [totalRevenue, setTotalRevenue] = React.useState(0)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setSession(user)
        setProfileName(user.user_metadata?.name || user.email?.split('@')[0] || "")
        setProfileEmail(user.email || "")
      }

      const accounts = await getManagedAccounts()
      const total = accounts.reduce((acc, curr) => acc + (curr.revenue || 0), 0)
      setTotalRevenue(total)

      const savedPhoto = localStorage.getItem("swipe-profile-photo")
      if (savedPhoto) {
        setProfileImage(savedPhoto)
      }
    }
    load()
  }, [])

  const handleSaveProfile = () => {
    if (!session) return
    setIsSaving(true)
    
    // Simulate save or use supabase.auth.updateUser in production
    setTimeout(() => {
      if (profileImage) {
        localStorage.setItem("swipe-profile-photo", profileImage)
      } else {
        localStorage.removeItem("swipe-profile-photo")
      }
      
      setIsSaving(false)
    }, 800)
  }

  const handleUpdatePassword = (current: string, next: string) => {
    // Prototype logic: just show success or log
    console.log("Updating password from", current, "to", next)
  }

  if (!session) return null

  const currentAccess = loginHistory.find((item) => item.current) ?? loginHistory[0]

  return (
    <div className="flex flex-col gap-10 pb-10">
      <SettingsHeader 
        name={profileName}
        email={profileEmail}
        totalRevenue={totalRevenue}
        lastAccess={currentAccess.date}
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
            isLoading={isSaving}
          />
        </div>

        <div className="space-y-10">
          <SettingsCurrentSessionCard 
            device={currentAccess.device}
            city={currentAccess.city}
            date={currentAccess.date}
          />

          <SettingsLoginHistoryCard history={loginHistory} />

          <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 shadow-lg">
             <h4 className="text-sm font-black uppercase tracking-tight mb-2">{t("nav.account_security")}</h4>
             <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                {t("nav.account_security_desc")}
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
