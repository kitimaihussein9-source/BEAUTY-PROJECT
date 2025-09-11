import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const providerId = searchParams.get("providerId")

  if (!providerId) {
    return NextResponse.json({ error: "Provider ID required" }, { status: 400 })
  }

  try {
    // Get total earnings
    const { data: totalEarnings, error: totalError } = await supabase
      .from("payments")
      .select("amount")
      .eq("status", "completed")
      .in("appointment_id", supabase.from("appointments").select("id").eq("provider_id", providerId))

    if (totalError) throw totalError

    const total = totalEarnings?.reduce((sum, payment) => sum + payment.amount, 0) || 0

    // Get monthly earnings
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format

    const { data: monthlyEarnings, error: monthlyError } = await supabase
      .from("payments")
      .select("amount, created_at")
      .eq("status", "completed")
      .gte("created_at", `${currentMonth}-01`)
      .lt("created_at", `${currentMonth}-32`)
      .in("appointment_id", supabase.from("appointments").select("id").eq("provider_id", providerId))

    if (monthlyError) throw monthlyError

    const monthlyTotal = monthlyEarnings?.reduce((sum, payment) => sum + payment.amount, 0) || 0

    // Get recent transactions
    const { data: recentTransactions, error: transactionsError } = await supabase
      .from("payments")
      .select(`
        *,
        appointments (
          appointment_date,
          services (name),
          profiles!appointments_customer_id_fkey (full_name)
        )
      `)
      .eq("status", "completed")
      .in("appointment_id", supabase.from("appointments").select("id").eq("provider_id", providerId))
      .order("created_at", { ascending: false })
      .limit(10)

    if (transactionsError) throw transactionsError

    return NextResponse.json({
      totalEarnings: total,
      monthlyEarnings: monthlyTotal,
      recentTransactions: recentTransactions || [],
    })
  } catch (error) {
    console.error("Error fetching earnings:", error)
    return NextResponse.json({ error: "Failed to fetch earnings" }, { status: 500 })
  }
}
