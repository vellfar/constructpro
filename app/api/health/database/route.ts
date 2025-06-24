import { NextResponse } from "next/server"
import { checkDatabaseHealth, ensureConnection } from "@/lib/db"

export async function GET() {
  try {
    // First check if we can establish connection
    const canConnect = await ensureConnection()

    if (!canConnect) {
      return NextResponse.json(
        {
          healthy: false,
          message: "Cannot establish database connection",
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      )
    }

    // Then check database health
    const health = await checkDatabaseHealth()

    return NextResponse.json(
      {
        ...health,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? "configured" : "missing",
      },
      { status: health.healthy ? 200 : 503 },
    )
  } catch (error) {
    console.error("Database health check failed:", error)
    return NextResponse.json(
      {
        healthy: false,
        message: error instanceof Error ? error.message : "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
