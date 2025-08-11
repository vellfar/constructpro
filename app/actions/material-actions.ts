'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { validateSchema } from '@/lib/validation'
import { z } from 'zod'
import type {
  CreateMaterialRequest,
  UpdateMaterialRequest,
  CreateMaterialRequestRequest,
  ApproveMaterialRequestRequest,
  IssueMaterialRequestRequest,
  AcknowledgeMaterialRequestRequest,
  CompleteMaterialRequestRequest,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  InventoryAdjustmentRequest,
} from '@/types/material-management'

// Material schemas
const materialCreateSchema = z.object({
  materialCode: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(100),
  unit: z.string().min(1).max(20),
  unitCost: z.number().min(0).optional(),
  minimumStockLevel: z.number().min(0).optional(),
  maximumStockLevel: z.number().min(0).optional(),
  reorderPoint: z.number().min(0).optional(),
  supplierId: z.number().int().positive().optional(),
})

const materialRequestCreateSchema = z.object({
  materialId: z.number().int().positive(),
  projectId: z.number().int().positive(),
  requestedQuantity: z.number().positive().max(10000),
  justification: z.string().min(1).max(1000),
  urgency: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'),
  deliveryLocation: z.enum(['STORE', 'SITE']).default('SITE'),
  requiredDate: z.string().optional(),
})

const supplierCreateSchema = z.object({
  name: z.string().min(1).max(200),
  contactPerson: z.string().max(100).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  taxNumber: z.string().max(50).optional(),
  paymentTerms: z.string().max(100).optional(),
})

// Material CRUD operations
export async function createMaterial(data: CreateMaterialRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const validation = validateSchema(materialCreateSchema, data)
    if (!validation.success) {
      return { success: false, errors: validation.errors }
    }

    // Check if material code already exists
    const existingMaterial = await prisma.material.findUnique({
      where: { materialCode: data.materialCode }
    })

    if (existingMaterial) {
      return { success: false, error: 'Material code already exists' }
    }

    const material = await prisma.material.create({
      data: {
        materialCode: data.materialCode,
        name: data.name,
        description: data.description,
        category: data.category,
        unit: data.unit,
        unitCost: data.unitCost,
        minimumStockLevel: data.minimumStockLevel,
        maximumStockLevel: data.maximumStockLevel,
        reorderPoint: data.reorderPoint,
        supplierId: data.supplierId,
      },
      include: {
        supplier: true,
      }
    })

    revalidatePath('/materials')
    return { success: true, data: material }
  } catch (error) {
    console.error('Error creating material:', error)
    return { success: false, error: 'Failed to create material' }
  }
}

export async function updateMaterial(id: number, data: UpdateMaterialRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const material = await prisma.material.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        supplier: true,
      }
    })

    revalidatePath('/materials')
    revalidatePath(`/materials/${id}`)
    return { success: true, data: material }
  } catch (error) {
    console.error('Error updating material:', error)
    return { success: false, error: 'Failed to update material' }
  }
}

export async function deleteMaterial(id: number) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Check if material has any requests or inventory
    const materialUsage = await prisma.material.findUnique({
      where: { id },
      include: {
        requests: { take: 1 },
        inventory: { take: 1 },
        transactions: { take: 1 },
      }
    })

    if (materialUsage?.requests.length || materialUsage?.inventory.length || materialUsage?.transactions.length) {
      return { success: false, error: 'Cannot delete material with existing requests, inventory, or transactions' }
    }

    await prisma.material.delete({
      where: { id }
    })

    revalidatePath('/materials')
    return { success: true }
  } catch (error) {
    console.error('Error deleting material:', error)
    return { success: false, error: 'Failed to delete material' }
  }
}

// Material Request operations
export async function createMaterialRequest(data: CreateMaterialRequestRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const validation = validateSchema(materialRequestCreateSchema, data)
    if (!validation.success) {
      return { success: false, errors: validation.errors }
    }

    // Generate request number
    const requestCount = await prisma.materialRequest.count()
    const requestNumber = `MR-${String(requestCount + 1).padStart(4, '0')}`

    // Get material details for cost calculation
    const material = await prisma.material.findUnique({
      where: { id: data.materialId }
    })

    if (!material) {
      return { success: false, error: 'Material not found' }
    }

    const totalCost = material.unitCost ? Number(material.unitCost) * data.requestedQuantity : null

    const materialRequest = await prisma.materialRequest.create({
      data: {
        requestNumber,
        materialId: data.materialId,
        projectId: data.projectId,
        requestedById: user.id,
        requestedQuantity: data.requestedQuantity,
        justification: data.justification,
        urgency: data.urgency,
        deliveryLocation: data.deliveryLocation,
        requiredDate: data.requiredDate ? new Date(data.requiredDate) : null,
        unitCost: material.unitCost,
        totalCost,
      },
      include: {
        material: true,
        project: true,
        requestedBy: {
          include: {
            employee: true
          }
        }
      }
    })

    revalidatePath('/material-management')
    revalidatePath('/material-management/requests')
    return { success: true, data: materialRequest }
  } catch (error) {
    console.error('Error creating material request:', error)
    return { success: false, error: 'Failed to create material request' }
  }
}

