import type { AppSession } from "@/lib/app-session"

const MESSENGER_BADGE_EVENT = "swipe:messenger-badge"

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function getMessengerBadgeKey(session: AppSession) {
  const scope = session.role === "admin" ? session.userId : session.accountId || session.userId
  return `swipe-messenger-unread:${session.role}:${scope}`
}

function dispatchMessengerBadgeEvent(session: AppSession, count: number) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent(MESSENGER_BADGE_EVENT, {
      detail: { key: getMessengerBadgeKey(session), count },
    })
  )
}

export function readMessengerUnreadCount(session: AppSession) {
  if (!canUseBrowserStorage()) {
    return 0
  }

  const stored = window.localStorage.getItem(getMessengerBadgeKey(session))
  const parsed = Number(stored ?? 0)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function setMessengerUnreadCount(session: AppSession, count: number) {
  if (!canUseBrowserStorage()) {
    return 0
  }

  const normalized = Math.max(0, Math.floor(count))
  window.localStorage.setItem(getMessengerBadgeKey(session), String(normalized))
  dispatchMessengerBadgeEvent(session, normalized)
  return normalized
}

export function incrementMessengerUnreadCount(session: AppSession) {
  const next = readMessengerUnreadCount(session) + 1
  return setMessengerUnreadCount(session, next)
}

export function clearMessengerUnreadCount(session: AppSession) {
  return setMessengerUnreadCount(session, 0)
}

export function subscribeToMessengerUnreadCount(
  session: AppSession,
  callback: (count: number) => void
) {
  if (typeof window === "undefined") {
    return () => undefined
  }

  const key = getMessengerBadgeKey(session)

  const handleCustomEvent = (event: Event) => {
    const detail = (event as CustomEvent<{ key?: string; count?: number }>).detail
    if (detail?.key === key) {
      callback(typeof detail.count === "number" ? detail.count : 0)
    }
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === key) {
      const parsed = Number(event.newValue ?? 0)
      callback(Number.isFinite(parsed) && parsed > 0 ? parsed : 0)
    }
  }

  window.addEventListener(MESSENGER_BADGE_EVENT, handleCustomEvent as EventListener)
  window.addEventListener("storage", handleStorage)

  return () => {
    window.removeEventListener(MESSENGER_BADGE_EVENT, handleCustomEvent as EventListener)
    window.removeEventListener("storage", handleStorage)
  }
}
