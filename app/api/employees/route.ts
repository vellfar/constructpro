import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db, safeDbOperation } from "@/lib/db"

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

    const employees = await safeDbOperation(
      async () => {
        return await db.employee.findMany({
          include: {
            user: {
              select: {
                id: true,
                email: true,
                isActive: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      },
      [], // fallback to empty array
      "Fetch employees",
    )

    return NextResponse.json(employees)
  } catch (error) {
    console.error("Failed to fetch employees:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch employees",
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
    const { firstName, lastName, email, phone, section, designation, dateOfAppointment, wageAmount, wageFrequency } =
      body

    if (!firstName || !lastName || !email || !section || !designation) {
      return NextResponse.json(
        {
          error: "First name, last name, email, section, and designation are required",
        },
        { status: 400 },
      )
    }

    // Generate employee number
    const employeeCount = await safeDbOperation(async () => await db.employee.count(), 0, "Count employees")

    const employeeNumber = `EMP-${String(employeeCount + 1).padStart(4, "0")}`

    const employee = await safeDbOperation(
      async () => {
        return await db.employee.create({
          data: {
            firstName,
            lastName,
            email,
            phone: phone || null,
            section,
            designation,
            employeeNumber,
            dateOfAppointment: dateOfAppointment ? new Date(dateOfAppointment) : new Date(),
            wageAmount: wageAmount ? Number.parseFloat(wageAmount) : null,
            wageFrequency: wageFrequency || "MONTHLY",
          },
        })
      },
      null,
      "Create employee",
    )

    if (!employee) {
      return NextResponse.json({ error: "Failed to create employee" }, { status: 500 })
    }

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error("Failed to create employee:", error)
    return NextResponse.json(
      {
        error: "Failed to create employee",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
