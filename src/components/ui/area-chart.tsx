"use client"

import * as React from "react"
import { localPoint } from "@visx/event"
import { GridRows } from "@visx/grid"
import { ParentSize } from "@visx/responsive"
import { scaleLinear, scaleTime } from "@visx/scale"
import { AreaClosed, LinePath } from "@visx/shape"
import { bisector } from "d3-array"
import { motion } from "motion/react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type ChartDatum = Record<string, unknown>

type ChartContextValue = {
  data: ChartDatum[]
  xAccessor: (datum: ChartDatum) => Date
  xScale: ReturnType<typeof scaleTime<number>>
  yScale: ReturnType<typeof scaleLinear<number>>
  width: number
  height: number
  innerWidth: number
  innerHeight: number
  margin: { top: number; right: number; bottom: number; left: number }
  containerRef: React.RefObject<HTMLDivElement | null>
  tooltipData: {
    point: ChartDatum
    x: number
    y: number
    index: number
  } | null
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within AreaChart.")
  }

  return context
}

type AreaChartProps = {
  data: ChartDatum[]
  xDataKey?: string
  className?: string
  aspectRatio?: string
  children: React.ReactNode
}

export function AreaChart({
  data,
  xDataKey = "date",
  className,
  aspectRatio = "16 / 7",
  children,
}: AreaChartProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      style={{ aspectRatio }}
    >
      <ParentSize debounceTime={10}>
        {({ width, height }) => (
          <ChartInner
            containerRef={containerRef}
            data={data}
            height={height}
            width={width}
            xDataKey={xDataKey}
          >
            {children}
          </ChartInner>
        )}
      </ParentSize>
    </div>
  )
}

function ChartInner({
  width,
  height,
  data,
  xDataKey,
  containerRef,
  children,
}: {
  width: number
  height: number
  data: ChartDatum[]
  xDataKey: string
  containerRef: React.RefObject<HTMLDivElement | null>
  children: React.ReactNode
}) {
  const [tooltipData, setTooltipData] = React.useState<ChartContextValue["tooltipData"]>(null)
  const margin = React.useMemo(() => ({ top: 20, right: 16, bottom: 32, left: 8 }), [])

  const innerWidth = Math.max(width - margin.left - margin.right, 0)
  const innerHeight = Math.max(height - margin.top - margin.bottom, 0)

  const areaConfigs = React.useMemo(() => extractAreaConfigs(children), [children])

  const xAccessor = React.useCallback(
    (datum: ChartDatum) => {
      const value = datum[xDataKey]
      return value instanceof Date ? value : new Date(String(value))
    },
    [xDataKey]
  )

  const xScale = React.useMemo(() => {
    const dates = data.map(xAccessor)
    const min = dates.length > 0 ? Math.min(...dates.map((item) => item.getTime())) : Date.now()
    const max = dates.length > 0 ? Math.max(...dates.map((item) => item.getTime())) : Date.now()

    return scaleTime<number>({
      domain: [new Date(min), new Date(max)],
      range: [0, innerWidth],
    })
  }, [data, innerWidth, xAccessor])

  const yScale = React.useMemo(() => {
    let max = 0
    for (const config of areaConfigs) {
      for (const point of data) {
        const value = point[config.dataKey]
        if (typeof value === "number") {
          max = Math.max(max, value)
        }
      }
    }

    return scaleLinear<number>({
      domain: [0, max > 0 ? max * 1.12 : 100],
      range: [innerHeight, 0],
      nice: true,
    })
  }, [areaConfigs, data, innerHeight])

  const bisectDate = React.useMemo(
    () => bisector<ChartDatum, Date>((datum) => xAccessor(datum)).left,
    [xAccessor]
  )

  const handlePointerMove = React.useCallback(
    (event: React.MouseEvent<SVGRectElement>) => {
      const point = localPoint(event)
      if (!point) return

      const chartX = point.x - margin.left
      const xDate = xScale.invert(chartX)
      const index = bisectDate(data, xDate, 1)
      const previous = data[index - 1]
      const next = data[index]
      let chosen = previous
      let chosenIndex = index - 1

      if (!previous && next) {
        chosen = next
        chosenIndex = index
      } else if (previous && next) {
        const previousDistance = Math.abs(xDate.getTime() - xAccessor(previous).getTime())
        const nextDistance = Math.abs(xAccessor(next).getTime() - xDate.getTime())
        if (nextDistance < previousDistance) {
          chosen = next
          chosenIndex = index
        }
      }

      if (!chosen) {
        setTooltipData(null)
        return
      }

      const primaryKey = areaConfigs[0]?.dataKey
      const primaryValue =
        primaryKey && typeof chosen[primaryKey] === "number" ? Number(chosen[primaryKey]) : 0

      setTooltipData({
        point: chosen,
        index: chosenIndex,
        x: xScale(xAccessor(chosen)),
        y: yScale(primaryValue),
      })
    },
    [areaConfigs, bisectDate, data, margin.left, xAccessor, xScale, yScale]
  )

  const contextValue = React.useMemo<ChartContextValue>(
    () => ({
      data,
      xAccessor,
      xScale,
      yScale,
      width,
      height,
      innerWidth,
      innerHeight,
      margin,
      containerRef,
      tooltipData,
    }),
    [containerRef, data, height, innerHeight, innerWidth, margin, tooltipData, width, xAccessor, xScale, yScale]
  )

  if (width <= 0 || height <= 0) {
    return null
  }

  return (
    <ChartContext.Provider value={contextValue}>
      <div className="absolute inset-0">
        <svg width={width} height={height} className="overflow-visible">
          <g transform={`translate(${margin.left},${margin.top})`}>
            <rect
              x={0}
              y={0}
              width={innerWidth}
              height={innerHeight}
              fill="transparent"
              onMouseMove={handlePointerMove}
              onMouseLeave={() => setTooltipData(null)}
            />
            {children}
          </g>
        </svg>
      </div>
    </ChartContext.Provider>
  )
}

