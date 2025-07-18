import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { EditProjectForm } from "./edit-project-form"

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

  return <EditProjectForm project={project} clients={clients} />
}
