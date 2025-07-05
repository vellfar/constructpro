import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getReportById } from "@/app/actions/report-actions"

// GET /api/reports/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = Number(params.id)
    const report = await getReportById(id)

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("Failed to fetch report:", error)
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
  }
}
