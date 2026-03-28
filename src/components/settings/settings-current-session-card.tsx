"use client"

import * as React from "react"
import { Monitor, MapPin, Clock, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n"

interface SettingsCurrentSessionCardProps {
  device: string
  city: string
  date: string
  deviceDetails: string
  locationDetails: string
  sessionDetails: string
}

export function SettingsCurrentSessionCard({
  device,
  city,
  date,
  deviceDetails,
  locationDetails,
  sessionDetails,
}: SettingsCurrentSessionCardProps) {
  const { t } = useI18n()

  return (
    <Card className="overflow-hidden border-primary/10 bg-card/40 shadow-xl backdrop-blur-sm transition-all group hover:border-primary/20">
      <CardHeader className="relative border-b border-primary/10 bg-primary/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <Monitor className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">{t("settings.session.title")}</CardTitle>
            <CardDescription>{t("settings.session.desc")}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8">
        <div className="grid grid-cols-1 gap-4">
          <SessionStat icon={Monitor} label={t("nav.device")} value={device} subValue={deviceDetails} />
          <SessionStat icon={MapPin} label={t("nav.location")} value={city} subValue={locationDetails} />
          <SessionStat icon={Clock} label={t("settings.last_access")} value={date} subValue={sessionDetails} />
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-dashed border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-500/80">
                {t("nav.secure_session")}
              </h4>
              <p className="text-[10px] font-bold leading-tight text-muted-foreground">
                {t("nav.secure_desc")}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="h-5 border-emerald-500/30 text-[9px] font-black uppercase text-emerald-500"
          >
            {t("nav.verified")}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function SessionStat({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  subValue: string
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-primary/5 bg-muted/20 p-5 transition-colors hover:border-primary/10">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="space-y-0.5">
        <div className="text-base font-black tracking-tight">{value}</div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
          <div className="h-1 w-1 rounded-full bg-primary/40" />
          {subValue}
        </div>
      </div>
    </div>
  )
}
