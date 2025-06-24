import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface RouteParams {
  params: {
    id: string
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid fuel request ID" }, { status: 400 })
    }

    // Check if user can cancel (request owner or admin)
    const fuelRequest = await prisma.fuelRequest.findUnique({
      where: { id },
      include: { requestedBy: true },
    })

    if (!fuelRequest) {
      return NextResponse.json({ error: "Fuel request not found" }, { status: 404 })
    }

    const canCancel = session.user.role === "Admin" || fuelRequest.requestedBy.id === Number.parseInt(session.user.id)

    if (!canCancel) {
      return NextResponse.json({ error: "Not authorized to cancel this request" }, { status: 403 })
    }

    if (!["PENDING", "APPROVED"].includes(fuelRequest.status)) {
      return NextResponse.json({ error: "Can only cancel pending or approved requests" }, { status: 400 })
    }

    const updatedRequest = await prisma.fuelRequest.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancellationReason: "Cancelled by user",
        cancelledAt: new Date(),
      },
    })

    return NextResponse.json({
      message: "Fuel request cancelled successfully",
      fuelRequest: updatedRequest,
    })
  } catch (error) {
    console.error("Failed to cancel fuel request:", error)
    return NextResponse.json({ error: "Failed to cancel fuel request" }, { status: 500 })
  }
}
