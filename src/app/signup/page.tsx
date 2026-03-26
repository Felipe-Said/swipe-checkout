"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CreditCard, CheckCircle2, Loader2 } from "lucide-react"
import { signup } from "@/app/auth/actions"
import { toast } from "sonner"

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(event.currentTarget)
    const result = await signup(formData)

    if (result?.error) {
      toast.error(result.error)
      setIsLoading(false)
    } else {
      toast.success("Conta criada! Aguarde a aprovação administrativa.")
      router.push("/login?message=pending")
    }
  }

  return (
    <div className="container relative flex h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <Link href="/" className="relative z-20 flex w-fit items-center text-lg font-medium">
          <CreditCard className="mr-2 h-6 w-6" />
          Swipe
        </Link>
        
        <div className="relative z-20 mt-12 space-y-6">
           <h2 className="text-3xl font-bold tracking-tight">Comece a escalar sua operação hoje mesmo.</h2>
           <ul className="space-y-4">
              {[
                "Criação ilimitada de checkouts premium",
                "Dashboard operacional em tempo real",
                "Integração direta com Shopify",
                "Suporte a múltiplos domínios e pixels"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-lg opacity-90 transition-opacity hover:opacity-100">
                   <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                   </div>
                   {item}
                </li>
              ))}
           </ul>
        </div>

        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;A melhor decisão que tomamos para nossa operação de checkout. Simple, robusto e extremamente profissional.&rdquo;
            </p>
            <footer className="text-sm">Ricardo Mendes, Diretor de E-commerce</footer>
          </blockquote>
        </div>
      </div>
      
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Criar sua conta</h1>
            <p className="text-sm text-muted-foreground">
              Preencha os dados abaixo para começar sua jornada com a Swipe.
            </p>
          </div>
          <Card className="border-2 border-primary/10 shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Registro</CardTitle>
              <CardDescription>Crie sua conta administrativa ou de usuário.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" name="name" placeholder="Seu nome" disabled={isLoading} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail Corporativo</Label>
                  <Input id="email" name="email" type="email" placeholder="nome@empresa.com" disabled={isLoading} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" name="password" type="password" disabled={isLoading} required />
                </div>
                <Button className="w-full h-11 text-base font-bold shadow-lg shadow-primary/25" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : "Criar conta grátis"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <div className="text-sm text-center text-muted-foreground w-full">
                Já tem uma conta?{" "}
                <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4">
                  Fazer Login
                </Link>
              </div>
            </CardFooter>
          </Card>
          <p className="px-8 text-center text-xs text-muted-foreground leading-relaxed">
            Ao se registrar, você concorda com nossos{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary transition-colors">
              Termos de Serviço
            </Link>{" "}
            e{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary transition-colors">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
