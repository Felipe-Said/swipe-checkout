"use client"

import * as React from "react"
import { Monitor, MapPin, Clock, Globe, ShieldCheck, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n"

interface SettingsCurrentSessionCardProps {
  device: string
  city: string
  date: string
}

export function SettingsCurrentSessionCard({
  device,
  city,
  date
}: SettingsCurrentSessionCardProps) {
  const { t } = useI18n()
  return (
    <Card className="border-primary/10 bg-card/40 backdrop-blur-sm shadow-xl overflow-hidden group hover:border-primary/20 transition-all">
      <CardHeader className="bg-primary/5 pb-6 border-b border-primary/10 relative">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Monitor className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">{t("settings.session.title")}</CardTitle>
            <CardDescription>{t("settings.session.desc")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        <div className="grid gap-6 md:grid-cols-3">
           <SessionStat 
             icon={Monitor} 
             label={t("nav.device")} 
             value={device} 
             subValue="Windows (Google Chrome)"
           />
           <SessionStat 
             icon={MapPin} 
             label={t("nav.location")} 
             value={city} 
             subValue="IP: 189.12.XXX.XXX"
           />
           <SessionStat 
             icon={Clock} 
             label={t("settings.last_access")} 
             value={date} 
             subValue={`${t("nav.connected_ago")} 12 ${t("nav.minutes_ago")}`}
           />
        </div>

        <div className="mt-8 p-4 rounded-2xl bg-emerald-500/5 border border-dashed border-emerald-500/20 flex items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                 <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                 <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-500/80">{t("nav.secure_session")}</h4>
                 <p className="text-[10px] text-muted-foreground font-bold leading-tight">
                    {t("nav.secure_desc")}
                 </p>
              </div>
           </div>
           <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 text-[9px] font-black uppercase h-5">{t("nav.verified")}</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function SessionStat({ 
  icon: Icon, 
  label, 
  value, 
  subValue 
}: { 
  icon: any, 
  label: string, 
  value: string, 
  subValue: string 
}) {
  return (
    <div className="p-5 rounded-2xl bg-muted/20 border border-primary/5 space-y-3 transition-colors hover:border-primary/10">
       <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          <Icon className="h-3.5 w-3.5" />
          {label}
       </div>
       <div className="space-y-0.5">
          <div className="text-base font-black tracking-tight">{value}</div>
          <div className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5 uppercase tracking-tighter">
             <div className="h-1 w-1 rounded-full bg-primary/40" />
             {subValue}
          </div>
       </div>
    </div>
  )
}
