"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value?: number }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <div
        className="bg-primary h-full w-full flex-1 transition-all duration-300 ease-in-out"
        style={{ width: `${value || 0}%` }}
      />
    </div>
  )
}

export { Progress }
