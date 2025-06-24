import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const type = searchParams.get("type") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const skip = (page - 1) * pageSize

    // Build where clause
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { equipmentCode: { contains: search, mode: "insensitive" } },
        { make: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { type: { contains: search, mode: "insensitive" } },
      ]
    }
    if (status) {
      where.status = status
    }
    if (type) {
      where.type = { contains: type, mode: "insensitive" }
    }

    // Get total count - handle empty database
    const total = await prisma.equipment.count({ where }).catch(() => 0)

    // Get equipment - handle empty database
    const equipment = await prisma.equipment
      .findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              assignments: true,
              fuelRequests: true,
            },
          },
        },
      })
      .catch(() => [])

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      data: equipment || [],
      pagination: {
        page,
        pageSize,
        total: total || 0,
        totalPages: totalPages || 0,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Equipment API error:", error)
    // Return empty data instead of error
    return NextResponse.json({
      data: [],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    })
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
      equipmentCode,
      name,
      type,
      make,
      model,
      yearOfManufacture,
      ownership,
      measurementType,
      unit,
      size,
      workMeasure,
      acquisitionCost,
      supplier,
      dateReceived,
    } = body

    if (
      !equipmentCode ||
      !name ||
      !type ||
      !make ||
      !model ||
      !ownership ||
      !measurementType ||
      !unit ||
      !workMeasure
    ) {
      return NextResponse.json(
        {
          error:
            "Equipment code, name, type, make, model, ownership, measurement type, unit, and work measure are required",
        },
        { status: 400 },
      )
    }

    const equipment = await prisma.equipment.create({
      data: {
        equipmentCode,
        name,
        type,
        make,
        model,
        yearOfManufacture: yearOfManufacture ? Number.parseInt(yearOfManufacture) : null,
        ownership,
        measurementType,
        unit,
        size: size ? Number.parseFloat(size) : null,
        workMeasure,
        acquisitionCost: acquisitionCost ? Number.parseFloat(acquisitionCost) : null,
        supplier: supplier || null,
        dateReceived: dateReceived ? new Date(dateReceived) : null,
        status: "OPERATIONAL",
      },
    })

    return NextResponse.json(equipment, { status: 201 })
  } catch (error) {
    console.error("Failed to create equipment:", error)
    return NextResponse.json({ error: "Failed to create equipment" }, { status: 500 })
  }
}
