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

    const fuelRequests = await withRetry(async () => {
      return await db.fuelRequest.findMany({
        include: {
          equipment: {
            select: {
              id: true,
              name: true,
              type: true,
              registrationNumber: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              projectCode: true,
            },
          },
          requestedBy: {
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
      })
    })

    return NextResponse.json(fuelRequests)
  } catch (error) {
    console.error("Failed to fetch fuel requests:", error)
    return NextResponse.json({ error: "Failed to fetch fuel requests" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { equipmentId, projectId, quantity, fuelType, requestedById } = body

    if (!equipmentId || !projectId || !quantity || !fuelType) {
      return NextResponse.json({ error: "Equipment, project, quantity, and fuel type are required" }, { status: 400 })
    }

    const fuelRequest = await withRetry(async () => {
      return await db.fuelRequest.create({
        data: {
          equipmentId: Number.parseInt(equipmentId),
          projectId: Number.parseInt(projectId),
          quantity: Number.parseFloat(quantity),
          fuelType,
          requestedById: requestedById ? Number.parseInt(requestedById) : null,
          status: "PENDING",
        },
        include: {
          equipment: {
            select: {
              id: true,
              name: true,
              type: true,
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

    return NextResponse.json(fuelRequest, { status: 201 })
  } catch (error) {
    console.error("Failed to create fuel request:", error)
    return NextResponse.json({ error: "Failed to create fuel request" }, { status: 500 })
  }
}
