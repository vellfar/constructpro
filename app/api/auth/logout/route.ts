import { NextResponse } from "next/server"

export async function POST() {
  try {
    // In a real app, you would clear the session/cookie here

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
