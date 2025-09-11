"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Lock, Phone } from "lucide-react"
import { formatCurrency, calculateServiceFee, calculateTotal } from "@/lib/payment"

interface PaymentFormProps {
  servicePrice: number
  serviceName: string
  providerName: string
  onPaymentSubmit: (paymentData: any) => Promise<void>
  isLoading?: boolean
}

export function PaymentForm({
  servicePrice,
  serviceName,
  providerName,
  onPaymentSubmit,
  isLoading = false,
}: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mobile">("mobile")
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    mobileNumber: "0614103439", // Default to the specified number
    mobileProvider: "mpesa",
  })

  const serviceFee = calculateServiceFee(servicePrice)
  const totalAmount = calculateTotal(servicePrice)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onPaymentSubmit({
      paymentMethod,
      ...formData,
      amount: totalAmount,
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-green-600" />
          Secure Payment
        </CardTitle>
        <CardDescription>Complete your booking payment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Summary */}
        <div className="space-y-3">
          <h3 className="font-medium">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{serviceName}</span>
              <span>{formatCurrency(servicePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Provider: {providerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Service fee</span>
              <span>{formatCurrency(serviceFee)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <h3 className="font-medium">Payment Method</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={paymentMethod === "mobile" ? "default" : "outline"}
              onClick={() => setPaymentMethod("mobile")}
              className="flex items-center gap-2"
            >
              <Phone className="h-4 w-4" />
              Mobile Money
            </Button>
            <Button
              type="button"
              variant={paymentMethod === "card" ? "default" : "outline"}
              onClick={() => setPaymentMethod("card")}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Card
            </Button>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {paymentMethod === "mobile" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  placeholder="0614103439"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-xs text-gray-500">You'll receive a payment prompt on your phone</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  name="cardholderName"
                  placeholder="John Doe"
                  value={formData.cardholderName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  name="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    name="expiryDate"
                    placeholder="MM/YY"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    name="cvv"
                    placeholder="123"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : `Pay ${formatCurrency(totalAmount)}`}
          </Button>
        </form>

        <div className="text-xs text-gray-500 text-center">
          <Lock className="h-3 w-3 inline mr-1" />
          Your payment information is secure and encrypted
        </div>
      </CardContent>
    </Card>
  )
}
