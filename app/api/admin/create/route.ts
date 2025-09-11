import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createAdminClient()

    const { data: existingUser, error: userCheckError } =
      await supabase.auth.admin.getUserByEmail("ecokitaaloop@gmail.com")

    if (existingUser?.user && !userCheckError) {
      console.log("Admin user exists in auth, checking profile...")

      if (!existingUser.user.email_confirmed_at) {
        const { error: confirmError } = await supabase.auth.admin.updateUserById(existingUser.user.id, {
          email_confirm: true,
        })
        if (confirmError) {
          console.error("Email confirmation error:", confirmError)
        }
      }

      // Check if profile exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", "ecokitaaloop@gmail.com")
        .single()

      if (!existingProfile && !profileCheckError) {
        // Create missing profile
        const { error: profileError } = await supabase.from("profiles").insert({
          id: existingUser.user.id,
          email: "ecokitaaloop@gmail.com",
          full_name: "Admin User",
          phone: "0614103439",
          role: "admin",
        })

        if (profileError) {
          console.error("Profile creation error:", profileError)
        }
      }

      return NextResponse.json({
        success: true,
        message: "Admin account is ready",
        credentials: {
          email: "ecokitaaloop@gmail.com",
          password: "Admin@2024!",
        },
      })
    }

    console.log("Creating new admin user...")

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: "ecokitaaloop@gmail.com",
      password: "Admin@2024!",
      email_confirm: true,
      user_metadata: {
        full_name: "Admin User",
        phone: "0614103439",
        role: "admin",
      },
    })

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create admin user: " + authError.message,
        },
        { status: 500 },
      )
    }

    // Create admin profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authUser.user.id,
      email: "ecokitaaloop@gmail.com",
      full_name: "Admin User",
      phone: "0614103439",
      role: "admin",
    })

    if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create admin profile: " + profileError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Admin account created successfully!",
      credentials: {
        email: "ecokitaaloop@gmail.com",
        password: "Admin@2024!",
      },
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
