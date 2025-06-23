import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db, withRetry } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoices = await withRetry(async () => {
      return await db.invoice.findMany({
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Failed to fetch invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { invoiceNumber, clientId, projectId, amount, dueDate, description, items = [] } = body

    if (!invoiceNumber || !clientId || !amount) {
      return NextResponse.json({ error: "Invoice number, client, and amount are required" }, { status: 400 })
    }

    const invoice = await withRetry(async () => {
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
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              projectCode: true,
            },
          },
        },
      })
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error("Failed to create invoice:", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}
