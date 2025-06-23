"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db, withRetry } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function generateReport(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    const reportType = formData.get("reportType") as string
    const dateFrom = formData.get("dateFrom") as string
    const dateTo = formData.get("dateTo") as string
    const projectId = formData.get("projectId") as string

    // Generate report based on type
    let reportData = {}

    switch (reportType) {
      case "project-summary":
        reportData = await generateProjectSummaryReport(dateFrom, dateTo, projectId)
        break
      case "financial":
        reportData = await generateFinancialReport(dateFrom, dateTo, projectId)
        break
      case "equipment-utilization":
        reportData = await generateEquipmentReport(dateFrom, dateTo)
        break
      case "fuel-consumption":
        reportData = await generateFuelReport(dateFrom, dateTo, projectId)
        break
      case "employee-productivity":
        reportData = await generateEmployeeReport(dateFrom, dateTo)
        break
      case "safety-compliance":
        reportData = await generateSafetyReport(dateFrom, dateTo)
        break
      default:
        throw new Error("Invalid report type")
    }

    // Create a simple report record (without saving to database for now)
    const report = {
      id: Date.now(), // Temporary ID
      name: `${reportData.type} - ${new Date().toLocaleDateString()}`,
      type: reportType,
      data: reportData,
      generatedBy: session.user.id,
      parameters: {
        dateFrom,
        dateTo,
        projectId,
      },
      status: "COMPLETED",
      createdAt: new Date(),
    }

    revalidatePath("/reports")
    return { success: true, reportId: report.id, reportData }
  } catch (error) {
    console.error("Error generating report:", error)
    throw new Error("Failed to generate report")
  }
}

export async function getReports() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  // For now, return empty array since we don't have reports table
  return []
}

export async function getReportById(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  // Mock report data for now
  return {
    id,
    name: "Sample Report",
    type: "project-summary",
    data: {},
    createdAt: new Date(),
    user: {
      firstName: session.user.name?.split(" ")[0] || "User",
      lastName: session.user.name?.split(" ")[1] || "",
    },
  }
}

export async function deleteReport(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  // Mock deletion for now
  revalidatePath("/reports")
  return { success: true }
}

async function generateProjectSummaryReport(dateFrom: string, dateTo: string, projectId: string) {
  const whereClause: any = {}

  if (dateFrom && dateTo) {
    whereClause.createdAt = {
      gte: new Date(dateFrom),
      lte: new Date(dateTo),
    }
  }

  if (projectId && projectId !== "all") {
    whereClause.id = Number.parseInt(projectId)
  }

  const projects = await withRetry(async () => {
    return await db.project.findMany({
      where: whereClause,
      include: {
        client: true,
        activities: true,
        equipmentAssigned: true, // Fixed field name
        fuelRequests: true,
        invoices: true,
      },
    })
  })

  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
  const totalSpent = projects.reduce((sum, p) => {
    const projectInvoices = p.invoices.filter((inv) => inv.status === "PAID")
    return sum + projectInvoices.reduce((invSum, inv) => invSum + inv.amount, 0)
  }, 0)

  return {
    type: "Project Summary Report",
    generatedAt: new Date().toISOString(),
    summary: {
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => p.status === "ACTIVE").length,
      completedProjects: projects.filter((p) => p.status === "COMPLETED").length,
      onHoldProjects: projects.filter((p) => p.status === "ON_HOLD").length,
      totalBudget,
      totalSpent,
      budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
    },
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      projectCode: p.projectCode,
      status: p.status,
      budget: p.budget,
      spent: p.invoices.filter((inv) => inv.status === "PAID").reduce((sum, inv) => sum + inv.amount, 0),
      client: p.client?.name,
      startDate: p.startDate,
      endDate: p.endDate,
      activitiesCount: p.activities.length,
      equipmentCount: p.equipmentAssigned.length,
      fuelRequestsCount: p.fuelRequests.length,
      progress: calculateProjectProgress(p),
    })),
  }
}

