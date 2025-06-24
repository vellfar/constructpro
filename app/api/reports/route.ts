import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { generateReport } from "@/app/actions/report-actions"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const formData = new FormData()

    // Convert JSON body to FormData
    Object.entries(body).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value))
      }
    })

    const result = await generateReport(formData)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to generate report:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Return empty array for now since we don't have reports table
    return NextResponse.json([])
  } catch (error) {
    console.error("Failed to fetch reports:", error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}
