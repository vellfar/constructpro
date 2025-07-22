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
    let equipment
    if (session.user.role === "Admin") {
      equipment = await prisma.equipment.findMany({
        orderBy: {
          createdAt: "desc",
        },
      })
    } else {
      // Only show equipment assigned to projects the user is assigned to
      const userAssignments = await prisma.projectAssignment.findMany({
        where: { userId: Number(session.user.id) },
        select: { projectId: true },
      })
      const assignedProjectIds = userAssignments.map((a) => a.projectId)
      const eqAssignments = await prisma.equipmentAssignment.findMany({
        where: { projectId: { in: assignedProjectIds } },
        select: { equipmentId: true },
      })
      const assignedEquipmentIds = eqAssignments.map((a) => a.equipmentId)
      equipment = await prisma.equipment.findMany({
        where: { id: { in: assignedEquipmentIds } },
        orderBy: {
          createdAt: "desc",
        },
      })
    }

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
            createdAt: "desc",
          },
        },
        assessments: {
          orderBy: {
            assessmentDate: "desc",
          },
        },
        locations: {
          orderBy: {
            startDate: "desc",
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
  if (!session?.user?.email) {
    return { success: false, error: "Please log in to create equipment" }
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

    // Only equipment code is required
    if (!equipmentCode?.trim()) {
      return { success: false, error: "Equipment code/plate number is required" }
    }

    // Check if equipment code already exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { equipmentCode: equipmentCode.trim() },
    })

    if (existingEquipment) {
      return { success: false, error: `Equipment code "${equipmentCode}" already exists` }
    }

    // Validate year of manufacture if provided
    let yearNum = null
    if (yearOfManufacture?.trim()) {
      yearNum = Number.parseInt(yearOfManufacture.trim())
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear()) {
        return { success: false, error: "Invalid year of manufacture" }
      }
    }

    // Validate size if provided
    let sizeNum = null
    if (size?.trim()) {
      sizeNum = Number.parseFloat(size.trim())
      if (isNaN(sizeNum) || sizeNum < 0) {
        return { success: false, error: "Invalid size value" }
      }
    }

    // Validate acquisition cost if provided
    let costNum = null
    if (acquisitionCost?.trim()) {
      costNum = Number.parseFloat(acquisitionCost.trim())
      if (isNaN(costNum) || costNum < 0) {
        return { success: false, error: "Invalid acquisition cost" }
      }
    }

    // Validate date received if provided
    let dateReceivedObj = null
    if (dateReceived?.trim()) {
      dateReceivedObj = new Date(dateReceived.trim())
      if (isNaN(dateReceivedObj.getTime())) {
        return { success: false, error: "Invalid date received" }
      }
      if (dateReceivedObj > new Date()) {
        return { success: false, error: "Date received cannot be in the future" }
      }
    }

    // Validate ownership if provided
    const validOwnership = ["OWNED", "RENTED", "LEASED", "UNRA", "MoWT"]
    if (ownership?.trim() && !validOwnership.includes(ownership.trim())) {
      return { success: false, error: "Invalid ownership type" }
    }

    const equipment = await prisma.equipment.create({
      data: {
        equipmentCode: equipmentCode.trim(),
        name: name?.trim() || equipmentCode.trim(), // Use equipment code as fallback name
        type: type?.trim() || "Equipment", // Default type
        make: make?.trim() || "Unknown", // Default make
        model: model?.trim() || "Unknown", // Default model
        yearOfManufacture: yearNum,
        ownership: (ownership?.trim() as any) || "OWNED", // Default ownership
        measurementType: measurementType?.trim() || "Unit", // Default measurement type
        unit: unit?.trim() || "pcs", // Default unit
        size: sizeNum,
        workMeasure: workMeasure?.trim() || "N/A", // Default work measure
        acquisitionCost: costNum,
        supplier: supplier?.trim() || null,
        dateReceived: dateReceivedObj,
        status: "OPERATIONAL",
      },
    })

    console.log("✅ Equipment created successfully:", equipment.id, equipment.name)

    revalidatePath("/equipment")
    return {
      success: true,
      data: equipment,
      message: `Equipment "${equipment.name}" created successfully`,
    }
  } catch (error) {
    console.error("❌ Failed to create equipment:", error)

    // Handle specific Prisma errors
    const err = error as any;
    if (err.code === "P2002") {
      return { success: false, error: "Equipment code already exists" }
    }

    return { success: false, error: "Failed to create equipment. Please try again." }
  }
}

