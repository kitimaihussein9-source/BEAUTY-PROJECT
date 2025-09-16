
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { add, format, set, parseISO, startOfDay, endOfDay, getDay, parse } from 'date-fns'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Clock, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

// Combined type for service and its provider
interface ServiceWithProvider {
  id: string
  title: string
  description: string | null
  price: number
  duration_minutes: number
  provider_id: string
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
  const [isFetchingSlots, setIsFetchingSlots] = useState(false)
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
          .select(`id, title, description, price, duration_minutes, provider_id, profiles (full_name, avatar_url)`)
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

  // Generate available time slots when date or service changes
  useEffect(() => {
    if (!selectedDate || !service) return

    const generateAndFilterSlots = async () => {
      setIsFetchingSlots(true)
      setSelectedTime(null)
      setError(null)
      setAvailableSlots([])

      try {
        const dayOfWeek = getDay(selectedDate) // Sunday = 0, Monday = 1, etc.

        // 1. Fetch provider's availability for the selected day of the week
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('provider_availability')
          .select('start_time, end_time, is_available')
          .eq('provider_id', service.provider_id)
          .eq('day_of_week', dayOfWeek)
          .single()
        
        if (availabilityError) {
            console.warn(`No custom availability set for provider ${service.provider_id} on day ${dayOfWeek}. Using defaults.`)
        }

        // If provider is not available on this day, show no slots
        if (!availabilityData || !availabilityData.is_available) {
            return; // No need to proceed
        }

        // 2. Fetch existing bookings for the provider on the selected date
        const from = startOfDay(selectedDate).toISOString()
        const to = endOfDay(selectedDate).toISOString()
        const { data: existingBookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('start_time, end_time')
            .eq('provider_id', service.provider_id)
            .gte('start_time', from)
            .lte('start_time', to)

        if (bookingsError) throw bookingsError

        const bookedIntervals = existingBookings.map(b => ({
            start: parseISO(b.start_time),
            end: parseISO(b.end_time),
        }))

        // 3. Generate potential slots based on provider's custom hours
        const duration = service.duration_minutes
        const interval = 30 // Generate slots every 30 mins

        // Parse the time from 'HH:MM:SS' string to a Date object
        const baseDate = selectedDate
        const startTime = parse(availabilityData.start_time, 'HH:mm:ss', baseDate)
        const endTime = parse(availabilityData.end_time, 'HH:mm:ss', baseDate)
        
        const dayStart = set(selectedDate, { hours: startTime.getHours(), minutes: startTime.getMinutes() })
        const dayEnd = set(selectedDate, { hours: endTime.getHours(), minutes: endTime.getMinutes() })

        const potentialSlots = []
        let currentTime = dayStart
        while (currentTime < dayEnd) {
          potentialSlots.push(currentTime)
          currentTime = add(currentTime, { minutes: interval })
        }

        // 4. Filter out slots that conflict with existing bookings or don't have enough time
        const filteredSlots = potentialSlots.filter(slotStart => {
            const slotEnd = add(slotStart, { minutes: duration })
            if (slotEnd > dayEnd) return false

            const isOverlapping = bookedIntervals.some(booked => 
                slotStart < booked.end && slotEnd > booked.start
            )
            return !isOverlapping
        })
        
        setAvailableSlots(filteredSlots.map(date => format(date, "HH:mm")))

      } catch (err: any) {
        console.error("Error generating slots:", err)
        setError("Could not verify available time slots. Please refresh and try again.")
      } finally {
        setIsFetchingSlots(false)
      }
    }

    generateAndFilterSlots()
  }, [selectedDate, service, supabase])

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
        router.push(`/auth/login?redirect=/booking/${serviceId}`)
        return
      }

      const startTime = set(selectedDate, {
        hours: parseInt(selectedTime.split(":")[0]),
        minutes: parseInt(selectedTime.split(":")[1]),
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

      if (bookingError) throw bookingError

      router.push("/dashboard/bookings?status=new")

    } catch (err: any) {
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
        </div>

        <div className="container mx-auto px-4 grid lg:grid-cols-3 gap-8">
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
                            disabled={(date) => date < startOfDay(new Date())}
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
                        {isFetchingSlots ? (
                           <div className="col-span-full flex items-center justify-center py-4">
                               <Loader2 className="h-6 w-6 animate-spin text-primary" /> 
                           </div>
                        ) : availableSlots.length > 0 ? availableSlots.map(time => (
                            <Button 
                                key={time}
                                variant={selectedTime === time ? 'default' : 'outline'}
                                onClick={() => setSelectedTime(time)}>
                                {time}
                            </Button>
                        )) : <p className="col-span-full text-center text-gray-500 py-4">This provider is not available on this day.</p>}
                    </CardContent>
                </Card>
            </div>

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
                        <Button size="lg" className="w-full" onClick={handleBooking} disabled={isBooking || !selectedTime || !selectedDate || isFetchingSlots}>
                            {isBooking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking...</> : 'Confirm & Book'}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    </div>
  )
}
