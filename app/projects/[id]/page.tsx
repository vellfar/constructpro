// app/projects/[id]/page.tsx

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Edit, MapPin, Calendar, DollarSign, Users, Activity, AlertCircle } from "lucide-react"
import Link from "next/link"
import { ProjectActions } from "@/components/project-actions"
import type {
  Project,
  Client,
  Activity as ActivityType,
  FuelRequest,
  Equipment,
  ProjectStatus,
  ActivityStatus,
  FuelRequestStatus,
} from "@prisma/client"

type ProjectWithRelations = Project & {
  client: Client | null
  activities: ActivityType[]
  fuelRequests: (FuelRequest & { equipment: Equipment | null })[]
}

interface PageProps {
  params: { id: string }
}

export default async function ProjectDetailPage({ params }: PageProps) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) redirect("/auth/login")

    const projectId = Number(params.id)
    if (isNaN(projectId) || projectId <= 0) notFound()

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        activities: { orderBy: { createdAt: "desc" } },
        fuelRequests: {
          include: { equipment: true },
          orderBy: { createdAt: "desc" },
        },
        projectAssignments: {
          include: { user: true },
        },
        equipmentAssignments: {
          include: { equipment: true },
        },
      },
    })

    if (!project) notFound()

    const getStatusBadgeVariant = (
      status: string,
    ): "default" | "secondary" | "outline" | "destructive" => {
      switch (status) {
        case "ACTIVE":
        case "IN_PROGRESS":
        case "APPROVED":
          return "default"
        case "COMPLETED":
        case "ISSUED":
        case "ACKNOWLEDGED":
          return "secondary"
        case "PLANNING":
        case "PLANNED":
        case "PENDING":
          return "outline"
        case "ON_HOLD":
        case "CANCELLED":
        case "REJECTED":
          return "destructive"
        default:
          return "secondary"
      }
    }

    const formatCurrency = (amount: number | string | null): string =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "UGX",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(typeof amount === "number" ? amount : parseFloat(amount || "0"))

    const formatDate = (date: Date | string | null): string => {
      if (!date) return "Not set"
      const d = new Date(date)
      return isNaN(d.getTime()) ? "Invalid date" : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    }

    const progressPercentage = (() => {
      const total = project.activities.length
      const completed = project.activities.filter(a => a.status === "COMPLETED").length
      return total ? Math.round((completed / total) * 100) : 0
    })()

    const getEquipment = (equipment: Equipment | null) =>
      equipment
        ? { name: equipment.name?.trim() || "Unnamed", code: equipment.equipmentCode?.trim() || "No code" }
        : { name: "Unknown", code: "No code" }

    return (
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
          <h1 className="font-semibold truncate">{project.name || "Unnamed Project"}</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${project.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <ProjectActions project={project} />
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 p-4 sm:p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-1">
            <Card>
              <CardContent className="p-4 sm:p-6 overflow-x-auto">
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(project.budget)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6 overflow-x-auto flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Activities</p>
                  <p className="text-2xl font-bold text-blue-600">{project.activities.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6 overflow-x-auto flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fuel Requests</p>
                  <p className="text-2xl font-bold text-orange-600">{project.fuelRequests.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Project Code</p>
                  <p className="text-lg font-medium">{project.projectCode || "Not assigned"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusBadgeVariant(project.status)}>{project.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p>{project.client?.name || "No client assigned"}</p>
                  {project.client?.email && (
                    <p className="text-sm text-muted-foreground">{project.client.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="flex items-center gap-1 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {project.location || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="flex items-center gap-1 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(project.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Planned End Date</p>
                  <p className="flex items-center gap-1 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {project.plannedEndDate ? formatDate(project.plannedEndDate) : "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actual End Date</p>
                  <p className="flex items-center gap-1 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {project.actualEndDate ? formatDate(project.actualEndDate) : "Not set"}
                  </p>
                </div>
              </div>

              {project.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm leading-relaxed bg-muted/50 p-4 rounded-lg">
                    {project.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignments Section */}
          {project.projectAssignments && project.projectAssignments.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Assigned Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2">
                  {project.projectAssignments.map((assignment: any) => (
                    <div key={assignment.userId} className="p-2 border rounded flex flex-col gap-1">
                      <p className="font-medium">{assignment.user?.firstName} {assignment.user?.lastName}</p>
                      <p className="text-xs text-muted-foreground">Role: {assignment.role}</p>
                      <form action={async () => {
                        'use server'
                        const { unassignUserFromProject } = require('@/app/actions/project-actions')
                        await unassignUserFromProject(assignment.userId, project.id)
                      }}>
                        <Button type="submit" size="sm" variant="outline">Unassign</Button>
                      </form>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {project.equipmentAssignments && project.equipmentAssignments.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Assigned Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2">
                  {project.equipmentAssignments.map((assignment: any) => (
                    <div key={assignment.equipmentId} className="p-2 border rounded flex flex-col gap-1">
                      <p className="font-medium">{assignment.equipment?.name}</p>
                      <form action={async () => {
                        'use server'
                        const { unassignEquipmentFromProject } = require('@/app/actions/equipment-actions')
                        await unassignEquipmentFromProject(assignment.equipmentId, project.id)
                      }}>
                        <Button type="submit" size="sm" variant="outline">Unassign</Button>
                      </form>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {/* ...existing tabs and content... */}
        </main>
      </div>
    )
  } catch (error) {
    console.error("Error loading project:", error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
        <h2 className="text-xl font-semibold text-red-600 mb-1">Error Loading Project</h2>
        <p className="text-muted-foreground mb-4">Something went wrong. Please try again later.</p>
        <Button asChild>
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>
    )
  }
}
