"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// ✅ This can still return data since it's used via client/server calls, not form <action>
export async function getClients() {
  try {
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

    return { success: true, data: clients || [] }
  } catch (error) {
    console.error("❌ Failed to fetch clients:", error)
    return { success: false, data: [], error: "Database error" }
  }
}

// ✅ This is fine too — not used in <form action>
export async function getClient(id: number) {
  try {
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
      return { success: false, error: "Client not found" }
    }

    return { success: true, data: client }
  } catch (error) {
    console.error("❌ Failed to fetch client:", error)
    return { success: false, error: "Failed to fetch client" }
  }
}

// ✅ createClient now returns Promise<void> to satisfy <form action>
export async function createClient(formData: FormData): Promise<void> {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string
  const contactName = formData.get("contactName") as string

  if (!name) {
    console.error("❌ Name is required")
    return
  }

  await prisma.client.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      contactName: contactName || null,
    },
  })

  revalidatePath("/clients")
  redirect("/clients") // Ends execution; does not return anything
}

// ✅ updateClient returns Promise<void> to work in form action
export async function updateClient(id: number, formData: FormData): Promise<void> {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string
  const contactName = formData.get("contactName") as string

  if (!name) {
    console.error("❌ Name is required")
    return
  }

  await prisma.client.update({
    where: { id },
    data: {
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      contactName: contactName || null,
    },
  })

  revalidatePath("/clients")
  redirect("/clients")
}

// ✅ deleteClient now also returns Promise<void>
export async function deleteClient(id: number): Promise<void> {
  await prisma.client.delete({
    where: { id },
  })

  revalidatePath("/clients")
  redirect("/clients")
}
