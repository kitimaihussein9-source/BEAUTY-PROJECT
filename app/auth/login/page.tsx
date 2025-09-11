"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSettingUpAdmin, setIsSettingUpAdmin] = useState(false)
  const router = useRouter()

  const setupAdminAccount = async () => {
    setIsSettingUpAdmin(true)
    try {
      const response = await fetch("/api/admin/create", {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        alert("Admin account is ready! You can now login with:\nEmail: ecokitaaloop@gmail.com\nPassword: Admin@2024!")
      } else {
        console.error("Admin setup error:", result.error)
      }
    } catch (error) {
      console.error("Failed to setup admin:", error)
    } finally {
      setIsSettingUpAdmin(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Attempting login for:", email)

      if (email === "ecokitaaloop@gmail.com") {
        console.log("[v0] Admin login detected, ensuring admin exists and is verified")
        try {
          const response = await fetch("/api/admin/create", {
            method: "POST",
          })
          const result = await response.json()
          console.log("[v0] Admin setup result:", result)

          await new Promise((resolve) => setTimeout(resolve, 2000))
        } catch (setupError) {
          console.log("[v0] Admin setup error (continuing with login):", setupError)
        }
      }

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.log("[v0] Auth error:", error)
        if (error.message.includes("Invalid login credentials")) {
          if (email === "ecokitaaloop@gmail.com") {
            throw new Error("Admin account setup in progress. Please wait a moment and try again.")
          } else {
            throw new Error("Invalid email or password. Please check your credentials.")
          }
        } else if (error.message.includes("Email not confirmed")) {
          if (email === "ecokitaaloop@gmail.com") {
            throw new Error("Admin email verification in progress. Please try again in a moment.")
          } else {
            throw new Error("Please check your email and click the confirmation link before logging in.")
          }
        } else {
          throw error
        }
      }

      console.log("[v0] Login successful, user ID:", authData.user?.id)

      await new Promise((resolve) => setTimeout(resolve, email === "ecokitaaloop@gmail.com" ? 2000 : 1000))

      // Get user profile to determine redirect
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user?.id)
        .single()

      console.log("[v0] Profile data:", profile)

      if (profileError) {
        console.log("[v0] Profile error:", profileError)
        if (email === "ecokitaaloop@gmail.com") {
          console.log("[v0] Creating admin profile")
          const { error: createProfileError } = await supabase.from("profiles").insert({
            id: authData.user.id,
            email: email,
            full_name: "Admin User",
            phone: "0614103439",
            role: "admin",
          })

          if (createProfileError) {
            console.log("[v0] Profile creation error:", createProfileError)
          }

          console.log("[v0] Redirecting to admin dashboard")
          window.location.href = "/admin"
          return
        } else {
          throw new Error("Could not fetch user profile. Please try again.")
        }
      }

      if (profile?.role === "admin") {
        console.log("[v0] Redirecting to admin dashboard")
        window.location.href = "/admin"
      } else if (profile?.role === "provider") {
        console.log("[v0] Redirecting to provider dashboard")
        window.location.href = "/provider"
      } else {
        console.log("[v0] Redirecting to customer dashboard")
        window.location.href = "/dashboard"
      }
    } catch (error: unknown) {
      console.log("[v0] Login error:", error)
      setError(error instanceof Error ? error.message : "Login failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to your beauty & grooming account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</div>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </p>
              <p className="mt-2 text-muted-foreground">
                Want to become a provider?{" "}
                <Link href="/auth/provider-signup" className="font-medium text-primary hover:underline">
                  Apply here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
