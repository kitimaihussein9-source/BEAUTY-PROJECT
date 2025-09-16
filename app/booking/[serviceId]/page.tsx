
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { paymentConfig } from "@/lib/config"
import { Clock, User, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Service {
  id: string
  title: string
  description: string
  price: number
  duration_minutes: number
  category: string
  provider_id: string
  profiles: {
    full_name: string
    phone: string
  }
}

export default function BookingPage({ params }: { params: Promise<{ serviceId: string }> }) {
  const [serviceId, setServiceId] = useState<string>("")
  const [service, setService] = useState<Service | null>(null)
  const [user, setUser] = useState<any>(null)
  const [step, setStep] = useState<"details" | "payment" | "confirmation">("details")
  const [isLoading, setIsLoading] = useState(false)
  const [bookingData, setBookingData] = useState({
    appointmentDate: "",
    appointmentTime: "",
    notes: "",
  })
  const [customerPhone, setCustomerPhone] = useState("");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setServiceId(resolvedParams.serviceId)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (serviceId) {
      fetchService()
      checkAuth()
    }
  }, [serviceId])

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }
    setUser(user)
  }

  const fetchService = async () => {
    const { data, error } = await supabase
      .from("services")
      .select(`
        *,
        profiles (full_name, phone)
      `)
      .eq("id", serviceId)
      .single()

    if (error) {
      console.error("Error fetching service:", error)
      return
    }

    setService(data)
  }

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingData.appointmentDate || !bookingData.appointmentTime) {
      alert("Please select date and time")
      return
    }
    setStep("payment")
  }

  const handlePaymentSubmit = async () => {
    if (!service || !user) return;

    setIsLoading(true);
    try {
      // 1. Initiate Payment via your new API route
      const response = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: service.price,
          customerPhone,
          appointmentId: `appt_${service.id}_${Date.now()}`,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to initiate payment.");
      }

      setTransactionId(result.transactionId);

      // 2. Create appointment in the database with 'pending' status
      const appointmentDateTime = new Date(`${bookingData.appointmentDate}T${bookingData.appointmentTime}`);
      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert({
          customer_id: user.id,
          provider_id: service.provider_id,
          service_id: service.id,
          appointment_date: appointmentDateTime.toISOString(),
          total_amount: service.price,
          payment_status: "pending", // IMPORTANT: Status is now pending
          payment_id: result.transactionId, // Store the simulated transaction ID
          notes: bookingData.notes,
          status: "pending", // Overall appointment status
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create appointment: ${error.message}`);
      }

      // 3. Move to confirmation screen
      setPaymentResult({ success: true, appointment });
      setStep("confirmation");

    } catch (error) {
      console.error("Booking Error:", error);
      setPaymentResult({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!service) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/services">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Services
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Book Service</h1>
          <p className="text-gray-600">Complete your booking for {service.title}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Service Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>{service.title}</CardTitle>
                <CardDescription>with {service.profiles.full_name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  {service.duration_minutes} minutes
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  {service.profiles.full_name}
                </div>
                <div className="text-2xl font-bold text-pink-600">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: paymentConfig.currency }).format(service.price)}
                </div>
                <p className="text-sm text-gray-600">{service.description}</p>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            {step === "details" && (
              <Card>
                <CardHeader>
                  <CardTitle>Booking Details</CardTitle>
                  <CardDescription>Select your preferred date and time</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBookingSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="appointmentDate">Preferred Date</Label>
                        <Input
                          id="appointmentDate"
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={bookingData.appointmentDate}
                          onChange={(e) =>
                            setBookingData((prev) => ({
                              ...prev,
                              appointmentDate: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="appointmentTime">Preferred Time</Label>
                        <Input
                          id="appointmentTime"
                          type="time"
                          value={bookingData.appointmentTime}
                          onChange={(e) =>
                            setBookingData((prev) => ({
                              ...prev,
                              appointmentTime: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Special Requests (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any special requests or notes for the provider..."
                        value={bookingData.notes}
                        onChange={(e) =>
                          setBookingData((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Continue to Payment
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {step === "payment" && (
              <Card>
                <CardHeader>
                  <CardTitle>Confirm Payment</CardTitle>
                  <CardDescription>
                     Enter your phone number to initiate the mobile money payment.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="customerPhone">Your Halopesa Number</Label>
                            <Input
                                id="customerPhone"
                                type="tel"
                                placeholder="e.g., 0612345678"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                required
                            />
                        </div>
                        <Button onClick={handlePaymentSubmit} disabled={isLoading || !customerPhone} className="w-full">
                            {isLoading ? "Processing..." : `Pay ${new Intl.NumberFormat('en-US', { style: 'currency', currency: paymentConfig.currency }).format(service.price)}`}
                        </Button>
                    </div>
                </CardContent>
              </Card>
            )}

            {step === "confirmation" && (
              <Card>
                <CardHeader>
                  <CardTitle className={paymentResult?.success ? "text-green-600" : "text-red-600"}>
                    {paymentResult?.success ? "Payment Initiated!" : "Booking Failed"}
                  </CardTitle>
                  <CardDescription>
                    {paymentResult?.success
                      ? "Your booking is pending. Please complete the payment on your phone."
                      : "There was an issue with your booking."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentResult?.success ? (
                    <>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h3 className="font-medium text-green-800 mb-2">Next Steps</h3>
                        <p className="text-sm text-green-700">
                          A payment request has been sent to your phone. Please authorize the payment of
                          <strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: paymentConfig.currency }).format(service.price)} </strong>
                           to complete your booking.
                        </p>
                        <p className="text-sm text-green-700 mt-2">
                          Your Transaction ID is: <strong>{transactionId}</strong>
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <Button asChild>
                          <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href="/services">Book Another Service</Link>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-red-700">{paymentResult?.error}</p>
                      </div>
                      <div className="flex gap-4">
                        <Button onClick={() => setStep("payment")}>Try Again</Button>
                        <Button variant="outline" asChild>
                          <Link href="/services">Back to Services</Link>
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
