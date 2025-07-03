"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProjectStatus } from "@prisma/client"
import { redirect } from "next/navigation"

// Get all projects
export async function getProjects() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return { success: false, error: "Unauthorized" }

    const projects = await prisma.project.findMany({
      include: {
        client: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: projects }
  } catch (error) {
    console.error("Failed to fetch projects:", error)
    return { success: false, error: "Failed to fetch projects" }
  }
}

// Get active/planning projects
export async function getActiveProjects() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return { success: false, error: "Unauthorized" }

    const projects = await prisma.project.findMany({
      where: {
        status: { in: [ProjectStatus.PLANNING, ProjectStatus.ACTIVE] },
      },
      select: {
        id: true,
        name: true,
        projectCode: true,
        status: true,
      },
      orderBy: { name: "asc" },
    })

    return { success: true, data: projects }
  } catch (error) {
    console.error("Failed to fetch active projects:", error)
    return { success: false, error: "Failed to fetch active projects" }
  }
}

// Create project
export async function createProject(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return { success: false, error: "Please log in to create projects" }

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const location = formData.get("location") as string
    const budget = formData.get("budget") as string
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string
    const clientId = formData.get("clientId") as string
    let projectCode = formData.get("projectCode") as string

    if (!name || !budget) return { success: false, error: "Project name and budget are required" }

    if (!projectCode) {
      const last = await prisma.project.findFirst({
        where: { projectCode: { startsWith: "PRJ-" } },
        orderBy: { projectCode: "desc" },
        select: { projectCode: true },
      })

      let next = 1
      if (last?.projectCode) {
        const match = last.projectCode.match(/PRJ-(\d+)/)
        if (match) next = parseInt(match[1]) + 1
      }

      next += Math.floor(Math.random() * 5)
      projectCode = `PRJ-${String(next).padStart(4, "0")}`
    }

    const existing = await prisma.project.findUnique({ where: { projectCode } })
    if (existing) {
      return {
        success: false,
        error: `Project code ${projectCode} already exists. Try regenerating.`,
      }
    }

    const data: any = {
      name,
      description: description || null,
      location: location || null,
      budget: parseFloat(budget),
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      projectCode,
      status: ProjectStatus.PLANNING,
      createdById: Number(session.user.id),
    }

    if (clientId && clientId !== "NO_CLIENT") {
      data.clientId = Number(clientId)
    }

    const project = await prisma.project.create({ data })

    revalidatePath("/projects")
    return { success: true, data: project }
  } catch (error) {
    console.error("❌ Failed to create project:", error)
    return { success: false, error: "Failed to create project. Please try again." }
  }
}

// Update project — safe for internal usage (returns result)
export async function updateProject(
  id: number,
  formData: FormData
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return { success: false, error: "Unauthorized" }

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const location = formData.get("location") as string
    const budget = formData.get("budget") as string
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string
    const clientId = formData.get("clientId") as string
    const status = formData.get("status") as string
    const projectCode = formData.get("projectCode") as string

    if (!name || !budget || !projectCode) {
      return { success: false, error: "Required fields are missing" }
    }

    const duplicate = await prisma.project.findFirst({
      where: { projectCode, NOT: { id } },
    })
    if (duplicate) return { success: false, error: "Project code already exists." }

    const updateData: any = {
      name,
      description: description || null,
      location: location || null,
      budget: parseFloat(budget),
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      status: status as ProjectStatus,
      projectCode,
      clientId: clientId && clientId !== "NO_CLIENT" ? Number(clientId) : null,
    }

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/projects")
    revalidatePath(`/projects/${id}`)

    return { success: true, data: updated }
  } catch (error) {
    console.error("❌ Failed to update project:", error)
    return { success: false, error: "Failed to update project" }
  }
}

// Safe for use in <form action={...}>
export async function updateProjectFormAction(id: number, formData: FormData): Promise<void> {
  const result = await updateProject(id, formData)

  if (result.success) {
    redirect(`/projects/${id}`)
  } else {
    console.error("❌ Update error:", result.error)
    // Optionally: log or show error
  }
}

// Delete project
export async function deleteProject(id: number, force = false) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return { success: false, error: "Unauthorized" }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        activities: true,
        equipmentAssignments: true,
        fuelRequests: true,
        projectAssignments: true,
      },
    })

    if (!project) return { success: false, error: "Project not found" }

    const hasDependencies = [
      project.activities,
      project.equipmentAssignments,
      project.fuelRequests,
      project.projectAssignments,
    ].some((arr) => arr.length > 0)

    if (hasDependencies && !force) {
      return {
        success: false,
        error: "Project has dependencies. Use force delete.",
        canForceDelete: true,
      }
    }

    if (hasDependencies && force) {
      await prisma.$transaction(async (tx) => {
        await tx.fuelRequest.deleteMany({ where: { projectId: id } })
        await tx.equipmentAssignment.deleteMany({ where: { projectId: id } })
        await tx.projectAssignment.deleteMany({ where: { projectId: id } })
        await tx.activity.deleteMany({ where: { projectId: id } })
        await tx.project.delete({ where: { id } })
      })
    } else {
      await prisma.project.delete({ where: { id } })
    }

    revalidatePath("/projects")
    return { success: true, message: `Project "${project.name}" deleted` }
  } catch (error) {
    console.error("❌ Failed to delete project:", error)
    return { success: false, error: "Failed to delete project" }
  }
}

// Update only project status
export async function updateProjectStatus(id: number, status: ProjectStatus) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return { success: false, error: "Unauthorized" }

    const updated = await prisma.project.update({
      where: { id },
      data: { status },
    })

    revalidatePath("/projects")
    revalidatePath(`/projects/${id}`)
    return { success: true, data: updated }
  } catch (error) {
    console.error("Failed to update status:", error)
    return { success: false, error: "Failed to update status" }
  }
}

// Alias for compatibility
export const createProjectSimple = createProject
