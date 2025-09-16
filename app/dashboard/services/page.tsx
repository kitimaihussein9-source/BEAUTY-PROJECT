
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, PlusCircle, Edit, Trash2, Tag, Clock, DollarSign } from "lucide-react"

// Reflects the structure of your 'services' table
interface Service {
  id: string
  title: string
  description: string | null
  category: string
  price: number
  duration_minutes: number
  is_active: boolean
  created_at: string
}

export default function ServicesListPage() {
  const router = useRouter()
  const supabase = createClient()
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data, error: fetchError } = await supabase
        .from("services")
        .select("*")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setServices(data || [])
    } catch (err: any) {
      console.error("Error fetching services:", err)
      setError("Failed to load your services. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (serviceId: string) => {
    if (!window.confirm("Are you sure you want to delete this service? This action cannot be undone.")) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceId)

      if (deleteError) {
        throw deleteError
      }

      // Refresh the list after deletion
      setServices(prevServices => prevServices.filter(s => s.id !== serviceId))

    } catch (err: any) {
      console.error("Error deleting service:", err)
      setError("Failed to delete the service. Please try again.")
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Services</h1>
              <p className="text-gray-600">Manage the services you offer to clients.</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/services/create">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add New Service
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800">No Services Found</h3>
            <p className="text-gray-500 mt-2 mb-4">You haven't added any services yet.</p>
            <Button asChild>
              <Link href="/dashboard/services/create">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Your First Service
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(service => (
              <Card key={service.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold">{service.title}</CardTitle>
                    <Badge variant={service.is_active ? 'default' : 'secondary'}>
                        {service.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription className="capitalize text-pink-600 font-medium flex items-center pt-1">
                    <Tag className="h-4 w-4 mr-1.5" />
                    {service.category}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-2">{service.description || 'No description provided.'}</p>
                    <div className="flex justify-between items-center text-sm text-gray-800">
                        <div className="flex items-center gap-1.5">
                           <DollarSign className="h-4 w-4 text-gray-500" />
                           <span className="font-semibold">{`$${service.price}`}</span>
                        </div>
                         <div className="flex items-center gap-1.5">
                           <Clock className="h-4 w-4 text-gray-500" />
                           <span>{`${service.duration_minutes} min`}</span>
                        </div>
                    </div>
                </CardContent>
                <div className="flex justify-end p-4 border-t">
                    <Button variant="ghost" size="sm" disabled> {/* Edit functionality to be added later */}
                      <Edit className="h-4 w-4 mr-2"/> Edit
                    </Button>
                     <Button variant="destructive" size="sm" onClick={() => handleDelete(service.id)}>
                      <Trash2 className="h-4 w-4 mr-2"/> Delete
                    </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
