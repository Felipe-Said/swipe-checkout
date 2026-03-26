import * as React from "react"
import { 
  BarChart3, 
  Layout, 
  Monitor, 
  Smartphone, 
  Store, 
  Globe, 
  Truck, 
  Bell, 
  ShieldCheck 
} from "lucide-react"

const features = [
  {
    title: "Gestão de Checkouts",
    description: "Crie e gerencie múltiplos fluxos de checkout com facilidade e rapidez.",
    icon: Layout,
  },
  {
    title: "Editor Visual",
    description: "Personalize cada detalhe do seu checkout sem precisar tocar em código.",
    icon: Monitor,
  },
  {
    title: "Preview Mobile",
    description: "Veja como seu checkout fica em dispositivos móveis em tempo real.",
    icon: Smartphone,
  },
  {
    title: "Conexão Shopify",
    description: "Integração direta com sua loja Shopify para sincronização de pedidos.",
    icon: Store,
  },
  {
    title: "Domínios Próprios",
    description: "Use seus próprios domínios para passar mais credibilidade aos clientes.",
    icon: Globe,
  },
  {
    title: "Configuração de Frete",
    description: "Regras flexíveis de frete para atender todas as suas necessidades logísticas.",
    icon: Truck,
  },
  {
    title: "Pixels e Notificações",
    description: "Acompanhe conversões e configure notificações PushCut instantâneas.",
    icon: Bell,
  },
  {
    title: "Métricas Avançadas",
    description: "Dashboard completo com taxas de conversão e faturamento detalhado.",
    icon: BarChart3,
  },
  {
    title: "Controle Operacional",
    description: "Ferramentas administrativas para supervisão total da sua operação.",
    icon: ShieldCheck,
  },
]

export function LandingFeatureGrid() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center max-w-[800px] mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Tudo o que você precisa para <br /> operar com excelência.
          </h2>
          <p className="text-lg text-muted-foreground">
            A Swipe centraliza toda a sua operação de checkout em uma única plataforma premium e intuitiva.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group p-8 rounded-2xl border bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
