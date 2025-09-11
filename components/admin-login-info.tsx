import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Mail, Key } from "lucide-react"

export function AdminLoginInfo() {
  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Shield className="h-6 w-6 text-blue-600 mr-2" />
          <CardTitle className="text-lg">Admin Access</CardTitle>
        </div>
        <CardDescription>Use these credentials to access the admin dashboard</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <Mail className="h-4 w-4 text-gray-500" />
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-gray-600">ecokitaaloop@gmail.com</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Key className="h-4 w-4 text-gray-500" />
          <div>
            <p className="text-sm font-medium">Password</p>
            <p className="text-sm text-gray-600">Admin@2024!</p>
          </div>
        </div>
        <Badge variant="secondary" className="w-full justify-center">
          Admin privileges included
        </Badge>
      </CardContent>
    </Card>
  )
}
