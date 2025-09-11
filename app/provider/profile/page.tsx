"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowLeft, Save, User, Mail, Phone, Briefcase, Star } from "lucide-react"

interface Profile {
  id: string
  email: string
  full_name: string
  phone: string
  avatar_url: string
  role: string
  created_at: string
}

interface ProviderApplication {
  business_name: string
  experience_years: number
  bio: string
  status: string
}

export default function ProviderProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [application, setApplication] = useState<ProviderApplication | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    business_name: "",
    experience_years: 0,
    bio: "",
  })
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError) throw profileError

      // Check if user is a provider
      if (profileData.role !== "provider") {
        router.push("/dashboard/profile")
        return
      }

      // Get provider application
      const { data: appData } = await supabase.from("provider_applications").select("*").eq("user_id", user.id).single()

      setProfile(profileData)
      setApplication(appData)
      setFormData({
        full_name: profileData.full_name || "",
        phone: profileData.phone || "",
        business_name: appData?.business_name || "",
        experience_years: appData?.experience_years || 0,
        bio: appData?.bio || "",
      })
    } catch (error) {
      console.error("Error fetching profile:", error)
      setMessage({ type: "error", text: "Failed to load profile" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: name === "experience_years" ? Number.parseInt(value) || 0 : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setIsSaving(true)
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (profileError) throw profileError

      // Update provider application if it exists
      if (application) {
        const { error: appError } = await supabase
          .from("provider_applications")
          .update({
            business_name: formData.business_name,
            experience_years: formData.experience_years,
            bio: formData.bio,
          })
          .eq("user_id", profile.id)

        if (appError) throw appError
      }

      setMessage({ type: "success", text: "Profile updated successfully" })
    } catch (error) {
      console.error("Error updating profile:", error)
      setMessage({ type: "error", text: "Failed to update profile" })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile not found</h2>
          <Button asChild>
            <Link href="/provider">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/provider">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Profile</h1>
          <p className="text-gray-600">Manage your business profile and information</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>Your provider information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden mx-auto">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url || "/placeholder.svg"}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Business Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Business Name</p>
                      <p className="font-medium">{formData.business_name || "Not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Experience</p>
                      <p className="font-medium">{formData.experience_years} years</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{profile.phone || "Not set"}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Status */}
                <div className="text-center">
                  <Badge variant="default" className="capitalize">
                    {profile.role}
                  </Badge>
                  {application && (
                    <div className="mt-2">
                      <Badge
                        variant={
                          application.status === "approved"
                            ? "default"
                            : application.status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        Application {application.status}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your business information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Business Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Business Information</h3>
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="business_name">Business Name</Label>
                          <Input
                            id="business_name"
                            name="business_name"
                            type="text"
                            placeholder="Enter your business name"
                            value={formData.business_name}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="experience_years">Years of Experience</Label>
                          <Input
                            id="experience_years"
                            name="experience_years"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={formData.experience_years}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          placeholder="Tell customers about your experience and specialties..."
                          value={formData.bio}
                          onChange={handleInputChange}
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" asChild>
                      <Link href="/provider">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
