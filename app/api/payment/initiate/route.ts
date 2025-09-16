
import { NextResponse } from "next/server";
import { paymentConfig } from "@/lib/config";

/**
 * API route to initiate a mobile money payment.
 * This simulates a request to a provider like Halopesa.
 */
export async function POST(req: Request) {
  try {
    const { amount, customerPhone, appointmentId } = await req.json();

    // **1. Input Validation (Essential for Security)**
    if (!amount || !customerPhone || !appointmentId) {
      return NextResponse.json(
        { success: false, error: "Missing required payment details." },
        { status: 400 }
      );
    }

    // **2. Simulate the Payment Request to Halopesa**
    // In a real-world scenario, you would make an API call to Halopesa here,
    // passing the details and receiving a transaction ID in response.
    console.log(`
      --> Simulating Payment Request:
      - Amount: ${amount} ${paymentConfig.currency}
      - To: ${paymentConfig.halopesaReceivingNumber}
      - From: ${customerPhone} (Customer)
      - For Appointment: ${appointmentId}
    `);

    // Simulate a successful response from the payment gateway
    const mockTransactionId = `mock_trans_${Date.now()}`;

    // **3. Respond to the Client**
    // The client will use this transaction ID to poll for payment status.
    return NextResponse.json({
      success: true,
      message: "Payment initiated. Please check your phone to confirm.",
      transactionId: mockTransactionId,
    });

  } catch (error) {
    console.error("Payment Initiation Error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
