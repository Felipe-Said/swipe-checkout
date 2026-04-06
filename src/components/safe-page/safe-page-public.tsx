"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Award,
  BookOpen,
  CalendarDays,
  ChefHat,
  CheckCircle2,
  Clock3,
  Flame,
  LockKeyhole,
  PlayCircle,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react"

import type { SafePageMember } from "@/lib/safe-page"

export function SafePagePublic({
  businessName,
  logoUrl,
  members,
  pathname = "/",
}: {
  businessName: string
  logoUrl?: string
  members: SafePageMember[]
  pathname?: string
}) {
  const router = useRouter()
  const currentPath = normalizeSafePagePath(pathname)
  const activeMember = members[0]
  const visibleMembers = members.slice(0, 8)

  const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    router.push("/dashboard")
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] text-[#1f160f]">
      <div className="border-b border-[#f1e3d6] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 md:px-10">
          <a href="/" className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[#f0dfcf] bg-white shadow-sm">
              {logoUrl ? (
                <img src={logoUrl} alt={businessName} className="h-full w-full object-cover" />
              ) : (
                <ChefHat className="h-7 w-7 text-[#bb5a1c]" />
              )}
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#bb5a1c]">
                Safe Page
              </p>
              <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#2f2015]">
                {businessName}
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-3 md:flex">
            <SafeNavLink href="/" active={currentPath === "/"}>
              Inicio
            </SafeNavLink>
            <SafeNavLink href="/login" active={currentPath === "/login"}>
              Login
            </SafeNavLink>
            <SafeNavLink
              href="/dashboard"
              active={currentPath === "/dashboard"}
            >
              Area de membros
            </SafeNavLink>
          </nav>
        </div>
      </div>

      {currentPath === "/login" ? (
        <SafeLoginPage
          businessName={businessName}
          logoUrl={logoUrl}
          onSubmit={handleLoginSubmit}
          featuredMember={activeMember}
        />
      ) : currentPath === "/dashboard" ? (
        <SafeDashboardPage
          businessName={businessName}
          logoUrl={logoUrl}
          members={visibleMembers}
          activeMember={activeMember}
        />
      ) : (
        <SafeLandingPage
          businessName={businessName}
          logoUrl={logoUrl}
          members={visibleMembers}
        />
      )}
    </main>
  )
}