export async function approveMaterialRequest(id: number, data: ApproveMaterialRequestRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const materialRequest = await prisma.materialRequest.findUnique({
      where: { id },
      include: { material: true }
    })

    if (!materialRequest) {
      return { success: false, error: 'Material request not found' }
    }

    if (materialRequest.status !== 'PENDING') {
      return { success: false, error: 'Request is not in pending status' }
    }

    const updateData: any = {
      status: data.approved ? 'APPROVED' : 'REJECTED',
      approvalDate: new Date(),
      approvedById: user.id,
      approvalComments: data.approvalComments,
    }

    if (data.approved && data.approvedQuantity) {
      updateData.approvedQuantity = data.approvedQuantity
      updateData.totalCost = materialRequest.unitCost ? 
        Number(materialRequest.unitCost) * data.approvedQuantity : null
    } else if (!data.approved) {
      updateData.rejectionReason = data.rejectionReason
    }

    const updatedRequest = await prisma.materialRequest.update({
      where: { id },
      data: updateData,
      include: {
        material: true,
        project: true,
        requestedBy: true,
        approvedBy: true,
      }
    })

    revalidatePath('/material-management')
    revalidatePath('/material-management/requests')
    revalidatePath(`/material-management/requests/${id}`)
    return { success: true, data: updatedRequest }
  } catch (error) {
    console.error('Error approving material request:', error)
    return { success: false, error: 'Failed to approve material request' }
  }
}

export async function issueMaterialRequest(id: number, data: IssueMaterialRequestRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const materialRequest = await prisma.materialRequest.findUnique({
      where: { id },
      include: { material: true }
    })

    if (!materialRequest) {
      return { success: false, error: 'Material request not found' }
    }

    if (materialRequest.status !== 'APPROVED') {
      return { success: false, error: 'Request is not approved' }
    }

    // Check inventory availability
    const inventory = await prisma.materialInventory.findFirst({
      where: {
        materialId: materialRequest.materialId,
        locationType: 'STORE',
      }
    })

    if (!inventory || Number(inventory.currentStock) < data.issuedQuantity) {
      return { success: false, error: 'Insufficient stock available' }
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update material request
      const updatedRequest = await tx.materialRequest.update({
        where: { id },
        data: {
          status: 'ISSUED',
          issuedQuantity: data.issuedQuantity,
          issuanceDate: new Date(),
          issuedById: user.id,
          issuanceComments: data.issuanceComments,
        },
        include: {
          material: true,
          project: true,
          requestedBy: true,
          approvedBy: true,
          issuedBy: true,
        }
      })

      // Update inventory - reduce from store
      await tx.materialInventory.update({
        where: { id: inventory.id },
        data: {
          currentStock: {
            decrement: data.issuedQuantity
          },
          lastUpdated: new Date(),
        }
      })

      // Create or update inventory at delivery location
      if (materialRequest.deliveryLocation === 'SITE') {
        await tx.materialInventory.upsert({
          where: {
            materialId_locationType_locationReference_projectId: {
              materialId: materialRequest.materialId,
              locationType: 'SITE',
              locationReference: 'Site Stock',
              projectId: materialRequest.projectId,
            }
          },
          create: {
            materialId: materialRequest.materialId,
            locationType: 'SITE',
            locationReference: 'Site Stock',
            projectId: materialRequest.projectId,
            currentStock: data.issuedQuantity,
          },
          update: {
            currentStock: {
              increment: data.issuedQuantity
            },
            lastUpdated: new Date(),
          }
        })
      }

      // Create transaction record
      await tx.materialTransaction.create({
        data: {
          materialId: materialRequest.materialId,
          transactionType: 'ISSUE',
          referenceType: 'REQUEST',
          referenceId: id,
          fromLocationType: 'STORE',
          fromLocationReference: 'Main Store',
          toLocationType: materialRequest.deliveryLocation,
          toLocationReference: materialRequest.deliveryLocation === 'SITE' ? 'Site Stock' : 'Store',
          toProjectId: materialRequest.deliveryLocation === 'SITE' ? materialRequest.projectId : null,
          quantity: data.issuedQuantity,
          unitCost: materialRequest.unitCost,
          totalCost: materialRequest.unitCost ? Number(materialRequest.unitCost) * data.issuedQuantity : null,
          performedById: user.id,
          notes: data.issuanceComments,
        }
      })

      return updatedRequest
    })

    revalidatePath('/material-management')
    revalidatePath('/material-management/requests')
    revalidatePath(`/material-management/requests/${id}`)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error issuing material request:', error)
    return { success: false, error: 'Failed to issue material request' }
  }
}

