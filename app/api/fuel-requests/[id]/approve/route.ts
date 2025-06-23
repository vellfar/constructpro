import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { FuelRequestStatus } from "@prisma/client"
import type { ApprovalData, ApiResponse } from "@/types/fuel-management"

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
    if (!["Admin", "Project Manager"].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const requestId = Number.parseInt(params.id, 10)
    if (isNaN(requestId)) {
      return NextResponse.json({ success: false, error: "Invalid request ID" }, { status: 400 })
    }

    const body: ApprovalData = await request.json()

    // Validate approval data
    if (body.approved && (!body.approvedQuantity || body.approvedQuantity <= 0)) {
      return NextResponse.json({ success: false, error: "Approved quantity is required for approval" }, { status: 400 })
    }

    if (!body.approved && !body.rejectionReason) {
      return NextResponse.json({ success: false, error: "Rejection reason is required for rejection" }, { status: 400 })
    }

    // Get current request
    const currentRequest = await db.fuelRequest.findUnique({
      where: { id: requestId },
    })

    if (!currentRequest) {
      return NextResponse.json({ success: false, error: "Fuel request not found" }, { status: 404 })
    }

    if (currentRequest.status !== FuelRequestStatus.PENDING) {
      return NextResponse.json(
        { success: false, error: "Only pending fuel requests can be approved or rejected" },
        { status: 400 },
      )
    }

    // Update request
    await db.fuelRequest.update({
      where: { id: requestId },
      data: {
        status: body.approved ? FuelRequestStatus.APPROVED : FuelRequestStatus.REJECTED,
        approvedById: Number.parseInt(session.user.id),
        approvalDate: new Date(),
        approvedQuantity: body.approved ? body.approvedQuantity : null,
        approvalComments: body.approvalComments,
        rejectionReason: body.approved ? null : body.rejectionReason,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Fuel request ${body.approved ? "approved" : "rejected"} successfully`,
    })
  } catch (error) {
    console.error("❌ Failed to process approval:", error)
    return NextResponse.json({ success: false, error: "Failed to process approval" }, { status: 500 })
  }
}
