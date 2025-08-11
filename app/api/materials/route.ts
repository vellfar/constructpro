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
    const category = searchParams.get('category')
    const supplierId = searchParams.get('supplierId')
    const isActive = searchParams.get('isActive')
    const lowStock = searchParams.get('lowStock') === 'true'

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { materialCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.category = category
    }

    if (supplierId) {
      where.supplierId = parseInt(supplierId)
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const materials = await prisma.material.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
          }
        },
        inventory: {
          select: {
            locationType: true,
            locationReference: true,
            currentStock: true,
            reservedStock: true,
          }
        },
        _count: {
          select: {
            requests: true,
            transactions: true,
          }
        }
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    })

    // Filter for low stock if requested
    let filteredMaterials = materials
    if (lowStock) {
      filteredMaterials = materials.filter(material => {
        const totalStock = material.inventory.reduce((sum, inv) => sum + Number(inv.currentStock), 0)
        return material.minimumStockLevel && totalStock < Number(material.minimumStockLevel)
      })
    }

    const total = await prisma.material.count({ where })

    return NextResponse.json({
      success: true,
      data: filteredMaterials,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch materials' },
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

    // Check if material code already exists
    const existingMaterial = await prisma.material.findUnique({
      where: { materialCode: data.materialCode }
    })

    if (existingMaterial) {
      return NextResponse.json(
        { success: false, error: 'Material code already exists' },
        { status: 400 }
      )
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

    return NextResponse.json({ success: true, data: material }, { status: 201 })
  } catch (error) {
    console.error('Error creating material:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create material' },
      { status: 500 }
    )
  }
}
