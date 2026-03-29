export type SupportedWithdrawalCurrency = "BRL" | "USD" | "EUR" | "GBP"

export type BankAccountDetails = {
  holderName: string
  document: string
  bankName: string
  agency: string
  accountNumber: string
  pixKey: string
}

export type BankFieldDefinition = {
  documentLabel: string
  agencyLabel: string
  accountLabel: string
  pixKeyLabel: string
}

export type WithdrawalRecord = {
  id: string
  accountId: string
  currency: SupportedWithdrawalCurrency
  amount: number
  requestedAt: string
  paidAt: string | null
  status: "pending" | "paid"
}

export const withdrawalCurrencyOptions: Array<{
  value: SupportedWithdrawalCurrency
  label: string
}> = [
  { value: "BRL", label: "BRL - Real" },
  { value: "USD", label: "USD - Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - Pound" },
]

export function getBankFieldDefinitions(currency: SupportedWithdrawalCurrency): BankFieldDefinition {
  if (currency === "USD") {
    return {
      documentLabel: "Tax ID / Documento",
      agencyLabel: "Routing Number / ABA",
      accountLabel: "Account Number",
      pixKeyLabel: "SWIFT / Wire",
    }
  }

  if (currency === "EUR") {
    return {
      documentLabel: "VAT / Documento",
      agencyLabel: "BIC / SWIFT",
      accountLabel: "IBAN",
      pixKeyLabel: "Referencia do Beneficiario",
    }
  }

  if (currency === "GBP") {
    return {
      documentLabel: "Tax ID / Documento",
      agencyLabel: "Sort Code",
      accountLabel: "Account Number",
      pixKeyLabel: "IBAN",
    }
  }

  return {
    documentLabel: "Documento",
    agencyLabel: "Agencia",
    accountLabel: "Conta",
    pixKeyLabel: "Chave Pix",
  }
}
