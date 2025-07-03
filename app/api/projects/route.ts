import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Check if this is a code generation request
    const generateCode = searchParams.get("generateCode") === "true"

    if (generateCode) {
      try {
        const existingProjects = await prisma.project.findMany({
          select: { projectCode: true },
          orderBy: { projectCode: "desc" },
        })

        let nextNumber = 1
        const codePattern = /^PRJ-(\d+)$/

        for (const project of existingProjects) {
          const match = project.projectCode.match(codePattern)
          if (match) {
            const num = Number.parseInt(match[1], 10)
            if (num >= nextNumber) {
              nextNumber = num + 1
            }
          }
        }

        const randomOffset = Math.floor(Math.random() * 3)
        nextNumber += randomOffset

        let projectCode = `PRJ-${nextNumber.toString().padStart(4, "0")}`
        let attempts = 0
        const maxAttempts = 10

        while (attempts < maxAttempts) {
          const existing = await prisma.project.findUnique({
            where: { projectCode },
          })

          if (!existing) break

          nextNumber++
          projectCode = `PRJ-${nextNumber.toString().padStart(4, "0")}`
          attempts++
        }

        if (attempts >= maxAttempts) {
          const timestamp = Date.now().toString().slice(-6)
          projectCode = `PRJ-${timestamp}`
        }

        return NextResponse.json({
          success: true,
          projectCode,
        })
      } catch (error) {
        console.error("Error generating project code:", error)
        const timestamp = Date.now().toString().slice(-6)
        return NextResponse.json({
          success: true,
          projectCode: `PRJ-${timestamp}`,
        })
      }
    }

    // Project listing logic
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10")
    const search = searchParams.get("search") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const skip = (page - 1) * pageSize

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { projectCode: { contains: search, mode: "insensitive" } },
      ]
    }

    const total = await prisma.project.count({ where })

    const projects = await prisma.project.findMany({
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
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Format name from firstName + lastName
    const formattedProjects = projects.map((project) => ({
      ...project,
      createdBy: {
        ...project.createdBy,
        name: `${project.createdBy.firstName} ${project.createdBy.lastName}`,
      },
    }))

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      success: true,
      data: formattedProjects,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Projects API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      location,
      budget,
      startDate,
      endDate,
      clientId,
      projectCode,
      status = "PLANNING",
    } = body

    if (!name || !clientId) {
      return NextResponse.json({ error: "Name and client are required" }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        location,
        budget: budget ? Number.parseFloat(budget) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        clientId: Number.parseInt(clientId),
        projectCode,
        status,
        createdById: session.user.id,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    const formattedProject = {
      ...project,
      createdBy: {
        ...project.createdBy,
        name: `${project.createdBy.firstName} ${project.createdBy.lastName}`,
      },
    }

    return NextResponse.json({
      success: true,
      data: formattedProject,
    })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ success: false, error: "Failed to create project" }, { status: 500 })
  }
}
