import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, User, Phone } from "lucide-react"

export default async function ProviderAppointments() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Redirect if not a provider
  if (profile?.role !== "provider") {
    redirect("/dashboard")
  }

  // Get all appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      *,
      services (title, category, duration_minutes),
      profiles!appointments_customer_id_fkey (full_name, phone, email),
      payments (amount, status, payment_method)
    `)
    .eq("provider_id", user.id)
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
              <Link href="/provider">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All Appointments</h1>
              <p className="text-gray-600">Manage your bookings and schedule</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Appointments</CardTitle>
            <CardDescription>Complete history of all your bookings</CardDescription>
          </CardHeader>
          <CardContent>
            {allAppointments.length > 0 ? (
              <div className="space-y-4">
                {allAppointments.map((appointment) => {
                  const payment = appointment.payments?.[0]
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
                              <p className="text-gray-600">{appointment.services?.category}</p>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Client Information</p>
                              <p className="font-medium">{appointment.profiles?.full_name}</p>
                              <p className="text-sm text-gray-600">{appointment.profiles?.email}</p>
                              {appointment.profiles?.phone && (
                                <div className="flex items-center space-x-1 text-sm text-gray-600">
                                  <Phone className="h-3 w-3" />
                                  <span>{appointment.profiles.phone}</span>
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="text-sm text-gray-500 mb-1">Appointment Details</p>
                              <div className="flex items-center space-x-1 text-sm mb-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm mb-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {new Date(appointment.appointment_date).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  • {appointment.services?.duration_minutes}min
                                </span>
                              </div>
                            </div>
                          </div>

                          {appointment.notes && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-500 mb-1">Notes</p>
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
                              {payment.payment_method && (
                                <p className="text-xs text-gray-500 mt-1">via {payment.payment_method}</p>
                              )}
                            </div>
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
                <p className="text-sm text-gray-500">Appointments will appear here once customers book your services</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