export async function updateEquipment(id: number, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return { success: false, error: "Please log in to update equipment" }
  }

  try {
    // Check if equipment exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id },
    })

    if (!existingEquipment) {
      return { success: false, error: "Equipment not found" }
    }

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

    // Only equipment code is required
    if (!equipmentCode?.trim()) {
      return { success: false, error: "Equipment code/plate number is required" }
    }

    // Check if equipment code already exists (excluding current equipment)
    if (equipmentCode.trim() !== existingEquipment.equipmentCode) {
      const duplicateEquipment = await prisma.equipment.findUnique({
        where: { equipmentCode: equipmentCode.trim() },
      })

      if (duplicateEquipment) {
        return { success: false, error: `Equipment code "${equipmentCode}" already exists` }
      }
    }

    // Permission check: only Admin or user assigned to the equipment's project
    const isAdmin = session.user.role === "Admin"
    if (!isAdmin) {
      // Find equipment assignment
      const eqAssignment = await prisma.equipmentAssignment.findFirst({
        where: { equipmentId: id },
        select: { projectId: true },
      })
      if (!eqAssignment) {
        return { success: false, error: "Forbidden: No project assignment for this equipment" }
      }
      // Check if user is assigned to the project
      const userAssignment = await prisma.projectAssignment.findFirst({
        where: { userId: Number(session.user.id), projectId: eqAssignment.projectId },
      })
      if (!userAssignment) {
        return { success: false, error: "Forbidden: You are not assigned to the equipment's project" }
      }
    }

    // Validate year of manufacture if provided
    let yearNum = null
    if (yearOfManufacture?.trim()) {
      yearNum = Number.parseInt(yearOfManufacture.trim())
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear()) {
        return { success: false, error: "Invalid year of manufacture" }
      }
    }

    // Validate size if provided
    let sizeNum = null
    if (size?.trim()) {
      sizeNum = Number.parseFloat(size.trim())
      if (isNaN(sizeNum) || sizeNum < 0) {
        return { success: false, error: "Invalid size value" }
      }
    }

    // Validate acquisition cost if provided
    let costNum = null
    if (acquisitionCost?.trim()) {
      costNum = Number.parseFloat(acquisitionCost.trim())
      if (isNaN(costNum) || costNum < 0) {
        return { success: false, error: "Invalid acquisition cost" }
      }
    }

    // Validate date received if provided
    let dateReceivedObj = null
    if (dateReceived?.trim()) {
      dateReceivedObj = new Date(dateReceived.trim())
      if (isNaN(dateReceivedObj.getTime())) {
        return { success: false, error: "Invalid date received" }
      }
      if (dateReceivedObj > new Date()) {
        return { success: false, error: "Date received cannot be in the future" }
      }
    }

    // Validate ownership if provided
    const validOwnership = ["OWNED", "RENTED", "LEASED", "UNRA", "MoWT"]
    if (ownership?.trim() && !validOwnership.includes(ownership.trim())) {
      return { success: false, error: "Invalid ownership type" }
    }

    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: {
        equipmentCode: equipmentCode.trim(),
        name: name?.trim() || equipmentCode.trim(), // Use equipment code as fallback name
        type: type?.trim() || existingEquipment.type || "Equipment",
        make: make?.trim() || existingEquipment.make || "Unknown",
        model: model?.trim() || existingEquipment.model || "Unknown",
        yearOfManufacture: yearNum,
        ownership: (ownership?.trim() as any) || existingEquipment.ownership || "OWNED",
        measurementType: measurementType?.trim() || existingEquipment.measurementType || "Unit",
        unit: unit?.trim() || existingEquipment.unit || "pcs",
        size: sizeNum,
        workMeasure: workMeasure?.trim() || existingEquipment.workMeasure || "N/A",
        acquisitionCost: costNum,
        supplier: supplier?.trim() || null,
        dateReceived: dateReceivedObj,
        status: (status?.trim() as any) || existingEquipment.status || "OPERATIONAL",
      },
    })

    console.log("✅ Equipment updated successfully:", updatedEquipment.id, updatedEquipment.name)

    revalidatePath("/equipment")
    revalidatePath(`/equipment/${id}`)
    return {
      success: true,
      data: updatedEquipment,
      message: `Equipment "${updatedEquipment.name}" updated successfully`,
    }
  } catch (error) {
    console.error("❌ Failed to update equipment:", error)

    // Handle specific Prisma errors
    const err = error as any;
    if (err.code === "P2002") {
      return { success: false, error: "Equipment code already exists" }
    }

    return { success: false, error: "Failed to update equipment. Please try again." }
  }
}

