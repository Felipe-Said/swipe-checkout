export type SupportChatMessage = {
  id: string
  accountId: string
  from: "admin" | "user"
  text: string
  imageSrc: string
  createdAt: string
}

const STORAGE_KEY = "swipe-support-chat"

const defaultMessages: SupportChatMessage[] = [
  {
    id: "msg-1",
    accountId: "user-demo",
    from: "admin",
    text: "Recebemos sua ultima mensagem e ja estamos revisando sua configuracao de checkout.",
    imageSrc: "",
    createdAt: "2026-03-24T10:00:00.000Z",
  },
  {
    id: "msg-2",
    accountId: "user-demo",
    from: "user",
    text: "Perfeito, tambem queria confirmar o prazo para ativacao da integracao.",
    imageSrc: "",
    createdAt: "2026-03-24T10:05:00.000Z",
  },
]

export function readSupportChatMessages() {
  if (typeof window === "undefined") {
    return defaultMessages
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMessages))
      return defaultMessages
    }

    const parsed = JSON.parse(raw) as SupportChatMessage[]
    return Array.isArray(parsed) ? parsed : defaultMessages
  } catch {
    return defaultMessages
  }
}

export function writeSupportChatMessages(messages: SupportChatMessage[]) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
}

export function appendSupportChatMessage(message: SupportChatMessage) {
  const current = readSupportChatMessages()
  const next = [...current, message]
  writeSupportChatMessages(next)
  return next
}