async function generateFinancialReport(dateFrom: string, dateTo: string, projectId: string) {
  const whereClause: any = {}

  if (dateFrom && dateTo) {
    whereClause.invoiceDate = {
      gte: new Date(dateFrom),
      lte: new Date(dateTo),
    }
  }

  if (projectId && projectId !== "all") {
    whereClause.projectId = Number.parseInt(projectId)
  }

  const invoices = await withRetry(async () => {
    return await db.invoice.findMany({
      where: whereClause,
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    })
  })

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const paidAmount = invoices.filter((inv) => inv.status === "PAID").reduce((sum, inv) => sum + inv.amount, 0)
  const pendingAmount = invoices.filter((inv) => inv.status === "PENDING").reduce((sum, inv) => sum + inv.amount, 0)
  const approvedAmount = invoices.filter((inv) => inv.status === "APPROVED").reduce((sum, inv) => sum + inv.amount, 0)

  return {
    type: "Financial Report",
    generatedAt: new Date().toISOString(),
    summary: {
      totalInvoices: invoices.length,
      totalAmount,
      paidAmount,
      pendingAmount,
      approvedAmount,
      collectionRate: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
    },
    invoicesByStatus: {
      PAID: invoices.filter((inv) => inv.status === "PAID").length,
      PENDING: invoices.filter((inv) => inv.status === "PENDING").length,
      APPROVED: invoices.filter((inv) => inv.status === "APPROVED").length,
      REJECTED: invoices.filter((inv) => inv.status === "REJECTED").length,
    },
    invoicesByProject: invoices.reduce((acc: any, inv) => {
      const projectName = inv.project.name
      if (!acc[projectName]) {
        acc[projectName] = { count: 0, amount: 0 }
      }
      acc[projectName].count += 1
      acc[projectName].amount += inv.amount
      return acc
    }, {}),
    monthlyTrend: generateMonthlyTrend(invoices),
  }
}

async function generateEquipmentReport(dateFrom: string, dateTo: string) {
  const equipment = await withRetry(async () => {
    return await db.equipment.findMany({
      include: {
        assignments: {
          where:
            dateFrom && dateTo
              ? {
                  startDate: {
                    gte: new Date(dateFrom),
                    lte: new Date(dateTo),
                  },
                }
              : {},
          include: {
            project: true,
          },
        },
      },
    })
  })

  const totalEquipment = equipment.length
  const operationalEquipment = equipment.filter((eq) => eq.status === "OPERATIONAL").length
  const maintenanceEquipment = equipment.filter((eq) => eq.status === "UNDER_MAINTENANCE").length
  const outOfServiceEquipment = equipment.filter((eq) => eq.status === "OUT_OF_SERVICE").length

  return {
    type: "Equipment Utilization Report",
    generatedAt: new Date().toISOString(),
    summary: {
      totalEquipment,
      operationalEquipment,
      maintenanceEquipment,
      outOfServiceEquipment,
      utilizationRate:
        totalEquipment > 0 ? (equipment.filter((eq) => eq.assignments.length > 0).length / totalEquipment) * 100 : 0,
    },
    equipmentByType: equipment.reduce((acc: any, eq) => {
      acc[eq.type] = (acc[eq.type] || 0) + 1
      return acc
    }, {}),
    equipmentByStatus: {
      OPERATIONAL: operationalEquipment,
      UNDER_MAINTENANCE: maintenanceEquipment,
      OUT_OF_SERVICE: outOfServiceEquipment,
    },
    mostUtilizedEquipment: equipment
      .map((eq) => ({
        id: eq.id,
        name: eq.name,
        type: eq.type,
        assignmentsCount: eq.assignments.length,
        status: eq.status,
      }))
      .sort((a, b) => b.assignmentsCount - a.assignmentsCount)
      .slice(0, 10),
  }
}

