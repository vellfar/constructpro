"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import {
  Building2,
  Users,
  Wrench,
  Fuel,
  AlertTriangle,
  RefreshCw,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  ArrowUpRight,
  TrendingUp,
  Calendar,
} from "lucide-react"
import { useDashboardStats } from "@/hooks/use-real-time-data"

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

const CHART_COLORS = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]

export default function DashboardPage() {
  const { data: session } = useSession()
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d")
  const { data: stats, loading, error, refresh, lastUpdated } = useDashboardStats()

  if (loading && !stats) return <DashboardSkeleton />

  if (error)
    return (
      <div className="flex-1 p-3 sm:p-4 md:p-6 bg-white min-h-screen">
        <Alert variant="destructive" className="flex items-center justify-between bg-red-50 shadow-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
            <AlertDescription className="text-red-800">Failed to load dashboard data: {error.message}</AlertDescription>
          </div>
          <Button onClick={refresh} variant="outline" size="sm" className="ml-4 text-red-700 hover:bg-red-100 bg-white">
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </Alert>
      </div>
    )

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6 bg-white min-h-screen w-full max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3 w-full">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-2">
            Welcome back, {session?.user?.firstName || "User"}!
          </h1>
          <p className="text-sm sm:text-base text-slate-700">Here's what's happening with your projects today.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-slate-500 w-full sm:w-auto">
          {lastUpdated && (
            <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-lg shadow-sm">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Updated {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
          <Button
            onClick={refresh}
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex items-center gap-2 w-full sm:w-auto text-slate-700 hover:bg-slate-50 bg-white shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="sm:inline">Refresh</span>
          </Button>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
          color="cyan"
          trend={`${stats?.operationalEquipment || 0} operational`}
          href="/equipment"
        />
        <StatsCard
          title="Team Members"
          value={stats?.totalEmployees || 0}
          subtitle="Active employees"
          icon={Users}
          color="green"
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
      </section>

      {/* Quick Actions */}
      <section className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2 hover:bg-blue-50 bg-transparent">
            <Link href="/projects/new">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">New Project</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2 hover:bg-cyan-50 bg-transparent">
            <Link href="/equipment/new">
              <Wrench className="w-5 h-5 text-cyan-600" />
              <span className="text-sm font-medium">Add Equipment</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2 hover:bg-green-50 bg-transparent">
            <Link href="/employees/new">
              <Users className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">Add Employee</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2 hover:bg-orange-50 bg-transparent">
            <Link href="/fuel-management/request">
              <Fuel className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium">Request Fuel</span>
            </Link>
          </Button>
        </div>
      </section>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-2xl bg-white rounded-xl p-1 mx-auto shadow-lg">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md text-sm font-medium rounded-lg transition-all duration-200"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="projects"
            className="data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md text-sm font-medium rounded-lg transition-all duration-200"
          >
            Projects
          </TabsTrigger>
          <TabsTrigger
            value="equipment"
            className="data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md text-sm font-medium rounded-lg transition-all duration-200"
          >
            Equipment
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md text-sm font-medium rounded-lg transition-all duration-200"
          >
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Content */}
        <TabsContent value="overview" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Status Chart */}
          <Card className="shadow-lg bg-white hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                Project Status Distribution
              </CardTitle>
              <CardDescription className="text-slate-600">Current status of all projects</CardDescription>
            </CardHeader>
            <CardContent className="h-72 pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.projectStatusData || []}
                    dataKey="count"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {(stats?.projectStatusData || []).map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Equipment Status Chart */}
          <Card className="shadow-lg bg-white hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Wrench className="w-5 h-5 text-cyan-600" />
                </div>
                Equipment Status Overview
              </CardTitle>
              <CardDescription className="text-slate-600">Current equipment distribution by status</CardDescription>
            </CardHeader>
            <CardContent className="h-72 pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.equipmentStatusData || []} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="shadow-lg bg-white hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                Recent Activities
              </CardTitle>
              <CardDescription className="text-slate-600">Latest system activities and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-72 overflow-y-auto pt-6">
              {(stats?.recentActivities?.length ?? 0) === 0 && (
                <div className="text-center py-8">
                  <div className="p-4 bg-slate-50 rounded-full w-fit mx-auto mb-3">
                    <Activity className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">No recent activities</p>
                </div>
              )}
              {stats?.recentActivities?.map((act, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:shadow-sm transition-all duration-200"
                >
                  <ActivityIcon status={act.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{act.description}</p>
                    <p className="text-xs text-slate-500">{act.timestamp}</p>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 text-slate-700 hover:bg-slate-50 bg-white"
                asChild
              >
                <Link href="/activities">
                  View All Activities
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Fuel Requests */}
          <Card className="shadow-lg bg-white hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Fuel className="w-5 h-5 text-orange-600" />
                </div>
                Fuel Management
              </CardTitle>
              <CardDescription className="text-slate-600">Recent fuel request activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-72 overflow-y-auto pt-6">
              {(stats?.recentFuelRequests?.length ?? 0) === 0 && (
                <div className="text-center py-8">
                  <div className="p-4 bg-slate-50 rounded-full w-fit mx-auto mb-3">
                    <Fuel className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">No recent fuel requests</p>
                </div>
              )}
              {stats?.recentFuelRequests?.map((req, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:shadow-sm transition-all duration-200"
                >
                  <Badge
                    variant={
                      req.status === "APPROVED" ? "default" : req.status === "PENDING" ? "secondary" : "destructive"
                    }
                    className={`text-xs px-2 py-1 mt-1 ${
                      req.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : req.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {req.status}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{req.description}</p>
                    <p className="text-xs text-slate-500">{req.timestamp}</p>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 text-slate-700 hover:bg-slate-50 bg-white"
                asChild
              >
                <Link href="/fuel-management">
                  View All Requests
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="p-0">
          <Card className="shadow-lg bg-white">
            <CardHeader className="bg-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                Projects Overview
              </CardTitle>
              <CardDescription className="text-slate-600">Summary of all construction projects</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {stats?.projectsList && stats.projectsList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Budget</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Client</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.projectsList.map((project: any) => (
                        <tr key={project.id} className="border-b hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900">{project.name}</td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-800">
                              {project.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-medium">
                            {project.budget?.toLocaleString?.() ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{project.client?.name ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-6 bg-slate-50 rounded-full w-fit mx-auto mb-4">
                    <Building2 className="h-12 w-12 text-slate-400" />
                  </div>
                  <p className="text-slate-600 mb-4 text-lg">No projects found</p>
                  <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg">
                    <Link href="/projects/new">Create First Project</Link>
                  </Button>
                </div>
              )}
              <div className="mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-slate-700 hover:bg-slate-50 bg-white"
                  asChild
                >
                  <Link href="/projects">
                    View All Projects
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="p-0">
          <Card className="shadow-lg bg-white">
            <CardHeader className="bg-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Wrench className="w-6 h-6 text-cyan-600" />
                </div>
                Equipment Overview
              </CardTitle>
              <CardDescription className="text-slate-600">Summary of all construction equipment</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {stats?.equipmentList && stats.equipmentList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.equipmentList.map((eq: any) => (
                        <tr key={eq.id} className="border-b hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900">{eq.name}</td>
                          <td className="px-4 py-3 text-slate-700">{eq.type}</td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-800">
                              {eq.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-6 bg-slate-50 rounded-full w-fit mx-auto mb-4">
                    <Wrench className="h-12 w-12 text-slate-400" />
                  </div>
                  <p className="text-slate-600 mb-4 text-lg">No equipment found</p>
                  <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg">
                    <Link href="/equipment/new">Add First Equipment</Link>
                  </Button>
                </div>
              )}
              <div className="mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-slate-700 hover:bg-slate-50 bg-white"
                  asChild
                >
                  <Link href="/equipment">
                    View All Equipment
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="p-0">
          <Card className="shadow-lg bg-white">
            <CardHeader className="bg-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                Recent Activities
              </CardTitle>
              <CardDescription className="text-slate-600">Latest system activities and updates</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivities.map((act: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 hover:shadow-sm transition-all duration-200"
                    >
                      <ActivityIcon status={act.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{act.description}</p>
                        <p className="text-xs text-slate-500 mt-1">{act.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-6 bg-slate-50 rounded-full w-fit mx-auto mb-4">
                    <Activity className="h-12 w-12 text-slate-400" />
                  </div>
                  <p className="text-slate-600 text-lg">No recent activities found</p>
                </div>
              )}
              <div className="mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-slate-700 hover:bg-slate-50 bg-white"
                  asChild
                >
                  <Link href="/activities">
                    View All Activities
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}

interface StatsCardProps {
  title: string
  value: number
  subtitle?: string
  icon: React.ElementType
  color: "blue" | "cyan" | "green" | "orange"
  trend?: string
  urgent?: boolean
  href?: string
}

function StatsCard({ title, value, subtitle, icon: Icon, color, trend, urgent, href }: StatsCardProps) {
  const colorClasses = {
    blue: {
      bg: "bg-white",
      border: "hover:shadow-lg",
      icon: "bg-blue-100 text-blue-600",
      text: "text-blue-600",
      hover: "hover:shadow-lg",
    },
    cyan: {
      bg: "bg-white",
      border: "hover:shadow-lg",
      icon: "bg-cyan-100 text-cyan-600",
      text: "text-cyan-600",
      hover: "hover:shadow-lg",
    },
    green: {
      bg: "bg-white",
      border: "hover:shadow-lg",
      icon: "bg-green-100 text-green-600",
      text: "text-green-600",
      hover: "hover:shadow-lg",
    },
    orange: {
      bg: "bg-white",
      border: "hover:shadow-lg",
      icon: "bg-orange-100 text-orange-600",
      text: "text-orange-600",
      hover: "hover:shadow-lg",
    },
  }

  const classes = colorClasses[color]
  if (href) {
    return (
      <Link href={href}>
        <Card
          className={`cursor-pointer hover:shadow-xl transition-all duration-300 ${classes.bg} ${classes.hover} group shadow-md`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
              {title}
            </CardTitle>
            <div className={`p-3 rounded-xl ${classes.icon} group-hover:scale-110 transition-transform duration-200`}>
              <Icon className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 mb-1">{value.toLocaleString()}</div>
            {subtitle && <p className="text-sm text-slate-600 mb-2">{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <Badge
                  variant={urgent ? "destructive" : "secondary"}
                  className={`text-xs px-2 py-1 ${urgent ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                >
                  {trend}
                </Badge>
              </div>
            )}
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors mt-2" />
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Card
      className={`cursor-pointer hover:shadow-xl transition-all duration-300 ${classes.bg} ${classes.hover} group shadow-md`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
          {title}
        </CardTitle>
        <div className={`p-3 rounded-xl ${classes.icon} group-hover:scale-110 transition-transform duration-200`}>
          <Icon className="w-5 h-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 mb-1">{value.toLocaleString()}</div>
        {subtitle && <p className="text-sm text-slate-600 mb-2">{subtitle}</p>}
        {trend && (
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <Badge
              variant={urgent ? "destructive" : "secondary"}
              className={`text-xs px-2 py-1 ${urgent ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
            >
              {trend}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ActivityIcon({ status }: { status: string }) {
  switch (status) {
    case "success":
      return <CheckCircle className="w-5 h-5 text-green-600" />
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    case "error":
      return <XCircle className="w-5 h-5 text-red-600" />
    case "info":
    default:
      return <Zap className="w-5 h-5 text-blue-600" />
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto bg-white min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-slate-200" />
          <Skeleton className="h-4 w-96 bg-slate-100" />
        </div>
        <Skeleton className="h-10 w-24 bg-slate-200" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 bg-white" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 bg-white" />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full max-w-2xl mx-auto bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-80 bg-white shadow-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
