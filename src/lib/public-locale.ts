export type PublicLocale = "pt-BR" | "en-US"

export function resolvePublicLocale(input: {
  country?: string | null
  language?: string | null
}): PublicLocale {
  const country = (input.country || "").toUpperCase()
  const language = (input.language || "").toLowerCase()

  if (country === "US") {
    return "en-US"
  }

  if (language.startsWith("en-us")) {
    return "en-US"
  }

  return "pt-BR"
}
