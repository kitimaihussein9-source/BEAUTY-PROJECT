"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Subscription {
  id: string
  providerId: string
  providerName: string
  plan: "basic" | "premium" | "enterprise"
  status: "active" | "expired" | "suspended"
  startDate: string
  endDate: string
  amount: number
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    {
      id: "1",
      providerId: "p1",
      providerName: "James Kariuki",
      plan: "premium",
      status: "active",
      startDate: "2024-01-01",
      endDate: "2024-02-01",
      amount: 50000,
    },
    {
      id: "2",
      providerId: "p2",
      providerName: "Beauty Salon Pro",
      plan: "enterprise",
      status: "active",
      startDate: "2024-01-01",
      endDate: "2024-02-01",
      amount: 100000,
    },
    {
      id: "3",
      providerId: "p3",
      providerName: "Mike Otieno",
      plan: "basic",
      status: "expired",
      startDate: "2023-12-01",
      endDate: "2024-01-01",
      amount: 25000,
    },
  ])

  const handleSuspendProvider = (id: string) => {
    setSubscriptions((prev) => prev.map((sub) => (sub.id === id ? { ...sub, status: "suspended" as const } : sub)))
  }

  const handleReactivateProvider = (id: string) => {
    setSubscriptions((prev) => prev.map((sub) => (sub.id === id ? { ...sub, status: "active" as const } : sub)))
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "basic":
        return "bg-gray-100 text-gray-800"
      case "premium":
        return "bg-blue-100 text-blue-800"
      case "enterprise":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "expired":
        return "bg-red-100 text-red-800"
      case "suspended":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Provider Subscriptions</h1>
          <p className="text-gray-600 mt-2">Manage provider access and subscription plans</p>
        </div>

        {/* Subscription Plans Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-2">TSh 25,000/month</div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Up to 50 bookings/month</li>
                <li>• Basic analytics</li>
                <li>• Email support</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Premium Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 mb-2">TSh 50,000/month</div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Unlimited bookings</li>
                <li>• Advanced analytics</li>
                <li>• Priority support</li>
                <li>• Marketing tools</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enterprise Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 mb-2">TSh 100,000/month</div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Everything in Premium</li>
                <li>• Multiple locations</li>
                <li>• Custom branding</li>
                <li>• Dedicated support</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Provider</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Plan</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">End Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{subscription.providerName}</td>
                      <td className="py-3 px-4">
                        <Badge className={getPlanColor(subscription.plan)}>{subscription.plan}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(subscription.status)}>{subscription.status}</Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold text-green-600">
                        TSh {subscription.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{subscription.endDate}</td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          {subscription.status === "active" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSuspendProvider(subscription.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReactivateProvider(subscription.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              Reactivate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
