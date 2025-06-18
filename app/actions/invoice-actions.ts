"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function createInvoice(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    const invoiceNumber = formData.get("invoiceNumber") as string
    const projectId = Number.parseInt(formData.get("projectId") as string)
    const serviceProvider = formData.get("serviceProvider") as string
    const amount = Number.parseFloat(formData.get("amount") as string)
    const invoiceDate = new Date(formData.get("invoiceDate") as string)
    const dateReceived = formData.get("dateReceived") as string
    const contractNumber = formData.get("contractNumber") as string
    const status = formData.get("status") as string
    const procurementDescription = formData.get("procurementDescription") as string
    const providerId = formData.get("providerId") as string

    if (!invoiceNumber || !projectId || !serviceProvider || !amount || !invoiceDate) {
      throw new Error("Missing required fields")
    }

    await prisma.invoice.create({
      data: {
        invoiceNumber,
        projectId,
        serviceProvider,
        amount,
        invoiceDate,
        dateReceived: dateReceived ? new Date(dateReceived) : new Date(),
        contractNumber: contractNumber || null,
        status: status as any,
        procurementDescription: procurementDescription || "",
        providerId: providerId || "",
        documentId: null,
        goodsReceivedNote: null,
      },
    })

    revalidatePath("/invoices")
  } catch (error) {
    console.error("Error creating invoice:", error)
    throw new Error("Failed to create invoice")
  }

  redirect("/invoices")
}

export async function updateInvoice(id: number, formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    const invoiceNumber = formData.get("invoiceNumber") as string
    const projectId = Number.parseInt(formData.get("projectId") as string)
    const serviceProvider = formData.get("serviceProvider") as string
    const amount = Number.parseFloat(formData.get("amount") as string)
    const invoiceDate = new Date(formData.get("invoiceDate") as string)
    const dateReceived = formData.get("dateReceived") as string
    const contractNumber = formData.get("contractNumber") as string
    const status = formData.get("status") as string
    const procurementDescription = formData.get("procurementDescription") as string
    const providerId = formData.get("providerId") as string

    if (!invoiceNumber || !projectId || !serviceProvider || !amount || !invoiceDate) {
      throw new Error("Missing required fields")
    }

    await prisma.invoice.update({
      where: { id },
      data: {
        invoiceNumber,
        projectId,
        serviceProvider,
        amount,
        invoiceDate,
        dateReceived: dateReceived ? new Date(dateReceived) : new Date(),
        contractNumber: contractNumber || null,
        status: status as any,
        procurementDescription: procurementDescription || "",
        providerId: providerId || "",
      },
    })

    revalidatePath("/invoices")
    revalidatePath(`/invoices/${id}`)
  } catch (error) {
    console.error("Error updating invoice:", error)
    throw new Error("Failed to update invoice")
  }

  redirect("/invoices")
}

export async function deleteInvoice(id: number) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    await prisma.invoice.delete({
      where: { id },
    })

    revalidatePath("/invoices")
  } catch (error) {
    console.error("Error deleting invoice:", error)
    throw new Error("Failed to delete invoice")
  }

  redirect("/invoices")
}
