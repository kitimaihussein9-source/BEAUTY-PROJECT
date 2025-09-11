import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Check, X, User, Briefcase, Clock } from "lucide-react"

interface ApplicationDetailProps {
  params: Promise<{ id: string }>
}

export default async function ApplicationDetailPage({ params }: ApplicationDetailProps) {
  const resolvedParams = await params
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

  // Get application details
  const { data: application } = await supabase
    .from("provider_applications")
    .select(`
      *,
      profiles (full_name, email, phone, avatar_url)
    `)
    .eq("id", resolvedParams.id)
    .single()

  if (!application) {
    redirect("/admin/applications")
  }

  const handleApprove = async () => {
    "use server"
    const supabase = await createClient()

    // Update application status
    await supabase
      .from("provider_applications")
      .update({
        status: "approved",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", resolvedParams.id)

    // Update user role to provider
    await supabase.from("profiles").update({ role: "provider" }).eq("id", application.user_id)

    redirect("/admin/applications")
  }

  const handleReject = async () => {
    "use server"
    const supabase = await createClient()

    await supabase
      .from("provider_applications")
      .update({
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", resolvedParams.id)

    redirect("/admin/applications")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/admin/applications">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Provider Application</h1>
              <p className="text-gray-600">Review application details</p>
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
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Application Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="font-medium">{application.profiles?.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="font-medium">{application.profiles?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="font-medium">{application.profiles?.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Application Date</label>
                    <p className="font-medium">{new Date(application.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Business Name</label>
                    <p className="font-medium">{application.business_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Years of Experience</label>
                    <p className="font-medium">{application.experience_years} years</p>
                  </div>
                </div>

                {application.certifications && application.certifications.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Certifications</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {application.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {application.bio && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Bio</label>
                    <p className="mt-1 text-gray-700">{application.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Portfolio */}
            {application.portfolio_images && application.portfolio_images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio</CardTitle>
                  <CardDescription>Work samples submitted by the applicant</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {application.portfolio_images.map((image, index) => (
                      <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Portfolio ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Review Actions */}
            {application.status === "pending" && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Actions</CardTitle>
                  <CardDescription>Approve or reject this application</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form action={handleApprove}>
                    <Button type="submit" className="w-full">
                      <Check className="h-4 w-4 mr-2" />
                      Approve Application
                    </Button>
                  </form>
                  <form action={handleReject}>
                    <Button type="submit" variant="destructive" className="w-full">
                      <X className="h-4 w-4 mr-2" />
                      Reject Application
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Application Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Application Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
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
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Submitted</span>
                  <span className="text-sm font-medium">{new Date(application.created_at).toLocaleDateString()}</span>
                </div>
                {application.reviewed_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Reviewed</span>
                    <span className="text-sm font-medium">
                      {new Date(application.reviewed_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Applicant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <a href={`mailto:${application.profiles?.email}`}>Send Email</a>
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <a href={`tel:${application.profiles?.phone}`}>Call Phone</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
