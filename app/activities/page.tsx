import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db, withRetry } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Plus, Search, Calendar, MapPin, Edit, Trash2 } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ActivitiesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login")
  }

  let activities = []
  let error = null

  try {
    activities = await withRetry(async () => {
      return await db.activity.findMany({
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

  const formatDate = (date: Date | null) => {
    if (!date) return "Not set"
    return new Date(date).toLocaleDateString()
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <header className="dashboard-header">
          <div className="flex items-center gap-2 font-semibold">
            <Calendar className="h-5 w-5" />
            Activity Management
          </div>
        </header>
        <div className="p-6">
          <div className="error-state">
            <p className="text-destructive font-medium">Error: {error}</p>
            <Button asChild className="mt-4">
              <Link href="/activities">Retry</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 bg-white dark:bg-slate-900 min-h-screen">
      <header className="dashboard-header">
        <div className="flex items-center gap-2 font-semibold">
          <Calendar className="h-5 w-5" />
          Activity Management
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Button size="sm" asChild>
            <Link href="/activities/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Activity
            </Link>
          </Button>
        </div>
      </header>

      <div className="p-6">
        <div className="flex flex-col gap-6 animate-fade-in">
          {/*
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search activities..." className="w-full bg-background pl-8" />
            </div>
            <div className="flex items-center gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
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
                <SelectTrigger className="w-[180px]">
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
          </div> */}

          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Project Activities</CardTitle>
              <CardDescription>
                Track and manage project activities and tasks ({activities.length} activities)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity Name</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities && activities.length > 0 ? (
                      activities.map((activity) => (
                        <TableRow key={activity.id} className="hover:bg-muted/50 transition-colors">
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
                                className="font-medium hover:underline text-primary"
                              >
                                {activity.project.name}
                              </Link>
                              <div className="text-sm text-muted-foreground">{activity.project.projectCode}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(activity.status)}>
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
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/activities/${activity.id}`}>View</Link>
                              </Button>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/activities/${activity.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="empty-state">
                            <Calendar className="h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">No activities found</p>
                            <Button asChild className="mt-4">
                              <Link href="/activities/new">Add First Activity</Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
