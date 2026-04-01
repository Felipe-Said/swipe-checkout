"use client"

import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react"

export function SidebarShaderBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
      <ShaderGradientCanvas
        className="h-full w-full"
        pointerEvents="none"
        pixelDensity={1}
        fov={45}
        lazyLoad
        threshold={0.1}
        rootMargin="100px"
        powerPreference="low-power"
      >
        <ShaderGradient
          animate="on"
          brightness={1.2}
          cAzimuthAngle={180}
          cDistance={3.6}
          cPolarAngle={90}
          cameraZoom={1}
          color1="#ff5005"
          color2="#dbba95"
          color3="#d0bce1"
          envPreset="city"
          grain="on"
          lightType="3d"
          positionX={-1.4}
          positionY={0}
          positionZ={0}
          range="disabled"
          rangeEnd={40}
          rangeStart={0}
          reflection={0.1}
          rotationX={0}
          rotationY={10}
          rotationZ={50}
          shader="defaults"
          type="plane"
          uAmplitude={1}
          uDensity={1.3}
          uFrequency={5.5}
          uSpeed={0.4}
          uStrength={4}
          uTime={0}
          wireframe={false}
        />
      </ShaderGradientCanvas>
      <div className="pointer-events-none absolute inset-0 bg-black/20" />
    </div>
  )
}
