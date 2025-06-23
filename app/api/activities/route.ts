import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db, withRetry } from "@/lib/db"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const activities = await withRetry(async () => {
      return await db.activity.findMany({
        include: {
          project: {
            select: {
              id: true,
              name: true,
              projectCode: true,
              location: true,
              status: true,
            },
          },
          employee: {
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

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Failed to fetch activities:", error)
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, projectId, startDate, endDate, status = "PLANNED" } = body

    if (!name || !projectId) {
      return NextResponse.json({ error: "Name and project are required" }, { status: 400 })
    }

    const activity = await withRetry(async () => {
      return await db.activity.create({
        data: {
          name,
          description: description || null,
          projectId: Number.parseInt(projectId),
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          status,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              projectCode: true,
              location: true,
            },
          },
        },
      })
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error("Failed to create activity:", error)
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 })
  }
}
