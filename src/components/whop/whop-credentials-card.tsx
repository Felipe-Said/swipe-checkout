"use client"

import * as React from "react"
import { KeyRound, ShieldCheck, Mail, User, CheckCircle2, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

import { type ManagedAccount } from "@/lib/account-metrics"

interface WhopCredentialsCardProps {
  accounts: ManagedAccount[]
  selectedAccountId: string
  onAccountChange: (id: string) => void
  apiKey: string
  onKeyChange: (value: string) => void
  onSave: () => void
  isLoading?: boolean
  isAdmin?: boolean
  isSaved?: boolean
}

export function WhopCredentialsCard({
  accounts,
  selectedAccountId,
  onAccountChange,
  apiKey,
  onKeyChange,
  onSave,
  isLoading = false,
  isAdmin = false,
  isSaved = false
}: WhopCredentialsCardProps) {
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId)

  return (
    <Card className="border-primary/10 bg-card/40 backdrop-blur-sm shadow-xl overflow-hidden group">
      <CardHeader className="bg-primary/5 pb-6 border-b border-primary/10 relative">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
           <KeyRound className="h-12 w-12 text-primary" />
        </div>
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <User className="h-6 w-6" />
           </div>
           <div>
              <CardTitle className="text-xl">Chave e Configuração</CardTitle>
              <CardDescription>Gerencie as credenciais da conta Whop selecionada.</CardDescription>
           </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-8 mt-2">
        {isAdmin && (
           <div className="space-y-3">
              <Label htmlFor="account-selector" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                 Selecionar Conta Swipe
              </Label>
              <Select value={selectedAccountId} onValueChange={onAccountChange}>
                <SelectTrigger className="h-12 bg-muted/20 border-primary/5 rounded-xl px-4 focus:ring-primary/20 transition-all font-bold">
                   <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-primary" />
                      <SelectValue placeholder="Selecione uma conta" />
                   </div>
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-md border-primary/10 rounded-xl overflow-hidden shadow-2xl">
                   {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id} className="focus:bg-primary/10 cursor-pointer h-10 font-medium">
                         {acc.name} <span className="opacity-40 font-normal">({acc.email})</span>
                      </SelectItem>
                   ))}
                </SelectContent>
              </Select>
           </div>
        )}

        <div className="space-y-4">
           <div className="space-y-3">
              <div className="flex items-center justify-between ml-1">
                 <Label htmlFor="whop-api-key" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    Whop API Key (Company)
                 </Label>
                 {isSaved && (
                    <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                       <ShieldCheck className="h-3 w-3" />
                       <span className="text-[10px] font-black uppercase tracking-tighter">Credencial Salva</span>
                    </div>
                 )}
              </div>
              <div className="relative group/input">
                 <Input 
                   id="whop-api-key"
                   value={apiKey}
                   onChange={(e) => onKeyChange(e.target.value)}
                   type="password"
                   placeholder="whop_live_xxxxxxxxxxxxxxxxxxxx"
                   className="h-12 bg-muted/20 border-primary/5 rounded-xl px-4 focus-visible:ring-primary/20 transition-all font-mono text-sm tracking-widest"
                   disabled={isLoading}
                 />
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {apiKey.startsWith('whop_') && (
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                    )}
                 </div>
              </div>
           </div>

           <Button 
             className="w-full h-12 text-lg font-black tracking-tight rounded-xl shadow-lg shadow-primary/20 group relative overflow-hidden" 
             onClick={onSave}
             disabled={isLoading || !apiKey}
           >
              <span className="relative z-10 flex items-center gap-2">
                 {isLoading ? "Salvando..." : "Salvar Chave na Conta"}
                 {!isLoading && <Save className="h-5 w-5 transition-transform group-hover:scale-110" />}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/10 to-primary-foreground/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
           </Button>
        </div>

        <div className="bg-muted/30 p-4 rounded-2xl border border-dashed border-primary/10 flex items-start gap-4">
           <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ShieldCheck className="h-5 w-5" />
           </div>
           <div className="space-y-1">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Segurança da Credencial</h4>
              <p className="text-[11px] text-muted-foreground/80 leading-relaxed font-medium">
                 O Swipe utiliza sua chave exclusivamente para operações autenticadas entre sua conta e a Whop. Nunca compartilhamos seus dados com terceiros.
              </p>
           </div>
        </div>
      </CardContent>
    </Card>
  )
}