function extractAreaConfigs(children: React.ReactNode) {
  const configs: Array<{ dataKey: string; stroke: string }> = []

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    const props = child.props as { dataKey?: string; stroke?: string; fill?: string }
    if (typeof props.dataKey === "string" && props.dataKey.length > 0) {
      configs.push({
        dataKey: props.dataKey,
        stroke: props.stroke ?? props.fill ?? "var(--chart-line-primary)",
      })
    }
  })

  return configs
}

export function Grid({
  horizontal = true,
  numTicksRows = 5,
  stroke = "var(--chart-grid)",
}: {
  horizontal?: boolean
  numTicksRows?: number
  stroke?: string
}) {
  const { yScale, innerWidth } = useChart()

  if (!horizontal) {
    return null
  }

  return (
    <GridRows
      scale={yScale}
      width={innerWidth}
      numTicks={numTicksRows}
      stroke={stroke}
      strokeDasharray="4 4"
      strokeOpacity={1}
    />
  )
}

export function Area({
  dataKey,
  fill = "var(--chart-line-primary)",
  fillOpacity = 0.28,
  stroke,
  strokeWidth = 2,
}: {
  dataKey: string
  fill?: string
  fillOpacity?: number
  stroke?: string
  strokeWidth?: number
}) {
  const { data, xScale, yScale, xAccessor } = useChart()
  const resolvedStroke = stroke ?? fill

  return (
    <>
      <defs>
        <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={fill} stopOpacity={0} />
        </linearGradient>
      </defs>
      <AreaClosed
        data={data}
        x={(datum) => xScale(xAccessor(datum)) ?? 0}
        y={(datum) =>
          typeof datum[dataKey] === "number" ? (yScale(Number(datum[dataKey])) ?? 0) : 0
        }
        yScale={yScale}
        fill={`url(#gradient-${dataKey})`}
      />
      <LinePath
        data={data}
        x={(datum) => xScale(xAccessor(datum)) ?? 0}
        y={(datum) =>
          typeof datum[dataKey] === "number" ? (yScale(Number(datum[dataKey])) ?? 0) : 0
        }
        stroke={resolvedStroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </>
  )
}

export function XAxis({ tickCount = 6 }: { tickCount?: number }) {
  const { xScale, innerHeight, innerWidth } = useChart()
  const ticks = xScale.ticks(tickCount)

  return (
    <g transform={`translate(0,${innerHeight + 12})`}>
      {ticks.map((tick) => {
        const x = xScale(tick)
        if (typeof x !== "number" || x < 0 || x > innerWidth) return null

        return (
          <text
            key={tick.toISOString()}
            x={x}
            y={0}
            textAnchor="middle"
            className="fill-chart-label text-[11px]"
          >
            {tick.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
            })}
          </text>
        )
      })}
    </g>
  )
}

export function ChartTooltip({
  rows,
}: {
  rows: (point: ChartDatum) => Array<{ color: string; label: string; value: string | number }>
}) {
  const { tooltipData, margin, width } = useChart()
  if (!tooltipData) return null
  const leftBase = tooltipData.x + margin.left + 16
  const left = Math.min(leftBase, Math.max(width - 220, 12))

  return (
    <foreignObject x={left} y={margin.top + 12} width={200} height={120}>
      <ChartTooltipContent rows={rows(tooltipData.point)} />
    </foreignObject>
  )
}

function ChartTooltipContent({
  rows,
}: {
  rows: Array<{ color: string; label: string; value: string | number }>
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="pointer-events-none min-w-[180px] rounded-xl border border-white/10 bg-chart-tooltip-background px-3 py-2 text-chart-tooltip-foreground shadow-xl backdrop-blur-md"
    >
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={`${row.label}-${row.color}`} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
              <span className="text-sm text-chart-tooltip-muted">{row.label}</span>
            </div>
            <span className="text-sm font-medium tabular-nums">{row.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
