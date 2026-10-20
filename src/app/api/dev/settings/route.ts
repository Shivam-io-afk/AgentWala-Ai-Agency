import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const devSettings = await db.getDevSettings();
    return NextResponse.json({ success: true, settings: devSettings });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await db.updateDevSettings(body);
    await db.logActivity(
      "system",
      "Dev Settings Updated",
      `Dev integrations status or force-failure toggles updated.`
    );
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

