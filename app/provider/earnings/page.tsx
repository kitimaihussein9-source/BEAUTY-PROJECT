import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, DollarSign, TrendingUp, Calendar, Download } from "lucide-react"

export default async function EarningsPage() {
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

  // Get all completed appointments with payments
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      *,
      services (title, category),
      profiles!appointments_customer_id_fkey (full_name),
      payments (amount, status, created_at, payment_method, transaction_id)
    `)
    .eq("provider_id", user.id)
    .eq("status", "completed")
    .order("appointment_date", { ascending: false })

  const completedAppointments = appointments || []

  // Calculate earnings
  const totalEarnings = completedAppointments.reduce((sum, apt) => {
    const payment = apt.payments?.[0]
    return payment?.status === "completed" ? sum + Number(payment.amount) : sum
  }, 0)

  // Monthly breakdown
  const monthlyEarnings = {}
  completedAppointments.forEach((apt) => {
    const payment = apt.payments?.[0]
    if (payment?.status === "completed") {
      const date = new Date(apt.appointment_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      monthlyEarnings[monthKey] = (monthlyEarnings[monthKey] || 0) + Number(payment.amount)
    }
  })

  const currentMonth = new Date().toISOString().slice(0, 7)
  const thisMonthEarnings = monthlyEarnings[currentMonth] || 0

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
              <h1 className="text-2xl font-bold text-gray-900">Earnings Report</h1>
              <p className="text-gray-600">Track your income and payments</p>
            </div>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Earnings Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-3xl font-bold text-green-600">${totalEarnings.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">All time revenue</p>
                </div>
                <DollarSign className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-3xl font-bold text-blue-600">${thisMonthEarnings.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Current month earnings</p>
                </div>
                <TrendingUp className="h-10 w-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Jobs</p>
                  <p className="text-3xl font-bold text-purple-600">{completedAppointments.length}</p>
                  <p className="text-xs text-gray-500">Total services provided</p>
                </div>
                <Calendar className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Transaction History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All your completed payments</CardDescription>
              </CardHeader>
              <CardContent>
                {completedAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {completedAppointments.map((appointment) => {
                      const payment = appointment.payments?.[0]
                      return (
                        <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{appointment.services?.title}</h4>
                            <p className="text-sm text-gray-600">Client: {appointment.profiles?.full_name}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(appointment.appointment_date).toLocaleDateString()} •
                              {payment?.payment_method || "Cash"}
                            </p>
                            {payment?.transaction_id && (
                              <p className="text-xs text-gray-400">ID: {payment.transaction_id}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              +${payment?.amount || appointment.total_amount}
                            </p>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Paid
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No earnings yet</p>
                    <p className="text-sm text-gray-500">Complete appointments to start earning money</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly Breakdown */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Monthly Breakdown</CardTitle>
                <CardDescription>Earnings by month</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(monthlyEarnings).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(monthlyEarnings)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .slice(0, 6)
                      .map(([month, amount]) => (
                        <div key={month} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            {new Date(month + "-01").toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                            })}
                          </span>
                          <span className="font-medium">${amount.toFixed(2)}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No earnings data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
