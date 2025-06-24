import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { updateActivity } from "@/app/actions/activity-actions"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface EditActivityPageProps {
  params: {
    id: string
  }
}

export default async function EditActivityPage({ params }: EditActivityPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login")
  }

  const activityId = Number.parseInt(params.id)
  if (isNaN(activityId)) {
    notFound()
  }

  const [activity, projects] = await Promise.all([
    prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectCode: true,
          },
        },
      },
    }),
    prisma.project.findMany({
      select: {
        id: true,
        name: true,
        projectCode: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ])

  if (!activity) {
    notFound()
  }

  async function handleSubmit(formData: FormData) {
    "use server"
    const result = await updateActivity(activityId, formData)
    if (result.success) {
      redirect(`/activities/${activityId}`)
    }
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href={`/activities/${activityId}`} className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 font-semibold">Edit Activity</div>
      </header>

      <div className="container max-w-2xl py-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit Activity</CardTitle>
            <CardDescription>Update the activity details</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Activity Name</Label>
                <Input id="name" name="name" defaultValue={activity.name} placeholder="Enter activity name" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={activity.description || ""}
                  placeholder="Enter activity description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectId">Project</Label>
                <Select name="projectId" defaultValue={activity.projectId.toString() || "__EMPTY__"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__EMPTY__" disabled>
                      Select a project
                    </SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.projectCode} - {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={activity.status || "__EMPTY__"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__EMPTY__" disabled>
                      Select status
                    </SelectItem>
                    <SelectItem value="PLANNED">Planned</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="DELAYED">Delayed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue={activity.startDate ? new Date(activity.startDate).toISOString().split("T")[0] : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={activity.endDate ? new Date(activity.endDate).toISOString().split("T")[0] : ""}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit">Update Activity</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/activities/${activityId}`}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
