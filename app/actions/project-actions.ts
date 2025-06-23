"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProjectStatus } from "@prisma/client"

export async function getProjects() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const projects = await prisma.project.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return {
      success: true,
      data: projects,
    }
  } catch (error) {
    console.error("Failed to fetch projects:", error)
    return {
      success: false,
      error: "Failed to fetch projects",
    }
  }
}

export async function getActiveProjects() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const projects = await prisma.project.findMany({
      where: {
        status: {
          in: [ProjectStatus.PLANNING, ProjectStatus.ACTIVE],
        },
      },
      select: {
        id: true,
        name: true,
        projectCode: true,
        status: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return {
      success: true,
      data: projects,
    }
  } catch (error) {
    console.error("Failed to fetch active projects:", error)
    return {
      success: false,
      error: "Failed to fetch active projects",
    }
  }
}

export async function createProject(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Please log in to create projects" }
    }

    // Extract form data
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const location = formData.get("location") as string
    const budget = formData.get("budget") as string
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string
    const clientId = formData.get("clientId") as string
    let projectCode = formData.get("projectCode") as string

    console.log("📝 Creating project with data:", {
      name,
      description,
      location,
      budget,
      startDate,
      endDate,
      clientId,
      projectCode,
    })

    // Basic validation
    if (!name || !budget) {
      return { success: false, error: "Project name and budget are required" }
    }

    if (!projectCode) {
      return { success: false, error: "Project code is required" }
    }

    // Enhanced duplicate checking with retry logic
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      // Check if project code already exists
      const existingProject = await prisma.project.findUnique({
        where: { projectCode },
        select: { id: true },
      })

      if (!existingProject) {
        // Project code is available, break out of loop
        break
      }

      // If this is the original code from the form, try to generate a new one
      attempts++
      console.log(`⚠️ Project code ${projectCode} already exists, attempt ${attempts}/${maxAttempts}`)

      if (attempts >= maxAttempts) {
        return {
          success: false,
          error: "Unable to generate a unique project code. Please try again or enter a custom code.",
        }
      }

      // Generate a new project code
      try {
        const lastProject = await prisma.project.findFirst({
          where: {
            projectCode: {
              startsWith: "PRJ-",
            },
          },
          orderBy: {
            projectCode: "desc",
          },
          select: {
            projectCode: true,
          },
        })

        let nextNumber = 1
        if (lastProject?.projectCode) {
          const match = lastProject.projectCode.match(/PRJ-(\d+)/)
          if (match) {
            nextNumber = Number.parseInt(match[1]) + 1
          }
        }

        // Add some randomness to avoid conflicts in concurrent requests
        nextNumber += Math.floor(Math.random() * 10)
        projectCode = `PRJ-${String(nextNumber).padStart(4, "0")}`
        console.log(`🔄 Generated new project code: ${projectCode}`)
      } catch (error) {
        console.error("Failed to generate new project code:", error)
        // Fallback to timestamp-based code
        const timestamp = Date.now().toString().slice(-6)
        projectCode = `PRJ-${timestamp}`
        console.log(`🔄 Using timestamp-based code: ${projectCode}`)
      }
    }

    // Create project data - only using fields that exist in schema
    const projectData: any = {
      name,
      description: description || null,
      location: location || null,
      budget: Number.parseFloat(budget),
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      projectCode,
      status: ProjectStatus.PLANNING,
      createdById: Number.parseInt(session.user.id),
    }

    // Add client if provided
    if (clientId && clientId !== "" && clientId !== "NO_CLIENT") {
      projectData.clientId = Number.parseInt(clientId)
    }

    console.log("🚀 Final project data:", projectData)

    // Create the project
    const project = await prisma.project.create({
      data: projectData,
    })

    console.log("✅ Project created successfully:", project)

    // Revalidate and redirect
    revalidatePath("/projects")
    redirect("/projects")
  } catch (error: any) {
    console.error("❌ Failed to create project:", error)

    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return {
        success: false,
        error: "A project with this code already exists. Please try again with a different code.",
      }
    }

    return {
      success: false,
      error: "Failed to create project. Please try again.",
    }
  }
}

