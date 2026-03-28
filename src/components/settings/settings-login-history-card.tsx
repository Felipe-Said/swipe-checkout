"use client"

import * as React from "react"
import { Smartphone, Laptop, MapPin, Clock, History } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
    <Card className="overflow-hidden border-primary/10 bg-card/40 shadow-xl backdrop-blur-sm group">
      <CardHeader className="relative border-b border-primary/10 bg-primary/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <History className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">{t("settings.history.title")}</CardTitle>
            <CardDescription>Veja os acessos recentes da conta com localidade e dispositivo.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-primary/5">
          {history.map((item) => (
            <div
              key={item.id}
              className="group/item flex items-center justify-between p-6 transition-colors hover:bg-primary/[0.02]"
            >
              <div className="flex items-center gap-5">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl border transition-all",
                    item.current
                      ? "border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/10"
                      : "border-primary/5 bg-muted/20 text-muted-foreground/60 group-hover/item:border-primary/20 group-hover/item:text-primary",
                  )}
                >
                  {item.device.toLowerCase().includes("windows") ||
                  item.device.toLowerCase().includes("mac") ? (
                    <Laptop className="h-6 w-6" />
                  ) : (
                    <Smartphone className="h-6 w-6" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black tracking-tight">{item.device}</span>
                    {item.current ? (
                      <Badge
                        variant="outline"
                        className="h-5 border-emerald-500/50 bg-emerald-500/5 text-[9px] font-black uppercase tracking-widest text-emerald-500"
                      >
                        {t("nav.this_session")}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {item.city}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {item.date}
                    </div>
                  </div>
                </div>
              </div>

              {item.current ? (
                <Badge
                  variant="outline"
                  className="h-8 border-primary/20 bg-primary/5 px-3 text-[9px] font-black uppercase tracking-widest text-primary"
                >
                  Sessao ativa
                </Badge>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(" ")
}
