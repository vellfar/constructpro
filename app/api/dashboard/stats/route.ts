import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get dashboard statistics with proper error handling
    const [
      totalProjects,
      activeProjects,
      totalEmployees,
      totalEquipment,
      operationalEquipment,
      totalClients,
      pendingFuelRequests,
      totalActivities,
    ] = await Promise.all([
      prisma.project.count().catch(() => 0),
      prisma.project.count({ where: { status: "ACTIVE" } }).catch(() => 0),
      prisma.employee.count().catch(() => 0),
      prisma.equipment.count().catch(() => 0),
      prisma.equipment.count({ where: { status: "OPERATIONAL" } }).catch(() => 0),
      prisma.client.count().catch(() => 0),
      prisma.fuelRequest.count({ where: { status: "PENDING" } }).catch(() => 0),
      prisma.activity.count().catch(() => 0),
    ])

    // Get recent activities with error handling
    const recentActivities = await prisma.activity
      .findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          project: {
            select: {
              name: true,
              projectCode: true,
            },
          },
        },
      })
      .catch(() => [])

    // Get project status distribution
    const projectStatusCounts = await prisma.project
      .groupBy({
        by: ["status"],
        _count: { status: true },
      })
      .catch(() => [])

    // Get equipment status distribution
    const equipmentStatusCounts = await prisma.equipment
      .groupBy({
        by: ["status"],
        _count: { status: true },
      })
      .catch(() => [])

    // Calculate total project budget
    const projectBudgets = await prisma.project
      .aggregate({
        _sum: { budget: true },
      })
      .catch(() => ({ _sum: { budget: 0 } }))

    // Get recent fuel requests
    const recentFuelRequests = await prisma.fuelRequest
      .findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          equipment: { select: { name: true, equipmentCode: true } },
          project: { select: { name: true, projectCode: true } },
          requestedBy: { select: { firstName: true, lastName: true } },
        },
      })
      .catch(() => [])

    // Get equipment utilization
    const equipmentAssignments = await prisma.equipmentAssignment
      .count({
        where: {
          endDate: null, // Currently assigned
        },
      })
      .catch(() => 0)

    const stats = {
      overview: {
        totalProjects: totalProjects || 0,
        activeProjects: activeProjects || 0,
        totalEmployees: totalEmployees || 0,
        totalEquipment: totalEquipment || 0,
        operationalEquipment: operationalEquipment || 0,
        totalClients: totalClients || 0,
        pendingFuelRequests: pendingFuelRequests || 0,
        totalActivities: totalActivities || 0,
      },
      financial: {
        totalBudget: projectBudgets._sum.budget || 0,
        equipmentUtilization: totalEquipment > 0 ? (operationalEquipment / totalEquipment) * 100 : 0,
        activeAssignments: equipmentAssignments || 0,
      },
      distributions: {
        projectStatus: projectStatusCounts.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
        equipmentStatus: equipmentStatusCounts.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
      },
      recentActivities: recentActivities.map((activity) => ({
        id: activity.id,
        name: activity.name,
        description: activity.description,
        project: activity.project.name,
        projectCode: activity.project.projectCode,
        status: activity.status,
        startDate: activity.startDate,
        endDate: activity.endDate,
        createdAt: activity.createdAt,
      })),
      recentFuelRequests: recentFuelRequests.map((request) => ({
        id: request.id,
        requestNumber: request.requestNumber,
        equipment: request.equipment.name,
        equipmentCode: request.equipment.equipmentCode,
        project: request.project.name,
        projectCode: request.project.projectCode,
        requestedBy: `${request.requestedBy.firstName} ${request.requestedBy.lastName}`,
        fuelType: request.fuelType,
        quantity: request.quantity,
        status: request.status,
        requestDate: request.requestDate,
      })),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
