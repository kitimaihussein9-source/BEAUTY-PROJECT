
"use client"

import type React from "react"
import { useState, useEffect, Suspense, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { format, parseISO, isFuture } from 'date-fns'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Calendar, CheckCircle, Clock, Loader2, XCircle } from "lucide-react"
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
  const { toast } = useToast()

  const [bookings, setBookings] = useState<BookingDetails[]>([])
  const [userRole, setUserRole] = useState<'customer' | 'provider' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useTransition()
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null)

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
              customer:profiles!bookings_customer_id_fkey(full_name, avatar_url, email)
            `)
            .eq('provider_id', user.id)
        } else {
          query = supabase
            .from('bookings')
            .select(`
              id, start_time, end_time, status, total_price,
              service:services(title, duration_minutes),
              provider:profiles!bookings_provider_id_fkey(full_name, avatar_url, email)
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
  }, [router, supabase])

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return

    setIsCancelling(async () => {
        const { error: updateError } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingToCancel)

        if (updateError) {
            toast({
                title: "Cancellation Failed",
                description: updateError.message,
                variant: "destructive",
            })
        } else {
            setBookings(currentBookings => 
                currentBookings.map(b => b.id === bookingToCancel ? { ...b, status: 'cancelled'} : b)
            )
            toast({
                title: "Booking Cancelled",
                description: "The appointment has been successfully cancelled.",
            })

            // Trigger the notification function
            const { error: functionError } = await supabase.functions.invoke('booking-notification', {
                body: { type: 'cancelled', bookingId: bookingToCancel },
            });
            if (functionError) {
                console.error("Failed to send cancellation email:", functionError);
            }
        }
        setBookingToCancel(null)
    });
  }

  const getStatusBadgeVariant = (status: string) => {
      switch (status) {
          case 'confirmed': return 'default'
          case 'cancelled': return 'destructive'
          default: return 'secondary'
      }
  }

  return (
    <>
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
                const isCancellable = booking.status === 'confirmed' && isFuture(startTime)

                return (
                    <Card 
                        key={booking.id} 
                        className={`transition-all ${isNewBooking && index === 0 ? 'border-green-400 border-2' : ''} ${booking.status === 'cancelled' ? 'bg-gray-100 opacity-70' : ''}`}>
                    <CardHeader className="flex flex-row justify-between items-start">
                        <div>
                        <CardTitle>{booking.service.title}</CardTitle>
                        <CardDescription className="flex items-center gap-4 pt-2">
                            <div className="flex items-center"><Calendar className="h-4 w-4 mr-1.5"/> {format(startTime, 'E, d MMM yyyy')}</div>
                            <div className="flex items-center"><Clock className="h-4 w-4 mr-1.5"/> {format(startTime, 'p')}</div>
                        </CardDescription>
                        </div>
                        <Badge variant={getStatusBadgeVariant(booking.status)} className="capitalize">{booking.status}</Badge>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                           <p className="text-lg font-bold">${booking.total_price}</p>
                           {isCancellable && (
                             <Button 
                                variant="destructive"
                                size="sm"
                                onClick={() => setBookingToCancel(booking.id)} 
                                disabled={isCancelling}>
                                     <XCircle className="h-4 w-4 mr-2" />
                                     Cancel
                             </Button>
                           )}
                        </div>
                    </CardContent>
                    </Card>
                )
                })}
            </div>
            )}
        </div>
        </div>

        <AlertDialog open={!!bookingToCancel} onOpenChange={() => setBookingToCancel(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently cancel the booking. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isCancelling}>Back</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelBooking} disabled={isCancelling}>
                        {isCancelling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Cancelling...</> : 'Yes, cancel it'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  )
}

export default function BookingsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BookingsComponent />
        </Suspense>
    )
}
