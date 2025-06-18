"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, DollarSign, Clock, Users, Fuel, Download, RefreshCw, Loader2 } from "lucide-react"

interface AnalyticsData {
  overview: {
    totalProjects: number
    activeProjects: number
    totalEmployees: number
    totalEquipment: number
    operationalEquipment: number
    totalClients: number
    pendingFuelRequests: number
    totalActivities: number
  }
  financial: {
    totalBudget: number
    equipmentUtilization: number
    activeAssignments: number
    totalInvoices: number
    totalInvoiceAmount: number
    paidInvoices: number
    pendingInvoices: number
  }
  distributions: {
    projectStatus: Array<{ status: string; count: number }>
    equipmentStatus: Array<{ status: string; count: number }>
  }
  trends: {
    monthlyProjects: Array<{ month: string; count: number }>
    monthlyInvoices: Array<{ month: string; amount: number }>
    equipmentUtilization: Array<{ month: string; utilization: number }>
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timePeriod, setTimePeriod] = useState("30days")

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/analytics?period=${timePeriod}`)
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data")
      }
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timePeriod])

  if (loading) {
    return (
      <div className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <div className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-5 w-5" />
            Analytics
          </div>
        </header>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <div className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-5 w-5" />
            Analytics
          </div>
        </header>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={fetchAnalytics}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <div className="flex items-center gap-2 font-semibold">
          <BarChart3 className="h-5 w-5" />
          Analytics Dashboard
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                      <p className="text-2xl font-bold">{data.overview.totalProjects}</p>
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {data.overview.activeProjects} active
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                      <p className="text-2xl font-bold">{data.overview.totalEmployees}</p>
                      <p className="text-xs text-muted-foreground">Active workforce</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Equipment</p>
                      <p className="text-2xl font-bold">{data.overview.totalEquipment}</p>
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {data.overview.operationalEquipment} operational
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fuel Requests</p>
                      <p className="text-2xl font-bold">{data.overview.pendingFuelRequests}</p>
                      <p className="text-xs text-orange-600">Pending approval</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Distribution */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Project Status Distribution</CardTitle>
                  <CardDescription>Current status of all projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.distributions.projectStatus.map((item) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              item.status === "ACTIVE"
                                ? "default"
                                : item.status === "COMPLETED"
                                  ? "secondary"
                                  : item.status === "ON_HOLD"
                                    ? "destructive"
                                    : "outline"
                            }
                          >
                            {item.status}
                          </Badge>
                        </div>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Equipment Status Distribution</CardTitle>
                  <CardDescription>Current status of all equipment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.distributions.equipmentStatus.map((item) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              item.status === "OPERATIONAL"
                                ? "default"
                                : item.status === "MAINTENANCE"
                                  ? "destructive"
                                  : item.status === "OUT_OF_SERVICE"
                                    ? "secondary"
                                    : "outline"
                            }
                          >
                            {item.status}
                          </Badge>
                        </div>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                      <p className="text-2xl font-bold">${data.financial.totalBudget.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                      <p className="text-2xl font-bold">{data.financial.totalInvoices}</p>
                      <p className="text-xs text-green-600">{data.financial.paidInvoices} paid</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Invoice Amount</p>
                      <p className="text-2xl font-bold">${data.financial.totalInvoiceAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Invoices</p>
                      <p className="text-2xl font-bold">{data.financial.pendingInvoices}</p>
                      <p className="text-xs text-orange-600">Awaiting payment</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Equipment Utilization</p>
                      <p className="text-2xl font-bold">{data.financial.equipmentUtilization}%</p>
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Optimal range
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Assignments</p>
                      <p className="text-2xl font-bold">{data.financial.activeAssignments}</p>
                      <p className="text-xs text-muted-foreground">Current assignments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
                      <p className="text-2xl font-bold">{data.overview.totalActivities}</p>
                      <p className="text-xs text-muted-foreground">All time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {/* Line Charts */}
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Project Creation</CardTitle>
                  <CardDescription>Number of projects created each month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Line Chart: Monthly Projects</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Data: {data.trends.monthlyProjects.map((d) => `${d.month}: ${d.count}`).join(", ")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Invoice Amount</CardTitle>
                  <CardDescription>Total invoice amounts by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <div className="text-center">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Line Chart: Monthly Invoice Amounts</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Data:{" "}
                        {data.trends.monthlyInvoices.map((d) => `${d.month}: $${d.amount.toLocaleString()}`).join(", ")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Equipment Utilization Trend</CardTitle>
                  <CardDescription>Equipment utilization percentage over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Line Chart: Equipment Utilization Trend</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Data: {data.trends.equipmentUtilization.map((d) => `${d.month}: ${d.utilization}%`).join(", ")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
