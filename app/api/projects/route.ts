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

    const projects = await safeDbOperation(
      async () => {
        return await db.project.findMany({
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            activities: {
              select: {
                id: true,
                status: true,
              },
            },
            equipmentAssignments: {
              select: {
                id: true,
              },
            },
            invoices: {
              select: {
                id: true,
                amount: true,
                status: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      },
      [], // fallback to empty array
      "Fetch projects",
    )

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Failed to fetch projects:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch projects",
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
    const { name, description, clientId, budget, startDate, endDate, location } = body

    if (!name || !clientId) {
      return NextResponse.json({ error: "Project name and client are required" }, { status: 400 })
    }

    // Generate project code
    const projectCount = await safeDbOperation(async () => await db.project.count(), 0, "Count projects")

    const projectCode = `PRJ-${String(projectCount + 1).padStart(4, "0")}`

    const project = await safeDbOperation(
      async () => {
        return await db.project.create({
          data: {
            name,
            description: description || null,
            projectCode,
            clientId: Number.parseInt(clientId),
            budget: budget ? Number.parseFloat(budget) : null,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            location: location || null,
            status: "ACTIVE",
          },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })
      },
      null,
      "Create project",
    )

    if (!project) {
      return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
    }

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Failed to create project:", error)
    return NextResponse.json(
      {
        error: "Failed to create project",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
