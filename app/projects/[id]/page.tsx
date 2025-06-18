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
import { ArrowLeft, Edit, MapPin, Calendar, DollarSign, Users, Activity } from "lucide-react"
import Link from "next/link"
import { ProjectActions } from "@/components/project-actions"

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login")
  }

  const projectId = Number.parseInt(params.id)
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: true,
      activities: {
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      fuelRequests: {
        include: {
          equipment: {
            select: {
              name: true,
              equipmentCode: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!project) {
    notFound()
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default"
      case "COMPLETED":
        return "secondary"
      case "PLANNING":
        return "outline"
      case "ON_HOLD":
        return "destructive"
      case "CANCELLED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const calculateProgress = () => {
    const totalActivities = project.activities.length
    const completedActivities = project.activities.filter((a) => a.status === "COMPLETED").length
    return totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0
  }

  const totalBudgetUsed = project.activities.reduce((sum, activity) => {
    return sum + (activity.quantity || 0) * (activity.unitCost || 0)
  }, 0)

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <div className="flex items-center gap-2 font-semibold">{project.name}</div>
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

      <div className="p-6">
        <div className="space-y-6">
          {/* Project Overview */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Budget</p>
                    <p className="text-2xl font-bold">${project.budget.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Spent</p>
                    <p className="text-2xl font-bold">${totalBudgetUsed.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Activities</p>
                    <p className="text-2xl font-bold">{project.activities.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Progress</p>
                    <p className="text-2xl font-bold">{calculateProgress()}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Project Code</p>
                  <p className="font-medium">{project.projectCode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={getStatusBadgeVariant(project.status)}>{project.status}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Client</p>
                  <p className="font-medium">{project.client?.name || "No client assigned"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {project.location || "No location specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">End Date</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : "Not set"}
                  </p>
                </div>
              </div>
              {project.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="mt-1">{project.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Progress</p>
                <Progress value={calculateProgress()} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Activities and Fuel Requests */}
          <Tabs defaultValue="activities">
            <TabsList>
              <TabsTrigger value="activities">Activities ({project.activities.length})</TabsTrigger>
              <TabsTrigger value="fuel">Fuel Requests ({project.fuelRequests.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="activities" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Activities</CardTitle>
                  <CardDescription>Track work activities and progress for this project</CardDescription>
                </CardHeader>
                <CardContent>
                  {project.activities.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Activity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Assigned To</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {project.activities.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{activity.name}</p>
                                {activity.description && (
                                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{activity.status}</Badge>
                            </TableCell>
                            <TableCell>
                              {activity.employee
                                ? `${activity.employee.firstName} ${activity.employee.lastName}`
                                : "Unassigned"}
                            </TableCell>
                            <TableCell>
                              ${((activity.quantity || 0) * (activity.unitCost || 0)).toLocaleString()}
                            </TableCell>
                            <TableCell>{new Date(activity.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No activities found for this project</p>
                      <Button className="mt-4" asChild>
                        <Link href="/activities/new">Add Activity</Link>
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
                  {project.fuelRequests.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Request #</TableHead>
                          <TableHead>Equipment</TableHead>
                          <TableHead>Fuel Type</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {project.fuelRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.requestNumber}</TableCell>
                            <TableCell>
                              {request.equipment?.name} ({request.equipment?.equipmentCode})
                            </TableCell>
                            <TableCell>{request.fuelType}</TableCell>
                            <TableCell>{request.quantity}L</TableCell>
                            <TableCell>
                              <Badge variant="outline">{request.status}</Badge>
                            </TableCell>
                            <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No fuel requests found for this project</p>
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
}
