"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Utility to check session
async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return null
  }
  return session
}

export async function getClients() {
  const session = await requireAuth()
  if (!session) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const clients = await prisma.client.findMany({
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, data: clients }
  } catch (error) {
    console.error("Failed to fetch clients:", error)
    return { success: false, error: "Failed to fetch clients" }
  }
}

export async function createClient(formData: FormData) {
  const session = await requireAuth()
  if (!session) {
    return { success: false, error: "Unauthorized" }
  }

  const name = formData.get("name") as string
  const contactName = formData.get("contactName") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string

  if (!name?.trim()) {
    return { success: false, error: "Client name is required" }
  }

  try {
    await prisma.client.create({
      data: {
        name,
        contactName: contactName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
      },
    })

    revalidatePath("/clients")
    return { success: true }
  } catch (error) {
    console.error("Failed to create client:", error)
    return { success: false, error: "Failed to create client" }
  }
}

export async function updateClient(id: number, formData: FormData) {
  const session = await requireAuth()
  if (!session) {
    return { success: false, error: "Unauthorized" }
  }

  const name = formData.get("name") as string
  const contactName = formData.get("contactName") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string

  if (!name?.trim()) {
    return { success: false, error: "Client name is required" }
  }

  try {
    await prisma.client.update({
      where: { id },
      data: {
        name,
        contactName: contactName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
      },
    })

    revalidatePath("/clients")
    revalidatePath(`/clients/${id}`)

    // Note: Return path instead of using redirect() in server action
    return { success: true, redirectTo: `/clients/${id}` }
  } catch (error) {
    console.error("Failed to update client:", error)
    return { success: false, error: "Failed to update client" }
  }
}

export async function deleteClient(id: number) {
  const session = await requireAuth()
  if (!session) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await prisma.client.delete({
      where: { id },
    })

    revalidatePath("/clients")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete client:", error)
    return { success: false, error: "Failed to delete client" }
  }
}
