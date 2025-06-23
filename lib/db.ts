import { PrismaClient } from "@prisma/client"

declare global {
  var __prisma: PrismaClient | undefined
}

// Create Prisma client
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

export const prisma = globalThis.__prisma ?? createPrismaClient()
export const db = prisma

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma
}

// Enhanced retry mechanism
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
  maxDelay = 10000,
): Promise<T> {
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
          error.message.includes("Record to update not found") ||
          error.message.includes("Record to delete does not exist"))
      ) {
        throw error
      }

      if (attempt === maxRetries) {
        break
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000, maxDelay)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// Safe database operations with fallback values
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  operationName = "Database operation",
): Promise<T> {
  try {
    return await withRetry(operation, 3, 1000, 10000)
  } catch (error) {
    console.error(`${operationName} failed:`, error)
    return fallbackValue
  }
}

// Database health check
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean
  message: string
  latency?: number
}> {
  try {
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - startTime

    return {
      healthy: true,
      message: "Database connection is healthy",
      latency,
    }
  } catch (error) {
    return {
      healthy: false,
      message: error instanceof Error ? error.message : "Unknown database error",
    }
  }
}

// Transaction wrapper
export async function withTransaction<T>(operation: (tx: PrismaClient) => Promise<T>): Promise<T> {
  return await withRetry(async () => {
    return await prisma.$transaction(async (tx) => {
      return await operation(tx)
    })
  })
}

// Connection management
export async function ensureConnection(): Promise<boolean> {
  try {
    await prisma.$connect()
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}

// Graceful shutdown
process.on("beforeExit", async () => {
  try {
    await prisma.$disconnect()
  } catch (error) {
    // Ignore disconnect errors
  }
})

process.on("SIGINT", async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  await prisma.$disconnect()
  process.exit(0)
})
