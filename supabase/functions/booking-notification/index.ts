
// supabase/functions/booking-notification/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@1.0.0'

// IMPORTANT: In a real-world scenario, you would want to use a more robust HTML email templating library.
// For this example, we'll use simple string templates.

// Initialize Resend with the API key from environment variables
// Ensure you have set RESEND_API_KEY in your Supabase project's environment variables.
const resend = new Resend(Deno.env.get('RESEND_API_KEY')!)

interface BookingData {
  start_time: string;
  service: { title: string };
  customer: { full_name: string, email: string };
  provider: { full_name: string, email: string };
}

serve(async (req) => {
  const { bookingId, type } = await req.json()

  if (!bookingId || !type) {
    return new Response(JSON.stringify({ error: 'Missing bookingId or type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // Create a Supabase client with the service_role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch comprehensive booking details required for the email
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        start_time,
        service:services(title),
        customer:profiles!bookings_customer_id_fkey(full_name, email),
        provider:profiles!bookings_provider_id_fkey(full_name, email)
      `)
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      throw new Error(`Failed to fetch booking details: ${error?.message || 'Booking not found'}`)
    }
    
    // Type assertion to get correct typings for the joined data
    const { start_time, service, customer, provider } = booking as unknown as BookingData;
    const formattedStartTime = new Date(start_time).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    let customerSubject = '';
    let customerBody = '';
    let providerSubject = '';
    let providerBody = '';

    // Define email content based on the notification type ('confirmed' or 'cancelled')
    if (type === 'confirmed') {
      // --- Confirmation Emails ---
      customerSubject = 'Your Booking is Confirmed!';
      customerBody = `
        <h1>Booking Confirmed!</h1>
        <p>Hi ${customer.full_name},</p>
        <p>This is a confirmation that your booking for <strong>${service.title}</strong> with <strong>${provider.full_name}</strong> is scheduled for:</p>
        <p><strong>${formattedStartTime}</strong></p>
        <p>Thank you for using our platform!</p>
      `;

      providerSubject = 'New Booking Received!';
      providerBody = `
        <h1>New Booking!</h1>
        <p>Hi ${provider.full_name},</p>
        <p>You have a new booking from <strong>${customer.full_name}</strong> for the <strong>${service.title}</strong> service.</p>
        <p><strong>When:</strong> ${formattedStartTime}</p>
        <p>Please review the details in your dashboard.</p>
      `;
    } else if (type === 'cancelled') {
      // --- Cancellation Emails ---
      customerSubject = 'Your Booking Has Been Cancelled';
      customerBody = `
        <h1>Booking Cancelled</h1>
        <p>Hi ${customer.full_name},</p>
        <p>This is a confirmation that your booking for <strong>${service.title}</strong> with <strong>${provider.full_name}</strong> on ${formattedStartTime} has been cancelled.</p>
        <p>If you did not request this, please contact support.</p>
      `;

      providerSubject = 'A Booking Has Been Cancelled';
      providerBody = `
        <h1>Booking Cancelled</h1>
        <p>Hi ${provider.full_name},</p>
        <p>The booking with <strong>${customer.full_name}</strong> for the <strong>${service.title}</strong> service on ${formattedStartTime} has been cancelled.</p>
        <p>Your schedule for this time has been cleared.</p>
      `;
    } else {
        return new Response(JSON.stringify({ error: 'Invalid notification type' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    // Send both emails in parallel
    // IMPORTANT: Replace 'noreply@yourdomain.com' with a sender email from a domain
    // you have verified in your Resend account.
    await Promise.all([
      resend.emails.send({
        from: 'Bookings <noreply@yourdomain.com>',
        to: [customer.email],
        subject: customerSubject,
        html: customerBody,
      }),
      resend.emails.send({
        from: 'Bookings <noreply@yourdomain.com>',
        to: [provider.email],
        subject: providerSubject,
        html: providerBody,
      }),
    ])

    return new Response(JSON.stringify({ message: 'Notifications sent successfully' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
