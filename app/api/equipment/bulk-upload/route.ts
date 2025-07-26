export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { bulkUploadEquipment } from "@/app/actions/equipment-actions"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fileEntry = formData.get("file");
    let fileToUse: File | null = null;
    let debugType = typeof fileEntry;
    if (fileEntry instanceof File) {
      fileToUse = fileEntry;
      debugType = "File";
    } else if (typeof Blob !== "undefined" && fileEntry instanceof Blob) {
      // Convert Blob to File
      fileToUse = new File([fileEntry], "upload.csv", { type: fileEntry.type });
      debugType = "Blob";
    } else if (typeof fileEntry === "string") {
      // Convert string to File
      fileToUse = new File([fileEntry], "upload.csv", { type: "text/csv" });
      debugType = "string";
    }
    console.log("[BulkUploadAPI] file type:", debugType, fileToUse ? fileToUse.size : "no file");
    if (!fileToUse) {
      return NextResponse.json({ success: false, error: "No file uploaded or file type not supported" }, { status: 400 });
    }
    const result = await bulkUploadEquipment(fileToUse);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[BulkUploadAPI] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process upload: " + (error?.message || "Unknown error") }, { status: 500 });
  }
}
