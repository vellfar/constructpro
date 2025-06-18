"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function getFuelRequests() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const fuelRequests = await prisma.fuelRequest.findMany({
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            equipmentCode: true,
            type: true,
            status: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            projectCode: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, data: fuelRequests }
  } catch (error) {
    console.error("Failed to fetch fuel requests:", error)
    return { success: false, error: "Failed to fetch fuel requests" }
  }
}

export async function createFuelRequest(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const equipmentId = Number.parseInt(formData.get("equipmentId") as string)
    const projectId = Number.parseInt(formData.get("projectId") as string)
    const fuelType = formData.get("fuelType") as string
    const quantity = Number.parseFloat(formData.get("quantity") as string)
    const justification = formData.get("justification") as string

    if (!equipmentId || !projectId || !fuelType || !quantity || !justification) {
      return { success: false, error: "Required fields are missing" }
    }

    // Generate unique request number
    const requestNumber = `FR-${Date.now()}`

    await prisma.fuelRequest.create({
      data: {
        requestNumber,
        equipmentId,
        projectId,
        fuelType: fuelType as any,
        quantity,
        justification,
        requestedById: Number.parseInt(session.user.id),
        status: "PENDING",
      },
    })

    revalidatePath("/fuel-management")
    return { success: true, message: "Fuel request created successfully" }
  } catch (error) {
    console.error("Failed to create fuel request:", error)
    return { success: false, error: "Failed to create fuel request" }
  }
}

export async function approveFuelRequest(id: number, approved: boolean, comments?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  // Check if user has permission to approve (Admin or Project Manager)
  if (!["Admin", "Project Manager"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" }
  }

  try {
    await prisma.fuelRequest.update({
      where: { id },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        approvedById: Number.parseInt(session.user.id),
        approvalDate: new Date(),
        rejectionReason: approved ? null : comments,
      },
    })

    revalidatePath("/fuel-management")
    return { success: true }
  } catch (error) {
    console.error("Failed to update fuel request:", error)
    return { success: false, error: "Failed to update fuel request" }
  }
}

export async function deleteFuelRequest(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await prisma.fuelRequest.delete({
      where: { id },
    })

    revalidatePath("/fuel-management")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete fuel request:", error)
    return { success: false, error: "Failed to delete fuel request" }
  }
}
