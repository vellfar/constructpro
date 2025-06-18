"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function createProject(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const location = formData.get("location") as string
  const budget = Number.parseFloat(formData.get("budget") as string)
  const clientId = Number.parseInt(formData.get("clientId") as string)

  if (!name || !budget) {
    return { success: false, error: "Name and budget are required" }
  }

  try {
    // Generate a unique project code
    const projectCode = `PRJ-${Date.now().toString().slice(-6)}`

    await prisma.project.create({
      data: {
        name,
        description,
        location,
        budget,
        clientId,
        startDate: new Date(),
        status: "PLANNING",
        projectCode,
      },
    })

    revalidatePath("/projects")
    return { success: true }
  } catch (error) {
    console.error("Failed to create project:", error)
    return { success: false, error: "Failed to create project" }
  }
}

export async function getProjects() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const projects = await prisma.project.findMany({
      include: {
        client: true,
      },
    })

    return { success: true, data: projects }
  } catch (error) {
    console.error("Failed to fetch projects:", error)
    return { success: false, error: "Failed to fetch projects" }
  }
}

export async function updateProject(id: number, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const location = formData.get("location") as string
    const budget = Number.parseFloat(formData.get("budget") as string)
    const clientId = formData.get("clientId") as string
    const status = formData.get("status") as string
    const projectCode = formData.get("projectCode") as string
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string

    await prisma.project.update({
      where: { id },
      data: {
        name,
        description: description || null,
        location: location || null,
        budget,
        clientId: clientId ? Number.parseInt(clientId) : null,
        status: status as any,
        projectCode: projectCode || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    revalidatePath("/projects")
    revalidatePath(`/projects/${id}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to update project:", error)
    return { success: false, error: "Failed to update project" }
  }
}

export async function deleteProject(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await prisma.project.delete({
      where: { id },
    })

    revalidatePath("/projects")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete project:", error)
    return { success: false, error: "Failed to delete project" }
  }
}