export async function deleteEquipment(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Check if equipment exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        assignments: true,
        fuelRequests: true,
      },
    })

    if (!existingEquipment) {
      return { success: false, error: "Equipment not found" }
    }

    // Check for dependencies
    const hasActiveAssignments = existingEquipment.assignments.some((a) => !a.endDate)
    const hasFuelRequests = existingEquipment.fuelRequests.length > 0

    if (hasActiveAssignments || hasFuelRequests) {
      return {
        success: false,
        error: "Cannot delete equipment with active assignments or fuel requests",
      }
    }

    // Permission check: only Admin or user assigned to the equipment's project
    const isAdmin = session.user.role === "Admin"
    if (!isAdmin) {
      // Find equipment assignment
      const eqAssignment = await prisma.equipmentAssignment.findFirst({
        where: { equipmentId: id },
        select: { projectId: true },
      })
      if (!eqAssignment) {
        return { success: false, error: "Forbidden: No project assignment for this equipment" }
      }
      // Check if user is assigned to the project
      const userAssignment = await prisma.projectAssignment.findFirst({
        where: { userId: Number(session.user.id), projectId: eqAssignment.projectId },
      })
      if (!userAssignment) {
        return { success: false, error: "Forbidden: You are not assigned to the equipment's project" }
      }
    }

    // Actually delete the equipment record
    await prisma.equipment.delete({
      where: { id },
    })

    console.log("✅ Equipment deleted successfully:", existingEquipment.name)

    revalidatePath("/equipment")
    return {
      success: true,
      message: `Equipment "${existingEquipment.name}" deleted successfully`,
    }
  } catch (error) {
    console.error("❌ Failed to delete equipment:", error)
    return { success: false, error: "Failed to delete equipment. Please try again." }
  }
}

export async function updateEquipmentStatus(id: number, status: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const validStatuses = ["OPERATIONAL", "UNDER_MAINTENANCE", "OUT_OF_SERVICE", "RETIRED"]
    if (!validStatuses.includes(status)) {
      return { success: false, error: "Invalid status" }
    }

    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: { status: status as any },
    })

    revalidatePath("/equipment")
    revalidatePath(`/equipment/${id}`)
    return {
      success: true,
      data: updatedEquipment,
      message: `Equipment status updated to ${status}`,
    }
  } catch (error) {
    console.error("❌ Failed to update equipment status:", error)
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
    // Check if equipment and project exist
    const [equipment, project] = await Promise.all([
      prisma.equipment.findUnique({ where: { id: equipmentId } }),
      prisma.project.findUnique({ where: { id: projectId } }),
    ])

    if (!equipment) {
      return { success: false, error: "Equipment not found" }
    }
    if (!project) {
      return { success: false, error: "Project not found" }
    }

    // Check if equipment is already assigned to this project
    const existingAssignment = await prisma.equipmentAssignment.findFirst({
      where: {
        equipmentId,
        projectId,
        endDate: null, // Active assignment
      },
    })

    if (existingAssignment) {
      return { success: false, error: "Equipment is already assigned to this project" }
    }

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
    return {
      success: true,
      message: `Equipment "${equipment.name}" assigned to project "${project.name}"`,
    }
  } catch (error) {
    console.error("❌ Failed to assign equipment:", error)
    return { success: false, error: "Failed to assign equipment" }
  }
}

