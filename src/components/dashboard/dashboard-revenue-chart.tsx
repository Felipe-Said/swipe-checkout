"use client"

import * as React from "react"

import { Area, AreaChart, ChartTooltip, Grid, XAxis } from "@/components/ui/area-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type SupportedCurrency = "BRL" | "USD" | "EUR" | "GBP"
type RevenueChartSeries = {
  key: string
  label: string
  color: string
}
type RevenueChartPoint = {
  date: string
  label: string
} & Record<string, string | number>
type RevenueChartGranularity = {
  points: RevenueChartPoint[]
  series: RevenueChartSeries[]
}
type RevenueChartSummary = {
  day: RevenueChartGranularity
  week: RevenueChartGranularity
  month: RevenueChartGranularity
  year: RevenueChartGranularity
}

const granularityOptions = [
  { value: "day", label: "Dias" },
  { value: "week", label: "Semanas" },
  { value: "month", label: "Meses" },
  { value: "year", label: "Ano" },
] as const

type Granularity = (typeof granularityOptions)[number]["value"]

export function DashboardRevenueChart({
  chart,
  currency,
  language,
}: {
  chart: RevenueChartSummary
  currency: SupportedCurrency
  language: string
}) {
  const [granularity, setGranularity] = React.useState<Granularity>("day")
  const [mode, setMode] = React.useState<"total" | "products">("total")

  const current = chart[granularity]
  const points = React.useMemo(
    () =>
      current.points.map((point) => ({
        ...point,
        date: new Date(point.date),
      })),
    [current.points]
  )

  const hasProductSeries = current.series.length > 0
  const totalKey = `total_${currency}`
  const showProductsMode = mode === "products"
  const canRenderProducts = showProductsMode && hasProductSeries

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Faturamento em Grafico</CardTitle>
            <CardDescription>
              Receita real por periodo, com leitura total ou separada por checkout/produto.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {granularityOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={granularity === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setGranularity(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "total" ? "default" : "outline"}
              onClick={() => setMode("total")}
            >
              Total
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "products" ? "default" : "outline"}
              onClick={() => setMode("products")}
            >
              Por produto
            </Button>
          </div>

          {canRenderProducts ? (
            <div className="flex flex-wrap gap-3">
              {current.series.map((series) => (
                <div key={series.key} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
                  <span>{series.label}</span>
                </div>
              ))}
            </div>
          ) : showProductsMode ? (
            <div className="text-sm text-muted-foreground">
              Ainda nao ha dados suficientes para separar este faturamento por produto.
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        {points.length > 0 ? (
          <AreaChart data={points} xDataKey="date" aspectRatio="16 / 6" className="min-h-[260px]">
            <Grid horizontal />
            {canRenderProducts
              ? current.series.map((series) => (
                  <Area
                    key={series.key}
                    dataKey={`${series.key}_${currency}`}
                    fill={series.color}
                    stroke={series.color}
                    fillOpacity={0.16}
                  />
                ))
              : (
                <Area
                  dataKey={totalKey}
                  fill="var(--chart-line-primary)"
                  stroke="var(--chart-line-primary)"
                  fillOpacity={0.22}
                />
              )}
            <XAxis tickCount={granularity === "year" ? 5 : 6} />
            <ChartTooltip
              rows={(point) => {
                if (canRenderProducts) {
                  return current.series.map((series) => ({
                    color: series.color,
                    label: series.label,
                    value: formatAmount(
                      Number(point[`${series.key}_${currency}`] ?? 0),
                      currency,
                      language
                    ),
                  }))
                }

                return [
                  {
                    color: "var(--chart-line-primary)",
                    label: "Faturamento",
                    value: formatAmount(Number(point[totalKey] ?? 0), currency, language),
                  },
                ]
              }}
            />
          </AreaChart>
        ) : (
          <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
            Nenhum faturamento real encontrado para montar o grafico.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatAmount(value: number, currency: SupportedCurrency, language: string) {
  const locale =
    language === "en-US" || language === "es-ES" || language === "pt-BR"
      ? language
      : currency === "USD"
        ? "en-US"
        : currency === "EUR"
          ? "es-ES"
          : currency === "GBP"
            ? "en-US"
            : "pt-BR"

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value)
}
