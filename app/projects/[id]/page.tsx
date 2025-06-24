import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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

export const dynamic = "force-dynamic"
export const revalidate = 0

// Define proper types for the component - simplified for current schema
type ProjectWithRelations = Project & {
  client:
    | (Client & {
        id: number
        name: string
        email: string | null
        phone: string | null
      })
    | null
  activities: ActivityType[]
  fuelRequests: (FuelRequest & {
    equipment:
      | (Equipment & {
          id: number
          name: string
          equipmentCode: string
        })
      | null
  })[]
}

interface PageProps {
  params: { id: string }
}

export default async function ProjectDetailPage({ params }: PageProps) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      redirect("/auth/login")
    }

    const projectId = Number.parseInt(params.id, 10)

    if (isNaN(projectId) || projectId <= 0) {
      notFound()
    }

    console.log(`🔍 Fetching project with ID: ${projectId}`)

    // Simplified query that works with current schema
    const project: ProjectWithRelations | null = await prisma.project
      .findUnique({
        where: { id: projectId },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          activities: {
            orderBy: { createdAt: "desc" },
          },
          fuelRequests: {
            include: {
              equipment: {
                select: {
                  id: true,
                  name: true,
                  equipmentCode: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      })
      .catch((error: Error) => {
        console.error("Database error fetching project:", error)
        return null
      })

    if (!project) {
      console.log(`❌ Project with ID ${projectId} not found`)
      notFound()
    }

    console.log(`✅ Project found: ${project.name} (${project.projectCode})`)
    console.log(`📊 Activities: ${project.activities?.length || 0}`)
    console.log(`⛽ Fuel Requests: ${project.fuelRequests?.length || 0}`)

    // Type-safe helper functions
    const getStatusBadgeVariant = (
      status: ProjectStatus | ActivityStatus | FuelRequestStatus | string,
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

    const calculateProgress = (): number => {
      if (!project.activities || project.activities.length === 0) {
        return 0
      }

      const totalActivities = project.activities.length
      const completedActivities = project.activities.filter((activity) => activity.status === "COMPLETED").length

      return Math.round((completedActivities / totalActivities) * 100)
    }

    const formatCurrency = (amount: number | string | null | undefined): string => {
      const numAmount =
        typeof amount === "number" ? amount : typeof amount === "string" ? Number.parseFloat(amount) || 0 : 0

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numAmount)
    }

    const formatDate = (date: Date | string | null | undefined): string => {
      if (!date) return "Not set"

      try {
        const dateObj = typeof date === "string" ? new Date(date) : date
        if (isNaN(dateObj.getTime())) return "Invalid date"

        return dateObj.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      } catch {
        return "Invalid date"
      }
    }

    const getEquipmentDisplay = (
      equipment: { name: string; equipmentCode: string } | null,
    ): { name: string; code: string } => {
      if (!equipment) return { name: "Unknown Equipment", code: "No code" }
      return {
        name: equipment.name?.trim() || "Unknown Equipment",
        code: equipment.equipmentCode?.trim() || "No code",
      }
    }

    // Calculate values
    const projectBudget = Number(project.budget) || 0
    const progressPercentage = calculateProgress()

    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
          <div className="flex items-center gap-2 font-semibold truncate">
            {project.name?.trim() || "Unnamed Project"}
          </div>
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

        <div className="flex-1 p-6">
          <div className="space-y-6">
            {/* Project Overview Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Budget</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(projectBudget)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Activities</p>
                      <p className="text-2xl font-bold text-blue-600">{project.activities?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Progress</p>
                      <p className="text-2xl font-bold text-purple-600">{progressPercentage}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fuel Requests</p>
                      <p className="text-2xl font-bold text-orange-600">{project.fuelRequests?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Project Code</p>
                    <p className="font-medium text-lg">{project.projectCode?.trim() || "Not assigned"}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant={getStatusBadgeVariant(project.status)} className="text-sm">
                      {project.status || "Unknown"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Client</p>
                    <p className="font-medium">{project.client?.name?.trim() || "No client assigned"}</p>
                    {project.client?.email && <p className="text-sm text-muted-foreground">{project.client.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {project.location?.trim() || "No location specified"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(project.startDate)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">End Date</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(project.endDate)}
                    </p>
                  </div>
                </div>

                {project.description?.trim() && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm leading-relaxed bg-muted/50 p-4 rounded-lg">{project.description.trim()}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">Project Progress</p>
                    <span className="text-sm font-medium">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Activities and Fuel Requests */}
            <Tabs defaultValue="activities" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="activities" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Activities ({project.activities?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="fuel" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Fuel Requests ({project.fuelRequests?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="activities" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Activities</CardTitle>
                    <CardDescription>Track work activities and progress for this project</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {project.activities && project.activities.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Activity</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Start Date</TableHead>
                              <TableHead>End Date</TableHead>
                              <TableHead>Created</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {project.activities.map((activity) => (
                              <TableRow key={activity.id} className="hover:bg-muted/50">
                                <TableCell>
                                  <div className="space-y-1">
                                    <p className="font-medium">{activity.name?.trim() || "Unnamed Activity"}</p>
                                    {activity.description?.trim() && (
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {activity.description.trim()}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getStatusBadgeVariant(activity.status)} className="text-xs">
                                    {activity.status || "Unknown"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {formatDate(activity.startDate)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{formatDate(activity.endDate)}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {formatDate(activity.createdAt)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Activity className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-lg font-medium text-muted-foreground mb-2">No activities found</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Get started by adding the first activity to this project
                        </p>
                        <Button asChild>
                          <Link href={`/activities/new?projectId=${project.id}`}>Add First Activity</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fuel" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Fuel Requests</CardTitle>
                    <CardDescription>Fuel requests associated with this project</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {project.fuelRequests && project.fuelRequests.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Request #</TableHead>
                              <TableHead>Equipment</TableHead>
                              <TableHead>Fuel Type</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {project.fuelRequests.map((request) => {
                              const equipment = getEquipmentDisplay(request.equipment)
                              const quantity = Number(request.requestedQuantity) || 0

                              return (
                                <TableRow key={request.id} className="hover:bg-muted/50">
                                  <TableCell className="font-medium">
                                    {request.requestNumber?.trim() || `REQ-${request.id}`}
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <p className="font-medium">{equipment.name}</p>
                                      <p className="text-sm text-muted-foreground">{equipment.code}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {request.fuelType || "Unknown"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">{quantity}L</TableCell>
                                  <TableCell>
                                    <Badge variant={getStatusBadgeVariant(request.status)} className="text-xs">
                                      {request.status || "Unknown"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {formatDate(request.createdAt)}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-lg font-medium text-muted-foreground mb-2">No fuel requests found</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Fuel requests for this project will appear here
                        </p>
                        <Button asChild>
                          <Link href={`/fuel-management/request?projectId=${project.id}`}>Request Fuel</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in project detail page:", error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Project</h1>
        <p className="text-muted-foreground mb-4">There was an error loading the project details. Please try again.</p>
        <Button asChild>
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>
    )
  }
}
