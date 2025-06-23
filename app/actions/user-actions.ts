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
    return { success: false, error: "Required fields are missing" }
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
      return await db.user.create({
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
    redirect("/users")
  } catch (error) {
    console.error("Failed to create user:", error)
    return { success: false, error: "Failed to create user" }
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

    if (!email || !firstName || !lastName || !roleId) {
      return { success: false, error: "Required fields are missing" }
    }

    await withRetry(async () => {
      return await db.user.update({
        where: { id },
        data: {
          email,
          username: username || email,
          firstName,
          lastName,
          phoneNumber: phoneNumber || null,
          roleId,
          isActive,
        },
      })
    })

    revalidatePath("/users")
    revalidatePath(`/users/${id}`)
    redirect(`/users/${id}`)
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
    await withRetry(async () => {
      return await db.user.delete({
        where: { id },
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
