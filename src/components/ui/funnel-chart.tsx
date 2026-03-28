"use client"

import { motion } from "motion/react"
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface FunnelGradientStop {
  offset: string | number
  color: string
}

export interface FunnelStage {
  label: string
  value: number
  displayValue?: string
  color?: string
  gradient?: FunnelGradientStop[]
}

export interface FunnelChartProps {
  data: FunnelStage[]
  orientation?: "horizontal" | "vertical"
  color?: string
  layers?: number
  className?: string
  style?: CSSProperties
  showPercentage?: boolean
  showValues?: boolean
  showLabels?: boolean
  hoveredIndex?: number | null
  onHoverChange?: (index: number | null) => void
  formatPercentage?: (pct: number) => string
  formatValue?: (value: number) => string
  staggerDelay?: number
  gap?: number
  renderPattern?: (id: string, color: string) => ReactNode
  edges?: "curved" | "straight"
  labelLayout?: "spread" | "grouped"
  labelOrientation?: "vertical" | "horizontal"
  labelAlign?: "center" | "start" | "end"
}

const fmtPct = (p: number) => `${Math.round(p)}%`
const fmtVal = (v: number) => v.toLocaleString("pt-BR")

function hSegmentPath(
  normStart: number,
  normEnd: number,
  segW: number,
  fullH: number,
  layerScale: number,
  straight = false
) {
  const middleY = fullH / 2
  const startHeight = normStart * fullH * 0.44 * layerScale
  const endHeight = normEnd * fullH * 0.44 * layerScale

  if (straight) {
    return `M 0 ${middleY - startHeight} L ${segW} ${middleY - endHeight} L ${segW} ${middleY + endHeight} L 0 ${middleY + startHeight} Z`
  }

  const curveX = segW * 0.55
  const top = `M 0 ${middleY - startHeight} C ${curveX} ${middleY - startHeight}, ${segW - curveX} ${middleY - endHeight}, ${segW} ${middleY - endHeight}`
  const bottom = `L ${segW} ${middleY + endHeight} C ${segW - curveX} ${middleY + endHeight}, ${curveX} ${middleY + startHeight}, 0 ${middleY + startHeight}`
  return `${top} ${bottom} Z`
}

function vSegmentPath(
  normStart: number,
  normEnd: number,
  segH: number,
  fullW: number,
  layerScale: number,
  straight = false
) {
  const middleX = fullW / 2
  const startWidth = normStart * fullW * 0.44 * layerScale
  const endWidth = normEnd * fullW * 0.44 * layerScale

  if (straight) {
    return `M ${middleX - startWidth} 0 L ${middleX - endWidth} ${segH} L ${middleX + endWidth} ${segH} L ${middleX + startWidth} 0 Z`
  }

  const curveY = segH * 0.55
  const left = `M ${middleX - startWidth} 0 C ${middleX - startWidth} ${curveY}, ${middleX - endWidth} ${segH - curveY}, ${middleX - endWidth} ${segH}`
  const right = `L ${middleX + endWidth} ${segH} C ${middleX + endWidth} ${segH - curveY}, ${middleX + startWidth} ${curveY}, ${middleX + startWidth} 0`
  return `${left} ${right} Z`
}

