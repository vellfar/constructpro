import { NextRequest, NextResponse } from "next/server";
import { completeFuelRequest } from "@/app/actions/fuel-actions";

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  try {
    const id = Number(context.params.id);
    if (!id) {
      return NextResponse.json({ success: false, error: "Invalid request ID" }, { status: 400 });
    }
    const body = await req.json();
    const { completionComments } = body;
    const result = await completeFuelRequest(id, { completionComments });
    if (result && result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ success: false, error: result?.error || "Failed to complete request" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
