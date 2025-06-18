"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Building2, Truck, Activity, DollarSign, TrendingUp, AlertCircle, Fuel } from "lucide-react"

interface DashboardStats {
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
  }
  distributions: {
    projectStatus: Array<{ status: string; count: number }>
    equipmentStatus: Array<{ status: string; count: number }>
  }
  recentActivities: Array<{
    id: number
    name: string
    description: string
    project: string
    projectCode: string
    status: string
    startDate: string | null
    endDate: string | null
    createdAt: string
  }>
  recentFuelRequests: Array<{
    id: number
    requestNumber: string
    equipment: string
    equipmentCode: string
    project: string
    projectCode: string
    requestedBy: string
    fuelType: string
    quantity: number
    status: string
    requestDate: string
  }>
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "authenticated") {
      fetchDashboardStats()
    }
  }, [status])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/dashboard/stats")
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.status}`)
      }
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error("Dashboard fetch error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "0"
    }
    return amount.toLocaleString()
  }

  const formatPercentage = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return "0.0"
    }
    return value.toFixed(1)
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Dashboard</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchDashboardStats}>Try Again</Button>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No Data Available</h2>
          <p className="text-muted-foreground">Unable to load dashboard statistics</p>
        </div>
      </div>
    )
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "operational":
      case "approved":
      case "completed":
        return "default"
      case "pending":
      case "in_progress":
        return "secondary"
      case "on_hold":
      case "under_maintenance":
        return "outline"
      case "cancelled":
      case "rejected":
      case "out_of_service":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <div className="flex items-center gap-2 font-semibold">Dashboard</div>
        <div className="ml-auto flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={fetchDashboardStats}>
            Refresh
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-700">
              Welcome back, {session?.user?.firstName || session?.user?.name || "User"}!
            </h1>
            <p className="text-muted-foreground">Here's what's happening with your projects today.</p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Total Projects</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.totalProjects || 0}</div>
              <p className="text-xs text-muted-foreground">{stats.overview.activeProjects || 0} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Equipment</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.totalEquipment || 0}</div>
              <p className="text-xs text-muted-foreground">{stats.overview.operationalEquipment || 0} operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-400">Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.totalEmployees || 0}</div>
              <p className="text-xs text-muted-foreground">Active workforce</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Fuel Requests</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.pendingFuelRequests || 0}</div>
              <p className="text-xs text-muted-foreground">Pending approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">UGX {formatCurrency(stats.financial.totalBudget)}</div>
              <p className="text-xs text-muted-foreground">Across all projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipment Utilization</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(stats.financial.equipmentUtilization)}%</div>
              <p className="text-xs text-muted-foreground">Currently operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.financial.activeAssignments || 0}</div>
              <p className="text-xs text-muted-foreground">Equipment assignments</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-700">Project Status</CardTitle>
              <CardDescription>Distribution of project statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.distributions.projectStatus.length > 0 ? (
                  stats.distributions.projectStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{item.status.toLowerCase().replace("_", " ")}</span>
                      <Badge variant={getStatusBadgeVariant(item.status)}>{item.count}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No project data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">Equipment Status</CardTitle>
              <CardDescription>Equipment operational status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.distributions.equipmentStatus.length > 0 ? (
                  stats.distributions.equipmentStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{item.status.toLowerCase().replace("_", " ")}</span>
                      <Badge variant={getStatusBadgeVariant(item.status)}>{item.count}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No equipment data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities and Fuel Requests */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest project activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivities.length > 0 ? (
                  stats.recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{activity.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.project} ({activity.projectCode})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(activity.status)}>
                        {activity.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activities</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Fuel Requests</CardTitle>
              <CardDescription>Latest fuel requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentFuelRequests.length > 0 ? (
                  stats.recentFuelRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {request.equipment} - {request.quantity}L {request.fuelType}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {request.project} • {request.requestedBy}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(request.status)}>{request.status.replace("_", " ")}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent fuel requests</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
