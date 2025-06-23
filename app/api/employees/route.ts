import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "50")
    const search = searchParams.get("search") || ""
    const sortBy = searchParams.get("sortBy") || "firstName"
    const sortOrder = searchParams.get("sortOrder") || "asc"
    const simple = searchParams.get("simple") === "true"

    const skip = simple ? 0 : (page - 1) * pageSize
    const take = simple ? undefined : pageSize

    // Build where clause using only the most basic fields
    const where: any = {}
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ]
    }

    // Only include active employees for simple requests
    if (simple) {
      where.isActive = true
    }

    // Get total count (only for paginated requests)
    const total = simple ? 0 : await prisma.employee.count({ where })

    // Get employees using only the core fields that definitely exist
    const employees = await prisma.employee.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Only using the core fields from the error message
      },
    })

    // Transform data for simple requests (forms)
    if (simple) {
      const transformedEmployees = employees.map((emp) => ({
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        fullName: `${emp.firstName} ${emp.lastName}`,
        role: "Employee", // Default role since we don't have designation
        department: null,
        email: null,
        position: "Employee",
        employeeNumber: null,
      }))

      return NextResponse.json({
        success: true,
        data: transformedEmployees,
        employees: transformedEmployees,
      })
    }

    // For paginated requests, return full structure
    const totalPages = Math.ceil(total / pageSize)

    const transformedEmployees = employees.map((emp) => ({
      id: emp.id,
      employeeId: emp.id.toString(), // Use ID as fallback
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: null,
      phone: null,
      position: "Employee",
      department: null,
      hireDate: emp.createdAt, // Use createdAt as fallback
      salary: null,
      isActive: emp.isActive,
      createdAt: emp.createdAt,
      updatedAt: emp.updatedAt,
      user: {
        id: emp.id,
        role: "Employee",
        isActive: emp.isActive,
      },
    }))

    const responseData = {
      success: true,
      data: transformedEmployees,
      employees: transformedEmployees,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Employees API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch employees",
        data: [],
        employees: [],
      },
      { status: 500 },
    )
  }
}
