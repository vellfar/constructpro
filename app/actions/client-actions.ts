"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getClients() {
  try {
    console.log("🔍 Fetching clients from database...")
    const clients = await prisma.client.findMany({
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    console.log(`✅ Found ${clients.length} clients`)
    return { success: true, data: clients || [] }
  } catch (error) {
    console.error("❌ Failed to fetch clients:", error)
    return { success: true, data: [], error: null }
  }
}

export async function getClient(id: number) {
  try {
    console.log(`🔍 Fetching client with ID: ${id}`)
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    })

    if (!client) {
      console.log(`❌ Client not found: ${id}`)
      return { success: false, error: "Client not found" }
    }

    console.log(`✅ Found client: ${client.name}`)
    return { success: true, data: client }
  } catch (error) {
    console.error("❌ Failed to fetch client:", error)
    return { success: false, error: "Failed to fetch client" }
  }
}

export async function createClient(formData: FormData) {
  try {
    console.log("🚀 Starting client creation...")

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const address = formData.get("address") as string
    const contactName = formData.get("contactName") as string

    console.log("📝 Client data:", { name, email, phone, address, contactName })

    if (!name) {
      console.log("❌ Validation failed: Name is required")
      return { success: false, error: "Name is required" }
    }

    console.log("💾 Creating client in database...")
    const client = await prisma.client.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        contactName: contactName || null,
      },
    })

    console.log(`✅ Client created successfully with ID: ${client.id}`)

    // Revalidate the clients page to show the new client
    revalidatePath("/clients")

    // Return success instead of redirecting
    return { success: true, data: client }
  } catch (error) {
    console.error("❌ Failed to create client:", error)
    return { success: false, error: "Failed to create client" }
  }
}

export async function updateClient(id: number, formData: FormData) {
  try {
    console.log(`🔄 Updating client with ID: ${id}`)

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const address = formData.get("address") as string
    const contactName = formData.get("contactName") as string

    if (!name) {
      return { success: false, error: "Name is required" }
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        contactName: contactName || null,
      },
    })

    console.log(`✅ Client updated successfully: ${client.name}`)

    revalidatePath("/clients")
    revalidatePath(`/clients/${id}`)
    return { success: true, data: client }
  } catch (error) {
    console.error("❌ Failed to update client:", error)
    return { success: false, error: "Failed to update client" }
  }
}

export async function deleteClient(id: number) {
  try {
    console.log(`🗑️ Deleting client with ID: ${id}`)

    await prisma.client.delete({
      where: { id },
    })

    console.log(`✅ Client deleted successfully`)

    revalidatePath("/clients")
    return { success: true }
  } catch (error) {
    console.error("❌ Failed to delete client:", error)
    return { success: false, error: "Failed to delete client" }
  }
}
