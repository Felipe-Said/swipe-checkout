"use client"

import * as React from "react"
import { ImagePlus, Send, Shield } from "lucide-react"

import {
  loadSupportMessagesForSession,
  sendSupportMessageForSession,
} from "@/app/actions/customers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getCurrentAppSession } from "@/lib/app-session"
import { supabase } from "@/lib/supabase"

type SupportChatMessage = {
  id: string
  accountId: string
  from: "admin" | "user"
  text: string
  imageSrc: string
  createdAt: string
}

export default function MessengerPage() {
  const [accountId, setAccountId] = React.useState("")
  const [messages, setMessages] = React.useState<SupportChatMessage[]>([])
  const [draft, setDraft] = React.useState("")
  const [imageDraft, setImageDraft] = React.useState("")
  const [messengerEnabled, setMessengerEnabled] = React.useState(true)

  const upsertRealtimeMessage = React.useCallback((message: SupportChatMessage) => {
    setMessages((current) => {
      const next = current.filter((item) => item.id !== message.id)
      next.push(message)
      next.sort((left, right) => {
        const leftTime = new Date(left.createdAt).getTime()
        const rightTime = new Date(right.createdAt).getTime()
        return leftTime - rightTime
      })
      return next
    })
  }, [])

  const removeRealtimeMessage = React.useCallback((messageId: string) => {
    setMessages((current) => current.filter((item) => item.id !== messageId))
  }, [])

  React.useEffect(() => {
    async function loadSession() {
      const session = await getCurrentAppSession()
      if (!session?.accountId) {
        return
      }

      if (!session.messengerEnabled) {
        setMessengerEnabled(false)
        window.location.replace("/app")
        return
      }

      setAccountId(session.accountId)
      const result = await loadSupportMessagesForSession({
        userId: session.userId,
        accountId: session.accountId,
      })
      setMessages((result.messages ?? []) as SupportChatMessage[])
    }

    void loadSession()
  }, [])

  React.useEffect(() => {
    if (!accountId) {
      return
    }

    const messagesChannel = supabase
      .channel(`support-messages-${accountId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_messages",
          filter: `account_id=eq.${accountId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            removeRealtimeMessage(String(payload.old.id))
            return
          }

          if (payload.new && typeof payload.new === "object") {
            const row = payload.new as {
              id?: string
              account_id?: string
              from_role?: string
              text?: string | null
              image_src?: string | null
              created_at?: string
            }

            if (row.id && row.account_id && row.created_at) {
              upsertRealtimeMessage({
                id: row.id,
                accountId: row.account_id,
                from: row.from_role === "admin" ? "admin" : "user",
                text: row.text ?? "",
                imageSrc: row.image_src ?? "",
                createdAt: row.created_at,
              })
            }
          }
        }
      )
      .subscribe()

    const accountChannel = supabase
      .channel(`messenger-account-${accountId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "managed_accounts",
          filter: `id=eq.${accountId}`,
        },
        async (payload) => {
          const nextMessengerEnabled =
            payload.new && typeof payload.new === "object"
              ? (payload.new as { messenger_enabled?: unknown }).messenger_enabled !== false
              : true

          setMessengerEnabled(nextMessengerEnabled)

          if (!nextMessengerEnabled) {
            window.location.replace("/app")
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(messagesChannel)
      void supabase.removeChannel(accountChannel)
    }
  }, [accountId, removeRealtimeMessage, upsertRealtimeMessage])

  if (!messengerEnabled) {
    return null
  }

  const handleSend = async () => {
    if (!accountId || (!draft.trim() && !imageDraft)) return

    const session = await getCurrentAppSession()
    if (!session?.userId) return

    const result = await sendSupportMessageForSession({
      userId: session.userId,
      accountId,
      text: draft.trim(),
      imageSrc: imageDraft,
    })

    if (result.error) return

    const nextMessages = await loadSupportMessagesForSession({
      userId: session.userId,
      accountId,
    })
    setMessages((nextMessages.messages ?? []) as SupportChatMessage[])
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
  const lastAdminMessage =
    [...accountMessages].reverse().find((message) => message.from === "admin") ?? null
  const channelStatus = messengerEnabled ? "Canal habilitado" : "Canal desativado"
  const lastReplyLabel = lastAdminMessage
    ? formatRelativeLabel(lastAdminMessage.createdAt)
    : "Nenhuma resposta do admin ainda."

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
              <Button onClick={() => void handleSend()}>
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
                {channelStatus}
              </div>
              <p className="text-sm text-muted-foreground">
                {messengerEnabled
                  ? "Sua conta pode trocar mensagens reais com o admin enquanto o canal estiver habilitado."
                  : "Este canal depende da liberacao do admin para ficar disponivel."}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium">Ultima resposta</div>
              <p className="mt-1 text-sm text-muted-foreground">{lastReplyLabel}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function formatRelativeLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Resposta registrada recentemente."
  }

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0)

  if (diffMinutes < 1) {
    return "Agora mesmo."
  }

  if (diffMinutes < 60) {
    return `Ha ${diffMinutes} minuto${diffMinutes === 1 ? "" : "s"}.`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `Ha ${diffHours} hora${diffHours === 1 ? "" : "s"}.`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `Ha ${diffDays} dia${diffDays === 1 ? "" : "s"}.`
}
