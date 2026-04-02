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
          Leitura das ultimas 24 horas nas quatro etapas principais do checkout.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {funnel.length > 0 && funnel.some((stage) => stage.value > 0) ? (
          <FunnelChart
            data={funnel}
            orientation="vertical"
            className="min-h-[300px]"
            layers={2}
            labelLayout="grouped"
            labelOrientation="vertical"
            labelAlign="center"
            showLabels
            showPercentage
            showValues
          />
        ) : (
          <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
            Ainda nao existem eventos suficientes nas ultimas 24 horas para montar o funil.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
