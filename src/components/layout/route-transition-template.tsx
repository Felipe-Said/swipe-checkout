"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion"

export function RouteTransitionTemplate({
  children,
  mode = "page",
}: {
  children: React.ReactNode
  mode?: "page" | "checkout" | "auth"
}) {
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()
  const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number]
  const easeIn = [0.4, 0, 1, 1] as [number, number, number, number]

  const variants = React.useMemo<Variants>(() => {
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      }
    }

    if (mode === "checkout") {
      return {
        initial: { opacity: 0, y: 18, filter: "blur(10px)" },
        animate: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.42, ease: easeOut },
        },
        exit: {
          opacity: 0,
          y: -10,
          filter: "blur(8px)",
          transition: { duration: 0.22, ease: easeIn },
        },
      }
    }

    if (mode === "auth") {
      return {
        initial: { opacity: 0, y: 14 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.34, ease: easeOut },
        },
        exit: {
          opacity: 0,
          y: -8,
          transition: { duration: 0.18, ease: easeIn },
        },
      }
    }

    return {
      initial: { opacity: 0, y: 12, scale: 0.995, filter: "blur(8px)" },
      animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        transition: { duration: 0.32, ease: easeOut },
      },
      exit: {
        opacity: 0,
        y: -8,
        scale: 0.997,
        filter: "blur(6px)",
        transition: { duration: 0.18, ease: easeIn },
      },
    }
  }, [easeIn, easeOut, mode, prefersReducedMotion])

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        className="min-h-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
