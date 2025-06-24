import { PrismaClient } from "@prisma/client"

declare global {
  var __prisma: PrismaClient | undefined
}

// Create Prisma client with proper error handling
const createPrismaClient = () => {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    })
  } catch (error) {
    console.error("Failed to create Prisma client:", error)
    throw new Error("Database connection failed")
  }
}

// Initialize Prisma client
let prismaClient: PrismaClient

try {
  prismaClient = globalThis.__prisma ?? createPrismaClient()

  if (process.env.NODE_ENV !== "production") {
    globalThis.__prisma = prismaClient
  }
} catch (error) {
  console.error("Prisma client initialization failed:", error)
  // Create a fallback client for development
  prismaClient = new PrismaClient({
    log: ["error"],
  })
}

export const prisma = prismaClient
export const db = prismaClient

// Enhanced retry mechanism with better error handling
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
  maxDelay = 10000,
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Ensure database connection before operation
      if (!db) {
        throw new Error("Database client not initialized")
      }

      return await operation()
    } catch (error) {
      lastError = error as Error
      console.error(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error)

      // Don't retry on certain errors
      if (
        error instanceof Error &&
        (error.message.includes("Unique constraint") ||
          error.message.includes("Foreign key constraint") ||
          error.message.includes("Record to update not found") ||
          error.message.includes("Record to delete does not exist") ||
          error.message.includes("Database client not initialized"))
      ) {
        throw error
      }

      if (attempt === maxRetries) {
        break
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000, maxDelay)
      console.log(`Retrying in ${delay}ms...`)
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
    if (!db) {
      console.error(`${operationName}: Database client not available`)
      return fallbackValue
    }

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
    if (!db) {
      return {
        healthy: false,
        message: "Database client not initialized",
      }
    }

    const startTime = Date.now()
    await db.$queryRaw`SELECT 1`
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
  if (!db) {
    throw new Error("Database client not initialized")
  }

  return await withRetry(async () => {
    return await db.$transaction(async (tx) => {
      return await operation(tx)
    })
  })
}

// Connection management
export async function ensureConnection(): Promise<boolean> {
  try {
    if (!db) {
      console.error("Database client not available")
      return false
    }

    await db.$connect()
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}

// Graceful shutdown
process.on("beforeExit", async () => {
  try {
    if (db) {
      await db.$disconnect()
    }
  } catch (error) {
    // Ignore disconnect errors
  }
})

process.on("SIGINT", async () => {
  if (db) {
    await db.$disconnect()
  }
  process.exit(0)
})

process.on("SIGTERM", async () => {
  if (db) {
    await db.$disconnect()
  }
  process.exit(0)
})
