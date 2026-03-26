import * as React from "react"
import { UserPlus, LayoutPanelTop, Palette, Zap, LineChart } from "lucide-react"

const steps = [
  {
    title: "Crie sua conta",
    description: "Comece em segundos com um processo de registro simples e intuitivo.",
    icon: UserPlus,
  },
  {
    title: "Configure seu workspace",
    description: "Conecte sua loja Shopify e configure suas preferências básicas.",
    icon: LayoutPanelTop,
  },
  {
    title: "Personalize seu checkout",
    description: "Use o editor visual para deixar o checkout com a cara da sua marca.",
    icon: Palette,
  },
  {
    title: "Ative as operações",
    description: "Configure frete, domínios, pixels e notificações PushCut.",
    icon: Zap,
  },
  {
    title: "Gerencie e Escale",
    description: "Acompanhe tudo pelo dashboard e otimize suas conversões.",
    icon: LineChart,
  },
]

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center max-w-[800px] mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Como Funciona o Swipe.
          </h2>
          <p className="text-lg text-muted-foreground">
            Do zero ao checkout operando em escala em poucos minutos.
          </p>
        </div>

        <div className="relative">
          {/* Connector Line (Desktop) */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-1/2 hidden lg:block" />

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center group">
                <div className="h-16 w-16 rounded-full bg-card border shadow-lg flex items-center justify-center text-primary mb-6 relative z-10 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                   <step.icon className="h-7 w-7" />
                   <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-muted border text-[10px] font-bold flex items-center justify-center text-foreground">
                     {i + 1}
                   </div>
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
