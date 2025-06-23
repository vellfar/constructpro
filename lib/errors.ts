import type { ApiResponse } from "@/types/api"

export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, code: string, statusCode = 500, isOperational = true) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, "VALIDATION_ERROR", 400)
    this.name = "ValidationError"
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND", 404)
    this.name = "NotFoundError"
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access") {
    super(message, "UNAUTHORIZED", 401)
    this.name = "UnauthorizedError"
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, "FORBIDDEN", 403)
    this.name = "ForbiddenError"
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409)
    this.name = "ConflictError"
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, "DATABASE_ERROR", 500)
    this.name = "DatabaseError"
    if (originalError) {
      this.stack = originalError.stack
    }
  }
}

// Error response helpers
export function createErrorResponse(error: Error | AppError, defaultMessage = "An error occurred"): ApiResponse {
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      meta: {
        timestamp: new Date().toISOString(),
      },
    }
  }

  // Log unexpected errors
  console.error("Unexpected error:", error)

  return {
    success: false,
    error: process.env.NODE_ENV === "production" ? defaultMessage : error.message,
    code: "INTERNAL_ERROR",
    meta: {
      timestamp: new Date().toISOString(),
    },
  }
}

export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
    },
  }
}

// Error handling middleware for API routes
export function handleApiError(error: unknown): Response {
  const errorResponse = createErrorResponse(
    error instanceof Error ? error : new Error("Unknown error"),
    "Internal server error",
  )

  const statusCode = error instanceof AppError ? error.statusCode : 500

  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

// Database error parser
export function parseDatabaseError(error: any): AppError {
  if (error.code === "P2002") {
    return new ConflictError("A record with this information already exists")
  }
  if (error.code === "P2025") {
    return new NotFoundError("Record")
  }
  if (error.code === "P2003") {
    return new ValidationError("Invalid reference to related record")
  }
  if (error.code === "P2014") {
    return new ValidationError("The change you are trying to make would violate a required relation")
  }

  return new DatabaseError("Database operation failed", error)
}

// Async error wrapper for server actions
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
): (...args: T) => Promise<ApiResponse<R>> {
  return async (...args: T): Promise<ApiResponse<R>> => {
    try {
      const result = await fn(...args)
      return createSuccessResponse(result)
    } catch (error) {
      return createErrorResponse(error instanceof Error ? error : new Error("Unknown error"))
    }
  }
}