// Create Equipment Assessment
export async function createEquipmentAssessment(
  equipmentId: number,
  assessmentDate: string,
  assessor: string,
  notes?: string,
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    if (!assessmentDate?.trim() || !assessor?.trim()) {
      return { success: false, error: "Assessment date and assessor are required" }
    }

    const dateObj = new Date(assessmentDate.trim())
    if (isNaN(dateObj.getTime())) {
      return { success: false, error: "Invalid assessment date" }
    }

    await prisma.equipmentAssessment.create({
      data: {
        equipmentId,
        assessmentDate: dateObj,
        assessor: assessor.trim(),
        notes: notes?.trim() || null,
      },
    })

    revalidatePath(`/equipment/${equipmentId}`)
    return { success: true, message: "Assessment created successfully" }
  } catch (error) {
    console.error("❌ Failed to create assessment:", error)
    return { success: false, error: "Failed to create assessment" }
  }
}

// Update Equipment Assessment
export async function updateEquipmentAssessment(id: number, assessmentDate: string, assessor: string, notes?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    if (!assessmentDate?.trim() || !assessor?.trim()) {
      return { success: false, error: "Assessment date and assessor are required" }
    }

    const dateObj = new Date(assessmentDate.trim())
    if (isNaN(dateObj.getTime())) {
      return { success: false, error: "Invalid assessment date" }
    }

    await prisma.equipmentAssessment.update({
      where: { id },
      data: {
        assessmentDate: dateObj,
        assessor: assessor.trim(),
        notes: notes?.trim() || null,
      },
    })

    return { success: true, message: "Assessment updated successfully" }
  } catch (error) {
    console.error("❌ Failed to update assessment:", error)
    return { success: false, error: "Failed to update assessment" }
  }
}

// Create Equipment Location
export async function createEquipmentLocation(
  equipmentId: number,
  location: string,
  startDate: string,
  endDate?: string,
  notes?: string,
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    if (!location?.trim() || !startDate?.trim()) {
      return { success: false, error: "Location and start date are required" }
    }

    const startDateObj = new Date(startDate.trim())
    if (isNaN(startDateObj.getTime())) {
      return { success: false, error: "Invalid start date" }
    }

    let endDateObj = null
    if (endDate?.trim()) {
      endDateObj = new Date(endDate.trim())
      if (isNaN(endDateObj.getTime())) {
        return { success: false, error: "Invalid end date" }
      }
      if (endDateObj <= startDateObj) {
        return { success: false, error: "End date must be after start date" }
      }
    }

    await prisma.equipmentLocation.create({
      data: {
        equipmentId,
        location: location.trim(),
        startDate: startDateObj,
        endDate: endDateObj,
        notes: notes?.trim() || null,
      },
    })

    revalidatePath(`/equipment/${equipmentId}`)
    return { success: true, message: "Location created successfully" }
  } catch (error) {
    console.error("❌ Failed to create location:", error)
    return { success: false, error: "Failed to create location" }
  }
}

// Update Equipment Location
export async function updateEquipmentLocation(
  id: number,
  location: string,
  startDate: string,
  endDate?: string,
  notes?: string,
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    if (!location?.trim() || !startDate?.trim()) {
      return { success: false, error: "Location and start date are required" }
    }

    const startDateObj = new Date(startDate.trim())
    if (isNaN(startDateObj.getTime())) {
      return { success: false, error: "Invalid start date" }
    }

    let endDateObj = null
    if (endDate?.trim()) {
      endDateObj = new Date(endDate.trim())
      if (isNaN(endDateObj.getTime())) {
        return { success: false, error: "Invalid end date" }
      }
      if (endDateObj <= startDateObj) {
        return { success: false, error: "End date must be after start date" }
      }
    }

    await prisma.equipmentLocation.update({
      where: { id },
      data: {
        location: location.trim(),
        startDate: startDateObj,
        endDate: endDateObj,
        notes: notes?.trim() || null,
      },
    })

    return { success: true, message: "Location updated successfully" }
  } catch (error) {
    console.error("❌ Failed to update location:", error)
    return { success: false, error: "Failed to update location" }
  }
}
