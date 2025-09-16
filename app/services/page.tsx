
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tag, Clock, DollarSign, Calendar } from "lucide-react"

// We need to define a new type that includes the provider's information
interface ServiceWithProvider {
  id: string
  title: string
  description: string | null
  category: string
  price: number
  duration_minutes: number
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

export default function ServicesMarketplacePage() {
  const supabase = createClient()
  const [services, setServices] = useState<ServiceWithProvider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // This query joins the services table with the profiles table
      const { data, error: fetchError } = await supabase
        .from("services")
        .select(`
          id,
          title,
          description,
          category,
          price,
          duration_minutes,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq("is_active", true) // Only fetch active services
        .order("created_at", { ascending: false })

      if (fetchError) {
        throw fetchError
      }
      
      // The result needs to be cast to our new type
      setServices(data as ServiceWithProvider[] || [])

    } catch (err: any) {
      console.error("Error fetching services:", err)
      setError("Failed to load available services. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Book a Service</h1>
          <p className="text-gray-600">Browse our marketplace of professional beauty and wellness services.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-xl font-semibold text-gray-800">No Services Available</h3>
            <p className="text-gray-500 mt-2">There are currently no services available for booking. Please check back later.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {services.map(service => (
              <Card key={service.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                     <Avatar>
                        <AvatarImage src={service.profiles?.avatar_url || undefined} alt={service.profiles?.full_name || 'Provider'} />
                        <AvatarFallback>{service.profiles?.full_name?.charAt(0) || 'P'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg font-semibold leading-tight">{service.title}</CardTitle>
                      <CardDescription className="text-sm pt-1">by {service.profiles?.full_name || 'Unknown Provider'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                   <p className="text-sm text-gray-600 line-clamp-3">{service.description || 'No description provided.'}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-800">
                        <Tag className="h-4 w-4 text-pink-500" />
                        <span className="capitalize font-medium">{service.category}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-800">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-lg">{`$${service.price}`}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-800">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>{`${service.duration_minutes} minutes`}</span>
                      </div>
                    </div>
                </CardContent>
                <div className="p-4 border-t bg-gray-50">
                    <Button asChild className="w-full">
                      <Link href={`/booking/${service.id}`}>Book Now</Link>
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
