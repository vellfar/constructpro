export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { bulkUploadEquipment } from "@/app/actions/equipment-actions"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fileEntry = formData.get("file");
    let csvText: string | null = null;
    if (typeof fileEntry === "string") {
      csvText = fileEntry;
    } else if (fileEntry && typeof (fileEntry as any).text === "function") {
      csvText = await (fileEntry as any).text();
    }
    if (!csvText) {
      return NextResponse.json({ success: false, error: "No file uploaded or could not read file as text" }, { status: 400 });
    }
    const result = await bulkUploadEquipment(csvText);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[BulkUploadAPI] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process upload: " + (error?.message || "Unknown error") }, { status: 500 });
  }
}
