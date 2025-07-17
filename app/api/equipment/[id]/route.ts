import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get("id"))
  if (!id) {
    return NextResponse.json({ error: "Equipment ID required" }, { status: 400 })
  }
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        assignments: true,
        fuelRequests: true,
        assessments: {
          orderBy: { assessmentDate: "desc" },
        },
        locations: {
          orderBy: { startDate: "desc" },
        },
      },
    })
    if (!equipment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ data: equipment })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await request.json()
  const { type, payload } = body
  try {
    if (type === "assessment") {
      const { equipmentId, assessmentDate, assessor, notes } = payload
      const assessment = await prisma.equipmentAssessment.create({
        data: {
          equipmentId,
          assessmentDate: new Date(assessmentDate),
          assessor,
          notes: notes || null,
        },
      })
      return NextResponse.json({ data: assessment }, { status: 201 })
    }
    if (type === "location") {
      const { equipmentId, location, startDate, endDate, notes } = payload
      const loc = await prisma.equipmentLocation.create({
        data: {
          equipmentId,
          location,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          notes: notes || null,
        },
      })
      return NextResponse.json({ data: loc }, { status: 201 })
    }
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 })
  }
}
