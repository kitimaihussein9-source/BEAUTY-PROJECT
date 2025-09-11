"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RevenueData {
  totalRevenue: number
  monthlyRevenue: number
  commissionRevenue: number
  subscriptionRevenue: number
  transactions: Array<{
    id: string
    type: "commission" | "subscription"
    amount: number
    provider: string
    date: string
    status: string
  }>
}

export default function AdminRevenuePage() {
  const [revenueData, setRevenueData] = useState<RevenueData>({
    totalRevenue: 2450000,
    monthlyRevenue: 450000,
    commissionRevenue: 320000,
    subscriptionRevenue: 130000,
    transactions: [
      {
        id: "1",
        type: "commission",
        amount: 15000,
        provider: "James Kariuki",
        date: "2024-01-15",
        status: "completed",
      },
      {
        id: "2",
        type: "subscription",
        amount: 50000,
        provider: "Beauty Salon Pro",
        date: "2024-01-14",
        status: "completed",
      },
      {
        id: "3",
        type: "commission",
        amount: 8000,
        provider: "Mike Otieno",
        date: "2024-01-13",
        status: "pending",
      },
    ],
  })

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Revenue Dashboard</h1>
          <p className="text-gray-600 mt-2">Track platform earnings and provider subscriptions</p>
        </div>

        {/* Revenue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">TSh {revenueData.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">All time earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">TSh {revenueData.monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Commission Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                TSh {revenueData.commissionRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">15% per booking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Subscription Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                TSh {revenueData.subscriptionRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">Monthly subscriptions</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Revenue Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Provider</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Badge variant={transaction.type === "commission" ? "default" : "secondary"}>
                          {transaction.type === "commission" ? "Commission" : "Subscription"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium">{transaction.provider}</td>
                      <td className="py-3 px-4 text-green-600 font-semibold">
                        TSh {transaction.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{transaction.date}</td>
                      <td className="py-3 px-4">
                        <Badge variant={transaction.status === "completed" ? "default" : "secondary"}>
                          {transaction.status}
                        </Badge>
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
