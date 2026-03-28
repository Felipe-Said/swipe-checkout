"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CreditCard, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react"

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

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [error, setError] = React.useState("")
  const [notice, setNotice] = React.useState("")
  const [isRecoveryMode, setIsRecoveryMode] = React.useState(false)

  React.useEffect(() => {
    let mounted = true

    async function hydrateRecoverySession() {
      const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : ""
      const hashParams = new URLSearchParams(hash)
      const accessToken = hashParams.get("access_token")
      const refreshToken = hashParams.get("refresh_token")
      const type = hashParams.get("type")

      if (accessToken && refreshToken && type === "recovery") {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (!sessionError && mounted) {
          setIsRecoveryMode(true)
          setNotice("Token de recuperacao validado. Defina sua nova senha.")
          setError("")
          window.history.replaceState({}, document.title, "/forgot-password")
        }
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (mounted && session) {
          setIsRecoveryMode(true)
        }
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) {
        return
      }

      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setIsRecoveryMode(true)
        setNotice("Token de recuperacao validado. Defina sua nova senha.")
        setError("")
      }
    })

    void hydrateRecoverySession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSendReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSending(true)
    setError("")
    setNotice("")

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/forgot-password`
        : undefined

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    })

    if (resetError) {
      setError(resetError.message || "Nao foi possivel enviar o e-mail de recuperacao.")
      setIsSending(false)
      return
    }

    setNotice("Enviamos um link de recuperacao para o seu e-mail.")
    setIsSending(false)
  }

  const handleUpdatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsUpdating(true)
    setError("")
    setNotice("")

    if (!password || password.length < 6) {
      setError("A nova senha precisa ter pelo menos 6 caracteres.")
      setIsUpdating(false)
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas nao coincidem.")
      setIsUpdating(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError(updateError.message || "Nao foi possivel redefinir a senha.")
      setIsUpdating(false)
      return
    }

    await supabase.auth.signOut()
    router.replace("/login?message=reset")
  }

  return (
    <div className="container relative flex min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <Link href="/" className="relative z-20 flex w-fit items-center text-lg font-medium">
          <CreditCard className="mr-2 h-6 w-6" />
          Swipe
        </Link>
        <div className="relative z-20 mt-12 space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">Recupere o acesso ao seu painel.</h2>
          <ul className="space-y-4">
            {[
              "Solicite um link de recuperacao por e-mail",
              "Defina uma nova senha de forma segura",
              "Volte ao painel com as credenciais atualizadas",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-lg opacity-90">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/20">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[420px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {isRecoveryMode ? "Definir nova senha" : "Recuperar senha"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRecoveryMode
                ? "Escolha uma nova senha para voltar ao painel."
                : "Informe seu e-mail para receber o link de recuperacao."}
            </p>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">
                {isRecoveryMode ? "Nova senha" : "Esqueceu a senha?"}
              </CardTitle>
              <CardDescription>
                {isRecoveryMode
                  ? "A nova senha substituira a senha atual da conta."
                  : "Enviaremos um link seguro para redefinir seu acesso."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {isRecoveryMode ? (
                <form className="grid gap-4" onSubmit={handleUpdatePassword}>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Nova senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={isUpdating}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      disabled={isUpdating}
                      required
                    />
                  </div>

                  {notice ? (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
                      {notice}
                    </div>
                  ) : null}

                  {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

                  <Button className="h-11 w-full font-bold" type="submit" disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Atualizando...
                      </>
                    ) : (
                      <>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Salvar nova senha
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form className="grid gap-4" onSubmit={handleSendReset}>
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="nome@empresa.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={isSending}
                      required
                    />
                  </div>

                  {notice ? (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
                      {notice}
                    </div>
                  ) : null}

                  {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

                  <Button className="h-11 w-full font-bold" type="submit" disabled={isSending}>
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar link de recuperacao
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="justify-center">
              <Link href="/login" className="text-sm font-medium text-muted-foreground hover:underline">
                Voltar para o login
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
