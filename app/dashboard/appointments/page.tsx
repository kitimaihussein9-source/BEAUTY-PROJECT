import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, User, Star } from "lucide-react"

export default async function CustomerAppointments() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get all customer appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      *,
      services (title, category, duration_minutes),
      profiles!appointments_provider_id_fkey (full_name, phone, avatar_url),
      payments (amount, status, payment_method)
    `)
    .eq("customer_id", user.id)
    .order("appointment_date", { ascending: false })

  const allAppointments = appointments || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default"
      case "completed":
        return "secondary"
      case "cancelled":
        return "destructive"
      case "pending":
        return "outline"
      default:
        return "secondary"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
              <p className="text-gray-600">View and manage your bookings</p>
            </div>
          </div>
          <Button asChild>
            <Link href="/services">Book New Service</Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Appointments</CardTitle>
            <CardDescription>Complete history of all your beauty service bookings</CardDescription>
          </CardHeader>
          <CardContent>
            {allAppointments.length > 0 ? (
              <div className="space-y-4">
                {allAppointments.map((appointment) => {
                  const payment = appointment.payments?.[0]
                  const isCompleted = appointment.status === "completed"
                  return (
                    <div key={appointment.id} className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-pink-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{appointment.services?.title}</h3>
                              <p className="text-gray-600">with {appointment.profiles?.full_name}</p>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Service Details</p>
                              <p className="font-medium">{appointment.services?.category}</p>
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <Clock className="h-3 w-3" />
                                <span>{appointment.services?.duration_minutes} minutes</span>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm text-gray-500 mb-1">Appointment Time</p>
                              <div className="flex items-center space-x-1 text-sm mb-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {new Date(appointment.appointment_date).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {appointment.notes && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-500 mb-1">Your Notes</p>
                              <p className="text-sm bg-gray-50 p-2 rounded">{appointment.notes}</p>
                            </div>
                          )}
                        </div>

                        <div className="text-right ml-6">
                          <p className="text-2xl font-bold text-gray-900 mb-2">${appointment.total_amount}</p>
                          <Badge variant={getStatusColor(appointment.status)} className="mb-2">
                            {appointment.status}
                          </Badge>
                          {payment && (
                            <div className="mt-2">
                              <Badge
                                variant={payment.status === "completed" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {payment.status === "completed" ? "Paid" : "Payment Pending"}
                              </Badge>
                            </div>
                          )}
                          {isCompleted && (
                            <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                              <Star className="h-3 w-3 mr-1" />
                              Leave Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No appointments yet</p>
                <p className="text-sm text-gray-500">Book your first beauty service to get started</p>
                <Button asChild className="mt-4">
                  <Link href="/services">Browse Services</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
