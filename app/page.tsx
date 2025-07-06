"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

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
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}
const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

export default function DashboardPage() {
  const { data: session } = useSession()
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d")
  const { data: stats, loading, error, refresh, lastUpdated } = useDashboardStats()

  if (loading && !stats) return <DashboardSkeleton />
  if (error)
    return (
      <div className="flex-1 p-6">
        <Alert variant="destructive" className="flex items-center justify-between">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <AlertDescription>Failed to load dashboard data: {error.message}</AlertDescription>
          <Button onClick={refresh} variant="outline" size="sm" className="ml-4">
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </Alert>
      </div>
    )

  return (
    <main className="flex-1 p-6 bg-white dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-2">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Welcome back, {session?.user?.firstName || "User"}!
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          {lastUpdated && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Updated {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
          <Button
            onClick={refresh}
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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
      </section>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 max-w-lg bg-slate-100 dark:bg-slate-800 rounded-md shadow-sm">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Projects
          </TabsTrigger>
          <TabsTrigger value="equipment" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Equipment
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Content */}
        <TabsContent value="overview" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Status Pie */}
          <Card className="shadow-sm border border-slate-200 dark:border-slate-700 rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Building2 className="w-5 h-5 text-blue-600" />
                Project Status
              </CardTitle>
              <CardDescription>Distribution of project statuses</CardDescription>
            </CardHeader>
            <CardContent style={{ height: 280 }}>
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

          {/* Equipment Status Bar */}
          <Card className="shadow-sm border border-slate-200 dark:border-slate-700 rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Wrench className="w-5 h-5 text-green-600" />
                Equipment Status
              </CardTitle>
              <CardDescription>Current equipment distribution</CardDescription>
            </CardHeader>
            <CardContent style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.equipmentStatusData || []} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="shadow-sm border border-slate-200 dark:border-slate-700 rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Activity className="w-5 h-5 text-purple-600" />
                Recent Activities
              </CardTitle>
              <CardDescription>Latest system activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-72 overflow-y-auto pr-2">
              {(stats?.recentActivities?.length ?? 0) === 0 && (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-10">
                  No recent activities
                </p>
              )}
              {stats?.recentActivities?.map((act, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded bg-slate-50 dark:bg-slate-800"
                >
                  <ActivityIcon status={act.type} />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{act.description}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{act.timestamp}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                <Link href="/activities">View All Activities</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Fuel Requests */}
          <Card className="shadow-sm border border-slate-200 dark:border-slate-700 rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Fuel className="w-5 h-5 text-orange-600" />
                Fuel Requests
              </CardTitle>
              <CardDescription>Recent fuel request activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-72 overflow-y-auto pr-2">
              {(stats?.recentFuelRequests?.length ?? 0) === 0 && (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-10">
                  No recent fuel requests
                </p>
              )}
              {stats?.recentFuelRequests?.map((req, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded bg-slate-50 dark:bg-slate-800"
                >
                  <Badge
                    variant={
                      req.status === "APPROVED"
                        ? "default"
                        : req.status === "PENDING"
                        ? "secondary"
                        : "destructive"
                    }
                    className="text-xs px-2 py-1 mt-1"
                  >
                    {req.status}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{req.description}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{req.timestamp}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                <Link href="/fuel-management">View All Requests</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="p-0">
          <section className="bg-slate-50 dark:bg-slate-800 rounded-md shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Building2 className="w-6 h-6" /> Projects</h2>
            {/* Show a summary table of projects */}
            {stats?.projectsList && stats.projectsList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-2 py-1 text-left">Name</th>
                      <th className="px-2 py-1 text-left">Status</th>
                      <th className="px-2 py-1 text-left">Budget</th>
                      <th className="px-2 py-1 text-left">Client</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.projectsList.map((project: any) => (
                      <tr key={project.id} className="border-b hover:bg-slate-100 dark:hover:bg-slate-700">
                        <td className="px-2 py-1 font-medium">{project.name}</td>
                        <td className="px-2 py-1">{project.status}</td>
                        <td className="px-2 py-1">{project.budget?.toLocaleString?.() ?? '-'}</td>
                        <td className="px-2 py-1">{project.client?.name ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-slate-500 py-10">No projects found.</p>
            )}
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/projects">View All Projects</Link>
            </Button>
          </section>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="p-0">
          <section className="bg-slate-50 dark:bg-slate-800 rounded-md shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Wrench className="w-6 h-6" /> Equipment</h2>
            {stats?.equipmentList && stats.equipmentList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-2 py-1 text-left">Name</th>
                      <th className="px-2 py-1 text-left">Type</th>
                      <th className="px-2 py-1 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.equipmentList.map((eq: any) => (
                      <tr key={eq.id} className="border-b hover:bg-slate-100 dark:hover:bg-slate-700">
                        <td className="px-2 py-1 font-medium">{eq.name}</td>
                        <td className="px-2 py-1">{eq.type}</td>
                        <td className="px-2 py-1">{eq.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-slate-500 py-10">No equipment found.</p>
            )}
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/equipment">View All Equipment</Link>
            </Button>
          </section>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="p-0">
          <section className="bg-slate-50 dark:bg-slate-800 rounded-md shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Activity className="w-6 h-6" /> Recent Activities</h2>
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              <ul className="space-y-3">
                {stats.recentActivities.map((act: any, i: number) => (
                  <li key={i} className="flex items-start gap-3 p-3 rounded bg-slate-50 dark:bg-slate-800">
                    <ActivityIcon status={act.type} />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{act.description}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{act.timestamp}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-slate-500 py-10">No recent activities found.</p>
            )}
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/activities">View All Activities</Link>
            </Button>
          </section>
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
  color: "blue" | "green" | "purple" | "orange"
  trend?: string
  urgent?: boolean
  href?: string
}

function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  urgent,
  href,
}: StatsCardProps) {
  const colors = {
    blue: "text-blue-600 bg-blue-100 dark:bg-blue-900/20",
    green: "text-green-600 bg-green-100 dark:bg-green-900/20",
    purple: "text-purple-600 bg-purple-100 dark:bg-purple-900/20",
    orange: "text-orange-600 bg-orange-100 dark:bg-orange-900/20",
  }

  const Wrapper = href ? Link : React.Fragment
  const wrapperProps = href ? { href } : {}

  return (
    <Wrapper {...wrapperProps}>
      <Card
        className={`cursor-pointer hover:shadow-md transition-shadow duration-150 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded-md bg-white dark:bg-slate-800`}
      >
        <CardHeader className="flex justify-between items-center pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</CardTitle>
          <div className={`p-2 rounded-full ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{value.toLocaleString()}</p>
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          {trend && (
            <Badge
              variant={urgent ? "destructive" : "secondary"}
              className="mt-2 inline-block px-2 py-1 text-xs"
            >
              {trend}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Wrapper>
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
    <div className="space-y-6 p-6">
      <Skeleton className="h-10 w-64 rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-md" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-md" />
        ))}
      </div>
    </div>
  )
}
