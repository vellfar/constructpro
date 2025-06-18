{/*import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30days"

    // Calculate date range based on period
    const now = new Date()
    const startDate = new Date()

    switch (period) {
      case "7days":
        startDate.setDate(now.getDate() - 7)
        break
      case "30days":
        startDate.setDate(now.getDate() - 30)
        break
      case "90days":
        startDate.setDate(now.getDate() - 90)
        break
      case "1year":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Fetch all data in parallel
    const [projects, employees, equipment, clients, fuelRequests, activities, invoices, equipmentAssignments] =
      await Promise.all([
        prisma.project.findMany({
          include: { client: true },
        }),
        prisma.employee.findMany({
          include: { user: true },
        }),
        prisma.equipment.findMany({
          include: { assignments: true },
        }),
        prisma.client.findMany(),
        prisma.fuelRequest.findMany({
          where: {
            requestDate: {
              gte: startDate,
            },
          },
        }),
        prisma.activity.findMany({
          where: {
            createdAt: {
              gte: startDate,
            },
          },
        }),
        prisma.invoice.findMany({
          where: {
            invoiceDate: {
              gte: startDate,
            },
          },
          include: { project: true },
        }),
        prisma.equipmentAssignment.findMany({
          where: {
            startDate: {
              gte: startDate,
            },
          },
        }),
      ])

    // Calculate overview metrics
    const overview = {
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => p.status === "ACTIVE").length,
      totalEmployees: employees.filter((e) => e.user?.isActive).length,
      totalEquipment: equipment.length,
      operationalEquipment: equipment.filter((e) => e.status === "OPERATIONAL").length,
      totalClients: clients.length,
      pendingFuelRequests: fuelRequests.filter((f) => f.status === "PENDING").length,
      totalActivities: activities.length,
    }

    // Calculate financial metrics
    const financial = {
      totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
      equipmentUtilization:
        equipment.length > 0
          ? Math.round((equipment.filter((e) => e.assignments.length > 0).length / equipment.length) * 100)
          : 0,
      activeAssignments: equipmentAssignments.filter((a) => !a.endDate).length,
      totalInvoices: invoices.length,
      totalInvoiceAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
      paidInvoices: invoices.filter((inv) => inv.status === "PAID").length,
      pendingInvoices: invoices.filter((inv) => inv.status === "PENDING").length,
    }

    // Calculate distributions
    const projectStatusCounts = projects.reduce((acc: any, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1
      return acc
    }, {})

    const equipmentStatusCounts = equipment.reduce((acc: any, eq) => {
      acc[eq.status] = (acc[eq.status] || 0) + 1
      return acc
    }, {})

    const distributions = {
      projectStatus: Object.entries(projectStatusCounts).map(([status, count]) => ({
        status,
        count: count as number,
      })),
      equipmentStatus: Object.entries(equipmentStatusCounts).map(([status, count]) => ({
        status,
        count: count as number,
      })),
    }

    // Calculate trends (simplified for demo)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      return monthNames[date.getMonth()]
    })

    const trends = {
      monthlyProjects: last6Months.map((month, index) => ({
        month,
        count: Math.floor(Math.random() * 10) + 5, // Mock data
      })),
      monthlyInvoices: last6Months.map((month, index) => ({
        month,
        amount: Math.floor(Math.random() * 100000) + 50000, // Mock data
      })),
      equipmentUtilization: last6Months.map((month, index) => ({
        month,
        utilization: Math.floor(Math.random() * 30) + 70, // Mock data between 70-100%
      })),
    }

    const analyticsData = {
      overview,
      financial,
      distributions,
      trends,
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
  }
}
*/}