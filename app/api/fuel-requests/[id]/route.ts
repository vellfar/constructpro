import { type NextRequest, NextResponse } from "next/server"
import { getFuelRequestById } from "@/app/actions/fuel-actions"
import { handleApiError, ValidationError } from "@/lib/errors"

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id) || id <= 0) {
      throw new ValidationError("Invalid fuel request ID")
    }

    const result = await getFuelRequestById(id)

    if (!result.success) {
      const statusCode = result.code === "UNAUTHORIZED" ? 401 : result.code === "NOT_FOUND" ? 404 : 500
      return NextResponse.json(result, { status: statusCode })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error(`GET /api/fuel-requests/${params.id} error:`, error)
    return handleApiError(error)
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
