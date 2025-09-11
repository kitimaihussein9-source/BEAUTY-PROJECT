"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

interface PaymentStatusProps {
  status: "pending" | "paid" | "failed" | "refunded"
  className?: string
}

export function PaymentStatus({ status, className }: PaymentStatusProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      label: "Pending",
      variant: "secondary" as const,
      color: "text-yellow-600",
    },
    paid: {
      icon: CheckCircle,
      label: "Paid",
      variant: "default" as const,
      color: "text-green-600",
    },
    failed: {
      icon: XCircle,
      label: "Failed",
      variant: "destructive" as const,
      color: "text-red-600",
    },
    refunded: {
      icon: AlertCircle,
      label: "Refunded",
      variant: "outline" as const,
      color: "text-blue-600",
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={className}>
      <Icon className={`h-3 w-3 mr-1 ${config.color}`} />
      {config.label}
    </Badge>
  )
}
