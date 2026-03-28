import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type OrderConfirmationLabels = {
  orderId: string
  paymentMethod: string
  dateTime: string
  total: string
  product: string
}

interface OrderConfirmationCardProps {
  orderId: string
  paymentMethod: string
  dateTime: string
  totalAmount: string
  onGoToAccount: () => void
  description?: string
  productName?: string
  productVariant?: string
  labels?: Partial<OrderConfirmationLabels>
  countdownText?: string
  buttonVisible?: boolean
  borderRadius?: string
  surfaceColor?: string
  borderColor?: string
  textColor?: string
  mutedColor?: string
  accentColor?: string
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
  description,
  productName,
  productVariant,
  labels,
  countdownText,
  buttonVisible = true,
  borderRadius = "16px",
  surfaceColor,
  borderColor,
  textColor,
  mutedColor,
  accentColor,
  title = "Your order has been successfully submitted",
  buttonText = "Go to my account",
  icon = <CheckCircle2 className="h-12 w-12 text-green-500" />,
  className,
}: OrderConfirmationCardProps) {
  const resolvedLabels: OrderConfirmationLabels = {
    orderId: labels?.orderId ?? "Order ID",
    paymentMethod: labels?.paymentMethod ?? "Payment Method",
    dateTime: labels?.dateTime ?? "Date & Time",
    total: labels?.total ?? "Total",
    product: labels?.product ?? "Product",
  }

  const details = [
    { label: resolvedLabels.orderId, value: orderId },
    { label: resolvedLabels.paymentMethod, value: paymentMethod },
    { label: resolvedLabels.dateTime, value: dateTime },
    { label: resolvedLabels.total, value: totalAmount, isBold: true },
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
        style={{
          borderRadius,
          backgroundColor: surfaceColor,
          borderColor,
          color: textColor,
        }}
      >
        <div className="flex flex-col items-center space-y-6 text-center">
          <motion.div variants={itemVariants}>{icon}</motion.div>

          <motion.h2 variants={itemVariants} className="text-2xl font-semibold">
            {title}
          </motion.h2>

          {description ? (
            <motion.p
              variants={itemVariants}
              className="max-w-[28rem] text-sm leading-6"
              style={{ color: mutedColor ?? textColor }}
            >
              {description}
            </motion.p>
          ) : null}

          <motion.div variants={itemVariants} className="w-full space-y-4 pt-4">
            {details.map((item, index) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-start justify-between gap-4 border-b pb-4 text-left text-sm",
                  index === details.length - 1 && "border-none pb-0",
                )}
                style={{
                  borderColor,
                  color: item.isBold ? textColor : mutedColor ?? textColor,
                }}
              >
                <span className="shrink-0">{item.label}</span>
                <span
                  className={cn(
                    "max-w-[60%] break-words text-right",
                    item.isBold && "text-lg font-bold"
                  )}
                  style={{ color: textColor }}
                >
                  {item.value}
                </span>
              </div>
            ))}

            {productName ? (
              <div
                className="flex items-start justify-between gap-4 border-t pt-4 text-left text-sm"
                style={{ borderColor, color: mutedColor ?? textColor }}
              >
                <span className="shrink-0">{resolvedLabels.product}</span>
                <div className="max-w-[60%] text-right">
                  <p className="break-words font-semibold" style={{ color: textColor }}>
                    {productName}
                  </p>
                  {productVariant ? (
                    <p className="mt-1 break-words text-xs" style={{ color: mutedColor ?? textColor }}>
                      {productVariant}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </motion.div>

          {buttonVisible ? (
            <motion.div variants={itemVariants} className="w-full pt-4">
              <Button
                onClick={onGoToAccount}
                className="h-12 w-full text-md"
                size="lg"
                style={{
                  borderRadius,
                  backgroundColor: accentColor,
                  color: "#ffffff",
                }}
              >
                {buttonText}
              </Button>
            </motion.div>
          ) : null}

          {countdownText ? (
            <motion.p
              variants={itemVariants}
              className="text-xs leading-5"
              style={{ color: mutedColor ?? textColor }}
            >
              {countdownText}
            </motion.p>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
