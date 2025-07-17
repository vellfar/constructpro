import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db, withRetry } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, MapPin, Edit, Trash2, AlertCircle } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ActivitiesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login")
  }

  interface Project {
    id: string
    name: string
    projectCode: string
    location: string | null
    status: string
  }

  interface Employee {
    id: string
    firstName: string
    lastName: string
  }

  interface Activity {
    id: string
    name: string
    description?: string | null
    status: string
    startDate: Date | null
    endDate: Date | null
    project: Project
    employee?: Employee | null
  }

  let activities: Activity[] = []
  let error = null

  try {
    activities = await withRetry(async () => {
      let dbActivities
      if (session.user.role === "Admin") {
        dbActivities = await db.activity.findMany({
          include: {
            project: {
              select: {
                id: true,
                name: true,
                projectCode: true,
                location: true,
                status: true,
              },
            },
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      } else {
        // Only show activities for projects assigned to the user
        const assignments = await db.projectAssignment.findMany({
          where: { userId: Number(session.user.id) },
          select: { projectId: true },
        })
        const assignedProjectIds = assignments.map(a => a.projectId)
        dbActivities = await db.activity.findMany({
          where: { projectId: { in: assignedProjectIds } },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                projectCode: true,
                location: true,
                status: true,
              },
            },
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      }

      // Convert all id fields to string to match the Activity, Project, and Employee interfaces
      return dbActivities.map((activity) => ({
        ...activity,
        id: activity.id.toString(),
        project: {
          ...activity.project,
          id: activity.project.id.toString(),
        },
        employee: activity.employee
          ? {
              ...activity.employee,
              id: activity.employee.id.toString(),
            }
          : null,
      }))
    })
  } catch (err) {
    console.error("Failed to fetch activities:", err)
    error = err instanceof Error ? err.message : "Failed to fetch activities"
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default"
      case "IN_PROGRESS":
        return "secondary"
      case "PLANNED":
        return "outline"
      case "DELAYED":
        return "destructive"
      case "CANCELLED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800"
      case "PLANNED":
        return "bg-gray-100 text-gray-800"
      case "DELAYED":
        return "bg-red-100 text-red-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Not set"
    return new Date(date).toLocaleDateString()
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <Calendar className="h-5 w-5" />
            Activity Management
          </div>
        </header>
        <div className="flex-1 p-3 sm:p-4 lg:p-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <h3 className="font-medium">Error loading activities</h3>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
              <Button asChild className="mt-4">
                <Link href="/activities">Retry</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Calendar className="h-5 w-5" />
          <span className="hidden sm:inline">Activity Management</span>
          <span className="sm:hidden">Activities</span>
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <Button size="sm" asChild className="h-9">
            <Link href="/activities/new">
              <Plus className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add Activity</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-3 sm:p-4 lg:p-6 w-full max-w-7xl mx-auto">
        <div className="space-y-4 sm:space-y-6">
          {/* Summary Cards - Mobile Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{activities.length}</div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {activities.filter((a) => a.status === "IN_PROGRESS").length}
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {activities.filter((a) => a.status === "COMPLETED").length}
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Planned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-gray-600">
                  {activities.filter((a) => a.status === "PLANNED").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters - Commented out as in original */}
          {/*
          <Card className="border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Search activities..." 
                    className="w-full bg-background pl-8" 
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PLANNED">Planned</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="DELAYED">Delayed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {activities &&
                        [...new Set(activities.map((a) => a.project.name))].map((projectName) => (
                          <SelectItem key={projectName} value={projectName}>
                            {projectName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          */}

          {/* Activities Table/Cards */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Project Activities</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Track and manage project activities and tasks ({activities.length} activities)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities && activities.length > 0 ? (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    <div className="rounded-md border border-gray-200">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-medium">Activity Name</TableHead>
                            <TableHead className="font-medium">Project</TableHead>
                            <TableHead className="font-medium">Status</TableHead>
                            <TableHead className="font-medium">Start Date</TableHead>
                            <TableHead className="font-medium">End Date</TableHead>
                            <TableHead className="font-medium">Location</TableHead>
                            <TableHead className="text-right font-medium">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activities.map((activity) => (
                            <TableRow key={activity.id} className="hover:bg-gray-50 transition-colors">
                              <TableCell className="font-medium">
                                <div>
                                  <div className="font-medium">{activity.name}</div>
                                  {activity.description && (
                                    <div className="text-sm text-muted-foreground max-w-xs">
                                      {activity.description.length > 60
                                        ? `${activity.description.substring(0, 60)}...`
                                        : activity.description}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <Link
                                    href={`/projects/${activity.project.id}`}
                                    className="font-medium hover:underline text-blue-600"
                                  >
                                    {activity.project.name}
                                  </Link>
                                  <div className="text-sm text-muted-foreground">{activity.project.projectCode}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(activity.status)}>
                                  {activity.status.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{formatDate(activity.startDate)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{formatDate(activity.endDate)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{activity.project.location || "Not specified"}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/activities/${activity.id}`}>View</Link>
                                  </Button>
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/activities/${activity.id}/edit`}>
                                      <Edit className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                    {activities.map((activity) => (
                      <Card key={activity.id} className="border border-gray-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <CardTitle className="text-base">{activity.name}</CardTitle>
                              {activity.description && (
                                <CardDescription className="text-sm">
                                  {activity.description.length > 80
                                    ? `${activity.description.substring(0, 80)}...`
                                    : activity.description}
                                </CardDescription>
                              )}
                            </div>
                            <Badge className={getStatusColor(activity.status)}>
                              {activity.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center text-sm">
                              <span className="font-medium text-gray-600 w-20">Project:</span>
                              <Link href={`/projects/${activity.project.id}`} className="text-blue-600 hover:underline">
                                {activity.project.name}
                              </Link>
                            </div>
                            <div className="flex items-center text-sm">
                              <span className="font-medium text-gray-600 w-20">Code:</span>
                              <span className="text-gray-700">{activity.project.projectCode}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <span className="font-medium text-gray-600 w-20">Start:</span>
                              <span className="text-gray-700">{formatDate(activity.startDate)}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <span className="font-medium text-gray-600 w-20">End:</span>
                              <span className="text-gray-700">{formatDate(activity.endDate)}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <span className="font-medium text-gray-600 w-20">Location:</span>
                              <span className="text-gray-700">{activity.project.location || "Not specified"}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                              <Link href={`/activities/${activity.id}`}>View</Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                              <Link href={`/activities/${activity.id}/edit`}>Edit</Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No activities found</h3>
                  <p className="text-muted-foreground mb-4">Get started by creating your first activity.</p>
                  <Button asChild>
                    <Link href="/activities/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Activity
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
