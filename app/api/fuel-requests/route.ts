import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { FuelRequestStatus } from "@prisma/client"
import type { CreateFuelRequestData, ApiResponse, FuelRequestWithRelations } from "@/types/fuel-management"

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<FuelRequestWithRelations[]>>> {
  try {
    console.log("🔍 Fuel requests API called")

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log("❌ No session found")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ User authenticated:", session.user.email)

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const projectId = searchParams.get("projectId") || ""
    const equipmentId = searchParams.get("equipmentId") || ""

    // Build where clause
    const where: any = {}

    if (status && status !== "all") {
      where.status = status as FuelRequestStatus
    }

    if (projectId && projectId !== "all") {
      where.projectId = Number.parseInt(projectId, 10)
    }

    if (equipmentId && equipmentId !== "all") {
      where.equipmentId = Number.parseInt(equipmentId, 10)
    }

    if (search) {
      where.OR = [
        { requestNumber: { contains: search, mode: "insensitive" } },
        { justification: { contains: search, mode: "insensitive" } },
        { equipment: { name: { contains: search, mode: "insensitive" } } },
        { project: { name: { contains: search, mode: "insensitive" } } },
      ]
    }

    // Fetch fuel requests with relations
    const [fuelRequests, total] = await Promise.all([
      db.fuelRequest.findMany({
        where,
        include: {
          equipment: {
            select: {
              id: true,
              name: true,
              equipmentCode: true,
              type: true,
              status: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              projectCode: true,
              status: true,
            },
          },
          requestedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employee: {
                select: {
                  employeeNumber: true,
                  designation: true,
                },
              },
            },
          },
          approvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          issuedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          acknowledgedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          completedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: (page - 1) * limit,
      }),
      db.fuelRequest.count({ where }),
    ])

    console.log("📦 Returning fuel requests:", fuelRequests.length)

    return NextResponse.json({
      success: true,
      data: fuelRequests as FuelRequestWithRelations[],
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("❌ Fuel requests API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch fuel requests" }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<FuelRequestWithRelations>>> {
  try {
    console.log("🚀 Creating fuel request")

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body: CreateFuelRequestData = await request.json()
    console.log("📝 Request data:", body)

    // Validate required fields
    if (
      !body.projectId ||
      !body.equipmentId ||
      !body.fuelType ||
      !body.requestedQuantity ||
      !body.urgency ||
      !body.justification
    ) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Validate equipment and project exist
    const [equipment, project] = await Promise.all([
      db.equipment.findUnique({
        where: { id: body.equipmentId },
        select: { id: true, status: true, name: true },
      }),
      db.project.findUnique({
        where: { id: body.projectId },
        select: { id: true, status: true, name: true },
      }),
    ])

    if (!equipment) {
      return NextResponse.json({ success: false, error: "Equipment not found" }, { status: 404 })
    }

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    // Generate request number
    const requestNumber = `FR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // Create fuel request
    const newRequest = await db.fuelRequest.create({
      data: {
        requestNumber,
        equipmentId: body.equipmentId,
        projectId: body.projectId,
        fuelType: body.fuelType,
        requestedQuantity: body.requestedQuantity,
        justification: body.justification,
        urgency: body.urgency,
        requestedById: Number.parseInt(session.user.id),
        status: FuelRequestStatus.PENDING,
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            equipmentCode: true,
            type: true,
            status: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            projectCode: true,
            status: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employee: {
              select: {
                employeeNumber: true,
                designation: true,
              },
            },
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        issuedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        acknowledgedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        completedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    console.log("✅ Fuel request created:", newRequest.id)

    return NextResponse.json({
      success: true,
      data: newRequest as FuelRequestWithRelations,
      message: "Fuel request created successfully",
    })
  } catch (error) {
    console.error("❌ Failed to create fuel request:", error)
    return NextResponse.json({ success: false, error: "Failed to create fuel request" }, { status: 500 })
  }
}
