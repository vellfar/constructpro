"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"

type CreateUserData = {
  username: string
  firstName: string
  lastName: string
  email: string
  password: string
  phoneNumber?: string
  roleId: string
}

type UpdateUserData = {
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
  roleId: string
  isActive: boolean
}

export async function getUsers() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "Unauthorized" }

  try {
    const users = await prisma.user.findMany({
      include: { role: true, employee: true },
      orderBy: { createdAt: "desc" },
    })
    return { success: true, data: users }
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return { success: false, error: "Failed to fetch users" }
  }
}

export async function createUser(data: CreateUserData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "Admin") {
    return { success: false, error: "Unauthorized - Admin access required" }
  }

  const { email, username, password, firstName, lastName, phoneNumber, roleId } = data

  if (!email || !password || !firstName || !lastName || !roleId) {
    return { success: false, error: "Required fields are missing" }
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return { success: false, error: "User with this email already exists" }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber: phoneNumber || null,
        roleId: parseInt(roleId),
      },
    })

    revalidatePath("/users")
    return { success: true }
  } catch (error) {
    console.error("Failed to create user:", error)
    return { success: false, error: "Failed to create user" }
  }
}

export async function updateUser(id: number, data: UpdateUserData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "Admin") {
    return { success: false, error: "Unauthorized - Admin access required" }
  }

  const { email, firstName, lastName, phoneNumber, roleId, isActive } = data

  if (!email || !firstName || !lastName || !roleId) {
    return { success: false, error: "Required fields are missing" }
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        email,
        firstName,
        lastName,
        phoneNumber: phoneNumber || null,
        roleId: parseInt(roleId),
        isActive,
      },
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
    await prisma.user.delete({ where: { id } })
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
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return { success: false, error: "User not found" }

    await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    })

    revalidatePath("/users")
    return { success: true }
  } catch (error) {
    console.error("Failed to toggle user status:", error)
    return { success: false, error: "Failed to toggle user status" }
  }
}