export async function updateProject(id: number, formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const location = formData.get("location") as string
    const budget = formData.get("budget") as string
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string
    const clientId = formData.get("clientId") as string
    const status = formData.get("status") as string
    const projectCode = formData.get("projectCode") as string

    console.log("📝 Updating project with data:", {
      id,
      name,
      description,
      location,
      budget,
      startDate,
      endDate,
      clientId,
      status,
      projectCode,
    })

    // Basic validation
    if (!name || !budget) {
      return { success: false, error: "Project name and budget are required" }
    }

    if (!projectCode) {
      return { success: false, error: "Project code is required" }
    }

    // Check if project code already exists (excluding current project)
    const existingProject = await prisma.project.findFirst({
      where: {
        projectCode,
        NOT: { id },
      },
      select: { id: true },
    })

    if (existingProject) {
      return { success: false, error: "Project code already exists. Please use a different code." }
    }

    const updateData: any = {
      name,
      description: description || null,
      location: location || null,
      budget: Number.parseFloat(budget),
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      status: status as ProjectStatus,
      projectCode,
    }

    if (clientId && clientId !== "" && clientId !== "NO_CLIENT") {
      updateData.clientId = Number.parseInt(clientId)
    } else {
      updateData.clientId = null
    }

    console.log("🚀 Final update data:", updateData)

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
    })

    console.log("✅ Project updated successfully:", updatedProject)

    revalidatePath("/projects")
    revalidatePath(`/projects/${id}`)
    redirect(`/projects/${id}`)
  } catch (error) {
    console.error("❌ Failed to update project:", error)
    return { success: false, error: "Failed to update project" }
  }
}

export async function deleteProject(id: number, force = false) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check for dependencies
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        activities: { select: { id: true } },
        equipmentAssignments: { select: { id: true } },
        fuelRequests: { select: { id: true } },
        projectAssignments: { select: { id: true } },
      },
    })

    if (!project) {
      return { success: false, error: "Project not found" }
    }

    const hasDependencies =
      project.activities.length > 0 ||
      project.equipmentAssignments.length > 0 ||
      project.fuelRequests.length > 0 ||
      project.projectAssignments.length > 0

    if (hasDependencies && !force) {
      return {
        success: false,
        error: "Cannot delete project with existing dependencies",
        details: {
          activities: project.activities.length,
          equipmentAssignments: project.equipmentAssignments.length,
          fuelRequests: project.fuelRequests.length,
          projectAssignments: project.projectAssignments.length,
        },
        canForceDelete: true,
      }
    }

    // If force delete, remove dependencies first
    if (force && hasDependencies) {
      console.log("🗑️ Force deleting project dependencies...")

      // Delete in correct order to avoid foreign key constraints
      await prisma.$transaction(async (tx) => {
        // Delete fuel requests first
        if (project.fuelRequests.length > 0) {
          await tx.fuelRequest.deleteMany({
            where: { projectId: id },
          })
        }

        // Delete equipment assignments
        if (project.equipmentAssignments.length > 0) {
          await tx.equipmentAssignment.deleteMany({
            where: { projectId: id },
          })
        }

        // Delete project assignments
        if (project.projectAssignments.length > 0) {
          await tx.projectAssignment.deleteMany({
            where: { projectId: id },
          })
        }

        // Delete activities
        if (project.activities.length > 0) {
          await tx.activity.deleteMany({
            where: { projectId: id },
          })
        }

        // Finally delete the project
        await tx.project.delete({
          where: { id },
        })
      })
    } else {
      // Simple delete (no dependencies)
      await prisma.project.delete({ where: { id } })
    }

    revalidatePath("/projects")
    return {
      success: true,
      message: `Project "${project.name}" ${force ? "and all its dependencies" : ""} deleted successfully`,
    }
  } catch (error) {
    console.error("Failed to delete project:", error)
    return { success: false, error: "Failed to delete project" }
  }
}

export async function updateProjectStatus(id: number, status: ProjectStatus) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: { status },
    })

    revalidatePath("/projects")
    revalidatePath(`/projects/${id}`)
    return { success: true, data: updatedProject }
  } catch (error) {
    console.error("Failed to update project status:", error)
    return { success: false, error: "Failed to update project status" }
  }
}

// Alias for backward compatibility
export const createProjectSimple = createProject
