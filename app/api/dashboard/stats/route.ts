import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma, safeDbOperation } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [
      totalProjects,
      activeProjects,
      newProjectsThisMonth,
      totalEquipment,
      operationalEquipment,
      totalEmployees,
      pendingFuelRequests,
      projectStatusData,
      equipmentStatusData,
      recentActivities,
      recentFuelRequests,
    ] = await Promise.all([
      safeDbOperation(() => prisma.project.count(), 0),
      safeDbOperation(() => prisma.project.count({ where: { status: "ACTIVE" } }), 0),
      safeDbOperation(
        () =>
          prisma.project.count({
            where: {
              createdAt: {
                gte: new Date(new Date().setDate(new Date().getDate() - 30)),
              },
            },
          }),
        0
      ),
      safeDbOperation(() => prisma.equipment.count(), 0),
      safeDbOperation(() => prisma.equipment.count({ where: { status: "OPERATIONAL" } }), 0),
      safeDbOperation(() => prisma.employee.count(), 0),
      safeDbOperation(() => prisma.fuelRequest.count({ where: { status: "PENDING" } }), 0),
      safeDbOperation(
        () =>
          prisma.project.groupBy({
            by: ["status"],
            _count: { status: true },
          }),
        []
      ),
      safeDbOperation(
        () =>
          prisma.equipment.groupBy({
            by: ["status"],
            _count: { status: true },
          }),
        []
      ),
      safeDbOperation(
        () =>
          prisma.activity.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
          }),
        []
      ),
      safeDbOperation(
        () =>
          prisma.fuelRequest.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
          }),
        []
      ),
    ])

    return NextResponse.json({
      totalProjects,
      activeProjects,
      newProjectsThisMonth,
      totalEquipment,
      equipmentUtilization:
        totalEquipment > 0 ? Math.round((operationalEquipment / totalEquipment) * 100) : 0,
      operationalEquipment,
      totalEmployees,
      pendingFuelRequests,
      projectStatusData: projectStatusData.map((p: any) => ({
        name: p.status,
        count: p._count.status,
      })),
      equipmentStatusData: equipmentStatusData.map((e: any) => ({
        name: e.status,
        count: e._count.status,
      })),
      recentActivities: recentActivities.map((a: any) => ({
        type:
          a.status === "COMPLETED"
            ? "success"
            : a.status === "PENDING"
            ? "warning"
            : a.status === "FAILED"
            ? "error"
            : "info",
        description: a.description || "No description",
        timestamp: new Date(a.createdAt).toLocaleString(),
      })),
      recentFuelRequests: recentFuelRequests.map((r: any) => ({
        status: r.status,
        description: r.description || "No description",
        timestamp: new Date(r.createdAt).toLocaleString(),
      })),
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)

    return NextResponse.json({
      totalProjects: 3,
      activeProjects: 2,
      newProjectsThisMonth: 1,
      totalEquipment: 5,
      equipmentUtilization: 80,
      operationalEquipment: 4,
      totalEmployees: 8,
      pendingFuelRequests: 3,
      projectStatusData: [
        { name: "ACTIVE", count: 2 },
        { name: "PLANNING", count: 1 },
      ],
      equipmentStatusData: [
        { name: "OPERATIONAL", count: 4 },
        { name: "MAINTENANCE", count: 1 },
      ],
      recentActivities: [
        {
          type: "success",
          description: "Demo: Completed foundation work",
          timestamp: new Date().toLocaleString(),
        },
      ],
      recentFuelRequests: [
        {
          status: "PENDING",
          description: "Fuel for Project A",
          timestamp: new Date().toLocaleString(),
        },
      ],
    })
  }
}