export async function acknowledgeMaterialRequest(id: number, data: AcknowledgeMaterialRequestRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const materialRequest = await prisma.materialRequest.findUnique({
      where: { id }
    })

    if (!materialRequest) {
      return { success: false, error: 'Material request not found' }
    }

    if (materialRequest.status !== 'ISSUED') {
      return { success: false, error: 'Request is not issued' }
    }

    const updatedRequest = await prisma.materialRequest.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedQuantity: data.acknowledgedQuantity,
        acknowledgmentDate: new Date(),
        acknowledgedById: user.id,
        acknowledgmentComments: data.acknowledgmentComments,
      },
      include: {
        material: true,
        project: true,
        requestedBy: true,
        approvedBy: true,
        issuedBy: true,
        acknowledgedBy: true,
      }
    })

    revalidatePath('/material-management')
    revalidatePath('/material-management/requests')
    revalidatePath(`/material-management/requests/${id}`)
    return { success: true, data: updatedRequest }
  } catch (error) {
    console.error('Error acknowledging material request:', error)
    return { success: false, error: 'Failed to acknowledge material request' }
  }
}

export async function completeMaterialRequest(id: number, data: CompleteMaterialRequestRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const materialRequest = await prisma.materialRequest.findUnique({
      where: { id }
    })

    if (!materialRequest) {
      return { success: false, error: 'Material request not found' }
    }

    if (materialRequest.status !== 'ACKNOWLEDGED') {
      return { success: false, error: 'Request is not acknowledged' }
    }

    const updatedRequest = await prisma.materialRequest.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completionDate: new Date(),
        completedById: user.id,
        completionComments: data.completionComments,
      },
      include: {
        material: true,
        project: true,
        requestedBy: true,
        approvedBy: true,
        issuedBy: true,
        acknowledgedBy: true,
        completedBy: true,
      }
    })

    revalidatePath('/material-management')
    revalidatePath('/material-management/requests')
    revalidatePath(`/material-management/requests/${id}`)
    return { success: true, data: updatedRequest }
  } catch (error) {
    console.error('Error completing material request:', error)
    return { success: false, error: 'Failed to complete material request' }
  }
}

export async function cancelMaterialRequest(id: number, reason: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const materialRequest = await prisma.materialRequest.findUnique({
      where: { id }
    })

    if (!materialRequest) {
      return { success: false, error: 'Material request not found' }
    }

    if (!['PENDING', 'APPROVED'].includes(materialRequest.status)) {
      return { success: false, error: 'Request cannot be cancelled in current status' }
    }

    const updatedRequest = await prisma.materialRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        rejectionReason: reason,
        updatedAt: new Date(),
      },
      include: {
        material: true,
        project: true,
        requestedBy: true,
      }
    })

    revalidatePath('/material-management')
    revalidatePath('/material-management/requests')
    revalidatePath(`/material-management/requests/${id}`)
    return { success: true, data: updatedRequest }
  } catch (error) {
    console.error('Error cancelling material request:', error)
    return { success: false, error: 'Failed to cancel material request' }
  }
}

// Supplier operations
export async function createSupplier(data: CreateSupplierRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const validation = validateSchema(supplierCreateSchema, data)
    if (!validation.success) {
      return { success: false, errors: validation.errors }
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        address: data.address,
        taxNumber: data.taxNumber,
        paymentTerms: data.paymentTerms,
      }
    })

    revalidatePath('/material-management/suppliers')
    return { success: true, data: supplier }
  } catch (error) {
    console.error('Error creating supplier:', error)
    return { success: false, error: 'Failed to create supplier' }
  }
}

export async function updateSupplier(id: number, data: UpdateSupplierRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      }
    })

    revalidatePath('/material-management/suppliers')
    revalidatePath(`/material-management/suppliers/${id}`)
    return { success: true, data: supplier }
  } catch (error) {
    console.error('Error updating supplier:', error)
    return { success: false, error: 'Failed to update supplier' }
  }
}

