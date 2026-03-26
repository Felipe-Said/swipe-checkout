import * as React from "react"
import { Users, Shield, CheckCircle2 } from "lucide-react"

export function LandingRolesSection() {
  return (
    <section className="py-24 overflow-hidden">
      <div className="container">
        <div className="text-center max-w-[800px] mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Uma Plataforma, <br /> Multifuncional.
          </h2>
          <p className="text-lg text-muted-foreground">
            A Swipe foi projetada para suportar tanto a operação individual quanto a supervisão administrativa em larga escala.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Workspace */}
          <div className="group p-8 rounded-3xl border bg-card hover:border-primary/50 transition-all duration-500 relative overflow-hidden">
             <div className="absolute -right-8 -bottom-8 h-32 w-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
             <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8">
                <Users className="h-8 w-8" />
             </div>
             <h3 className="text-2xl font-bold mb-4">Workspace do Usuário</h3>
             <p className="text-muted-foreground mb-8 leading-relaxed">
                Foco total na criação e operação dos seus checkouts. Gerencie suas lojas, produtos, domínios e acompanhe suas vendas em tempo real.
             </p>
             <ul className="space-y-3">
               {[
                 "Criação ilimitada de checkouts",
                 "Conexão com múltiplas lojas",
                 "Gestão de domínios e pixels",
                 "Relatórios de vendas e conversão"
               ].map((item, i) => (
                 <li key={i} className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {item}
                 </li>
               ))}
             </ul>
          </div>

          {/* Admin Oversight */}
          <div className="group p-8 rounded-3xl border bg-card hover:border-primary/50 transition-all duration-500 relative overflow-hidden">
             <div className="absolute -right-8 -bottom-8 h-32 w-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
             <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-8">
                <Shield className="h-8 w-8" />
             </div>
             <h3 className="text-2xl font-bold mb-4">Supervisão Administrativa</h3>
             <p className="text-muted-foreground mb-8 leading-relaxed">
                Visibilidade operacional completa para administradores. Monitore contas, aprove saques e gerencie a saúde da plataforma em um só lugar.
             </p>
             <ul className="space-y-3">
               {[
                 "Visão operacional em tempo real",
                 "Gestão e aprovação de saques",
                 "Controle de bloqueio de contas",
                 "Dashboard consolidado de escala"
               ].map((item, i) => (
                 <li key={i} className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    {item}
                 </li>
               ))}
             </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
