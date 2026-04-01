"use client"

import { cn } from "@/lib/utils"
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react"

const shaderProps = {
  animate: "on",
  axesHelper: "on",
  bgColor1: "#000000",
  bgColor2: "#000000",
  brightness: 1.2,
  cAzimuthAngle: 180,
  cDistance: 2.4,
  cPolarAngle: 95,
  cameraZoom: 1,
  color1: "#ff6a1a",
  color2: "#c73c00",
  color3: "#FD4912",
  destination: "onCanvas",
  embedMode: "off",
  envPreset: "city",
  format: "gif",
  fov: 45,
  frameRate: 10,
  gizmoHelper: "hide",
  grain: "off",
  lightType: "3d",
  pixelDensity: 1,
  positionX: 0,
  positionY: -2.1,
  positionZ: 0,
  range: "enabled",
  rangeEnd: 40,
  rangeStart: 0,
  reflection: 0.1,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 225,
  shader: "defaults",
  type: "waterPlane",
  uAmplitude: 0,
  uDensity: 1.8,
  uFrequency: 5.5,
  uSpeed: 0.3,
  uStrength: 3,
  uTime: 0.2,
  wireframe: false,
} as any

export function SidebarShaderBackground({
  className,
  canvasClassName,
}: {
  className?: string
  canvasClassName?: string
}) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden rounded-[inherit]", className)}>
      <ShaderGradientCanvas
        className={cn("h-full w-full", canvasClassName)}
        pointerEvents="none"
        pixelDensity={1}
        fov={45}
        lazyLoad
        threshold={0.1}
        rootMargin="100px"
        powerPreference="low-power"
      >
        <ShaderGradient {...shaderProps} />
      </ShaderGradientCanvas>
      <div className="pointer-events-none absolute inset-0 bg-black/20" />
    </div>
  )
}
