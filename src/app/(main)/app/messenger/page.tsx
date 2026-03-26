"use client"

import * as React from "react"
import { ImagePlus, Send, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getCurrentAppSession } from "@/lib/app-session"
import {
  appendSupportChatMessage,
  readSupportChatMessages,
  type SupportChatMessage,
} from "@/lib/support-chat-data"

export default function MessengerPage() {
  const [accountId, setAccountId] = React.useState("")
  const [messages, setMessages] = React.useState<SupportChatMessage[]>([])
  const [draft, setDraft] = React.useState("")
  const [imageDraft, setImageDraft] = React.useState("")

  React.useEffect(() => {
    async function loadSession() {
      const session = await getCurrentAppSession()
      if (!session?.accountId) {
        return
      }

      setAccountId(session.accountId)
      setMessages(readSupportChatMessages())
    }

    loadSession()
  }, [])

  const handleSend = () => {
    if (!accountId || (!draft.trim() && !imageDraft)) return

    const nextMessages = appendSupportChatMessage({
      id: `${Date.now()}`,
      accountId,
      from: "user",
      text: draft.trim(),
      imageSrc: imageDraft,
      createdAt: new Date().toISOString(),
    })
    setMessages(nextMessages)
    setDraft("")
    setImageDraft("")
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageDraft(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const accountMessages = messages.filter((message) => message.accountId === accountId)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Messenger</h1>
        <p className="text-muted-foreground">
          Canal direto para enviar e receber mensagens do admin.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Conversa com o Admin</CardTitle>
            <CardDescription>
              Historico de mensagens da sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 rounded-xl border p-4">
              {accountMessages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                    message.from === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {message.text ? <div>{message.text}</div> : null}
                  {message.imageSrc ? (
                    <img
                      src={message.imageSrc}
                      alt="Anexo do chat"
                      className="mt-2 max-h-40 rounded-lg border object-contain"
                    />
                  ) : null}
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <Textarea
                rows={4}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Digite sua mensagem..."
              />
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*" onChange={handleImageUpload} />
                <Button variant="outline" size="icon">
                  <ImagePlus className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleSend}>
                <Send className="mr-2 h-4 w-4" />
                Enviar mensagem
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status do Canal</CardTitle>
            <CardDescription>
              Informacoes do atendimento da sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <Shield className="h-4 w-4" />
                Atendimento ativo
              </div>
              <p className="text-sm text-muted-foreground">
                Sua conta pode falar diretamente com o admin a qualquer momento.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium">Ultima resposta</div>
              <p className="mt-1 text-sm text-muted-foreground">Ha menos de 10 minutos.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
