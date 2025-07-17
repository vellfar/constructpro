"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { db, withRetry } from "@/lib/db"

export async function getUsers() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const users = await withRetry(async () => {
      return await db.user.findMany({
        include: {
          role: true,
          employee: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    })

    return { success: true, data: users }
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return { success: false, error: "Failed to fetch users" }
  }
}

export async function createUser(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "Admin") {
    return { success: false, error: "Unauthorized - Admin access required" }
  }

  const email = formData.get("email") as string
  const username = (formData.get("username") as string) || email
  const password = formData.get("password") as string
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const roleId = Number.parseInt(formData.get("roleId") as string)
  const phoneNumber = formData.get("phoneNumber") as string

  if (!email || !password || !firstName || !lastName || !roleId) {
    return { success: false, error: "Missing required fields" }
  }

  try {
    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    })

    if (existingUser) {
      return { success: false, error: "User with this email or username already exists" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    await withRetry(async () => {
      await db.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          firstName,
          lastName,
          phoneNumber: phoneNumber || null,
          roleId,
        },
      })
    })

    revalidatePath("/users")
    return { success: true }
  } catch (error) {
    console.error("Failed to create user:", error)
    return { success: false, error: "Server error while creating user" }
  }
}

export async function updateUser(id: number, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "Admin") {
    return { success: false, error: "Unauthorized - Admin access required" }
  }

  try {
    const email = formData.get("email") as string
    const username = formData.get("username") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const roleId = Number.parseInt(formData.get("roleId") as string)
    const phoneNumber = formData.get("phoneNumber") as string
    const isActive = formData.get("isActive") === "on"
    const password = formData.get("password") as string | undefined

    if (!email || !firstName || !lastName || !roleId) {
      return { success: false, error: "Required fields are missing" }
    }

    // Parse assigned projects and equipment from formData
    const projectIds = formData.getAll("projectIds").map((id) => Number(id))
    const equipmentIds = formData.getAll("equipmentIds").map((id) => Number(id))

    await withRetry(async () => {
      // Update user basic info
      const updateData: any = {
        email,
        username: username || email,
        firstName,
        lastName,
        phoneNumber: phoneNumber || null,
        roleId,
        isActive,
        // Audit trail
        updatedBy: session.user.email,
        updatedAt: new Date(),
      }
      if (password) {
        updateData.password = await bcrypt.hash(password, 12)
      }
      await db.user.update({
        where: { id },
        data: updateData as any,
      })

      // Soft delete (archive) existing project assignments for this user
      await db.projectAssignment.updateMany({
        where: { userId: id, endDate: null },
        data: {
          endDate: new Date(),
          role: "ARCHIVED",
        },
      })

      // Validate projectIds (ensure projects exist)
      const validProjectIds = await db.project.findMany({
        where: { id: { in: projectIds } },
        select: { id: true },
      })
      const validIdsSet = new Set(validProjectIds.map(p => p.id))

      // Add new project assignments with required fields
      if (projectIds.length > 0) {
        const defaultRole = "Member"
        const defaultStartDate = new Date()
        const formRoles = formData.getAll("projectRoles") as string[]
        const formStartDates = formData.getAll("projectStartDates") as string[]
        const formEndDates = formData.getAll("projectEndDates") as string[]
        await db.projectAssignment.createMany({
          data: projectIds
            .filter(projectId => validIdsSet.has(projectId))
            .map((projectId, idx) => ({
              userId: id,
              projectId,
              role: formRoles[idx] || defaultRole,
              startDate: formStartDates[idx] ? new Date(formStartDates[idx]) : defaultStartDate,
              endDate: formEndDates[idx] ? new Date(formEndDates[idx]) : null,
              assignedBy: session.user.email,
              assignedAt: new Date(),
              status: "ACTIVE",
            })),
          skipDuplicates: true,
        })
      }

      // Archive (soft delete) existing equipment assignments for this user and equipment
      if (equipmentIds.length > 0) {
        await db.equipmentAssignment.updateMany({
          where: {
            userId: id,
            equipmentId: { in: equipmentIds },
            endDate: null,
          },
          data: {
            endDate: new Date(),
            notes: "ARCHIVED",
            status: "ARCHIVED",
          },
        })
      }

      // Validate equipmentIds
      const validEquipmentIds = await db.equipment.findMany({
        where: { id: { in: equipmentIds } },
        select: { id: true },
      })
      const validEquipmentSet = new Set(validEquipmentIds.map(e => e.id))

      // Add new equipment assignments with required fields
      if (equipmentIds.length > 0) {
        const defaultStartDate = new Date()
        const defaultAssignedBy = session.user?.email || "system"
        const formProjectIds = formData.getAll("equipmentProjectIds").map(Number)
        const formStartDates = formData.getAll("equipmentStartDates") as string[]
        const formEndDates = formData.getAll("equipmentEndDates") as string[]
        const formAssignedBys = formData.getAll("equipmentAssignedBy") as string[]
        await db.equipmentAssignment.createMany({
          data: equipmentIds
            .filter(equipmentId => validEquipmentSet.has(equipmentId))
            .map((equipmentId, idx) => ({
              userId: id,
              equipmentId,
              projectId: validIdsSet.has(formProjectIds[idx]) ? formProjectIds[idx] : (projectIds[0] || 1),
              startDate: formStartDates[idx] ? new Date(formStartDates[idx]) : defaultStartDate,
              endDate: formEndDates[idx] ? new Date(formEndDates[idx]) : null,
              assignedBy: formAssignedBys[idx] || defaultAssignedBy,
              assignedAt: new Date(),
              status: "ACTIVE",
            })),
          skipDuplicates: true,
        })
      }
    })

    revalidatePath("/users")
    revalidatePath(`/users/${id}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to update user:", error)
    return { success: false, error: "Failed to update user" }
  }
}

export async function deleteUser(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "Admin") {
    return { success: false, error: "Unauthorized - Admin access required" }
  }

  try {
    // Soft delete: set isActive to false and record deletedBy/deletedAt
    await withRetry(async () => {
      await db.user.update({
        where: { id },
        data: {
          isActive: false,
          deletedBy: session.user.email,
          deletedAt: new Date(),
        } as any,
      })
    })

    revalidatePath("/users")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete user:", error)
    return { success: false, error: "Failed to delete user" }
  }
}

export async function toggleUserStatus(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "Admin") {
    return { success: false, error: "Unauthorized - Admin access required" }
  }

  try {
    const user = await db.user.findUnique({
      where: { id },
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    await withRetry(async () => {
      return await db.user.update({
        where: { id },
        data: {
          isActive: !user.isActive,
        },
      })
    })

    revalidatePath("/users")
    return { success: true }
  } catch (error) {
    console.error("Failed to toggle user status:", error)
    return { success: false, error: "Failed to toggle user status" }
  }
}

export async function getUserById(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const user = await withRetry(async () => {
      return await db.user.findUnique({
        where: { id },
        include: {
          role: true,
          employee: true,
        },
      })
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    return { success: true, data: user }
  } catch (error) {
    console.error("Failed to fetch user:", error)
    return { success: false, error: "Failed to fetch user" }
  }
}
