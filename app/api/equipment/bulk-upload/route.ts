export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { bulkUploadEquipment } from "@/app/actions/equipment-actions"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 })
    }
    const result = await bulkUploadEquipment(file)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to process upload" }, { status: 500 })
  }
}
