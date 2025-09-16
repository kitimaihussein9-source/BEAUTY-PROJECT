
"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, PlusCircle } from "lucide-react"
import Link from "next/link"

const serviceCategories = ['hair', 'nails', 'makeup', 'skincare', 'massage', 'other']

export default function CreateServicePage() {
  const router = useRouter()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    duration_minutes: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormState(prev => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setFormState(prev => ({ ...prev, category: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("You must be logged in to create a service.")
      }

      // Here we can also check if the user has the 'provider' role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
          throw new Error("Could not verify user profile.")
      }

      if (profile.role !== 'provider') {
          throw new Error("Only users with the 'provider' role can create services.")
      }

      const { error: insertError } = await supabase.from("services").insert({
        provider_id: user.id,
        title: formState.title,
        description: formState.description,
        category: formState.category,
        price: parseFloat(formState.price),
        duration_minutes: parseInt(formState.duration_minutes, 10),
      })

      if (insertError) {
        throw insertError
      }

      // Ideally, redirect to the list of services or the new service's page
      router.push("/dashboard/services") 
      // We will create the /dashboard/services page next

    } catch (err: any) {
      console.error("Error creating service:", err)
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Create a New Service</h1>
          <p className="text-gray-600">Fill out the details below to list a new service for customers to book.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
            <CardDescription>All fields are required unless otherwise stated.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg">
                  <p>{error}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="title">Service Title</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g., Classic Manicure"
                  value={formState.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Service Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the service in detail..."
                  value={formState.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={handleCategoryChange} value={formState.category} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map(cat => (
                        <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="e.g., 45.00"
                    value={formState.price}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                <Input
                  id="duration_minutes"
                  name="duration_minutes"
                  type="number"
                  placeholder="e.g., 60"
                  value={formState.duration_minutes}
                  onChange={handleInputChange}
                  required
                  min="5"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Saving Service..." : "Save Service"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
