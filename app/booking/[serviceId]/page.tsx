
"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { add, format, set, parseISO } from 'date-fns'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tag, Clock, DollarSign, User, Info, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

// Combined type for service and its provider
interface ServiceWithProvider {
  id: string
  title: string
  description: string | null
  category: string
  price: number
  duration_minutes: number
  provider_id: string // Need provider_id for booking
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

export default function BookingPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const serviceId = params.serviceId as string

  const [service, setService] = useState<ServiceWithProvider | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBooking, setIsBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch service details on component mount
  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!serviceId) return
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("services")
          .select(`
            id, title, description, category, price, duration_minutes, provider_id,
            profiles (full_name, avatar_url)
          `)
          .eq("id", serviceId)
          .single()

        if (error) throw error
        setService(data as ServiceWithProvider)
      } catch (err: any) {
        setError("Failed to load service details.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchServiceDetails()
  }, [serviceId])

  // Generate time slots when date or service changes
  useEffect(() => {
    if (!selectedDate || !service) return

    const generateSlots = async () => {
      const duration = service.duration_minutes
      const dayStart = set(selectedDate, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 })
      const dayEnd = set(selectedDate, { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 })
      const slots = []
      
      let currentTime = dayStart
      while (add(currentTime, { minutes: duration }) <= dayEnd) {
        slots.push(format(currentTime, "HH:mm"))
        currentTime = add(currentTime, { minutes: 30 }) // Generate slots every 30 mins for simplicity
      }

      // In a real app, you would also fetch existing bookings for this provider on this day
      // and filter out the slots that are already taken.
      setAvailableSlots(slots)
    }

    generateSlots()
  }, [selectedDate, service])

  const handleBooking = async () => {
    if (!service || !selectedDate || !selectedTime) {
      setError("Please select a date and time to book.")
      return
    }

    setIsBooking(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Redirect to login but remember where to come back to
        router.push(`/auth/login?redirect=/booking/${serviceId}`)
        return
      }

      const startTime = set(selectedDate, {
        hours: parseInt(selectedTime.split(":")[0]),
        minutes: parseInt(selectedTime.split(":")[1]),
        seconds: 0,
      });
      const endTime = add(startTime, { minutes: service.duration_minutes })

      const { error: bookingError } = await supabase.from("bookings").insert({
        customer_id: user.id,
        provider_id: service.provider_id,
        service_id: service.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'confirmed', 
        total_price: service.price,
      })

      if (bookingError) {
        throw bookingError
      }

      // Redirect to a confirmation page or user's bookings list
      router.push("/dashboard/bookings?status=new")

    } catch (err: any) {
      console.error("Booking Error:", err)
      setError(err.message || "An unexpected error occurred during booking.")
    } finally {
      setIsBooking(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (error && !service) {
     return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="link" asChild className="mt-4">
            <Link href="/services">Go back to marketplace</Link>
        </Button>
      </div>
    )
  }

  if (!service) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
        <div className="container mx-auto px-4 py-6">
            <Button variant="ghost" asChild className="mb-4">
                <Link href="/services">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Services
                </Link>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Confirm Your Booking</h1>
            <p className="text-gray-600">You are one step away from booking your service.</p>
        </div>

        <div className="container mx-auto px-4 grid lg:grid-cols-3 gap-8">
            {/* Left Column: Calendar & Time */}
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Select a Date</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                            className="rounded-md border"
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>2. Select a Time</CardTitle>
                        <CardDescription>Available slots for {selectedDate ? format(selectedDate, 'PPP') : '...'}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                        {availableSlots.length > 0 ? availableSlots.map(time => (
                            <Button 
                                key={time}
                                variant={selectedTime === time ? 'default' : 'outline'}
                                onClick={() => setSelectedTime(time)}>
                                {time}
                            </Button>
                        )) : <p className="col-span-full text-center text-gray-500">No available slots for this day.</p>}
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Service Summary & Confirmation */}
            <div className="lg:col-span-1">
                 <Card className="sticky top-24">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                                <AvatarImage src={service.profiles?.avatar_url || undefined} />
                                <AvatarFallback>{service.profiles?.full_name?.charAt(0) || 'P'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-xl">{service.title}</CardTitle>
                                <CardDescription>by {service.profiles?.full_name}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex items-center justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>${service.price}</span>
                        </div>
                        <div className="border-t pt-4 space-y-3 text-sm">
                             <div className="flex items-start"><Clock className="h-4 w-4 mr-2 mt-0.5 text-gray-600"/><span>{service.duration_minutes} minutes</span></div>
                            {selectedDate && <div className="flex items-start"><Calendar className="h-4 w-4 mr-2 mt-0.5 text-gray-600"/><span>{format(selectedDate, 'E, d MMM yyyy')}</span></div>}
                            {selectedTime && <div className="flex items-start font-bold text-primary"><Clock className="h-4 w-4 mr-2 mt-0.5"/><span>{selectedTime}</span></div>}
                        </div>
                         {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                    <div className="p-4 border-t">
                        <Button size="lg" className="w-full" onClick={handleBooking} disabled={isBooking || !selectedTime || !selectedDate}>
                            {isBooking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking...</> : 'Confirm & Book'}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    </div>
  )
}

