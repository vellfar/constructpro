import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building } from "lucide-react"
import Link from "next/link"

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login")
  }

  const clientId = Number.parseInt(params.id)
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      projects: {
        select: {
          id: true,
          name: true,
          projectCode: true,
          status: true,
          startDate: true,
          endDate: true,
          budget: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  if (!client) {
    notFound()
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href="/clients" className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 font-semibold">{client.name}</div>
        <div className="ml-auto flex items-center gap-4">
          <Button size="sm" asChild>
            <Link href={`/clients/${client.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Client
            </Link>
          </Button>
        </div>
      </header>

      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Client Information
                </CardTitle>
                <CardDescription>Contact details and basic information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Contact Person</h4>
                      <p className="text-sm text-muted-foreground">{client.contactName || "Not specified"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{client.email || "No email provided"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{client.phone || "No phone provided"}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </h4>
                    <p className="text-sm text-muted-foreground">{client.address || "No address provided"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
                <CardDescription>All projects associated with this client</CardDescription>
              </CardHeader>
              <CardContent>
                {client.projects.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Budget</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell>
                            <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                              {project.name}
                            </Link>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{project.projectCode}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                project.status === "ACTIVE"
                                  ? "default"
                                  : project.status === "COMPLETED"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {project.startDate ? new Date(project.startDate).toLocaleDateString() : "Not started"} -{" "}
                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : "Ongoing"}
                          </TableCell>
                          <TableCell className="font-medium">
                            ${project.budget ? project.budget.toLocaleString() : "Not set"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No projects found for this client</p>
                    <Button className="mt-4" asChild>
                      <Link href="/projects/new">Create New Project</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Projects</span>
                    <span className="font-medium">{client.projects.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Projects</span>
                    <span className="font-medium">{client.projects.filter((p) => p.status === "ACTIVE").length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Completed Projects</span>
                    <span className="font-medium">
                      {client.projects.filter((p) => p.status === "COMPLETED").length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Budget</span>
                    <span className="font-medium">
                      ${client.projects.reduce((sum, p) => sum + (p.budget || 0), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Since</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{new Date(client.createdAt).toLocaleDateString()}</p>
                <p className="text-sm text-muted-foreground">
                  {Math.floor((Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
