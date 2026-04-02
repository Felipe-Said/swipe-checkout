import * as React from "react"

import { RouteTransitionTemplate } from "@/components/layout/route-transition-template"

export default function CheckoutTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  return <RouteTransitionTemplate mode="checkout">{children}</RouteTransitionTemplate>
}
