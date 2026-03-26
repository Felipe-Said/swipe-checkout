export type DemoRole = "admin" | "user"

export type DemoSession = {
  name: string
  email: string
  role: DemoRole
}

export const DEMO_CREDENTIALS = {
  admin: {
    email: "admin@swipe.com.br",
    password: "admin123",
    name: "Administrador",
    role: "admin" as const,
  },
  user: {
    email: "user@swipe.com.br",
    password: "user123",
    name: "Usuario Demo",
    role: "user" as const,
  },
}

export const DEMO_AUTH_STORAGE_KEY = "swipe-demo-session"

export function authenticateDemoUser(email: string, password: string): DemoSession | null {
  const normalizedEmail = email.trim().toLowerCase()

  for (const credential of Object.values(DEMO_CREDENTIALS)) {
    if (credential.email === normalizedEmail && credential.password === password) {
      return {
        name: credential.name,
        email: credential.email,
        role: credential.role,
      }
    }
  }

  return null
}

export function readDemoSession(): DemoSession | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const raw = window.localStorage.getItem(DEMO_AUTH_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const session = JSON.parse(raw) as DemoSession
    if (!session?.email || !session?.role) {
      return null
    }

    return session
  } catch {
    return null
  }
}

export function writeDemoSession(session: DemoSession) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearDemoSession() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(DEMO_AUTH_STORAGE_KEY)
}
