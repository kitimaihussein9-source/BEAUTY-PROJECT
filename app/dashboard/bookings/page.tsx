
"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { format, parseISO } from 'date-fns'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, User, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"

// This type is flexible to hold info for both customer and provider views
interface BookingDetails {
  id: string
  start_time: string
  end_time: string
  status: string
  total_price: number
  service: {
    title: string
    duration_minutes: number
  }
  // Depending on the user role, we get either the provider or the customer
  provider?: {
    full_name: string | null
    avatar_url: string | null
  }
  customer?: {
    full_name: string | null
    avatar_url: string | null
  }
}

function BookingsComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [bookings, setBookings] = useState<BookingDetails[]>([])
  const [userRole, setUserRole] = useState<'customer' | 'provider' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isNewBooking = searchParams.get('status') === 'new'

  useEffect(() => {
    const fetchUserAndBookings = async () => {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError || !profile) throw new Error("Could not fetch user profile.")
        setUserRole(profile.role as 'customer' | 'provider')
        
        let query
        if (profile.role === 'provider') {
          query = supabase
            .from('bookings')
            .select(`
              id, start_time, end_time, status, total_price,
              service:services(title, duration_minutes),
              customer:profiles!bookings_customer_id_fkey(full_name, avatar_url)
            `)
            .eq('provider_id', user.id)
        } else {
          query = supabase
            .from('bookings')
            .select(`
              id, start_time, end_time, status, total_price,
              service:services(title, duration_minutes),
              provider:profiles!bookings_provider_id_fkey(full_name, avatar_url)
            `)
            .eq('customer_id', user.id)
        }

        const { data: bookingsData, error: bookingsError } = await query
            .order('start_time', { ascending: false })

        if (bookingsError) throw bookingsError

        setBookings(bookingsData as any)

      } catch (err: any) {
        console.error("Error fetching bookings:", err)
        setError("Failed to load your bookings.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserAndBookings()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600">View your upcoming and past appointments.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {isNewBooking && (
            <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Booking Confirmed!</AlertTitle>
                <AlertDescription>
                    Your appointment has been successfully scheduled. You can see the details below.
                </AlertDescription>
            </Alert>
        )}

        {isLoading ? (
          <div className="text-center py-12"><p>Loading bookings...</p></div>
        ) : error ? (
          <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
             <h3 className="text-xl font-semibold text-gray-800">No Bookings Yet</h3>
             <p className="text-gray-500 mt-2">You haven't {userRole === 'provider' ? 'received any' : 'made any'} bookings.</p>
             {userRole === 'customer' && 
                <Button asChild className="mt-4"><Link href="/services">Book a Service</Link></Button>
             }
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking, index) => {
              const partner = userRole === 'provider' ? booking.customer : booking.provider
              const startTime = parseISO(booking.start_time)

              return (
                <Card key={booking.id} className={`${isNewBooking && index === 0 ? 'border-green-400 border-2' : ''}`}>
                  <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                      <CardTitle>{booking.service.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4 pt-2">
                        <div className="flex items-center"><Calendar className="h-4 w-4 mr-1.5"/> {format(startTime, 'E, d MMM yyyy')}</div>
                        <div className="flex items-center"><Clock className="h-4 w-4 mr-1.5"/> {format(startTime, 'p')}</div>
                      </CardDescription>
                    </div>
                    <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize">{booking.status}</Badge>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={partner?.avatar_url || undefined} />
                            <AvatarFallback>{partner?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-sm">{userRole === 'provider' ? 'Customer' : 'Provider'}</p>
                            <p className="text-sm text-gray-600">{partner?.full_name}</p>
                        </div>
                     </div>
                     <div>
                        <p className="text-lg font-bold">${booking.total_price}</p>
                     </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Use Suspense to handle the query parameter
export default function BookingsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BookingsComponent />
        </Suspense>
    )
}
