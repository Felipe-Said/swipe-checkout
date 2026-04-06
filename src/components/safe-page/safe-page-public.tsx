import { ChefHat, Clock3, Flame, ShieldCheck, Users } from "lucide-react"

import type { SafePageMember } from "@/lib/safe-page"

export function SafePagePublic({
  businessName,
  logoUrl,
  members,
}: {
  businessName: string
  logoUrl?: string
  members: SafePageMember[]
}) {
  const visibleMembers = members.slice(0, 8)

  return (
    <main className="min-h-screen bg-[#fffdf8] text-[#1f160f]">
      <section className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-10">
        <div className="overflow-hidden rounded-[32px] border border-[#ead8c8] bg-white shadow-[0_24px_80px_rgba(92,54,24,0.08)]">
          <div className="border-b border-[#f1e3d6] bg-[linear-gradient(135deg,#fff8f1_0%,#fffdf8_45%,#fdf4ea_100%)] px-6 py-6 md:px-10 md:py-8">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-[#f0dfcf] bg-white shadow-sm">
                  {logoUrl ? (
                    <img src={logoUrl} alt={businessName} className="h-full w-full object-cover" />
                  ) : (
                    <ChefHat className="h-8 w-8 text-[#bb5a1c]" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#bb5a1c]">
                    Safe Page
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
                    {businessName}
                  </h1>
                </div>
              </div>

              <div className="rounded-2xl border border-[#f0dfcf] bg-white/80 px-5 py-4 text-sm text-[#6b4c33] backdrop-blur">
                <p className="font-semibold text-[#2f2015]">Produto White</p>
                <p className="mt-1">Atelier do Sabor Pro</p>
                <p className="mt-2 text-xs">Area de membros premium com receitas, modulos e biblioteca tecnica.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="border-b border-[#f1e3d6] px-6 py-8 md:px-10 lg:border-b-0 lg:border-r">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#bb5a1c]">
                Area de Membros
              </p>
              <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.05em] md:text-5xl">
                Formacao culinaria white label pronta para entrega segura de acessos.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#6b4c33]">
                Estrutura exclusiva para negocios de culinaria com trilhas de receitas, tecnicas profissionais,
                calendario de liberacao de conteudo e comprovacao de acessos entregues aos membros.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <FeatureCard
                  icon={<Flame className="h-5 w-5" />}
                  title="Masterclass de Cozinha Quente"
                  description="Receitas autorais, tecnicas de mise en place, coccoes e finalizacao premium."
                />
                <FeatureCard
                  icon={<Clock3 className="h-5 w-5" />}
                  title="Calendario de Liberacao"
                  description="Cronograma semanal com entregas continuas e area organizada por modulos."
                />
                <FeatureCard
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Entrega de Acesso Confirmada"
                  description="Lista operacional de membros com historico pronto para exportacao em CSV."
                />
                <FeatureCard
                  icon={<Users className="h-5 w-5" />}
                  title="Comunidade Exclusiva"
                  description="Ambiente white para alunos premium, chefs parceiros e eventos de degustacao."
                />
              </div>
            </div>

            <div className="bg-[#fffaf5] px-6 py-8 md:px-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#bb5a1c]">
                Membros Liberados
              </p>
              <div className="mt-6 space-y-3">
                {visibleMembers.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-[#f0dfcf] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(92,54,24,0.05)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#2f2015]">{member.name}</p>
                        <p className="mt-1 text-xs text-[#7b5d45]">{member.accessEmail}</p>
                      </div>
                      <span className="rounded-full bg-[#edf8f0] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1f7a3f]">
                        Entregue
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-[#8a6c56]">Acesso confirmado em {member.deliveredAt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-[#f0dfcf] bg-[#fffaf5] p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#bb5a1c] shadow-sm">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-[-0.03em]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#6b4c33]">{description}</p>
    </div>
  )
}