function SafeLandingPage({
  businessName,
  logoUrl,
  members,
}: {
  businessName: string
  logoUrl?: string
  members: SafePageMember[]
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-10">
      <div className="overflow-hidden rounded-[36px] border border-[#ead8c8] bg-white shadow-[0_24px_80px_rgba(92,54,24,0.08)]">
        <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-[#f1e3d6] bg-[linear-gradient(135deg,#fff8f1_0%,#fffdf8_45%,#fdf4ea_100%)] px-6 py-8 md:px-10 md:py-10 xl:border-b-0 xl:border-r">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#bb5a1c]">
              Plataforma white de culinaria
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.05em] text-[#2f2015] md:text-6xl">
              Experiencia premium de acesso para membros, aulas e entregas culinarias.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#6b4c33] md:text-lg">
              {businessName} opera uma pagina white de alta credibilidade com area de membros, cronograma
              de aulas, biblioteca tecnica e comprovacao operacional de acessos entregues.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-[#bb5a1c] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#a34d14]"
              >
                Acessar area de membros
              </a>
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-[#e4ccb8] bg-white px-7 py-3 text-sm font-semibold text-[#2f2015]"
              >
                Ver dashboard
              </a>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
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
                title="Comprovacao de Entrega"
                description="Estrutura pronta para respaldar o envio dos acessos liberados aos membros."
              />
              <FeatureCard
                icon={<Users className="h-5 w-5" />}
                title="Area de Membros White"
                description="Ambiente privado com design editorial, trilhas, biblioteca e comunidade."
              />
            </div>
          </div>

          <div className="bg-[#fffaf5] px-6 py-8 md:px-8 md:py-10">
            <div className="rounded-[28px] border border-[#f0dfcf] bg-white p-6 shadow-[0_10px_30px_rgba(92,54,24,0.05)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#bb5a1c]">
                    Produto white
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#2f2015]">
                    Atelier do Sabor Pro
                  </h2>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#f0dfcf] bg-[#fff8f1] text-[#bb5a1c]">
                  {logoUrl ? (
                    <img src={logoUrl} alt={businessName} className="h-full w-full rounded-2xl object-cover" />
                  ) : (
                    <ChefHat className="h-7 w-7" />
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MetricCard label="Modulos ativos" value="12" />
                <MetricCard label="Aulas liberadas" value="84" />
                <MetricCard label="Membros" value={String(members.length || 0)} />
              </div>

              <div className="mt-6 rounded-3xl border border-[#f2e2d4] bg-[#fffaf5] p-5">
                <p className="text-sm font-semibold text-[#2f2015]">Biblioteca da semana</p>
                <div className="mt-4 space-y-3">
                  {[
                    "Bases francesas e fundos aromáticos",
                    "Cocção precisa para carnes e aves",
                    "Sobremesas de vitrine com acabamento premium",
                    "Montagem de menu degustação e precificação",
                  ].map((module, index) => (
                    <div
                      key={module}
                      className="flex items-center justify-between rounded-2xl border border-[#ecd9c9] bg-white px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff3ea] text-[#bb5a1c]">
                          <PlayCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#2f2015]">{module}</p>
                          <p className="text-xs text-[#8a6c56]">Modulo {index + 1}</p>
                        </div>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-[#1f7a3f]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[28px] border border-[#f0dfcf] bg-white p-6 shadow-[0_10px_30px_rgba(92,54,24,0.05)]">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#bb5a1c]">
                Credibilidade operacional
              </p>
              <div className="mt-5 space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-[#f0dfcf] bg-[#fffaf5] px-4 py-4"
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
      </div>
    </section>
  )
}

function SafeLoginPage({
  businessName,
  logoUrl,
  featuredMember,
  onSubmit,
}: {
  businessName: string
  logoUrl?: string
  featuredMember?: SafePageMember
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-87px)] max-w-7xl gap-0 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="hidden rounded-l-[36px] border border-r-0 border-[#ead8c8] bg-[linear-gradient(145deg,#fff8f1_0%,#fffdf8_50%,#fdf4ea_100%)] p-10 lg:flex lg:flex-col">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-[#f0dfcf] bg-white shadow-sm">
            {logoUrl ? (
              <img src={logoUrl} alt={businessName} className="h-full w-full object-cover" />
            ) : (
              <ChefHat className="h-8 w-8 text-[#bb5a1c]" />
            )}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#bb5a1c]">
              Area de membros
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-[#2f2015]">
              Acesso premium liberado para membros aprovados.
            </h1>
          </div>
        </div>

        <div className="mt-10 grid gap-4">
          {[
            {
              icon: <BookOpen className="h-5 w-5" />,
              title: "Biblioteca de receitas e técnicas",
              description: "Conteúdo liberado por módulos com estrutura editorial profissional.",
            },
            {
              icon: <Award className="h-5 w-5" />,
              title: "Certificados e materiais bônus",
              description: "Downloads privados, apostilas e aulas com acabamento premium.",
            },
            {
              icon: <CalendarDays className="h-5 w-5" />,
              title: "Agenda de novas aulas",
              description: "Calendário contínuo para reforçar consistência e credibilidade do programa.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-[#ead8c8] bg-white/80 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff3ea] text-[#bb5a1c]">
                {item.icon}
              </div>
              <p className="mt-4 text-lg font-semibold tracking-[-0.03em] text-[#2f2015]">{item.title}</p>
              <p className="mt-2 text-sm leading-7 text-[#6b4c33]">{item.description}</p>
            </div>
          ))}
        </div>

        {featuredMember ? (
          <div className="mt-auto rounded-[28px] border border-[#ead8c8] bg-white p-6 shadow-[0_10px_30px_rgba(92,54,24,0.05)]">
            <p className="text-sm font-semibold text-[#2f2015]">
              “A organização da área de membros elevou a percepção premium da nossa operação.”
            </p>
            <div className="mt-4">
              <p className="text-sm font-semibold text-[#2f2015]">{featuredMember.name}</p>
              <p className="text-xs text-[#8a6c56]">{featuredMember.accessEmail}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-[36px] border border-[#ead8c8] bg-white p-6 shadow-[0_24px_80px_rgba(92,54,24,0.08)] md:p-10 lg:rounded-l-none">
        <div className="mx-auto flex max-w-md flex-col">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#bb5a1c]">
            Login seguro
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[#2f2015]">
            Entre para acessar seus módulos.
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#6b4c33]">
            Painel privado para membros, com aulas liberadas, cronograma culinário, materiais bônus e histórico de acesso entregue.
          </p>

          <form className="mt-10 space-y-5" onSubmit={onSubmit}>
            <Field label="E-mail de acesso" placeholder="nome.sobrenome@empresa.com" type="email" />
            <Field label="Senha" placeholder="Digite sua senha" type="password" />

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#efe0d1] bg-[#fffaf5] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#bb5a1c]">
                  <LockKeyhole className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2f2015]">Ambiente privado validado</p>
                  <p className="text-xs text-[#8a6c56]">Estrutura white para acesso exclusivo de membros.</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#bb5a1c] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#a34d14]"
            >
              Entrar na área de membros
            </button>
          </form>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <MiniStatus label="Suporte" value="Ativo" />
            <MiniStatus label="Conteúdo" value="Atualizado" />
          </div>
        </div>
      </div>
    </section>
  )
}

function SafeDashboardPage({
  businessName,
  logoUrl,
  members,
  activeMember,
}: {
  businessName: string
  logoUrl?: string
  members: SafePageMember[]
  activeMember?: SafePageMember
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-10">
      <div className="overflow-hidden rounded-[36px] border border-[#ead8c8] bg-white shadow-[0_24px_80px_rgba(92,54,24,0.08)]">
        <div className="border-b border-[#f1e3d6] bg-[linear-gradient(135deg,#fff8f1_0%,#fffdf8_45%,#fdf4ea_100%)] px-6 py-6 md:px-10 md:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-[#f0dfcf] bg-white shadow-sm">
                {logoUrl ? (
                  <img src={logoUrl} alt={businessName} className="h-full w-full object-cover" />
                ) : (
                  <ChefHat className="h-8 w-8 text-[#bb5a1c]" />
                )}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[#bb5a1c]">
                  Dashboard de membros
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#2f2015] md:text-4xl">
                  Painel premium liberado para membros ativos.
                </h1>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="Aulas liberadas" value="84" />
              <MetricCard label="Próxima live" value="48h" />
              <MetricCard label="Suporte" value="Priority" />
            </div>
          </div>
        </div>

        <div className="grid gap-0 xl:grid-cols-[0.72fr_0.28fr]">
          <div className="border-b border-[#f1e3d6] px-6 py-8 md:px-10 xl:border-b-0 xl:border-r">
            <div className="grid gap-5 lg:grid-cols-2">
              <DashboardCard
                icon={<BookOpen className="h-5 w-5" />}
                title="Trilha principal"
                description="Bases francesas, mise en place premium, cocção de proteínas e finalização de pratos autorais."
                badge="Atualizado hoje"
              />
              <DashboardCard
                icon={<PlayCircle className="h-5 w-5" />}
                title="Módulos em destaque"
                description="Desserts de vitrine, brunch de alto ticket, menu degustação e gestão de cozinha compacta."
                badge="12 ativos"
              />
              <DashboardCard
                icon={<Award className="h-5 w-5" />}
                title="Materiais bônus"
                description="Ficha técnica, cálculo de CMV, planilhas de produção e modelos de ficha operacional."
                badge="Downloads liberados"
              />
              <DashboardCard
                icon={<Star className="h-5 w-5" />}
                title="Mentoria exclusiva"
                description="Calendário de mentorias gravadas e sessões estratégicas para operação premium de culinária."
                badge="Membros premium"
              />
            </div>

            <div className="mt-8 rounded-[28px] border border-[#ead8c8] bg-[#fffaf5] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#bb5a1c]">
                Biblioteca liberada
              </p>
              <div className="mt-5 space-y-3">
                {[
                  "Fundos clássicos, caldos e reduções de sabor",
                  "Texturas, cremes e molhos para cozinha premium",
                  "Finalização visual para pratos autorais",
                  "Operação de brunch e menu executivo",
                  "Pães artesanais, fermentação e acabamento",
                ].map((lesson, index) => (
                  <div
                    key={lesson}
                    className="flex items-center justify-between rounded-2xl border border-[#ead8c8] bg-white px-4 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff3ea] text-[#bb5a1c]">
                        <PlayCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#2f2015]">{lesson}</p>
                        <p className="text-xs text-[#8a6c56]">Aula {index + 1}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#edf8f0] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1f7a3f]">
                      Liberado
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#fffaf5] px-6 py-8 md:px-8">
            <div className="rounded-[28px] border border-[#ead8c8] bg-white p-5 shadow-[0_10px_30px_rgba(92,54,24,0.05)]">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#bb5a1c]">
                Perfil do membro
              </p>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff3ea] text-[#bb5a1c]">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2f2015]">
                    {activeMember?.name || "Membro Premium"}
                  </p>
                  <p className="text-xs text-[#8a6c56]">
                    {activeMember?.accessEmail || "member@private-area.com"}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <MiniStatus label="Status de acesso" value="Entregue" />
                <MiniStatus label="Plano white" value="Premium" />
                <MiniStatus label="Última liberação" value={activeMember?.deliveredAt || "Hoje"} />
              </div>
            </div>

            <div className="mt-6 rounded-[28px] border border-[#ead8c8] bg-white p-5 shadow-[0_10px_30px_rgba(92,54,24,0.05)]">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#bb5a1c]">
                Entregas confirmadas
              </p>
              <div className="mt-5 space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-[#ead8c8] bg-[#fffaf5] px-4 py-4"
                  >
                    <p className="text-sm font-semibold text-[#2f2015]">{member.name}</p>
                    <p className="mt-1 text-xs text-[#7b5d45]">{member.accessEmail}</p>
                    <p className="mt-3 text-xs text-[#8a6c56]">Liberado em {member.deliveredAt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SafeNavLink({
  href,
  active,
  children,
}: {
  href: string
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-[#bb5a1c] text-white"
          : "border border-[#ead8c8] bg-white text-[#2f2015] hover:bg-[#fff8f1]"
      }`}
    >
      {children}
    </a>
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
      <h3 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-[#2f2015]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#6b4c33]">{description}</p>
    </div>
  )
}

function DashboardCard({
  icon,
  title,
  description,
  badge,
}: {
  icon: React.ReactNode
  title: string
  description: string
  badge: string
}) {
  return (
    <div className="rounded-[28px] border border-[#ead8c8] bg-white p-6 shadow-[0_10px_30px_rgba(92,54,24,0.05)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff3ea] text-[#bb5a1c]">
        {icon}
      </div>
      <div className="mt-5">
        <p className="text-lg font-semibold tracking-[-0.03em] text-[#2f2015]">{title}</p>
        <p className="mt-2 text-sm leading-7 text-[#6b4c33]">{description}</p>
      </div>
      <span className="mt-5 inline-flex rounded-full bg-[#fff8f1] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#bb5a1c]">
        {badge}
      </span>
    </div>
  )
}

function Field({
  label,
  placeholder,
  type,
}: {
  label: string
  placeholder: string
  type: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#2f2015]">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="h-14 w-full rounded-2xl border border-[#e6d3c3] bg-[#fffdf9] px-4 text-sm text-[#2f2015] outline-none transition placeholder:text-[#a38570] focus:border-[#bb5a1c]"
      />
    </label>
  )
}

function MetricCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-[#ead8c8] bg-white px-4 py-4">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8a6c56]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#2f2015]">{value}</p>
    </div>
  )
}

function MiniStatus({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-[#ead8c8] bg-[#fffaf5] px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8a6c56]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#2f2015]">{value}</p>
    </div>
  )
}

function normalizeSafePagePath(pathname: string) {
  if (!pathname || pathname === "/") return "/"
  if (pathname === "/login") return "/login"
  if (pathname === "/dashboard" || pathname === "/members" || pathname === "/area-de-membros") {
    return "/dashboard"
  }
  return "/"
}
