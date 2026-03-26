import * as React from "react"
import Link from "next/link"
import { ArrowRight, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LandingFinalCta() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[160px] opacity-60" />
      </div>

      <div className="container">
        <div className="max-w-[1000px] mx-auto rounded-3xl border bg-card/50 backdrop-blur-xl p-8 md:p-16 text-center shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
             <CreditCard className="h-64 w-64 text-primary" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-6xl font-black mb-6 tracking-tight">
              Pronto para escalar seu <br /> checkout com a Swipe?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-[600px] mx-auto">
              Junte-se a centenas de produtores e empresas que já operam suas vendas com total controle e performance.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-16 px-10 text-xl font-bold shadow-2xl shadow-primary/30 group w-full sm:w-auto" asChild>
                <Link href="/signup">
                  Começar Agora
                  <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" className="h-16 px-10 text-xl font-bold w-full sm:w-auto" asChild>
                <Link href="/login">Fazer Login</Link>
              </Button>
            </div>
            
            <p className="mt-8 text-sm text-muted-foreground font-medium">
              Não requer cartão de crédito para começar.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
