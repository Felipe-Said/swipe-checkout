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

type WithdrawalsStore = {
  bankAccounts: Record<string, Partial<Record<SupportedWithdrawalCurrency, BankAccountDetails>>>
  withdrawals: WithdrawalRecord[]
}

const STORAGE_KEY = "swipe-withdrawals-store"

const defaultStore: WithdrawalsStore = {
  bankAccounts: {
    "user-demo": {
      BRL: {
        holderName: "Usuario Demo",
        document: "123.456.789-00",
        bankName: "Banco Global BR",
        agency: "0001",
        accountNumber: "12345-6",
        pixKey: "user@swipe.com.br",
      },
      GBP: {
        holderName: "Usuario Demo",
        document: "GB123456789",
        bankName: "Global Bank UK",
        agency: "20-01-55",
        accountNumber: "77889910",
        pixKey: "GB29NWBK60161331926819",
      },
    },
  },
  withdrawals: [
    {
      id: "wd-1",
      accountId: "user-demo",
      currency: "BRL",
      amount: 1840,
      requestedAt: "2026-03-20T14:30:00.000Z",
      paidAt: "2026-03-22T10:15:00.000Z",
      status: "paid",
    },
    {
      id: "wd-2",
      accountId: "user-demo",
      currency: "GBP",
      amount: 2150,
      requestedAt: "2026-03-24T09:00:00.000Z",
      paidAt: null,
      status: "pending",
    },
    {
      id: "wd-3",
      accountId: "studio-atlas",
      currency: "BRL",
      amount: 620,
      requestedAt: "2026-03-23T18:00:00.000Z",
      paidAt: null,
      status: "pending",
    },
  ],
}

export function readWithdrawalsStore(): WithdrawalsStore {
  if (typeof window === "undefined") {
    return defaultStore
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStore))
      return defaultStore
    }

    const parsed = JSON.parse(raw) as WithdrawalsStore
    if (!parsed?.withdrawals) {
      return defaultStore
    }

    return {
      bankAccounts: parsed.bankAccounts ?? defaultStore.bankAccounts,
      withdrawals: parsed.withdrawals.map((withdrawal) => ({
        ...withdrawal,
        currency: withdrawal.currency ?? "BRL",
      })),
    }
  } catch {
    return defaultStore
  }
}

export function writeWithdrawalsStore(store: WithdrawalsStore) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getBankAccount(accountId: string, currency: SupportedWithdrawalCurrency) {
  const store = readWithdrawalsStore()
  return store.bankAccounts[accountId]?.[currency] ?? null
}

export function getBankAccountsByAccount(accountId: string) {
  const store = readWithdrawalsStore()
  return store.bankAccounts[accountId] ?? {}
}

export function saveBankAccount(
  accountId: string,
  currency: SupportedWithdrawalCurrency,
  details: BankAccountDetails
) {
  const store = readWithdrawalsStore()
  const nextStore: WithdrawalsStore = {
    ...store,
    bankAccounts: {
      ...store.bankAccounts,
      [accountId]: {
        ...(store.bankAccounts[accountId] ?? {}),
        [currency]: details,
      },
    },
  }
  writeWithdrawalsStore(nextStore)
  return nextStore
}

export function getWithdrawalsByAccount(accountId: string) {
  return readWithdrawalsStore().withdrawals.filter((withdrawal) => withdrawal.accountId === accountId)
}

export function markWithdrawalAsPaid(withdrawalId: string) {
  const store = readWithdrawalsStore()
  const nextStore: WithdrawalsStore = {
    ...store,
    withdrawals: store.withdrawals.map((withdrawal) =>
      withdrawal.id === withdrawalId
        ? { ...withdrawal, status: "paid", paidAt: new Date().toISOString() }
        : withdrawal
    ),
  }
  writeWithdrawalsStore(nextStore)
  return nextStore
}

export function createWithdrawal(
  accountId: string,
  amount: number,
  currency: SupportedWithdrawalCurrency
) {
  const store = readWithdrawalsStore()
  const nextWithdrawal: WithdrawalRecord = {
    id: `wd-${Date.now()}`,
    accountId,
    currency,
    amount,
    requestedAt: new Date().toISOString(),
    paidAt: null,
    status: "pending",
  }

  const nextStore: WithdrawalsStore = {
    ...store,
    withdrawals: [nextWithdrawal, ...store.withdrawals],
  }

  writeWithdrawalsStore(nextStore)
  return nextStore
}

export function getLastPaidWithdrawalAmount(accountId: string) {
  const paid = getWithdrawalsByAccount(accountId)
    .filter((withdrawal) => withdrawal.status === "paid" && withdrawal.paidAt)
    .sort((a, b) => new Date(b.paidAt ?? 0).getTime() - new Date(a.paidAt ?? 0).getTime())

  return paid[0]?.amount ?? 0
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
