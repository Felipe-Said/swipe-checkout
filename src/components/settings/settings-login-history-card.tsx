"use client"

import * as React from "react"
import { Shield, Monitor, Smartphone, Laptop, MapPin, Clock, History, MoreVertical } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useI18n } from "@/lib/i18n"

interface LoginHistoryItem {
  id: string
  device: string
  city: string
  date: string
  current: boolean
}

interface SettingsLoginHistoryCardProps {
  history: LoginHistoryItem[]
}

export function SettingsLoginHistoryCard({ history }: SettingsLoginHistoryCardProps) {
  const { t } = useI18n()
  return (
    <Card className="border-primary/10 bg-card/40 backdrop-blur-sm shadow-xl overflow-hidden group">
      <CardHeader className="bg-primary/5 pb-6 border-b border-primary/10 relative">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <History className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">{t("settings.history.title")}</CardTitle>
                <CardDescription>Veja os acessos recentes da conta com localidade e dispositivo.</CardDescription>
              </div>
           </div>
           <Button variant="outline" size="sm" className="h-9 rounded-lg border-primary/10 font-bold text-xs gap-2">
              {t("settings.history.terminate_all")}
           </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y divide-primary/5">
           {history.map((item) => (
             <div key={item.id} className="p-6 flex items-center justify-between hover:bg-primary/[0.02] transition-colors group/item">
                <div className="flex items-center gap-5">
                   <div className={cn(
                      "h-12 w-12 rounded-xl border flex items-center justify-center transition-all",
                      item.current ? "bg-primary/10 border-primary/20 text-primary shadow-lg shadow-primary/10" : "bg-muted/20 border-primary/5 text-muted-foreground/60 group-hover/item:border-primary/20 group-hover/item:text-primary"
                   )}>
                      {item.device.toLowerCase().includes("windows") || item.device.toLowerCase().includes("mac") ? (
                        <Laptop className="h-6 w-6" />
                      ) : (
                        <Smartphone className="h-6 w-6" />
                      )}
                   </div>
                   <div className="space-y-1">
                      <div className="flex items-center gap-3">
                         <span className="text-sm font-black tracking-tight">{item.device}</span>
                         {item.current && (
                            <Badge variant="outline" className="h-5 text-[9px] font-black uppercase tracking-widest border-emerald-500/50 text-emerald-500 bg-emerald-500/5">
                               {t("nav.this_session")}
                            </Badge>
                         )}
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-bold">
                            <MapPin className="h-3 w-3" />
                            {item.city}
                         </div>
                         <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-bold">
                            <Clock className="h-3 w-3" />
                            {item.date}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-2">
                   {!item.current && (
                      <Button variant="ghost" size="sm" className="h-9 text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 opacity-0 group-hover/item:opacity-100 transition-opacity">
                         {t("nav.revoke")}
                      </Button>
                   )}
                   <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground/40 hover:text-primary transition-colors">
                      <MoreVertical className="h-4 w-4" />
                   </Button>
                </div>
             </div>
           ))}
        </div>
        
        <div className="p-6 bg-muted/20 border-t border-primary/5 text-center">
           <Button variant="ghost" className="text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/10">
              {t("nav.view_history")}
           </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
