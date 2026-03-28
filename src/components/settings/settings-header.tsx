"use client"

import * as React from "react"
import { Wallet, Clock, Mail } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n"

interface SettingsHeaderProps {
  name: string
  email: string
  totalRevenue: number
  lastAccess: string
  revenueCaption: string
  sessionCaption: string
  profileImage?: string
}

export function SettingsHeader({
  name,
  email,
  totalRevenue,
  lastAccess,
  revenueCaption,
  sessionCaption,
  profileImage,
}: SettingsHeaderProps) {
  const { t, formatCurrency } = useI18n()
  const formattedRevenue = formatCurrency(totalRevenue)

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return (
    <div className="mb-4 flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tighter">{t("settings.title")}</h1>
        <p className="text-sm font-medium text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-1 flex items-center gap-6 rounded-3xl border border-primary/10 bg-card/40 p-6 shadow-xl backdrop-blur-sm transition-all group hover:border-primary/20 md:col-span-2">
          <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-lg transition-transform duration-500 group-hover:scale-105">
            <AvatarImage src={profileImage} />
            <AvatarFallback className="bg-primary/10 text-2xl font-black text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h2 className="truncate text-2xl font-black tracking-tight">{name}</h2>
              <Badge
                variant="secondary"
                className="h-5 bg-primary/10 text-[10px] font-black uppercase tracking-widest text-primary"
              >
                Conta ativa
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {email}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-3xl border border-primary/10 bg-card/40 p-6 shadow-xl backdrop-blur-sm transition-all group hover:border-primary/20">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
              {t("settings.total_revenue")}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-emerald-500">
              {formattedRevenue}
            </div>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60">
              {revenueCaption}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-3xl border border-primary/10 bg-card/40 p-6 shadow-xl backdrop-blur-sm transition-all group hover:border-primary/20">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
              {t("settings.last_access")}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight">{lastAccess}</div>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60">
              {sessionCaption}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