export function FunnelChart({
  data,
  orientation = "horizontal",
  color = "var(--chart-line-primary)",
  layers = 3,
  className,
  style,
  showPercentage = true,
  showValues = true,
  showLabels = true,
  hoveredIndex: hoveredIndexProp,
  onHoverChange,
  formatPercentage = fmtPct,
  formatValue = fmtVal,
  staggerDelay = 0.08,
  gap = 10,
  edges = "curved",
  labelLayout = "grouped",
  labelOrientation,
  labelAlign = "center",
}: FunnelChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [internalHoveredIndex, setInternalHoveredIndex] = useState<number | null>(null)

  const isControlled = hoveredIndexProp !== undefined
  const hoveredIndex = isControlled ? hoveredIndexProp : internalHoveredIndex

  const setHoveredIndex = useCallback(
    (index: number | null) => {
      if (isControlled) {
        onHoverChange?.(index)
      } else {
        setInternalHoveredIndex(index)
      }
    },
    [isControlled, onHoverChange]
  )

  useEffect(() => {
    const measure = () => {
      if (!ref.current) return
      const bounds = ref.current.getBoundingClientRect()
      setSize({ width: bounds.width, height: bounds.height })
    }

    measure()
    const observer = new ResizeObserver(measure)
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  if (!data.length) return null

  const first = data[0]
  if (!first) return null

  const max = Math.max(first.value, 1)
  const count = data.length
  const norms = data.map((stage) => stage.value / max)
  const horizontal = orientation === "horizontal"
  const width = size.width
  const height = size.height
  const segmentWidth = horizontal ? (width - gap * (count - 1)) / count : width
  const segmentHeight = horizontal ? height : (height - gap * (count - 1)) / count

  return (
    <div
      ref={ref}
      className={cn("relative w-full overflow-visible select-none", className)}
      style={{
        aspectRatio: horizontal ? "2.2 / 1" : "0.9 / 1.35",
        ...style,
      }}
    >
      {width > 0 && height > 0 ? (
        <div
          className={cn("absolute inset-0 flex", horizontal ? "flex-row" : "flex-col")}
          style={{ gap }}
        >
          {data.map((stage, index) => {
            const normStart = norms[index] ?? 0
            const normEnd = norms[Math.min(index + 1, count - 1)] ?? 0
            const stageColor = stage.gradient?.[0]?.color ?? stage.color ?? color
            const isHovered = hoveredIndex === index
            const isDimmed = hoveredIndex !== null && hoveredIndex !== index

            return (
              <motion.div
                key={stage.label}
                className="relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isDimmed ? 0.42 : 1, y: 0 }}
                transition={{
                  delay: index * staggerDelay,
                  duration: 0.28,
                  ease: "easeOut",
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  width: horizontal ? segmentWidth : width,
                  height: horizontal ? height : segmentHeight,
                  zIndex: isHovered ? 5 : 1,
                }}
              >
                <svg
                  className="absolute inset-0 h-full w-full overflow-visible"
                  viewBox={`0 0 ${horizontal ? segmentWidth : width} ${horizontal ? height : segmentHeight}`}
                  preserveAspectRatio="none"
                >
                  {Array.from({ length: layers }, (_, layerIndex) => {
                    const scale = 1 - (layerIndex / layers) * 0.32
                    const opacity = 0.16 + (layerIndex / Math.max(layers - 1, 1)) * 0.72
                    const d = horizontal
                      ? hSegmentPath(normStart, normEnd, segmentWidth, height, scale, edges === "straight")
                      : vSegmentPath(normStart, normEnd, segmentHeight, width, scale, edges === "straight")

                    return (
                      <path
                        key={`${stage.label}-${layerIndex}`}
                        d={d}
                        fill={stageColor}
                        opacity={opacity}
                      />
                    )
                  })}
                </svg>

                <div className="absolute inset-0">
                  <SegmentLabel
                    stage={stage}
                    pct={(stage.value / max) * 100}
                    isHorizontal={horizontal}
                    showLabels={showLabels}
                    showPercentage={showPercentage}
                    showValues={showValues}
                    formatPercentage={formatPercentage}
                    formatValue={formatValue}
                    layout={labelLayout}
                    orientation={labelOrientation}
                    align={labelAlign}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function SegmentLabel({
  stage,
  pct,
  isHorizontal,
  showValues,
  showPercentage,
  showLabels,
  formatPercentage,
  formatValue,
  layout,
  orientation,
  align,
}: {
  stage: FunnelStage
  pct: number
  isHorizontal: boolean
  showValues: boolean
  showPercentage: boolean
  showLabels: boolean
  formatPercentage: (value: number) => string
  formatValue: (value: number) => string
  layout: "spread" | "grouped"
  orientation?: "vertical" | "horizontal"
  align: "center" | "start" | "end"
}) {
  const displayValue = stage.displayValue ?? formatValue(stage.value)
  const stackOrientation = orientation ?? (isHorizontal ? "vertical" : "horizontal")
  const justify =
    align === "start" ? "justify-start" : align === "end" ? "justify-end" : "justify-center"
  const items =
    align === "start" ? "items-start" : align === "end" ? "items-end" : "items-center"

  return (
    <div
      className={cn(
        "flex h-full w-full px-[8%] py-[8%]",
        isHorizontal ? "flex-col" : "flex-row",
        justify,
        items
      )}
    >
      <div
        className={cn(
          "flex gap-2 text-center",
          layout === "spread"
            ? isHorizontal
              ? "flex-col"
              : "flex-row"
            : stackOrientation === "vertical"
              ? "flex-col"
              : "flex-row flex-wrap justify-center"
        )}
      >
        {showValues ? (
          <span className="whitespace-nowrap font-semibold text-sm text-chart-foreground">
            {displayValue}
          </span>
        ) : null}
        {showPercentage ? (
          <span className="rounded-full bg-white/90 px-3 py-1 font-bold text-[11px] text-black shadow-sm">
            {formatPercentage(pct)}
          </span>
        ) : null}
        {showLabels ? (
          <span className="max-w-[12rem] text-xs font-medium text-white/90">
            {stage.label}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export default FunnelChart
