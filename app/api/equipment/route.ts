import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const equipment = await prisma.equipment.findMany({
      select: {
        id: true,
        name: true,
        equipmentCode: true,
        status: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(equipment)
  } catch (error) {
    console.error("Failed to fetch equipment:", error)
    return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 })
  }
}
