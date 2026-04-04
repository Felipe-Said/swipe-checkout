"use client"

import * as React from "react"

import { loadOrdersForSession } from "@/app/actions/orders"
import { getCurrentAppSession } from "@/lib/app-session"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type OrderRow = {
  id: string
  customerName: string
  amount: number
  currency: string
  status: string
  date: string
}

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<OrderRow[]>([])

  React.useEffect(() => {
    async function loadOrders() {
      const session = await getCurrentAppSession()
      if (!session) {
        setOrders([])
        return
      }

      const result = await loadOrdersForSession({
        userId: session.userId,
        accountId: session.accountId,
        accessToken: (await supabase.auth.getSession()).data.session?.access_token ?? null,
      })

      if (result.error) {
        setOrders([])
        return
      }

      setOrders(
        result.orders.map((order) => ({
          id: String(order.id),
          customerName: order.customer_name || "Cliente",
          amount: Number(order.amount ?? 0),
          currency: String(order.currency ?? "BRL").toUpperCase(),
          status: String(order.status ?? "Pendente"),
          date: String(order.date ?? new Date().toISOString()),
        }))
      )
    }

    void loadOrders()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
        <p className="text-muted-foreground">
          Acompanhe todas as vendas realizadas atraves do Swipe.
        </p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{formatOrderId(order.id)}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === "Pago" ? "default" : "outline"}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(order.amount, order.currency)}</TableCell>
                  <TableCell>{formatDate(order.date)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum pedido real encontrado ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function formatOrderId(value: string) {
  const cleanValue = String(value).trim()
  if (/^\d+$/.test(cleanValue)) {
    return `#${cleanValue}`
  }

  return `#${cleanValue.slice(-6).toUpperCase()}`
}

function formatCurrency(amount: number, currency: string) {
  const normalized =
    currency === "USD" || currency === "EUR" || currency === "GBP" ? currency : "BRL"
  const locale =
    normalized === "USD"
      ? "en-US"
      : normalized === "GBP"
        ? "en-GB"
        : normalized === "EUR"
          ? "de-DE"
          : "pt-BR"

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: normalized,
  }).format(amount)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value))
}
