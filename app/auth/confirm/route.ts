import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = searchParams.get("next") ?? "/dashboard"

  if (token_hash && type) {
    const supabase = createServerClient()

    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error) {
      // Get user data after confirmation
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Check if user is admin and redirect accordingly
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        if (profile?.role === "admin") {
          return NextResponse.redirect(new URL("/admin", request.url))
        } else if (profile?.role === "provider") {
          return NextResponse.redirect(new URL("/provider", request.url))
        }
      }

      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(new URL("/auth/error?message=Email confirmation failed", request.url))
}
