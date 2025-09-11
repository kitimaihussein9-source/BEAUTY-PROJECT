import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Users, UserCheck, Calendar, DollarSign, TrendingUp, Clock, LogOut } from "lucide-react"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile and check admin role
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/unauthorized")
  }

  // Get platform statistics
  const [
    { count: totalUsers },
    { count: totalProviders },
    { count: pendingApplications },
    { count: totalAppointments },
    { data: recentAppointments },
    { data: pendingApps },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "provider"),
    supabase.from("provider_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("appointments").select("*", { count: "exact", head: true }),
    supabase
      .from("appointments")
      .select(`
        *,
        services (title),
        profiles!appointments_customer_id_fkey (full_name),
        profiles!appointments_provider_id_fkey (full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("provider_applications")
      .select(`
        *,
        profiles (full_name, email)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  // Calculate revenue with admin commission
  const { data: completedAppointments } = await supabase
    .from("appointments")
    .select("total_amount")
    .eq("status", "completed")

  const totalRevenue = completedAppointments?.reduce((sum, apt) => sum + Number(apt.total_amount), 0) || 0
  const adminCommission = totalRevenue * 0.15 // 15% commission

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Platform management and oversight</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary">Admin: {profile?.full_name}</Badge>
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
        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600">{totalUsers || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Providers</p>
                  <p className="text-2xl font-bold text-green-600">{totalProviders || 0}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">TSh {totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Admin Revenue (15%)</p>
                  <p className="text-2xl font-bold text-purple-600">TSh {adminCommission.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-orange-600">{totalAppointments || 0}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Pending Provider Applications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pending Provider Applications</CardTitle>
                  <CardDescription>{pendingApplications || 0} applications awaiting review</CardDescription>
                </div>
                <Button asChild>
                  <Link href="/admin/applications">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {pendingApps && pendingApps.length > 0 ? (
                  <div className="space-y-4">
                    {pendingApps.map((application) => (
                      <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{application.profiles?.full_name}</h4>
                          <p className="text-sm text-gray-600">{application.business_name}</p>
                          <p className="text-sm text-gray-500">
                            Applied {new Date(application.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">Pending</Badge>
                          <Button size="sm" asChild>
                            <Link href={`/admin/applications/${application.id}`}>Review</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No pending applications</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Appointments */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Appointments</CardTitle>
                  <CardDescription>Latest bookings on the platform</CardDescription>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/admin/appointments">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentAppointments && recentAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {recentAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{appointment.services?.title}</h4>
                          <p className="text-sm text-gray-600">Customer: {appointment.profiles?.full_name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.appointment_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              appointment.status === "completed"
                                ? "default"
                                : appointment.status === "confirmed"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {appointment.status}
                          </Badge>
                          <p className="text-sm font-medium mt-1">
                            TSh {Number(appointment.total_amount).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recent appointments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" asChild>
                  <Link href="/admin/applications">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Review Applications
                  </Link>
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/admin/users">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Link>
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/admin/appointments">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Appointments
                  </Link>
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/admin/analytics">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Analytics
                  </Link>
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/admin/revenue">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Revenue Dashboard
                  </Link>
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/admin/subscriptions">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Manage Subscriptions
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Platform Health */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <Badge variant="default">Healthy</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Payment Success Rate</span>
                  <Badge variant="default">98.5%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Provider Satisfaction</span>
                  <Badge variant="default">4.8/5</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">System Status</span>
                  <Badge variant="default">Online</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
