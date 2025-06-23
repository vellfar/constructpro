import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function generateUniqueProjectCode(): Promise<string> {
  try {
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      // Get the highest existing project code number
      const lastProject = await prisma.project.findFirst({
        where: {
          projectCode: {
            startsWith: "PRJ-",
          },
        },
        orderBy: {
          projectCode: "desc",
        },
        select: {
          projectCode: true,
        },
      })

      let nextNumber = 1
      if (lastProject?.projectCode) {
        // Extract number from project code (e.g., "PRJ-0005" -> 5)
        const match = lastProject.projectCode.match(/PRJ-(\d+)/)
        if (match) {
          nextNumber = Number.parseInt(match[1]) + 1
        }
      }

      // Add some randomness to avoid conflicts in concurrent requests
      if (attempts > 0) {
        nextNumber += Math.floor(Math.random() * 100)
      }

      const projectCode = `PRJ-${String(nextNumber).padStart(4, "0")}`

      // Check if this code already exists
      const existing = await prisma.project.findUnique({
        where: { projectCode },
        select: { id: true },
      })

      if (!existing) {
        console.log(`✅ Generated unique project code: ${projectCode} (attempt ${attempts + 1})`)
        return projectCode
      }

      attempts++
      console.log(`⚠️ Code ${projectCode} exists, retrying... (attempt ${attempts}/${maxAttempts})`)
    }

    // If all attempts failed, use timestamp-based fallback
    const timestamp = Date.now().toString().slice(-6)
    const fallbackCode = `PRJ-${timestamp}`
    console.log(`🔄 Using timestamp fallback: ${fallbackCode}`)
    return fallbackCode
  } catch (error) {
    console.error("Error generating project code:", error)
    // Ultimate fallback: use timestamp-based code
    const timestamp = Date.now().toString().slice(-6)
    return `PRJ-${timestamp}`
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Projects API called")

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log("❌ Unauthorized access to projects API")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ User authenticated:", session.user.email)

    const { searchParams } = new URL(request.url)

    // Check if this is a request for generating a project code
    const generateCode = searchParams.get("generateCode")
    if (generateCode === "true") {
      console.log("🏷️ Generating project code...")
      const projectCode = await generateUniqueProjectCode()
      console.log("✅ Generated project code:", projectCode)

      return NextResponse.json({
        success: true,
        projectCode,
      })
    }

    // Regular project listing logic
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("limit") || searchParams.get("pageSize") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    console.log("📋 Query params:", { page, pageSize, search, status, sortBy, sortOrder })

    const skip = (page - 1) * pageSize

    // Build where clause
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { projectCode: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ]
    }
    if (status && status !== "ALL_STATUS") {
      where.status = status
    }

    console.log("🔍 Where clause:", JSON.stringify(where, null, 2))

    // Get total count
    const total = await prisma.project.count({ where }).catch((error) => {
      console.error("❌ Error counting projects:", error)
      return 0
    })

    console.log("📊 Total projects found:", total)

    // Get projects
    const projects = await prisma.project
      .findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              activities: true,
              equipmentAssignments: true,
            },
          },
        },
      })
      .catch((error) => {
        console.error("❌ Error fetching projects:", error)
        return []
      })

    console.log("📦 Projects fetched:", projects.length)
    console.log(
      "📝 First project sample:",
      projects[0]
        ? {
            id: projects[0].id,
            name: projects[0].name,
            projectCode: projects[0].projectCode,
            status: projects[0].status,
          }
        : "No projects",
    )

    const totalPages = Math.ceil(total / pageSize)

    const result = {
      data: projects,
      projects: projects, // Legacy support
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      total, // Legacy support
    }

    console.log("✅ Returning result:", {
      projectCount: result.data.length,
      total: result.total,
      pagination: result.pagination,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("💥 Projects API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        data: [],
        projects: [],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        total: 0,
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

    const body = await request.json()
    const { name, description, location, startDate, endDate, budget, clientId, projectCode } = body

    if (!name || !startDate || !budget || !projectCode) {
      return NextResponse.json(
        {
          error: "Name, start date, budget, and project code are required",
        },
        { status: 400 },
      )
    }

    // Check if project code already exists
    const existingProject = await prisma.project.findUnique({
      where: { projectCode },
      select: { id: true },
    })

    if (existingProject) {
      return NextResponse.json(
        {
          error: "Project code already exists. Please generate a new one.",
        },
        { status: 400 },
      )
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        location: location || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        budget: Number.parseFloat(budget),
        clientId: clientId ? Number.parseInt(clientId) : null,
        projectCode,
        status: "PLANNING",
        createdById: Number.parseInt(session.user.id),
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Failed to create project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
