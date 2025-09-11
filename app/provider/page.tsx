import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Calendar, DollarSign, Users, Star, Plus, LogOut, TrendingUp, CreditCard } from "lucide-react"

export default async function ProviderDashboard() {
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

  // Get provider's services
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("provider_id", user.id)
    .order("created_at", { ascending: false })

  // Get provider's appointments with payments
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      *,
      services (title, category),
      profiles!appointments_customer_id_fkey (full_name, phone),
      payments (amount, status, created_at)
    `)
    .eq("provider_id", user.id)
    .order("appointment_date", { ascending: true })

  const completedAppointments = appointments?.filter((apt) => apt.status === "completed") || []
  const totalRevenue = completedAppointments.reduce((sum, apt) => {
    const payment = apt.payments?.[0]
    return payment?.status === "completed" ? sum + Number(payment.amount) : sum
  }, 0)

  // Monthly earnings calculation
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyRevenue = completedAppointments
    .filter((apt) => {
      const aptDate = new Date(apt.appointment_date)
      return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear
    })
    .reduce((sum, apt) => {
      const payment = apt.payments?.[0]
      return payment?.status === "completed" ? sum + Number(payment.amount) : sum
    }, 0)

  // Weekly earnings
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const weeklyRevenue = completedAppointments
    .filter((apt) => new Date(apt.appointment_date) >= oneWeekAgo)
    .reduce((sum, apt) => {
      const payment = apt.payments?.[0]
      return payment?.status === "completed" ? sum + Number(payment.amount) : sum
    }, 0)

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
  }

  const todayAppointments =
    appointments?.filter((apt) => {
      const today = new Date().toDateString()
      return new Date(apt.appointment_date).toDateString() === today && apt.status !== "cancelled"
    }) || []

  const upcomingAppointments =
    appointments?.filter((apt) => new Date(apt.appointment_date) > new Date() && apt.status !== "cancelled") || []

  const completedBookings = appointments?.filter((apt) => apt.status === "completed").length || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Provider Dashboard</h1>
            <p className="text-gray-600">Welcome back, {profile?.full_name}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button asChild>
              <Link href="/provider/services/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Link>
            </Button>
            <form action={handleSignOut}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">All time</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Earnings</p>
                  <p className="text-2xl font-bold text-blue-600">${monthlyRevenue.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">This month</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Weekly Earnings</p>
                  <p className="text-2xl font-bold text-purple-600">${weeklyRevenue.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Last 7 days</p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Jobs</p>
                  <p className="text-2xl font-bold text-orange-600">{completedBookings}</p>
                  <p className="text-xs text-gray-500">Total bookings</p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Today's Appointments</CardTitle>
                <CardDescription>Your schedule for today with payment status</CardDescription>
              </CardHeader>
              <CardContent>
                {todayAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {todayAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{appointment.services?.title}</h4>
                          <p className="text-sm text-gray-600">Client: {appointment.profiles?.full_name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.appointment_date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                            {appointment.status}
                          </Badge>
                          <p className="text-sm font-medium mt-1">${appointment.total_amount}</p>
                          <Badge
                            variant={appointment.payments?.[0]?.status === "completed" ? "default" : "secondary"}
                            className="text-xs mt-1"
                          >
                            {appointment.payments?.[0]?.status === "completed" ? "Paid" : "Pending Payment"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No appointments scheduled for today</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Your Services */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Services</CardTitle>
                  <CardDescription>Manage your service offerings</CardDescription>
                </div>
                <Button asChild>
                  <Link href="/provider/services/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {services && services.length > 0 ? (
                  <div className="space-y-4">
                    {services.slice(0, 5).map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{service.title}</h4>
                          <p className="text-sm text-gray-600">{service.category}</p>
                          <p className="text-sm text-gray-500">{service.duration_minutes} minutes</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${service.price}</p>
                          <Badge variant={service.is_active ? "default" : "secondary"}>
                            {service.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No services created yet</p>
                    <Button asChild className="mt-4">
                      <Link href="/provider/services/new">Create Your First Service</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Earnings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Earnings</CardTitle>
                <CardDescription>Your latest completed payments</CardDescription>
              </CardHeader>
              <CardContent>
                {completedAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {completedAppointments.slice(0, 5).map((appointment) => {
                      const payment = appointment.payments?.[0]
                      return (
                        <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{appointment.services?.title}</h4>
                            <p className="text-sm text-gray-600">Client: {appointment.profiles?.full_name}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(appointment.appointment_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              +${payment?.amount || appointment.total_amount}
                            </p>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Earned
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No earnings yet</p>
                    <p className="text-sm text-gray-500">Complete appointments to start earning</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" asChild>
                  <Link href="/provider/appointments">View All Appointments</Link>
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/provider/earnings">View Earnings Report</Link>
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/provider/services">Manage Services</Link>
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/provider/profile">Edit Profile</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingAppointments.slice(0, 3).map((appointment) => (
                      <div key={appointment.id} className="p-3 border rounded-lg">
                        <p className="font-medium text-sm">{appointment.services?.title}</p>
                        <p className="text-xs text-gray-600">{appointment.profiles?.full_name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(appointment.appointment_date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No upcoming appointments</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
