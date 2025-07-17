"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db, withRetry, withTransaction } from "@/lib/db"
import { validateData, fuelRequestSchema } from "@/lib/validation"
import {
  AppError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
  createSuccessResponse,
  createErrorResponse,
  parseDatabaseError,
} from "@/lib/errors"
import { auditCreate, auditUpdate } from "@/lib/audit"
import type {
  ApiResponse,
  FuelRequestWithRelations,
  CreateFuelRequestRequest,
  ApproveFuelRequestRequest,
  IssueFuelRequestRequest,
  AcknowledgeFuelRequestRequest,
  CompleteFuelRequestRequest,
} from "@/types/api"
import { FuelRequestStatus, FuelType, FuelUrgency } from "@prisma/client"

// Cache for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data
  }
  cache.delete(key)
  return null
}

function setCachedData<T>(key: string, data: T, ttl = 300000): void {
  cache.set(key, { data, timestamp: Date.now(), ttl })
}

export async function getFuelRequests(filters?: {
  status?: FuelRequestStatus
  projectId?: number
  equipmentId?: number
  requestedById?: number
  page?: number
  limit?: number
}): Promise<ApiResponse<FuelRequestWithRelations[]>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const cacheKey = `fuel-requests-${JSON.stringify(filters || {})}`
    const cached = getCachedData<FuelRequestWithRelations[]>(cacheKey)
    if (cached) {
      return createSuccessResponse(cached)
    }

    const where: any = {}
    if (filters?.status) where.status = filters.status
    if (filters?.projectId) where.projectId = filters.projectId
    if (filters?.equipmentId) where.equipmentId = filters.equipmentId
    if (filters?.requestedById) where.requestedById = filters.requestedById

    const fuelRequests = await withRetry(async () => {
      return await db.fuelRequest.findMany({
        where,
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
          project: {
            select: {
              id: true,
              name: true,
              projectCode: true,
              status: true,
            },
          },
          requestedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employee: {
                select: {
                  employeeNumber: true,
                  designation: true,
                },
              },
            },
          },
          approvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          issuedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          acknowledgedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          completedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: filters?.limit || 100,
        skip: filters?.page ? (filters.page - 1) * (filters.limit || 100) : 0,
      })
    })

    setCachedData(cacheKey, fuelRequests, 60000) // Cache for 1 minute

    return createSuccessResponse(fuelRequests as FuelRequestWithRelations[])
  } catch (error) {
    console.error("Failed to fetch fuel requests:", error)
    if (error instanceof AppError) {
      return createErrorResponse(error)
    }
    return createErrorResponse(parseDatabaseError(error), "Failed to fetch fuel requests")
  }
}

