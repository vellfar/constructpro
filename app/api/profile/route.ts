import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, email, phoneNumber } = body

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        {
          error: "First name, last name, and email are required",
        },
        { status: 400 },
      )
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: Number.parseInt(session.user.id),
        },
      },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          error: "Email is already taken by another user",
        },
        { status: 400 },
      )
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: {
        id: Number.parseInt(session.user.id),
      },
      data: {
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber || null,
      },
      include: {
        role: true,
        employee: true,
      },
    })

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role.name,
      },
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      {
        error: "Failed to update profile",
      },
      { status: 500 },
    )
  }
}
