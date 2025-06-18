"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function getEquipment() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const equipment = await prisma.equipment.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, data: equipment }
  } catch (error) {
    console.error("Failed to fetch equipment:", error)
    return { success: false, error: "Failed to fetch equipment" }
  }
}

export async function getEquipmentById(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
          orderBy: {
            startDate: "desc",
          },
        },
        fuelRequests: {
          include: {
            project: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            requestDate: "desc",
          },
        },
        assessments: {
          orderBy: {
            assessmentDate: "desc",
          },
        },
        locations: {
          orderBy: {
            dateMoved: "desc",
          },
        },
      },
    })

    if (!equipment) {
      return { success: false, error: "Equipment not found" }
    }

    return { success: true, data: equipment }
  } catch (error) {
    console.error("Failed to fetch equipment:", error)
    return { success: false, error: "Failed to fetch equipment" }
  }
}

export async function createEquipment(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const equipmentCode = formData.get("equipmentCode") as string
    const name = formData.get("name") as string
    const type = formData.get("type") as string
    const make = formData.get("make") as string
    const model = formData.get("model") as string
    const yearOfManufacture = formData.get("yearOfManufacture") as string
    const ownership = formData.get("ownership") as string
    const measurementType = formData.get("measurementType") as string
    const unit = formData.get("unit") as string
    const size = formData.get("size") as string
    const workMeasure = formData.get("workMeasure") as string
    const acquisitionCost = formData.get("acquisitionCost") as string
    const supplier = formData.get("supplier") as string
    const dateReceived = formData.get("dateReceived") as string

    if (
      !equipmentCode ||
      !name ||
      !type ||
      !make ||
      !model ||
      !ownership ||
      !measurementType ||
      !unit ||
      !workMeasure
    ) {
      return { success: false, error: "Required fields are missing" }
    }

    // Check if equipment code already exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { equipmentCode },
    })

    if (existingEquipment) {
      return { success: false, error: "Equipment code already exists" }
    }

    await prisma.equipment.create({
      data: {
        equipmentCode,
        name,
        type,
        make,
        model,
        yearOfManufacture: yearOfManufacture ? Number.parseInt(yearOfManufacture) : null,
        ownership: ownership as any,
        measurementType,
        unit,
        size: size ? Number.parseFloat(size) : null,
        workMeasure,
        acquisitionCost: acquisitionCost ? Number.parseFloat(acquisitionCost) : null,
        supplier: supplier || null,
        dateReceived: dateReceived ? new Date(dateReceived) : null,
        status: "OPERATIONAL",
      },
    })

    revalidatePath("/equipment")
    return { success: true }
  } catch (error) {
    console.error("Failed to create equipment:", error)
    return { success: false, error: "Failed to create equipment" }
  }
}

export async function updateEquipment(id: number, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const equipmentCode = formData.get("equipmentCode") as string
    const name = formData.get("name") as string
    const type = formData.get("type") as string
    const make = formData.get("make") as string
    const model = formData.get("model") as string
    const yearOfManufacture = formData.get("yearOfManufacture") as string
    const ownership = formData.get("ownership") as string
    const measurementType = formData.get("measurementType") as string
    const unit = formData.get("unit") as string
    const size = formData.get("size") as string
    const workMeasure = formData.get("workMeasure") as string
    const acquisitionCost = formData.get("acquisitionCost") as string
    const supplier = formData.get("supplier") as string
    const dateReceived = formData.get("dateReceived") as string
    const status = formData.get("status") as string

    await prisma.equipment.update({
      where: { id },
      data: {
        equipmentCode,
        name,
        type,
        make,
        model,
        yearOfManufacture: yearOfManufacture ? Number.parseInt(yearOfManufacture) : null,
        ownership: ownership as any,
        measurementType,
        unit,
        size: size ? Number.parseFloat(size) : null,
        workMeasure,
        acquisitionCost: acquisitionCost ? Number.parseFloat(acquisitionCost) : null,
        supplier: supplier || null,
        dateReceived: dateReceived ? new Date(dateReceived) : null,
        status: status as any,
      },
    })

    revalidatePath("/equipment")
    revalidatePath(`/equipment/${id}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to update equipment:", error)
    return { success: false, error: "Failed to update equipment" }
  }
}

export async function deleteEquipment(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await prisma.equipment.delete({
      where: { id },
    })

    revalidatePath("/equipment")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete equipment:", error)
    return { success: false, error: "Failed to delete equipment" }
  }
}

export async function updateEquipmentStatus(id: number, status: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await prisma.equipment.update({
      where: { id },
      data: { status: status as any },
    })

    revalidatePath("/equipment")
    revalidatePath(`/equipment/${id}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to update equipment status:", error)
    return { success: false, error: "Failed to update equipment status" }
  }
}

export async function assignEquipmentToProject(
  equipmentId: number,
  projectId: number,
  assignedBy: string,
  notes?: string,
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await prisma.equipmentAssignment.create({
      data: {
        equipmentId,
        projectId,
        startDate: new Date(),
        assignedBy,
        notes: notes || null,
      },
    })

    revalidatePath("/equipment")
    revalidatePath(`/equipment/${equipmentId}`)
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to assign equipment:", error)
    return { success: false, error: "Failed to assign equipment" }
  }
}
