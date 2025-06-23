import { NextResponse } from "next/server"
import { checkDatabaseHealth } from "@/lib/db"

export async function GET() {
  try {
    const health = await checkDatabaseHealth()

    return NextResponse.json({
      ...health,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? "configured" : "missing",
    })
  } catch (error) {
    return NextResponse.json(
      {
        healthy: false,
        status: "error",
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
