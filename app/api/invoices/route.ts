import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db, safeDbOperation } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check database health first
    if (!db) {
      console.error("Database client not initialized")
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const invoices = await safeDbOperation(
      async () => {
        return await db.invoice.findMany({
          include: {
            project: {
              select: {
                id: true,
                name: true,
                projectCode: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      },
      [], // fallback to empty array
      "Fetch invoices",
    )

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Failed to fetch invoices:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch invoices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check database health first
    if (!db) {
      console.error("Database client not initialized")
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const body = await request.json()
    const { invoiceNumber, clientId, projectId, amount, dueDate, description, items = [] } = body

    if (!invoiceNumber || !clientId || !amount) {
      return NextResponse.json({ error: "Invoice number, client, and amount are required" }, { status: 400 })
    }

    const invoice = await safeDbOperation(
      async () => {
        return await db.invoice.create({
          data: {
            invoiceNumber,
            clientId: Number.parseInt(clientId),
            projectId: projectId ? Number.parseInt(projectId) : null,
            amount: Number.parseFloat(amount),
            dueDate: dueDate ? new Date(dueDate) : null,
            description: description || null,
            status: "DRAFT",
            items: items,
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                projectCode: true,
              },
            },
          },
        })
      },
      null, // fallback to null
      "Create invoice",
    )

    if (!invoice) {
      return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
    }

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error("Failed to create invoice:", error)
    return NextResponse.json(
      {
        error: "Failed to create invoice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
