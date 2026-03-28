"use client"

import { FunnelChart } from "@/components/ui/funnel-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function DashboardCustomerFunnel({
  funnel,
}: {
  funnel: Array<{
    label: string
    value: number
    color: string
    displayValue: string
  }>
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Comportamento no Checkout</CardTitle>
        <CardDescription>
          Etapas reais dos clientes no checkout com base nos pedidos do periodo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {funnel.length > 0 && funnel.some((stage) => stage.value > 0) ? (
          <FunnelChart
            data={funnel}
            orientation="vertical"
            className="min-h-[360px]"
            labelLayout="grouped"
            labelOrientation="vertical"
            showLabels
            showPercentage
            showValues
          />
        ) : (
          <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
            Ainda nao existe comportamento real suficiente para montar o funil.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
