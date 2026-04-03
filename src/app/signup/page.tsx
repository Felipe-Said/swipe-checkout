"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { signup } from "@/app/auth/actions"
import { toast } from "sonner"
import { buildEmbeddedPath } from "@/lib/shopify-embedded"

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

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const withEmbeddedContext = React.useCallback(
    (pathname: string, extraParams?: Record<string, string>) => {
      const params =
        typeof window === "undefined"
          ? null
          : new URLSearchParams(window.location.search)

      return buildEmbeddedPath(pathname, params, extraParams)
    },
    []
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const result = await signup(formData)

    if (result?.error) {
      toast.error(result.error)
      setIsLoading(false)
    } else {
      toast.success("Conta criada! Aguarde a aprovacao administrativa.")
      router.push(withEmbeddedContext("/login", { message: "pending" }))
    }
  }

  return (
    <div className="container relative flex h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/signup-background.png')" }}
        />
        <div className="absolute inset-0 bg-zinc-950/62" />
        <Link
          href={withEmbeddedContext("/")}
          className="relative z-20 flex w-fit items-center text-lg font-medium"
        >
          <img
            src="/swipe-logo-white.svg"
            alt="Swipe"
            className="h-8 w-auto max-w-[140px]"
          />
        </Link>

        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;A melhor decisao que tomamos para nossa operacao de
              checkout. Simple, robusto e extremamente profissional.&rdquo;
            </p>
            <footer className="text-sm">
              Ricardo Mendes, Diretor de E-commerce
            </footer>
          </blockquote>
        </div>
      </div>

      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Criar sua conta
            </h1>
            <p className="text-sm text-muted-foreground">
              Preencha os dados abaixo para comecar sua jornada com a Swipe.
            </p>
          </div>
          <Card className="border-2 border-primary/10 shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Registro</CardTitle>
              <CardDescription>
                Crie sua conta administrativa ou de usuario.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Seu nome"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail Corporativo</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nome@empresa.com"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    disabled={isLoading}
                    required
                  />
                </div>
                <Button
                  className="h-11 w-full text-base font-bold shadow-lg shadow-primary/25"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    "Criar conta gratis"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <div className="w-full text-center text-sm text-muted-foreground">
                Ja tem uma conta?{" "}
                <Link
                  href={withEmbeddedContext("/login")}
                  className="font-bold text-primary hover:underline underline-offset-4"
                >
                  Fazer Login
                </Link>
              </div>
            </CardFooter>
          </Card>
          <p className="px-8 text-center text-xs leading-relaxed text-muted-foreground">
            Ao se registrar, voce concorda com nossos{" "}
            <Link
              href={withEmbeddedContext("/terms")}
              className="underline underline-offset-4 transition-colors hover:text-primary"
            >
              Termos de Servico
            </Link>{" "}
            e{" "}
            <Link
              href={withEmbeddedContext("/privacy")}
              className="underline underline-offset-4 transition-colors hover:text-primary"
            >
              Politica de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
