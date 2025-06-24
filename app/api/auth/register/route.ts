import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password, role } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Find the role
    const userRole = await prisma.role.findUnique({
      where: { name: role },
    })

    if (!userRole) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        username: email, // Use email as username for simplicity
        password: hashedPassword,
        roleId: userRole.id,
      },
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: userWithoutPassword,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
