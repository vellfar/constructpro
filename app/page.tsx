"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import {
  Building2,
  Users,
  Wrench,
  Fuel,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
} from "lucide-react"
import { useDashboardStats } from "@/hooks/use-real-time-data"
import { useSession } from "next-auth/react"
import Link from "next/link"

const CHART_COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  purple: "#8b5cf6",
  pink: "#ec4899",
  indigo: "#6366f1",
}

const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
  CHART_COLORS.purple,
]

export default function DashboardPage() {
  const { data: session } = useSession()
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d")

  const { data: stats, loading, error, refresh, lastUpdated } = useDashboardStats()

  if (loading && !stats) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load dashboard data: {error.message}</span>
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
            Welcome back, {session?.user?.firstName || "User"}!
          </h1>
          <p className="text-muted-foreground">Here's what's happening with your construction projects today.</p>
        </div>
        <div className="flex items-center space-x-3">
          {lastUpdated && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Updated {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
          <Button onClick={refresh} variant="outline" size="sm" className="shadow-sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Projects"
          value={stats?.totalProjects || 0}
          subtitle={`${stats?.activeProjects || 0} active`}
          icon={Building2}
          color="blue"
          trend={stats?.newProjectsThisMonth ? `+${stats.newProjectsThisMonth} this month` : undefined}
          href="/projects"
        />
        <StatsCard
          title="Equipment"
          value={stats?.totalEquipment || 0}
          subtitle={`${stats?.equipmentUtilization || 0}% utilization`}
          icon={Wrench}
          color="green"
          trend={`${stats?.operationalEquipment || 0} operational`}
          href="/equipment"
        />
        <StatsCard
          title="Team Members"
          value={stats?.totalEmployees || 0}
          subtitle="Active employees"
          icon={Users}
          color="purple"
          href="/employees"
        />
        <StatsCard
          title="Fuel Requests"
          value={stats?.pendingFuelRequests || 0}
          subtitle="Pending approval"
          icon={Fuel}
          color={stats?.pendingFuelRequests > 0 ? "orange" : "green"}
          urgent={stats?.pendingFuelRequests > 0}
          href="/fuel-management"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px] bg-white dark:bg-slate-800 shadow-sm">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Projects
          </TabsTrigger>
          <TabsTrigger value="equipment" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Equipment
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Project Status Chart */}
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <span>Project Status</span>
                </CardTitle>
                <CardDescription>Distribution of project statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.projectStatusData || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(stats?.projectStatusData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Equipment Status Chart */}
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5 text-green-500" />
                  <span>Equipment Status</span>
                </CardTitle>
                <CardDescription>Current equipment distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats?.equipmentStatusData || []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  <span>Recent Activities</span>
                </CardTitle>
                <CardDescription>Latest system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(stats?.recentActivities || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activities</p>
                  ) : (
                    (stats?.recentActivities || []).map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50"
                      >
                        <div className="flex-shrink-0 mt-1">
                          {activity.type === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {activity.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                          {activity.type === "error" && <XCircle className="h-4 w-4 text-red-500" />}
                          {activity.type === "info" && <Zap className="h-4 w-4 text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href="/activities">View All Activities</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Fuel className="h-5 w-5 text-orange-500" />
                  <span>Fuel Requests</span>
                </CardTitle>
                <CardDescription>Recent fuel request activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(stats?.recentFuelRequests || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent fuel requests</p>
                  ) : (
                    (stats?.recentFuelRequests || []).map((request, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <Badge
                            variant={
                              request.status === "APPROVED"
                                ? "default"
                                : request.status === "PENDING"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-xs"
                          >
                            {request.status}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{request.description}</p>
                          <p className="text-xs text-muted-foreground">{request.timestamp}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href="/fuel-management">View All Requests</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
              <CardDescription>Current project status and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Project details will be loaded here</p>
                <Button variant="outline" asChild className="mt-4">
                  <Link href="/projects">View All Projects</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-6">
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Equipment Overview</CardTitle>
              <CardDescription>Equipment status and utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Equipment details will be loaded here</p>
                <Button variant="outline" asChild className="mt-4">
                  <Link href="/equipment">View All Equipment</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Recent system activities and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Activity timeline will be loaded here</p>
                <Button variant="outline" asChild className="mt-4">
                  <Link href="/activities">View All Activities</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Stats Card Component
interface StatsCardProps {
  title: string
  value: number
  subtitle?: string
  icon: React.ElementType
  color: "blue" | "green" | "purple" | "orange"
  trend?: string
  urgent?: boolean
  href?: string
}

function StatsCard({ title, value, subtitle, icon: Icon, color, trend, urgent, href }: StatsCardProps) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-100 dark:bg-blue-900/20",
    green: "text-green-600 bg-green-100 dark:bg-green-900/20",
    purple: "text-purple-600 bg-purple-100 dark:bg-purple-900/20",
    orange: "text-orange-600 bg-orange-100 dark:bg-orange-900/20",
  }

  const CardWrapper = href ? Link : "div"
  const cardProps = href ? { href } : {}

  return (
    <CardWrapper {...cardProps}>
      <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200 cursor-pointer group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={`p-2 rounded-full ${colorClasses[color]} group-hover:scale-110 transition-transform`}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value.toLocaleString()}</div>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trend && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {trend}
            </p>
          )}
          {urgent && (
            <Badge variant="destructive" className="mt-2 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Needs Attention
            </Badge>
          )}
        </CardContent>
      </Card>
    </CardWrapper>
  )
}

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
