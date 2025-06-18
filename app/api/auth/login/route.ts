import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // In a real app, you would validate credentials against your database
    // For demo purposes, we'll accept any email/password with simple validation
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Mock user data
    const user = {
      id: 1,
      email,
      firstName: "John",
      lastName: "Doe",
      role: email.includes("admin") ? "admin" : email.includes("pm") ? "project-manager" : "employee",
    }

    // In a real app, you would set a secure HTTP-only cookie here
    // For demo purposes, we'll just return the user data
    return NextResponse.json({ user })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
