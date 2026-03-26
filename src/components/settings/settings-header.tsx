"use client"

import * as React from "react"
import { User, Wallet, Clock, Mail } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n"

interface SettingsHeaderProps {
  name: string
  email: string
  totalRevenue: number
  lastAccess: string
  profileImage?: string
}

export function SettingsHeader({
  name,
  email,
  totalRevenue,
  lastAccess,
  profileImage
}: SettingsHeaderProps) {
  const { t, formatCurrency } = useI18n()
  const formattedRevenue = formatCurrency(totalRevenue)

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="flex flex-col gap-8 mb-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tighter">{t("settings.title")}</h1>
        <p className="text-muted-foreground font-medium text-sm">
          {t("settings.subtitle")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-1 md:col-span-2 bg-card/40 backdrop-blur-sm border border-primary/10 p-6 rounded-3xl shadow-xl flex items-center gap-6 group hover:border-primary/20 transition-all">
          <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-lg group-hover:scale-105 transition-transform duration-500">
            <AvatarImage src={profileImage} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-black tracking-tight truncate">{name}</h2>
                <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest h-5">
                   Conta Ativa
                </Badge>
             </div>
             <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <Mail className="h-3.5 w-3.5" />
                {email}
             </div>
          </div>
        </div>

        <div className="bg-card/40 backdrop-blur-sm border border-primary/10 p-6 rounded-3xl shadow-xl flex flex-col justify-between group hover:border-primary/20 transition-all">
           <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">{t("settings.total_revenue")}</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                 <Wallet className="h-5 w-5" />
              </div>
           </div>
           <div>
              <div className="text-2xl font-black tracking-tight text-emerald-500">{formattedRevenue}</div>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 uppercase tracking-tighter">Soma de todas as contas gerenciadas</p>
           </div>
        </div>

        <div className="bg-card/40 backdrop-blur-sm border border-primary/10 p-6 rounded-3xl shadow-xl flex flex-col justify-between group hover:border-primary/20 transition-all">
           <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">{t("settings.last_access")}</span>
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                 <Clock className="h-5 w-5" />
              </div>
           </div>
           <div>
              <div className="text-2xl font-black tracking-tight">{lastAccess}</div>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 uppercase tracking-tighter">Sessão em Windows (Google Chrome)</p>
           </div>
        </div>
      </div>
    </div>
  )
}