export async function createFuelRequest(
  data: CreateFuelRequestRequest,
): Promise<ApiResponse<FuelRequestWithRelations>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Validate input data
    const validation = validateData(fuelRequestSchema, data)
    if (!validation.isValid) {
      throw new ValidationError(`Validation failed: ${validation.errors.map((e) => e.message).join(", ")}`)
    }

    // Check if equipment and project exist and are active
    const [equipment, project] = await Promise.all([
      db.equipment.findUnique({
        where: { id: data.equipmentId },
        select: { id: true, status: true, name: true },
      }),
      db.project.findUnique({
        where: { id: data.projectId },
        select: { id: true, status: true, name: true },
      }),
    ])

    if (!equipment) {
      throw new NotFoundError("Equipment")
    }
    if (!project) {
      throw new NotFoundError("Project")
    }
    if (equipment.status !== "OPERATIONAL") {
      throw new ValidationError("Equipment is not operational")
    }
    if (project.status !== "ACTIVE") {
      throw new ValidationError("Project is not active")
    }

    const fuelRequest = await withTransaction(async (tx) => {
      // Generate unique request number
      const requestNumber = `FR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const newRequest = await tx.fuelRequest.create({
        data: {
          requestNumber,
          equipmentId: data.equipmentId,
          projectId: data.projectId,
          fuelType: data.fuelType,
          requestedQuantity: data.requestedQuantity,
          justification: data.justification,
          urgency: data.urgency,
          requestedById: Number.parseInt(session.user.id),
          status: FuelRequestStatus.PENDING,
          odometerKm: data.odometerKm,
        },
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
          project: {
            select: {
              id: true,
              name: true,
              projectCode: true,
              status: true,
            },
          },
          requestedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employee: {
                select: {
                  employeeNumber: true,
                  designation: true,
                },
              },
            },
          },
          approvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          issuedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          acknowledgedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          completedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      // Create audit log
      await auditCreate("fuelRequest", newRequest.id, newRequest)

      return newRequest
    })

    // Clear cache
    cache.clear()

    revalidatePath("/fuel-management")
    return createSuccessResponse(fuelRequest as FuelRequestWithRelations, "Fuel request created successfully")
  } catch (error) {
    console.error("Failed to create fuel request:", error)
    if (error instanceof AppError) {
      return createErrorResponse(error)
    }
    return createErrorResponse(parseDatabaseError(error), "Failed to create fuel request")
  }
}

export async function approveFuelRequest(id: number, data: ApproveFuelRequestRequest): Promise<ApiResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Check permissions
    if (!["Admin", "Project Manager"].includes(session.user.role)) {
      throw new ForbiddenError("Only Project Managers can approve fuel requests")
    }

    // Validate approval data
    if (data.approved && (!data.approvedQuantity || data.approvedQuantity <= 0)) {
      throw new ValidationError("Approved quantity is required for approval")
    }
    if (!data.approved && !data.rejectionReason) {
      throw new ValidationError("Rejection reason is required for rejection")
    }

    const fuelRequest = await withTransaction(async (tx) => {
      // Get current request
      const currentRequest = await tx.fuelRequest.findUnique({
        where: { id },
      })

      if (!currentRequest) {
        throw new NotFoundError("Fuel request")
      }

      if (currentRequest.status !== FuelRequestStatus.PENDING) {
        throw new ValidationError("Only pending fuel requests can be approved or rejected")
      }

      // Update request
      const updatedRequest = await tx.fuelRequest.update({
        where: { id },
        data: {
          status: data.approved ? FuelRequestStatus.APPROVED : FuelRequestStatus.REJECTED,
          approvedById: Number.parseInt(session.user.id),
          approvalDate: new Date(),
          approvedQuantity: data.approved ? data.approvedQuantity : null,
          approvalComments: data.approvalComments,
          rejectionReason: data.approved ? null : data.rejectionReason,
        },
      })

      // Create audit log
      await auditUpdate("fuelRequest", id, currentRequest, updatedRequest)

      return updatedRequest
    })

    // Clear cache
    cache.clear()

    revalidatePath("/fuel-management")
    return createSuccessResponse(undefined, `Fuel request ${data.approved ? "approved" : "rejected"} successfully`)
  } catch (error) {
    console.error("Failed to approve fuel request:", error)
    if (error instanceof AppError) {
      return createErrorResponse(error)
    }
    return createErrorResponse(parseDatabaseError(error), "Failed to process approval")
  }
}

export async function issueFuelRequest(id: number, data: IssueFuelRequestRequest): Promise<ApiResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Check permissions
    if (!["Admin", "Store Manager"].includes(session.user.role)) {
      throw new ForbiddenError("Only Store Managers can issue fuel")
    }

    // Validate issue data
    if (!data.issuedQuantity || data.issuedQuantity <= 0) {
      throw new ValidationError("Issued quantity must be greater than 0")
    }

    const fuelRequest = await withTransaction(async (tx) => {
      // Get current request
      const currentRequest = await tx.fuelRequest.findUnique({
        where: { id },
      })

      if (!currentRequest) {
        throw new NotFoundError("Fuel request")
      }

      if (currentRequest.status !== FuelRequestStatus.APPROVED) {
        throw new ValidationError("Only approved fuel requests can be issued")
      }

      if (data.issuedQuantity > (currentRequest.approvedQuantity || 0)) {
        throw new ValidationError("Issued quantity cannot exceed approved quantity")
      }

      // Update request
      const updatedRequest = await tx.fuelRequest.update({
        where: { id },
        data: {
          status: FuelRequestStatus.ISSUED,
          issuedById: Number.parseInt(session.user.id),
          issuanceDate: new Date(),
          issuedQuantity: data.issuedQuantity,
          issuanceComments: data.issuanceComments,
        },
      })

      // Create audit log
      await auditUpdate("fuelRequest", id, currentRequest, updatedRequest)

      return updatedRequest
    })

    // Clear cache
    cache.clear()

    revalidatePath("/fuel-management")
    return createSuccessResponse(undefined, "Fuel issued successfully")
  } catch (error) {
    console.error("Failed to issue fuel:", error)
    if (error instanceof AppError) {
      return createErrorResponse(error)
    }
    return createErrorResponse(parseDatabaseError(error), "Failed to issue fuel")
  }
}

export async function acknowledgeFuelRequest(
  id: number,
  data: AcknowledgeFuelRequestRequest,
): Promise<ApiResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Validate acknowledgment data
    if (!data.acknowledgedQuantity || data.acknowledgedQuantity <= 0) {
      throw new ValidationError("Acknowledged quantity must be greater than 0")
    }

    const fuelRequest = await withTransaction(async (tx) => {
      // Get current request
      const currentRequest = await tx.fuelRequest.findUnique({
        where: { id },
      })

      if (!currentRequest) {
        throw new NotFoundError("Fuel request")
      }

      if (currentRequest.status !== FuelRequestStatus.ISSUED) {
        throw new ValidationError("Only issued fuel requests can be acknowledged")
      }

      if (currentRequest.requestedById !== Number.parseInt(session.user.id)) {
        throw new ForbiddenError("Only the original requester can acknowledge fuel receipt")
      }

      if (data.acknowledgedQuantity > (currentRequest.issuedQuantity || 0)) {
        throw new ValidationError("Acknowledged quantity cannot exceed issued quantity")
      }

      // Update request
      const updatedRequest = await tx.fuelRequest.update({
        where: { id },
        data: {
          status: FuelRequestStatus.ACKNOWLEDGED,
          acknowledgedById: Number.parseInt(session.user.id),
          acknowledgmentDate: new Date(),
          acknowledgedQuantity: data.acknowledgedQuantity,
          acknowledgmentComments: data.acknowledgmentComments,
        },
      })

      // Create audit log
      await auditUpdate("fuelRequest", id, currentRequest, updatedRequest)

      return updatedRequest
    })

    // Clear cache
    cache.clear()

    revalidatePath("/fuel-management")
    return createSuccessResponse(undefined, "Fuel receipt acknowledged successfully")
  } catch (error) {
    console.error("Failed to acknowledge fuel receipt:", error)
    if (error instanceof AppError) {
      return createErrorResponse(error)
    }
    return createErrorResponse(parseDatabaseError(error), "Failed to acknowledge fuel receipt")
  }
}

export async function completeFuelRequest(id: number, data: CompleteFuelRequestRequest): Promise<ApiResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    // Check permissions
    if (session.user.role !== "Admin") {
      throw new ForbiddenError("Only Admins can complete fuel requests")
    }

    const fuelRequest = await withTransaction(async (tx) => {
      // Get current request
      const currentRequest = await tx.fuelRequest.findUnique({
        where: { id },
      })

      if (!currentRequest) {
        throw new NotFoundError("Fuel request")
      }

      if (currentRequest.status !== FuelRequestStatus.ACKNOWLEDGED) {
        throw new ValidationError("Only acknowledged fuel requests can be completed")
      }

      // Update request
      const updatedRequest = await tx.fuelRequest.update({
        where: { id },
        data: {
          status: FuelRequestStatus.COMPLETED,
          completedById: Number.parseInt(session.user.id),
          completionDate: new Date(),
          completionComments: data.completionComments,
        },
      })

      // Create audit log
      await auditUpdate("fuelRequest", id, currentRequest, updatedRequest)

      return updatedRequest
    })

    // Clear cache
    cache.clear()

    revalidatePath("/fuel-management")
    return createSuccessResponse(undefined, "Fuel request completed successfully")
  } catch (error) {
    console.error("Failed to complete fuel request:", error)
    if (error instanceof AppError) {
      return createErrorResponse(error)
    }
    return createErrorResponse(parseDatabaseError(error), "Failed to complete fuel request")
  }
}

export async function cancelFuelRequest(id: number): Promise<ApiResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const fuelRequest = await withTransaction(async (tx) => {
      // Get current request
      const currentRequest = await tx.fuelRequest.findUnique({
        where: { id },
      })

      if (!currentRequest) {
        throw new NotFoundError("Fuel request")
      }

      // Check permissions
      const canCancel =
        currentRequest.status === FuelRequestStatus.PENDING ||
        session.user.role === "Admin" ||
        currentRequest.requestedById === Number.parseInt(session.user.id)

      if (!canCancel) {
        throw new ForbiddenError("Cannot cancel this fuel request")
      }

      // Update request
      const updatedRequest = await tx.fuelRequest.update({
        where: { id },
        data: {
          status: FuelRequestStatus.CANCELLED,
        },
      })

      // Create audit log
      await auditUpdate("fuelRequest", id, currentRequest, updatedRequest)

      return updatedRequest
    })

    // Clear cache
    cache.clear()

    revalidatePath("/fuel-management")
    return createSuccessResponse(undefined, "Fuel request cancelled successfully")
  } catch (error) {
    console.error("Failed to cancel fuel request:", error)
    if (error instanceof AppError) {
      return createErrorResponse(error)
    }
    return createErrorResponse(parseDatabaseError(error), "Failed to cancel fuel request")
  }
}

export async function getFuelRequestById(id: number): Promise<ApiResponse<FuelRequestWithRelations>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const cacheKey = `fuel-request-${id}`
    const cached = getCachedData<FuelRequestWithRelations>(cacheKey)
    if (cached) {
      return createSuccessResponse(cached)
    }

    const fuelRequest = await withRetry(async () => {
      return await db.fuelRequest.findUnique({
        where: { id },
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
          project: {
            select: {
              id: true,
              name: true,
              projectCode: true,
              status: true,
            },
          },
          requestedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employee: {
                select: {
                  employeeNumber: true,
                  designation: true,
                },
              },
            },
          },
          approvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          issuedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          acknowledgedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          completedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })
    })

    if (!fuelRequest) {
      throw new NotFoundError("Fuel request")
    }

    setCachedData(cacheKey, fuelRequest, 300000) // Cache for 5 minutes

    return createSuccessResponse(fuelRequest as FuelRequestWithRelations)
  } catch (error) {
    console.error("Failed to fetch fuel request:", error)
    if (error instanceof AppError) {
      return createErrorResponse(error)
    }
    return createErrorResponse(parseDatabaseError(error), "Failed to fetch fuel request")
  }
}

// Utility function to get fuel request statistics
export async function getFuelRequestStats(): Promise<
  ApiResponse<{
    total: number
    byStatus: Record<FuelRequestStatus, number>
    byUrgency: Record<FuelUrgency, number>
    byFuelType: Record<FuelType, number>
    averageProcessingTime: number
  }>
> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    const cacheKey = "fuel-request-stats"
    const cached = getCachedData<any>(cacheKey)
    if (cached) {
      return createSuccessResponse(cached)
    }

    const [total, byStatus, byUrgency, byFuelType, processingTimes] = await Promise.all([
      db.fuelRequest.count(),
      db.fuelRequest.groupBy({
        by: ["status"],
        _count: true,
      }),
      db.fuelRequest.groupBy({
        by: ["urgency"],
        _count: true,
      }),
      db.fuelRequest.groupBy({
        by: ["fuelType"],
        _count: true,
      }),
      db.fuelRequest.findMany({
        where: {
          status: FuelRequestStatus.COMPLETED,
          completionDate: { not: null },
        },
        select: {
          createdAt: true,
          completionDate: true,
        },
      }),
    ])

    const statusCounts = Object.values(FuelRequestStatus).reduce(
      (acc, status) => {
        acc[status] = byStatus.find((s) => s.status === status)?._count || 0
        return acc
      },
      {} as Record<FuelRequestStatus, number>,
    )

    const urgencyCounts = Object.values(FuelUrgency).reduce(
      (acc, urgency) => {
        acc[urgency] = byUrgency.find((u) => u.urgency === urgency)?._count || 0
        return acc
      },
      {} as Record<FuelUrgency, number>,
    )

    const fuelTypeCounts = Object.values(FuelType).reduce(
      (acc, fuelType) => {
        acc[fuelType] = byFuelType.find((f) => f.fuelType === fuelType)?._count || 0
        return acc
      },
      {} as Record<FuelType, number>,
    )

    const averageProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((sum, req) => {
            const diff = req.completionDate!.getTime() - req.createdAt.getTime()
            return sum + diff
          }, 0) /
          processingTimes.length /
          (1000 * 60 * 60 * 24) // Convert to days
        : 0

    const stats = {
      total,
      byStatus: statusCounts,
      byUrgency: urgencyCounts,
      byFuelType: fuelTypeCounts,
      averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
    }

    setCachedData(cacheKey, stats, 600000) // Cache for 10 minutes

    return createSuccessResponse(stats)
  } catch (error) {
    console.error("Failed to fetch fuel request stats:", error)
    if (error instanceof AppError) {
      return createErrorResponse(error)
    }
    return createErrorResponse(parseDatabaseError(error), "Failed to fetch statistics")
  }
}
