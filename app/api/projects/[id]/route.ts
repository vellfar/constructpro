import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { projectUpdateSchema, validateSchema } from "@/lib/validation"
import { AppError, handleApiError } from "@/lib/errors"
import { cache, cacheKeys } from "@/lib/cache"
import { auditLog } from "@/lib/audit"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new AppError("Unauthorized", 401, "AUTH_REQUIRED")
    }

    const projectId = Number(params.id)
    if (isNaN(projectId)) {
      throw new AppError("Invalid project ID", 400, "INVALID_ID")
    }

    const cacheKey = cacheKeys.project(projectId)
    const cachedProject = cache.get(cacheKey)
    // const cachedProject = await cache.get(cacheKey) // use this if cache is async

    if (cachedProject) {
      return NextResponse.json(cachedProject)
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        activities: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        equipmentAssignments: {
          include: {
            equipment: {
              select: {
                id: true,
                name: true,
                equipmentCode: true,
                type: true,
                status: true,
              },
            },
          },
          where: { endDate: null }, // Only active assignments
        },
        fuelRequests: {
          include: {
            equipment: {
              select: {
                name: true,
                equipmentCode: true,
              },
            },
            requestedBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { requestDate: "desc" },
          take: 10,
        },
        invoices: {
          orderBy: { issueDate: "desc" },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!project) {
      throw new AppError("Project not found", 404, "PROJECT_NOT_FOUND")
    }

    cache.set(cacheKey, project, 600) // Cache for 10 minutes

    return NextResponse.json(project)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", 401, "AUTH_REQUIRED")
    }

    const projectId = Number(params.id)
    if (isNaN(projectId)) {
      throw new AppError("Invalid project ID", 400, "INVALID_ID")
    }

    const body = await request.json()
    const validation = validateSchema(projectUpdateSchema, { ...body, id: projectId })

    if (!validation.success) {
      throw new AppError("Invalid project data", 400, "VALIDATION_ERROR", validation.errors)
    }

    const { id, ...updateData } = validation.data

    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!existingProject) {
      throw new AppError("Project not found", 404, "PROJECT_NOT_FOUND")
    }

    if (updateData.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: updateData.clientId },
      })
      if (!client) {
        throw new AppError("Client not found", 404, "CLIENT_NOT_FOUND")
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    await auditLog({
      action: "UPDATE",
      resource: "PROJECT",
      resourceId: projectId.toString(),
      userId: session.user.id,
      details: { changes: updateData },
    })

    cache.delete(cacheKeys.project(projectId))
    cache.delete(cacheKeys.dashboardStats())

    return NextResponse.json(updatedProject)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", 401, "AUTH_REQUIRED")
    }

    const projectId = Number(params.id)
    if (isNaN(projectId)) {
      throw new AppError("Invalid project ID", 400, "INVALID_ID")
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        activities: { select: { id: true } },
        equipmentAssignments: { select: { id: true } },
        fuelRequests: { select: { id: true } },
        invoices: { select: { id: true } },
      },
    })

    if (!project) {
      throw new AppError("Project not found", 404, "PROJECT_NOT_FOUND")
    }

    const hasDependencies =
      project.activities.length > 0 ||
      project.equipmentAssignments.length > 0 ||
      project.fuelRequests.length > 0 ||
      project.invoices.length > 0

    if (hasDependencies) {
      throw new AppError(
        "Cannot delete project with existing activities, equipment assignments, fuel requests, or invoices",
        400,
        "PROJECT_HAS_DEPENDENCIES"
      )
    }

    await prisma.project.delete({
      where: { id: projectId },
    })

    await auditLog({
      action: "DELETE",
      resource: "PROJECT",
      resourceId: projectId.toString(),
      userId: session.user.id,
      details: { projectCode: project.projectCode, name: project.name },
    })

    cache.delete(cacheKeys.project(projectId))
    cache.delete(cacheKeys.dashboardStats())

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
