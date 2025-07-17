import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import EditUserForm from "./EditUserForm" // Client component

export const dynamic = "force-dynamic"
export const revalidate = 0

interface EditUserPageProps {
  params: {
    id: string
  }
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (session.user.role !== "Admin") {
    redirect("/unauthorized")
  }

  const userId = Number.parseInt(params.id)
  if (isNaN(userId)) {
    notFound()
  }

  const [user, roles, projects, equipment, projectAssignments, equipmentAssignments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        employee: true,
      },
    }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.project.findMany({ orderBy: { name: "asc" } }),
    prisma.equipment.findMany({ orderBy: { name: "asc" } }),
    prisma.projectAssignment.findMany({ where: { userId }, include: { project: true } }),
    prisma.equipmentAssignment.findMany({ where: { assignedBy: userId.toString() } }),
  ])

  if (!user) {
    notFound()
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href={`/users/${user.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to User
          </Button>
        </Link>
        <div className="flex items-center gap-2 font-semibold">Edit User</div>
      </header>
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>
                Edit User: {user.firstName} {user.lastName}
              </CardTitle>
              <CardDescription>Update user information and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <EditUserForm
                user={user}
                roles={roles}
                projects={projects}
                equipment={equipment}
                projectAssignments={projectAssignments}
                equipmentAssignments={equipmentAssignments}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
