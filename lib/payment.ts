// Payment processing utilities
export interface PaymentDetails {
  amount: number
  currency: string
  description: string
  customerPhone: string
  customerEmail: string
  appointmentId: string
}

export interface PaymentResult {
  success: boolean
  paymentId?: string
  error?: string
}

// Mock payment processor - replace with real payment gateway
export async function processPayment(details: PaymentDetails): Promise<PaymentResult> {
  // Simulate payment processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Mock payment logic - in real implementation, integrate with payment gateway
  const isSuccessful = Math.random() > 0.1 // 90% success rate for demo

  if (isSuccessful) {
    return {
      success: true,
      paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  } else {
    return {
      success: false,
      error: "Payment failed. Please try again.",
    }
  }
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount)
}

export function calculateServiceFee(amount: number): number {
  // 3% service fee
  return Math.round(amount * 0.03 * 100) / 100
}

export function calculateTotal(servicePrice: number): number {
  const serviceFee = calculateServiceFee(servicePrice)
  return servicePrice + serviceFee
}
