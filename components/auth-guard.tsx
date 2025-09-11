"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

export function AuthGuard({ children, allowedRoles = [], redirectTo = "/auth/login" }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push(redirectTo)
          return
        }

        if (allowedRoles.length > 0) {
          const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

          if (!profile || !allowedRoles.includes(profile.role)) {
            router.push("/unauthorized")
            return
          }
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push(redirectTo)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [supabase, router, allowedRoles, redirectTo])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
