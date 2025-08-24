import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { deleteUser } from "@/app/actions/user-actions"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface UserPageProps {
  params: {
    id: string
  }
}

export default async function UserPage({ params }: UserPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login")
  }

  const userId = Number.parseInt(params.id)
  if (isNaN(userId)) {
    notFound()
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      employee: true,
      projectAssignments: {
        include: {
          project: true,
        },
      },
      equipmentAssignments: {
        include: {
          equipment: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  const isAdmin = session.user.role === "Admin"

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href="/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </Link>
        <div className="flex items-center gap-2 font-semibold">User Details</div>
        {isAdmin && (
          <div className="ml-auto flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/users/${user.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <form action={async () => {
              "use server"
              await deleteUser(user.id)
              redirect("/users")
            }}>
              <Button variant="destructive" size="sm" type="submit">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </form>
          </div>
        )}
      </header>

      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* User Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {user.firstName} {user.lastName}
                  </CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
                <Badge variant={user.isActive ? "default" : "secondary"}>{user.isActive ? "Active" : "Inactive"}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">Contact Information</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Email:</strong> {user.email}
                    </p>
                    <p>
                      <strong>Phone:</strong> {user.phoneNumber || "Not provided"}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Account Details</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Role:</strong> {user.role.name}
                    </p>
                    <p>
                      <strong>Status:</strong> {user.isActive ? "Active" : "Inactive"}
                    </p>
                    <p>
                      <strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employee Information */}
          {user.employee && (
            <Card>
              <CardHeader>
                <CardTitle>Employee Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Employee Number</p>
                    <p className="font-medium">{user.employee.employeeNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Section</p>
                    <p className="font-medium">{user.employee.section}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Designation</p>
                    <p className="font-medium">{user.employee.designation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Appointment</p>
                    <p className="font-medium">{new Date(user.employee.dateOfAppointment).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assigned Projects */}
          {user.projectAssignments && user.projectAssignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Assigned Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2">
                  {user.projectAssignments.map((assignment: any) => (
                    <div key={assignment.project.id} className="p-2 border rounded flex flex-col gap-1">
                      <p className="font-medium">{assignment.project.name}</p>
                      <p className="text-sm text-muted-foreground">Code: {assignment.project.projectCode || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">Role: {assignment.role}</p>
                      <form action={async () => {
                        'use server'
                        const { unassignUserFromProject } = require('@/app/actions/project-actions')
                        await unassignUserFromProject(user.id, assignment.project.id)
                        // Optionally revalidate or redirect
                      }}>
                        <Button type="submit" size="sm" variant="outline">Unassign</Button>
                      </form>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assigned Equipment */}
          {user.equipmentAssignments && user.equipmentAssignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Assigned Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2">
                  {user.equipmentAssignments.map((assignment: any) => (
                    <div key={assignment.equipment.id} className="p-2 border rounded flex flex-col gap-1">
                      <p className="font-medium">{assignment.equipment.name}</p>
                      <p className="text-sm text-muted-foreground">Code: {assignment.equipment.equipmentCode || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">Project: {assignment.projectId}</p>
                      <form action={async () => {
                        'use server'
                        const { unassignEquipmentFromProject } = require('@/app/actions/equipment-actions')
                        await unassignEquipmentFromProject(assignment.equipment.id, assignment.projectId)
                        // Optionally revalidate or redirect
                      }}>
                        <Button type="submit" size="sm" variant="outline">Unassign</Button>
                      </form>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Account Created</p>
                  <p className="text-lg font-semibold">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-semibold">{new Date(user.updatedAt).toLocaleDateString()}</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Role Level</p>
                  <p className="text-lg font-semibold">{user.role.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
