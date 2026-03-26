"use client"

import * as React from "react"
import { LockKeyhole, ShieldCheck, RefreshCw, Key } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

interface SettingsSecurityCardProps {
  onUpdatePassword: (current: string, next: string) => void
  isLoading?: boolean
}

export function SettingsSecurityCard({ onUpdatePassword, isLoading = false }: SettingsSecurityCardProps) {
  const { t } = useI18n()
  const [current, setCurrent] = React.useState("")
  const [next, setNext] = React.useState("")
  const [confirm, setConfirm] = React.useState("")

  const handleSubmit = () => {
    if (next === confirm && next !== "") {
       onUpdatePassword(current, next)
       setCurrent("")
       setNext("")
       setConfirm("")
    }
  }

  return (
    <Card className="border-primary/10 bg-card/40 backdrop-blur-sm shadow-xl overflow-hidden group">
      <CardHeader className="bg-primary/5 pb-6 border-b border-primary/10 relative">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">{t("settings.security.title")}</CardTitle>
            <CardDescription>{t("settings.security.desc")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              {t("settings.security.current_password")}
            </Label>
            <Input 
              type="password"
              placeholder="••••••••"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="h-12 bg-muted/20 border-primary/5 rounded-xl px-4 focus-visible:ring-primary/20 transition-all font-bold"
            />
          </div>
          
          <div className="space-y-3">
            <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              {t("settings.security.new_password")}
            </Label>
            <Input 
              type="password"
              placeholder="••••••••"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="h-12 bg-muted/20 border-primary/5 rounded-xl px-4 focus-visible:ring-primary/20 transition-all font-bold"
            />
          </div>

          <div className="space-y-3 md:col-span-2">
            <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              {t("settings.security.confirm_password")}
            </Label>
            <Input 
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-12 bg-muted/20 border-primary/5 rounded-xl px-4 focus-visible:ring-primary/20 transition-all font-bold"
            />
          </div>
        </div>

        <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-6">
           <Button 
             className="w-full md:w-auto h-12 px-8 text-lg font-black tracking-tighter rounded-xl shadow-lg shadow-primary/20 group relative overflow-hidden shrink-0" 
             onClick={handleSubmit}
             disabled={isLoading || next !== confirm || next === ""}
           >
              <span className="relative z-10 flex items-center gap-2">
                 {isLoading ? "Atualizando..." : t("settings.security.update")}
                 {!isLoading && <RefreshCw className="h-5 w-5 transition-transform group-hover:rotate-180 duration-500" />}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/10 to-primary-foreground/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
           </Button>

           <div className="flex items-center gap-3 text-muted-foreground/60">
              <ShieldCheck className="h-5 w-5 text-emerald-500/50" />
              <p className="text-[10px] font-bold leading-tight uppercase tracking-widest max-w-[200px]">
                 {t("nav.security_tip")}
              </p>
           </div>
        </div>
      </CardContent>
    </Card>
  )
}
