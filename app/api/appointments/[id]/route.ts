import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { status } = body

    const { data: appointment, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error

    // If appointment is completed, create payment record
    if (status === "completed") {
      const { error: paymentError } = await supabase.from("payments").insert({
        appointment_id: appointment.id,
        amount: appointment.total_amount,
        status: "completed",
        payment_method: "cash", // Default for completed appointments
        transaction_id: `cash_${Date.now()}`,
      })

      if (paymentError) {
        console.error("Error creating payment record:", paymentError)
      }
    }

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error("Error updating appointment:", error)
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 })
  }
}
