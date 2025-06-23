import { prisma } from "@/lib/db"

interface AuditLogData {
  action: string
  resource: string
  resourceId: string
  userId?: number
  details?: any
}

export async function auditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.resource,
        entityId: Number.parseInt(data.resourceId),
        newValues: data.details,
        userId: data.userId,
      },
    })
  } catch (error) {
    console.error("Failed to create audit log:", error)
    // Don't throw to avoid breaking main operations
  }
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  return auditLog(data)
}

export async function auditCreate(
  entityType: string,
  entityId: number,
  newValues: any,
  userId?: number,
): Promise<void> {
  await auditLog({
    action: "CREATE",
    resource: entityType,
    resourceId: entityId.toString(),
    details: newValues,
    userId,
  })
}

export async function auditUpdate(
  entityType: string,
  entityId: number,
  oldValues: any,
  newValues: any,
  userId?: number,
): Promise<void> {
  await auditLog({
    action: "UPDATE",
    resource: entityType,
    resourceId: entityId.toString(),
    details: { old: oldValues, new: newValues },
    userId,
  })
}

export async function auditDelete(
  entityType: string,
  entityId: number,
  oldValues: any,
  userId?: number,
): Promise<void> {
  await auditLog({
    action: "DELETE",
    resource: entityType,
    resourceId: entityId.toString(),
    details: oldValues,
    userId,
  })
}
