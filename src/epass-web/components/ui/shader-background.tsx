"use client"

import { GrainGradient } from "@paper-design/shaders-react"

export function GradientBackground() {
  return (
    <div className="absolute inset-0 -z-10 bg-black">
      <div className="w-full h-full animate-in fade-in duration-700 fill-mode-both transition-all">
        <GrainGradient
          style={{ height: "100%", width: "100%" }}
          colorBack="hsl(0, 0%, 0%)"
          softness={0.76}
          intensity={0.45}
          noise={0}
          shape="corners"
          offsetX={0}
          offsetY={0}
          scale={1}
          rotation={0}
          speed={1}
          colors={[
              "hsl(167, 59%, 14%)",
              "hsl(67, 87%, 59%)",
          ]}
        />
      </div>
    </div>
  )
}