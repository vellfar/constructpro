import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          error: "All password fields are required",
        },
        { status: 400 },
      )
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          error: "New passwords do not match",
        },
        { status: 400 },
      )
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          error: "New password must be at least 6 characters long",
        },
        { status: 400 },
      )
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: {
        id: Number.parseInt(session.user.id),
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        {
          error: "Current password is incorrect",
        },
        { status: 400 },
      )
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await prisma.user.update({
      where: {
        id: Number.parseInt(session.user.id),
      },
      data: {
        password: hashedNewPassword,
      },
    })

    return NextResponse.json({
      message: "Password updated successfully",
    })
  } catch (error) {
    console.error("Password update error:", error)
    return NextResponse.json(
      {
        error: "Failed to update password",
      },
      { status: 500 },
    )
  }
}
