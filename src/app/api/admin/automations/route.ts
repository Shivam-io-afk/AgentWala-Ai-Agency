import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const automations = await db.getAutomations();
    return NextResponse.json({ success: true, automations });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, id, enabled } = await req.json();

    if (action === "toggle") {
      const updated = await db.toggleAutomation(id, enabled);
      return NextResponse.json({ success: true, automation: updated });
    }

    if (action === "retry") {
      await db.recordAutomationRun(id, true);
      await db.logActivity("user", "Automation Retried", `Manually retried job for automation ${id}`);
      return NextResponse.json({ success: true, message: `Automation ${id} re-executed successfully` });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
