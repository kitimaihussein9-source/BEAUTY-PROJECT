import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    // Verify webhook signature (implement based on your payment provider)
    // const signature = request.headers.get('x-webhook-signature')

    // Handle different payment events
    switch (body.event_type) {
      case "payment.succeeded":
        await handlePaymentSuccess(body.data, supabase)
        break
      case "payment.failed":
        await handlePaymentFailure(body.data, supabase)
        break
      default:
        console.log("Unhandled webhook event:", body.event_type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handlePaymentSuccess(paymentData: any, supabase: any) {
  // Update appointment payment status
  const { error } = await supabase
    .from("appointments")
    .update({
      payment_status: "paid",
      status: "confirmed",
    })
    .eq("payment_id", paymentData.payment_id)

  if (error) {
    console.error("Error updating payment status:", error)
  }
}

async function handlePaymentFailure(paymentData: any, supabase: any) {
  // Update appointment payment status
  const { error } = await supabase
    .from("appointments")
    .update({
      payment_status: "failed",
      status: "cancelled",
    })
    .eq("payment_id", paymentData.payment_id)

  if (error) {
    console.error("Error updating payment status:", error)
  }
}
