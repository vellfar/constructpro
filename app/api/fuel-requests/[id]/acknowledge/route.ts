import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { FuelRequestStatus } from "@prisma/client"
import type { AcknowledgeData, ApiResponse } from "@/types/fuel-management"

interface RouteParams {
  params: {
    id: string
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const requestId = Number.parseInt(params.id, 10)
    if (isNaN(requestId)) {
      return NextResponse.json({ success: false, error: "Invalid request ID" }, { status: 400 })
    }

    const body: AcknowledgeData = await request.json()

    // Validate acknowledgment data
    if (!body.acknowledgedQuantity || body.acknowledgedQuantity <= 0) {
      return NextResponse.json(
        { success: false, error: "Acknowledged quantity must be greater than 0" },
        { status: 400 },
      )
    }

    // Get current request
    const currentRequest = await db.fuelRequest.findUnique({
      where: { id: requestId },
    })

    if (!currentRequest) {
      return NextResponse.json({ success: false, error: "Fuel request not found" }, { status: 404 })
    }

    if (currentRequest.status !== FuelRequestStatus.ISSUED) {
      return NextResponse.json(
        { success: false, error: "Only issued fuel requests can be acknowledged" },
        { status: 400 },
      )
    }

    // Check if user is the original requester
    if (currentRequest.requestedById !== Number.parseInt(session.user.id)) {
      return NextResponse.json(
        { success: false, error: "Only the original requester can acknowledge fuel receipt" },
        { status: 403 },
      )
    }

    if (body.acknowledgedQuantity > (currentRequest.issuedQuantity || 0)) {
      return NextResponse.json(
        { success: false, error: "Acknowledged quantity cannot exceed issued quantity" },
        { status: 400 },
      )
    }

    // Update request
    await db.fuelRequest.update({
      where: { id: requestId },
      data: {
        status: FuelRequestStatus.ACKNOWLEDGED,
        acknowledgedById: Number.parseInt(session.user.id),
        acknowledgmentDate: new Date(),
        acknowledgedQuantity: body.acknowledgedQuantity,
        acknowledgmentComments: body.acknowledgmentComments,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Fuel receipt acknowledged successfully",
    })
  } catch (error) {
    console.error("❌ Failed to acknowledge fuel receipt:", error)
    return NextResponse.json({ success: false, error: "Failed to acknowledge fuel receipt" }, { status: 500 })
  }
}
