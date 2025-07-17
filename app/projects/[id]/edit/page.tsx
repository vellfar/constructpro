import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { updateProjectFormAction } from "@/app/actions/project-actions"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login")
  }

  const projectId = Number(params.id)

  let project = null
  let clients: Array<{ id: number; name: string }> = []

  try {
    ;[project, clients] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        include: { client: true },
      }),
      prisma.client.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ])
  } catch (error) {
    console.error("Database error:", error)
  }

  if (!project) {
    notFound()
  }

  const safeClientId = project.clientId ? project.clientId.toString() : "__NONE__"

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href={`/projects/${project.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </Link>
        <div className="flex items-center gap-2 font-semibold">Edit Project</div>
      </header>

      <div className="p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Edit Project</CardTitle>
            <CardDescription>Update project information and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateProjectFormAction.bind(null, project.id)} className="space-y-6" method="post">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input id="name" name="name" defaultValue={project.name} required placeholder="Enter project name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectCode">Project Code</Label>
                  <Input
                    id="projectCode"
                    name="projectCode"
                    defaultValue={project.projectCode || ""}
                    placeholder="PRJ-001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={project.description || ""}
                  placeholder="Project description and details"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client</Label>
                  <Select name="clientId" defaultValue={safeClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__">No client assigned</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                      {clients.length === 0 && (
                        <SelectItem value="__EMPTY__" disabled>
                          No clients available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={project.status || "PLANNING"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNING">Planning</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    defaultValue={project.location || ""}
                    placeholder="Project location"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget *</Label>
                  <Input
                    id="budget"
                    name="budget"
                    type="number"
                    step="0.01"
                    defaultValue={project.budget?.toString() || "0"}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plannedEndDate">Planned End Date</Label>
                  <Input
                    id="plannedEndDate"
                    name="plannedEndDate"
                    type="date"
                    defaultValue={project.plannedEndDate ? new Date(project.plannedEndDate).toISOString().split("T")[0] : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actualEndDate">Actual End Date</Label>
                  <Input
                    id="actualEndDate"
                    name="actualEndDate"
                    type="date"
                    defaultValue={project.actualEndDate ? new Date(project.actualEndDate).toISOString().split("T")[0] : ""}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit">Update Project</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/projects/${project.id}`}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
