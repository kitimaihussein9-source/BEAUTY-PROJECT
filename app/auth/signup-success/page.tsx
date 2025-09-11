import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function SignUpSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const params = await searchParams
  const isProvider = params.type === "provider"

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600">
              {isProvider ? "Application Submitted!" : "Account Created!"}
            </CardTitle>
            <CardDescription>
              {isProvider
                ? "Your provider application has been submitted"
                : "Welcome to our beauty & grooming platform"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-sm text-muted-foreground">
              {isProvider ? (
                <>
                  <p>
                    Thank you for applying to become a service provider. Please check your email to confirm your
                    account.
                  </p>
                  <p className="mt-2">
                    Once confirmed, our admin team will review your application. You'll receive an email notification
                    about the status.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">Please check your email to confirm your account.</p>
                  <p className="mt-2">
                    We've sent a confirmation link to your email address. Click the link to verify your account and
                    complete the registration process.
                  </p>
                  <p className="mt-2 text-xs">Don't see the email? Check your spam folder or contact support.</p>
                </>
              )}
            </div>
            <Button asChild className="w-full">
              <Link href="/auth/login">Go to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
