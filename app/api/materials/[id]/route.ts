import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const id = parseInt(params.id)
    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        supplier: true,
        inventory: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                projectCode: true,
              }
            }
          }
        },
        requests: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                projectCode: true,
              }
            },
            requestedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          },
          orderBy: { requestDate: 'desc' },
          take: 10,
        },
        transactions: {
          include: {
            performedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          },
          orderBy: { transactionDate: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            requests: true,
            transactions: true,
          }
        }
      }
    })

    if (!material) {
      return NextResponse.json(
        { success: false, error: 'Material not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: material })
  } catch (error) {
    console.error('Error fetching material:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch material' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const id = parseInt(params.id)
    const data = await request.json()

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

    return NextResponse.json({ success: true, data: material })
  } catch (error) {
    console.error('Error updating material:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update material' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const id = parseInt(params.id)

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
      return NextResponse.json(
        { success: false, error: 'Cannot delete material with existing requests, inventory, or transactions' },
        { status: 400 }
      )
    }

    await prisma.material.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting material:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete material' },
      { status: 500 }
    )
  }
}
