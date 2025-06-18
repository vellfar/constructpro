"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function getActivities() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const activities = await prisma.activity.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            location: true,
            projectCode: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, data: activities }
  } catch (error) {
    console.error("Failed to fetch activities:", error)
    return { success: false, error: "Failed to fetch activities" }
  }
}

export async function createActivity(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const projectId = Number.parseInt(formData.get("projectId") as string)
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string

    if (!name || !description || !projectId) {
      return { success: false, error: "Name, description, and project are required" }
    }

    await prisma.activity.create({
      data: {
        name,
        description,
        projectId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: "PLANNED",
      },
    })

    revalidatePath("/activities")
    return { success: true }
  } catch (error) {
    console.error("Failed to create activity:", error)
    return { success: false, error: "Failed to create activity" }
  }
}

export async function updateActivity(id: number, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const projectId = Number.parseInt(formData.get("projectId") as string)
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string
    const status = formData.get("status") as string

    await prisma.activity.update({
      where: { id },
      data: {
        name,
        description: description || null,
        projectId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: (status as any) || "PLANNED",
      },
    })

    revalidatePath("/activities")
    return { success: true }
  } catch (error) {
    console.error("Failed to update activity:", error)
    return { success: false, error: "Failed to update activity" }
  }
}

export async function deleteActivity(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await prisma.activity.delete({
      where: { id },
    })

    revalidatePath("/activities")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete activity:", error)
    return { success: false, error: "Failed to delete activity" }
  }
}
