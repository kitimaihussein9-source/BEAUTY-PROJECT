import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ArrowLeft, Search, Eye } from "lucide-react"

export default async function ApplicationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Check admin role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") {
    redirect("/unauthorized")
  }

  // Get all provider applications
  const { data: applications } = await supabase
    .from("provider_applications")
    .select(`
      *,
      profiles (full_name, email, phone)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Applications</h1>
          <p className="text-gray-600">Review and manage provider applications</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Search applications..." className="pl-10" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline">All</Button>
                <Button variant="outline">Pending</Button>
                <Button variant="outline">Approved</Button>
                <Button variant="outline">Rejected</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <div className="space-y-4">
          {applications && applications.length > 0 ? (
            applications.map((application) => (
              <Card key={application.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{application.profiles?.full_name}</h3>
                          <p className="text-gray-600">{application.business_name}</p>
                        </div>
                        <Badge
                          variant={
                            application.status === "approved"
                              ? "default"
                              : application.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {application.status}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <p className="font-medium">{application.profiles?.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <p className="font-medium">{application.profiles?.phone}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Experience:</span>
                          <p className="font-medium">{application.experience_years} years</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Applied:</span>
                          <p className="font-medium">{new Date(application.created_at).toLocaleDateString()}</p>
                        </div>
                        {application.reviewed_at && (
                          <div>
                            <span className="text-gray-500">Reviewed:</span>
                            <p className="font-medium">{new Date(application.reviewed_at).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>

                      {application.bio && (
                        <div className="mt-4">
                          <span className="text-gray-500 text-sm">Bio:</span>
                          <p className="text-sm mt-1 line-clamp-2">{application.bio}</p>
                        </div>
                      )}
                    </div>

                    <div className="ml-6">
                      <Button asChild>
                        <Link href={`/admin/applications/${application.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Applications Found</h3>
                <p className="text-gray-600">There are no provider applications to review at this time.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
