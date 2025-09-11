import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Calendar, Clock, Star, User, LogOut } from "lucide-react"

export default async function CustomerDashboard() {
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

  // Get user's appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      *,
      services (title, category, price),
      profiles!appointments_provider_id_fkey (full_name, avatar_url)
    `)
    .eq("customer_id", user.id)
    .order("appointment_date", { ascending: true })
    .limit(5)

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
  }

  const upcomingAppointments =
    appointments?.filter((apt) => new Date(apt.appointment_date) > new Date() && apt.status !== "cancelled") || []

  const recentAppointments =
    appointments?.filter((apt) => new Date(apt.appointment_date) < new Date() && apt.status === "completed") || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.full_name}</h1>
            <p className="text-gray-600">Manage your beauty appointments</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/services">Browse Services</Link>
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
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>What would you like to do today?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Button asChild className="h-auto p-6 flex-col space-y-2">
                    <Link href="/services">
                      <Calendar className="h-8 w-8" />
                      <span>Book New Service</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="h-auto p-6 flex-col space-y-2 bg-transparent">
                    <Link href="/dashboard/appointments">
                      <Clock className="h-8 w-8" />
                      <span>View Appointments</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Your scheduled services</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-pink-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{appointment.services?.title}</h4>
                            <p className="text-sm text-gray-600">with {appointment.profiles?.full_name}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(appointment.appointment_date).toLocaleDateString()} at{" "}
                              {new Date(appointment.appointment_date).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                            {appointment.status}
                          </Badge>
                          <p className="text-sm font-medium mt-1">${appointment.total_amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No upcoming appointments</p>
                    <Button asChild className="mt-4">
                      <Link href="/services">Book Your First Service</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Services */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Services</CardTitle>
                <CardDescription>Your completed appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {recentAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {recentAppointments.slice(0, 3).map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Star className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{appointment.services?.title}</h4>
                            <p className="text-sm text-gray-600">with {appointment.profiles?.full_name}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(appointment.appointment_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">Completed</Badge>
                          <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                            Leave Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No completed services yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{profile?.full_name}</h3>
                    <p className="text-sm text-gray-600">{profile?.email}</p>
                    <Badge variant="secondary" className="mt-1">
                      Customer
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/dashboard/profile">Edit Profile</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Bookings</span>
                  <span className="font-medium">{appointments?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium">{recentAppointments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Upcoming</span>
                  <span className="font-medium">{upcomingAppointments.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