export async function deleteSupplier(id: number) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Check if supplier has any materials or purchase orders
    const supplierUsage = await prisma.supplier.findUnique({
      where: { id },
      include: {
        materials: { take: 1 },
        purchaseOrders: { take: 1 },
      }
    })

    if (supplierUsage?.materials.length || supplierUsage?.purchaseOrders.length) {
      return { success: false, error: 'Cannot delete supplier with existing materials or purchase orders' }
    }

    await prisma.supplier.delete({
      where: { id }
    })

    revalidatePath('/material-management/suppliers')
    return { success: true }
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return { success: false, error: 'Failed to delete supplier' }
  }
}

// Inventory operations
export async function adjustInventory(data: InventoryAdjustmentRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const material = await prisma.material.findUnique({
      where: { id: data.materialId }
    })

    if (!material) {
      return { success: false, error: 'Material not found' }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update or create inventory record
      const inventory = await tx.materialInventory.upsert({
        where: {
          materialId_locationType_locationReference_projectId: {
            materialId: data.materialId,
            locationType: data.locationType,
            locationReference: data.locationReference || '',
            projectId: typeof data.projectId === 'number' ? data.projectId : 0,
          }
        },
        create: {
          materialId: data.materialId,
          locationType: data.locationType,
          locationReference: data.locationReference,
          projectId: typeof data.projectId === 'number' ? data.projectId : 0,
          currentStock: data.adjustmentType === 'INCREASE' ? data.adjustmentQuantity : 0,
        },
        update: {
          currentStock: data.adjustmentType === 'INCREASE' 
            ? { increment: data.adjustmentQuantity }
            : { decrement: data.adjustmentQuantity },
          lastUpdated: new Date(),
        }
      })

      // Create transaction record
      await tx.materialTransaction.create({
        data: {
          materialId: data.materialId,
          transactionType: 'ADJUSTMENT',
          toLocationType: data.locationType,
          toLocationReference: data.locationReference,
          toProjectId: data.projectId,
          quantity: data.adjustmentType === 'INCREASE' ? data.adjustmentQuantity : -data.adjustmentQuantity,
          performedById: user.id,
          notes: data.reason,
        }
      })

      return inventory
    })

    revalidatePath('/material-management/inventory')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error adjusting inventory:', error)
    return { success: false, error: 'Failed to adjust inventory' }
  }
}

export async function transferMaterial(
  materialId: number,
  fromLocation: { type: string; reference?: string; projectId?: number },
  toLocation: { type: string; reference?: string; projectId?: number },
  quantity: number,
  notes?: string
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Check source inventory
    const sourceInventory = await prisma.materialInventory.findFirst({
      where: {
        materialId,
        locationType: fromLocation.type as any,
        locationReference: fromLocation.reference,
        projectId: fromLocation.projectId,
      }
    })

    if (!sourceInventory || Number(sourceInventory.currentStock) < quantity) {
      return { success: false, error: 'Insufficient stock at source location' }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Reduce from source
      await tx.materialInventory.update({
        where: { id: sourceInventory.id },
        data: {
          currentStock: { decrement: quantity },
          lastUpdated: new Date(),
        }
      })

      // Add to destination
      await tx.materialInventory.upsert({
        where: {
          materialId_locationType_locationReference_projectId: {
            materialId,
            locationType: toLocation.type as any,
            locationReference: toLocation.reference || '',
            projectId: typeof toLocation.projectId === 'number' ? toLocation.projectId : 0,
          }
        },
        create: {
          materialId,
          locationType: toLocation.type as any,
          locationReference: toLocation.reference,
          projectId: typeof toLocation.projectId === 'number' ? toLocation.projectId : 0,
          currentStock: quantity,
        },
        update: {
          currentStock: { increment: quantity },
          lastUpdated: new Date(),
        }
      })

      // Create transaction record
      await tx.materialTransaction.create({
        data: {
          materialId,
          transactionType: 'TRANSFER',
          fromLocationType: fromLocation.type as any,
          fromLocationReference: fromLocation.reference,
          fromProjectId: fromLocation.projectId,
          toLocationType: toLocation.type as any,
          toLocationReference: toLocation.reference,
          toProjectId: toLocation.projectId,
          quantity,
          performedById: user.id,
          notes,
        }
      })
    })

    revalidatePath('/material-management/inventory')
    return { success: true }
  } catch (error) {
    console.error('Error transferring material:', error)
    return { success: false, error: 'Failed to transfer material' }
  }
}
