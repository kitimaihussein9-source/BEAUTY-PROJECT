import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const providerId = searchParams.get("providerId")
  const customerId = searchParams.get("customerId")

  try {
    let query = supabase
      .from("appointments")
      .select(`
        *,
        services (
          name,
          price,
          duration
        ),
        profiles!appointments_customer_id_fkey (
          full_name,
          avatar_url
        ),
        provider:profiles!appointments_provider_id_fkey (
          full_name,
          avatar_url
        )
      `)
      .order("appointment_date", { ascending: true })

    if (providerId) {
      query = query.eq("provider_id", providerId)
    }
    if (customerId) {
      query = query.eq("customer_id", customerId)
    }

    const { data: appointments, error } = await query

    if (error) throw error

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { serviceId, providerId, customerId, appointmentDate, notes } = body

    // Get service details for pricing
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("price")
      .eq("id", serviceId)
      .single()

    if (serviceError) throw serviceError

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        service_id: serviceId,
        provider_id: providerId,
        customer_id: customerId,
        appointment_date: appointmentDate,
        notes,
        status: "pending",
        total_amount: service.price,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 })
  }
}
