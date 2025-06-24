import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { FuelRequestStatus } from "@prisma/client"
import type { IssueData, ApiResponse } from "@/types/fuel-management"

export const dynamic = "force-dynamic"
export const revalidate = 0

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

    // Check permissions
    if (!["Admin", "Store Manager"].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const requestId = Number.parseInt(params.id, 10)
    if (isNaN(requestId)) {
      return NextResponse.json({ success: false, error: "Invalid request ID" }, { status: 400 })
    }

    const body: IssueData = await request.json()

    // Validate issue data
    if (!body.issuedQuantity || body.issuedQuantity <= 0) {
      return NextResponse.json({ success: false, error: "Issued quantity must be greater than 0" }, { status: 400 })
    }

    // Get current request
    const currentRequest = await db.fuelRequest.findUnique({
      where: { id: requestId },
    })

    if (!currentRequest) {
      return NextResponse.json({ success: false, error: "Fuel request not found" }, { status: 404 })
    }

    if (currentRequest.status !== FuelRequestStatus.APPROVED) {
      return NextResponse.json({ success: false, error: "Only approved fuel requests can be issued" }, { status: 400 })
    }

    if (body.issuedQuantity > (currentRequest.approvedQuantity || 0)) {
      return NextResponse.json(
        { success: false, error: "Issued quantity cannot exceed approved quantity" },
        { status: 400 },
      )
    }

    // Update request
    await db.fuelRequest.update({
      where: { id: requestId },
      data: {
        status: FuelRequestStatus.ISSUED,
        issuedById: Number.parseInt(session.user.id),
        issuanceDate: new Date(),
        issuedQuantity: body.issuedQuantity,
        issuanceComments: body.issuanceComments,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Fuel issued successfully",
    })
  } catch (error) {
    console.error("❌ Failed to issue fuel:", error)
    return NextResponse.json({ success: false, error: "Failed to issue fuel" }, { status: 500 })
  }
}
