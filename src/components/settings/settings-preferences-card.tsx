"use client"

import * as React from "react"
import { Globe, Coins, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n, type Language, type Currency } from "@/lib/i18n"

export function SettingsPreferencesCard() {
  const { language, setLanguage, currency, setCurrency, t } = useI18n()

  return (
    <Card className="border-primary/10 bg-card/40 backdrop-blur-sm shadow-xl overflow-hidden group">
      <CardHeader className="bg-primary/5 pb-6 border-b border-primary/10 relative">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">{t("settings.preferences.title")}</CardTitle>
            <CardDescription>{t("settings.preferences.desc")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 space-y-8">
        <div className="grid gap-8 md:grid-cols-2">
           <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <Globe className="h-4 w-4 text-primary" />
                 <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    {t("settings.preferences.language")}
                 </Label>
              </div>
              <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                <SelectTrigger className="h-12 bg-muted/20 border-primary/5 rounded-xl px-4 focus:ring-primary/20 font-bold">
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/10">
                  <SelectItem value="pt-BR" className="focus:bg-primary/10 focus:text-primary font-bold">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US" className="focus:bg-primary/10 focus:text-primary font-bold">English (US)</SelectItem>
                  <SelectItem value="es-ES" className="focus:bg-primary/10 focus:text-primary font-bold">Español (ES)</SelectItem>
                </SelectContent>
              </Select>
           </div>

           <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <Coins className="h-4 w-4 text-emerald-500" />
                 <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    {t("settings.preferences.currency")}
                 </Label>
              </div>
              <Select value={currency} onValueChange={(val) => setCurrency(val as Currency)}>
                <SelectTrigger className="h-12 bg-muted/20 border-primary/5 rounded-xl px-4 focus:ring-primary/20 font-bold">
                  <SelectValue placeholder="Selecione a moeda" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/10">
                  <SelectItem value="BRL" className="focus:bg-primary/10 focus:text-primary font-bold">Real Brasileiro (BRL)</SelectItem>
                  <SelectItem value="USD" className="focus:bg-primary/10 focus:text-primary font-bold">Dólar Americano (USD)</SelectItem>
                  <SelectItem value="EUR" className="focus:bg-primary/10 focus:text-primary font-bold">Euro (EUR)</SelectItem>
                </SelectContent>
              </Select>
           </div>
        </div>

        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
           <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1">
              <Check className="h-5 w-5" />
           </div>
           <div>
              <p className="text-xs font-bold leading-relaxed">
                 As configurações de idioma e moeda são aplicadas instantaneamente a todo o seu painel administrativo. 
                 <span className="text-muted-foreground/60 block mt-1 font-medium">Relatórios e valores históricos serão convertidos visualmente usando as taxas atuais.</span>
              </p>
           </div>
        </div>
      </CardContent>
    </Card>
  )
}
