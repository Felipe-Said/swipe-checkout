import * as React from "react"
import { 
  BarChart3, 
  Settings, 
  ShoppingCart, 
  Workflow, 
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  History
} from "lucide-react"

export function LandingOperationsSection() {
  return (
    <section id="operations" className="py-24 bg-muted/30">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
           <div className="order-2 lg:order-1 relative">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4 pt-8">
                   <div className="p-6 rounded-2xl border bg-card shadow-xl hover:-translate-y-1 transition-transform">
                      <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 mb-4">
                         <TrendingUp className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold mb-1">Faturamento</h4>
                      <div className="text-2xl font-black text-foreground">R$ 42.850</div>
                      <div className="text-[10px] text-green-500 font-bold flex items-center gap-1 mt-1">
                         <ArrowUpRight className="h-3 w-3" />
                         +12% este mês
                      </div>
                   </div>
                   <div className="p-6 rounded-2xl border bg-card shadow-xl hover:-translate-y-1 transition-transform">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
                         <ShoppingCart className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold mb-1">Pedidos</h4>
                      <div className="text-2xl font-black text-foreground">1.284</div>
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="p-6 rounded-2xl border bg-card shadow-xl hover:-translate-y-1 transition-transform">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                         <Workflow className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold mb-1">Conversão</h4>
                      <div className="text-2xl font-black text-foreground">6.5%</div>
                   </div>
                   <div className="p-6 rounded-2xl border bg-card shadow-xl hover:-translate-y-1 transition-transform">
                      <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-4">
                         <CreditCard className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold mb-1">Saques</h4>
                      <div className="text-sm text-muted-foreground font-medium">Disponível: R$ 8.200</div>
                   </div>
                </div>
             </div>
             
             {/* Background decorative elements */}
             <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -z-10" />
           </div>

           <div className="order-1 lg:order-2 space-y-8">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                  Muito Mais que um <br /> Construtor Visual.
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  A Swipe é uma ferramenta completa de gestão operacional. Da sincronização com Shopify ao controle financeiro e pixels de rastreamento, cuidamos de toda a inteligência do seu checkout.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { title: "Rastreamento de Pedidos", icon: History },
                  { title: "Gestão de Pixels", icon: Settings },
                  { title: "Configuração de Frete", icon: BarChart3 },
                  { title: "Fluxos de Saque", icon: CreditCard },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                       <item.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-semibold text-sm">{item.title}</span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </section>
  )
}
