import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permissions - Admin, Project Manager, or Store Manager can view analytics
    const canViewAnalytics =
      session.user.role === "Admin" || session.user.role === "Project Manager" || session.user.role === "Store Manager"

    if (!canViewAnalytics) {
      return NextResponse.json({ error: "Not authorized to view fuel analytics" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    const whereClause = Object.keys(dateFilter).length > 0 ? { requestDate: dateFilter } : {}

    // Get analytics data
    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      issuedRequests,
      completedRequests,
      fuelByType,
      fuelByProject,
      monthlyTrends,
    ] = await Promise.all([
      // Total requests
      prisma.fuelRequest.count({ where: whereClause }),

      // Requests by status
      prisma.fuelRequest.count({ where: { ...whereClause, status: "PENDING" } }),
      prisma.fuelRequest.count({ where: { ...whereClause, status: "APPROVED" } }),
      prisma.fuelRequest.count({ where: { ...whereClause, status: "REJECTED" } }),
      prisma.fuelRequest.count({ where: { ...whereClause, status: "ISSUED" } }),
      prisma.fuelRequest.count({ where: { ...whereClause, status: "COMPLETED" } }),

      // Fuel consumption by type
      prisma.fuelRequest.groupBy({
        by: ["fuelType"],
        where: { ...whereClause, status: { in: ["ISSUED", "COMPLETED"] } },
        _sum: { issuedQuantity: true },
        _count: true,
      }),

      // Fuel consumption by project
      prisma.fuelRequest.groupBy({
        by: ["projectId"],
        where: { ...whereClause, status: { in: ["ISSUED", "COMPLETED"] } },
        _sum: { issuedQuantity: true },
        _count: true,
      }),

      // Monthly trends (last 12 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "requestDate") as month,
          COUNT(*) as total_requests,
          SUM(CASE WHEN "issuedQuantity" IS NOT NULL THEN "issuedQuantity" ELSE 0 END) as total_fuel_issued
        FROM "FuelRequest"
        WHERE "requestDate" >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month
      `,
    ])

    return NextResponse.json({
      summary: {
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        issuedRequests,
        completedRequests,
      },
      fuelByType,
      fuelByProject,
      monthlyTrends,
    })
  } catch (error) {
    console.error("Failed to fetch fuel analytics:", error)
    return NextResponse.json({ error: "Failed to fetch fuel analytics" }, { status: 500 })
  }
}
