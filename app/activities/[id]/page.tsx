import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Activity, Calendar, Clock, MapPin } from "lucide-react"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface ActivityDetailPageProps {
  params: {
    id: string
  }
}

export default async function ActivityDetailPage({ params }: ActivityDetailPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login")
  }

  const activityId = Number.parseInt(params.id)
  if (isNaN(activityId)) {
    notFound()
  }

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true,
          plannedEndDate: true,
          location: true,
          projectCode: true,
        },
      },
    },
  })

  if (!activity) {
    notFound()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLANNED":
        return "bg-blue-100 text-blue-800"
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800"
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "DELAYED":
        return "bg-red-100 text-red-800"
      case "CANCELLED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href="/activities" className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 font-semibold">
          <Activity className="h-5 w-5" />
          Activity Details
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/activities/${activity.id}/edit`}>Edit Activity</Link>
          </Button>
        </div>
      </header>

      <div className="container max-w-4xl py-6">
        <div className="grid gap-6">
          {/* Activity Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{activity.name}</CardTitle>
                  {activity.description && (
                    <CardDescription className="text-base mt-2">{activity.description}</CardDescription>
                  )}
                </div>
                <Badge className={getStatusColor(activity.status)}>{activity.status.replace("_", " ")}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  {activity.startDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Start Date</p>
                        <p className="text-lg font-semibold">{new Date(activity.startDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  {activity.endDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">End Date</p>
                        <p className="text-lg font-semibold">{new Date(activity.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {activity.updatedAt !== activity.createdAt && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Last Updated</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Project Name</p>
                  <Link
                    href={`/projects/${activity.project.id}`}
                    className="text-lg font-semibold hover:underline text-blue-600"
                  >
                    {activity.project.name}
                  </Link>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Project Code</p>
                    <p className="text-sm font-mono">{activity.project.projectCode}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge
                      variant={
                        activity.project.status === "ACTIVE"
                          ? "default"
                          : activity.project.status === "COMPLETED"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {activity.project.status}
                    </Badge>
                  </div>
                </div>
                {activity.project.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <p className="text-sm">{activity.project.location}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Project Duration</p>
                  <p className="text-sm">
                    {new Date(activity.project.startDate).toLocaleDateString()} -{" "}
                    {activity.project.plannedEndDate ? new Date(activity.project.plannedEndDate).toLocaleDateString() : "Ongoing"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium">Activity Created</p>
                    <p className="text-sm text-muted-foreground">{new Date(activity.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {activity.updatedAt !== activity.createdAt && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">Last Updated</p>
                      <p className="text-sm text-muted-foreground">{new Date(activity.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {activity.startDate && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        new Date(activity.startDate) <= new Date() ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="font-medium">Scheduled Start</p>
                      <p className="text-sm text-muted-foreground">{new Date(activity.startDate).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {activity.endDate && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.status === "COMPLETED"
                          ? "bg-green-500"
                          : new Date(activity.endDate) < new Date()
                            ? "bg-red-500"
                            : "bg-gray-300"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="font-medium">Scheduled End</p>
                      <p className="text-sm text-muted-foreground">{new Date(activity.endDate).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
