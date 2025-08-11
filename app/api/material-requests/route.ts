import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const materialId = searchParams.get('materialId')
    const projectId = searchParams.get('projectId')
    const urgency = searchParams.get('urgency')

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { requestNumber: { contains: search, mode: 'insensitive' } },
        { justification: { contains: search, mode: 'insensitive' } },
        { material: { name: { contains: search, mode: 'insensitive' } } },
        { project: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (materialId) {
      where.materialId = parseInt(materialId)
    }

    if (projectId) {
      where.projectId = parseInt(projectId)
    }

    if (urgency) {
      where.urgency = urgency
    }

    const materialRequests = await prisma.materialRequest.findMany({
      where,
      include: {
        material: {
          select: {
            id: true,
            name: true,
            materialCode: true,
            category: true,
            unit: true,
            unitCost: true,
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            projectCode: true,
            location: true,
          }
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
              }
            }
          }
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        issuedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        acknowledgedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        completedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { requestDate: 'desc' },
      skip,
      take: limit,
    })

    const total = await prisma.materialRequest.count({ where })

    return NextResponse.json({
      success: true,
      data: materialRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error('Error fetching material requests:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch material requests' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const data = await request.json()

    // Generate request number
    const requestCount = await prisma.materialRequest.count()
    const requestNumber = `MR-${String(requestCount + 1).padStart(4, '0')}`

    // Get material details for cost calculation
    const material = await prisma.material.findUnique({
      where: { id: data.materialId }
    })

    if (!material) {
      return NextResponse.json(
        { success: false, error: 'Material not found' },
        { status: 404 }
      )
    }

    const totalCost = material.unitCost ? Number(material.unitCost) * data.requestedQuantity : null

    const materialRequest = await prisma.materialRequest.create({
      data: {
        requestNumber,
        materialId: data.materialId,
        projectId: data.projectId,
        requestedById: Number(user.id),
        requestedQuantity: data.requestedQuantity,
        justification: data.justification,
        urgency: data.urgency || 'NORMAL',
        deliveryLocation: data.deliveryLocation || 'SITE',
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

    return NextResponse.json({ success: true, data: materialRequest }, { status: 201 })
  } catch (error) {
    console.error('Error creating material request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create material request' },
      { status: 500 }
    )
  }
}
