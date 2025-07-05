import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getReportById } from "@/app/actions/report-actions"
import { jsonToCsv, jsonToPdfBuffer } from "@/lib/export-server-utils"

// GET /api/reports/[id]/download
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

    // Check format query param
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "json"
    let body: any, contentType: string, fileExt: string

    if (format === "csv") {
      // Try to export the main table if present, else flatten the object
      let exportData = report.data
      if (exportData && typeof exportData === "object") {
        // Try to find a main array/table in the report
        const mainArray = Object.values(exportData).find((v) => Array.isArray(v))
        exportData = mainArray || exportData
      }
      body = jsonToCsv(exportData)
      contentType = "text/csv"
      fileExt = "csv"
    } else if (format === "pdf") {
      const pdfBuffer = await jsonToPdfBuffer(report.data, report.title || `Report #${id}`)
      body = pdfBuffer
      contentType = "application/pdf"
      fileExt = "pdf"
    } else {
      body = JSON.stringify(report.data)
      contentType = "application/json"
      fileExt = "json"
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename=report-${id}.${fileExt}`,
      },
    })
  } catch (error) {
    console.error("Failed to download report:", error)
    return NextResponse.json({ error: "Failed to download report" }, { status: 500 })
  }
}
