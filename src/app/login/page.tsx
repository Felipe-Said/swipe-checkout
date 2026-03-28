"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CreditCard, Loader2, AlertCircle } from "lucide-react"
import { resolveLoginProfile } from "@/app/auth/actions"
import { recordLoginEvent } from "@/app/actions/settings"
import { useSearchParams } from "next/navigation"
import { clearAppSession, writeAppSession } from "@/lib/app-session"
import { clearDemoSession } from "@/lib/demo-auth"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </React.Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  
  const message = searchParams.get("message")

  const detectDeviceLabel = () => {
    if (typeof window === "undefined") {
      return "Dispositivo"
    }

    const userAgent = window.navigator.userAgent || ""
    if (/iPhone|iPad|iPod/i.test(userAgent)) return "Safari (iPhone)"
    if (/Android/i.test(userAgent)) return "Android"
    if (/Macintosh|Mac OS X/i.test(userAgent)) return "Chrome (MacBook)"
    if (/Windows/i.test(userAgent)) return "Chrome (Windows)"
    return "Navegador"
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError("")
    clearDemoSession()
    clearAppSession()

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") || "")
    const password = String(formData.get("password") || "")

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError || !data.user) {
      setError(loginError?.message || "Nao foi possivel entrar.")
      setIsLoading(false)
      return
    }

    const profileResult = await resolveLoginProfile(data.user.id)

    if (profileResult?.error || !profileResult?.session) {
      await supabase.auth.signOut()
      setError(profileResult?.error || "Perfil nao encontrado.")
      setIsLoading(false)
      return
    }

    if (
      profileResult.session.status !== "approved" &&
      profileResult.session.role !== "admin"
    ) {
      await supabase.auth.signOut()
      setError("Sua conta esta aguardando aprovacao administrativa.")
      setIsLoading(false)
      return
    }

    writeAppSession({
      userId: profileResult.session.userId,
      name: profileResult.session.name,
      email: profileResult.session.email,
      role: profileResult.session.role === "admin" ? "admin" : "user",
      accountId: profileResult.session.accountId,
      keyFrozen: profileResult.session.keyFrozen,
      withdrawalsEnabled: profileResult.session.withdrawalsEnabled,
      messengerEnabled: profileResult.session.messengerEnabled,
    })

    await recordLoginEvent({
      userId: profileResult.session.userId,
      accountId: profileResult.session.accountId,
      device: detectDeviceLabel(),
      location:
        typeof window !== "undefined"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone || null
          : null,
    })

    router.replace("/app")
  }

  return (
    <div className="container relative flex h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <Link href="/" className="relative z-20 flex w-fit items-center text-lg font-medium">
          <CreditCard className="mr-2 h-6 w-6" />
          Swipe
        </Link>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Esta plataforma economizou centenas de horas de trabalho e melhorou nossa taxa de conversao em 25% logo no primeiro mes.&rdquo;
            </p>
            <footer className="text-sm">Sofia Silva, CEO da TechStore</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Acessar Painel</h1>
            <p className="text-sm text-muted-foreground">
              Entre com uma conta demo para navegar como admin ou usuario.
            </p>
          </div>
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Login</CardTitle>
              <CardDescription>Entre com suas credenciais oficiais.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" placeholder="nome@empresa.com" disabled={isLoading} required />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <Link href="/forgot-password" className="text-xs text-muted-foreground hover:underline">
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <Input id="password" name="password" type="password" disabled={isLoading} required />
                </div>

                {message === "pending" && !error && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-sm text-primary border border-primary/20">
                     <AlertCircle className="h-4 w-4" />
                     Sua conta foi criada. Aguarde a aprovação do admin para acessar.
                  </div>
                )}

                {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
                
                <Button className="w-full h-11 font-bold" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : "Entrar"}
                </Button>
              </form>

              <div className="text-sm text-center text-muted-foreground mt-2">
                Novo por aqui?{" "}
                <Link href="/signup" className="text-primary font-bold hover:underline">
                   Criar conta agora
                </Link>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-muted-foreground">
                Somente usuários aprovados têm acesso ao painel operacional.
              </div>
            </CardFooter>
          </Card>
          <p className="px-8 text-center text-sm text-muted-foreground">
            Ao clicar em entrar, voce concorda com nossos{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
              Termos de Servico
            </Link>{" "}
            e{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
              Politica de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
