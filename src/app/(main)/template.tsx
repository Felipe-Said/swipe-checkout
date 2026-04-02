import * as React from "react"

import { RouteTransitionTemplate } from "@/components/layout/route-transition-template"

export default function MainTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  return <RouteTransitionTemplate mode="page">{children}</RouteTransitionTemplate>
}
