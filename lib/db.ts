import { PrismaClient } from "@prisma/client"

declare global {
  var __prisma: PrismaClient | undefined
}

// Optimized Prisma configuration
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// Singleton pattern with connection pooling
export const prisma = globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma
}

// Enhanced retry mechanism with exponential backoff
export async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      // Don't retry on certain errors
      if (
        error instanceof Error &&
        (error.message.includes("Unique constraint") ||
          error.message.includes("Foreign key constraint") ||
          error.message.includes("Record to update not found"))
      ) {
        throw error
      }

      if (attempt === maxRetries) {
        break
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// Database health check with detailed diagnostics
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean
  message: string
  latency?: number
  connectionCount?: number
}> {
  try {
    const startTime = Date.now()

    // Test basic connectivity
    await prisma.$queryRaw`SELECT 1`

    const latency = Date.now() - startTime

    // Get connection info (PostgreSQL specific)
    const connectionInfo = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT count(*) FROM pg_stat_activity WHERE state = 'active'
    `

    return {
      healthy: true,
      message: "Database connection is healthy",
      latency,
      connectionCount: Number(connectionInfo[0]?.count || 0),
    }
  } catch (error) {
    console.error("Database health check failed:", error)
    return {
      healthy: false,
      message: error instanceof Error ? error.message : "Unknown database error",
    }
  }
}

// Optimized database client with automatic cleanup
export const db = prisma

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect()
})
