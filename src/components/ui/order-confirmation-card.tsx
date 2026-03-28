import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface OrderConfirmationCardProps {
  orderId: string
  paymentMethod: string
  dateTime: string
  totalAmount: string
  onGoToAccount: () => void
  title?: string
  buttonText?: string
  icon?: React.ReactNode
  className?: string
}

export function OrderConfirmationCard({
  orderId,
  paymentMethod,
  dateTime,
  totalAmount,
  onGoToAccount,
  title = "Your order has been successfully submitted",
  buttonText = "Go to my account",
  icon = <CheckCircle2 className="h-12 w-12 text-green-500" />,
  className,
}: OrderConfirmationCardProps) {
  const details = [
    { label: "Order ID", value: orderId },
    { label: "Payment Method", value: paymentMethod },
    { label: "Date & Time", value: dateTime },
    { label: "Total", value: totalAmount, isBold: true },
  ]

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
          duration: 0.4,
          ease: "easeInOut" as const,
          staggerChildren: 0.1,
        },
      },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } },
  }

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        aria-live="polite"
        className={cn(
          "w-full max-w-sm rounded-xl border bg-card p-6 text-card-foreground shadow-lg sm:p-8",
          className
        )}
      >
        <div className="flex flex-col items-center space-y-6 text-center">
          <motion.div variants={itemVariants}>{icon}</motion.div>

          <motion.h2 variants={itemVariants} className="text-2xl font-semibold">
            {title}
          </motion.h2>

          <motion.div variants={itemVariants} className="w-full space-y-4 pt-4">
            {details.map((item, index) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-center justify-between border-b pb-4 text-sm text-muted-foreground",
                  index === details.length - 1 && "border-none pb-0",
                  item.isBold && "font-bold text-card-foreground"
                )}
              >
                <span>{item.label}</span>
                <span className={cn(item.isBold && "text-lg")}>{item.value}</span>
              </div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="w-full pt-4">
            <Button onClick={onGoToAccount} className="h-12 w-full text-md" size="lg">
              {buttonText}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