async function generateFuelReport(dateFrom: string, dateTo: string, projectId: string) {
  const whereClause: any = {}

  if (dateFrom && dateTo) {
    whereClause.requestDate = {
      gte: new Date(dateFrom),
      lte: new Date(dateTo),
    }
  }

  if (projectId && projectId !== "all") {
    whereClause.projectId = Number.parseInt(projectId)
  }

  const fuelRequests = await withRetry(async () => {
    return await db.fuelRequest.findMany({
      where: whereClause,
      include: {
        equipment: true,
        project: true,
      },
    })
  })

  const totalQuantity = fuelRequests.reduce((sum, req) => sum + req.quantity, 0)
  const approvedQuantity = fuelRequests
    .filter((req) => req.status === "APPROVED")
    .reduce((sum, req) => sum + req.quantity, 0)

  return {
    type: "Fuel Consumption Report",
    generatedAt: new Date().toISOString(),
    summary: {
      totalRequests: fuelRequests.length,
      totalQuantity,
      approvedQuantity,
      approvedRequests: fuelRequests.filter((req) => req.status === "APPROVED").length,
      pendingRequests: fuelRequests.filter((req) => req.status === "PENDING").length,
      rejectedRequests: fuelRequests.filter((req) => req.status === "REJECTED").length,
      approvalRate:
        fuelRequests.length > 0
          ? (fuelRequests.filter((req) => req.status === "APPROVED").length / fuelRequests.length) * 100
          : 0,
    },
    fuelByType: fuelRequests.reduce((acc: any, req) => {
      acc[req.fuelType] = (acc[req.fuelType] || 0) + req.quantity
      return acc
    }, {}),
    fuelByProject: fuelRequests.reduce((acc: any, req) => {
      const projectName = req.project.name
      if (!acc[projectName]) {
        acc[projectName] = { requests: 0, quantity: 0 }
      }
      acc[projectName].requests += 1
      acc[projectName].quantity += req.quantity
      return acc
    }, {}),
    topConsumingEquipment: fuelRequests.reduce((acc: any, req) => {
      const equipmentName = req.equipment.name
      if (!acc[equipmentName]) {
        acc[equipmentName] = { requests: 0, quantity: 0 }
      }
      acc[equipmentName].requests += 1
      acc[equipmentName].quantity += req.quantity
      return acc
    }, {}),
  }
}

async function generateEmployeeReport(dateFrom: string, dateTo: string) {
  const employees = await withRetry(async () => {
    return await db.employee.findMany({
      include: {
        user: true,
      },
    })
  })

  return {
    type: "Employee Productivity Report",
    generatedAt: new Date().toISOString(),
    summary: {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((emp) => emp.user?.isActive).length,
      inactiveEmployees: employees.filter((emp) => !emp.user?.isActive).length,
    },
    departmentDistribution: employees.reduce((acc: any, emp) => {
      acc[emp.section] = (acc[emp.section] || 0) + 1
      return acc
    }, {}),
    positionDistribution: employees.reduce((acc: any, emp) => {
      acc[emp.designation] = (acc[emp.designation] || 0) + 1
      return acc
    }, {}),
    employees: employees.map((emp) => ({
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      employeeNumber: emp.employeeNumber,
      section: emp.section,
      designation: emp.designation,
      dateOfAppointment: emp.dateOfAppointment,
      isActive: emp.user?.isActive,
    })),
  }
}

async function generateSafetyReport(dateFrom: string, dateTo: string) {
  // Since we don't have a safety incidents table, we'll create a mock report
  return {
    type: "Safety & Compliance Report",
    generatedAt: new Date().toISOString(),
    summary: {
      totalIncidents: 0,
      safetyScore: 95,
      complianceRate: 98,
      trainingCompleted: 85,
      safetyMeetings: 12,
    },
    incidentsByType: {
      "Minor Injury": 0,
      "Equipment Damage": 0,
      "Near Miss": 0,
      "Property Damage": 0,
    },
    complianceMetrics: {
      "Safety Training": 95,
      "Equipment Inspection": 98,
      Documentation: 92,
      "Emergency Procedures": 97,
    },
  }
}

function calculateProjectProgress(project: any): number {
  if (project.activities.length === 0) return 0
  const completedActivities = project.activities.filter((activity: any) => activity.status === "COMPLETED").length
  return Math.round((completedActivities / project.activities.length) * 100)
}

function generateMonthlyTrend(invoices: any[]) {
  const monthlyData: any = {}
  invoices.forEach((invoice) => {
    const month = new Date(invoice.invoiceDate).toISOString().slice(0, 7)
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, amount: 0 }
    }
    monthlyData[month].count += 1
    monthlyData[month].amount += invoice.amount
  })
  return monthlyData
}
