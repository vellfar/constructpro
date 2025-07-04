import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const activityId = Number.parseInt(params.id)

    if (isNaN(activityId)) {
      return NextResponse.json({ error: "Invalid activity ID" }, { status: 400 })
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        project: true,
        employee: true,
      },
    })

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error("Failed to fetch activity:", error)
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const activityId = Number.parseInt(params.id)

    if (isNaN(activityId)) {
      return NextResponse.json({ error: "Invalid activity ID" }, { status: 400 })
    }

    const existing = await prisma.activity.findUnique({
      where: { id: activityId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    await prisma.activity.delete({
      where: { id: activityId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete activity:", error)
    return NextResponse.json({ error: "Failed to delete activity" }, { status: 500 })
  }
}
