import * as React from "react"

import { RouteTransitionTemplate } from "@/components/layout/route-transition-template"

export default function PricingTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  return <RouteTransitionTemplate mode="auth">{children}</RouteTransitionTemplate>
}
