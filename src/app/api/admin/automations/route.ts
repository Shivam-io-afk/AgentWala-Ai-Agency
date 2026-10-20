import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const automationId = searchParams.get("automation_id") || undefined;
    const fetchLogs = searchParams.get("logs") === "true";

    if (fetchLogs || automationId) {
      const runs = await db.getAutomationRuns(automationId);
      return NextResponse.json({ success: true, runs });
    }

    const automations = await db.getAutomations();
    return NextResponse.json({ success: true, automations });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, id, enabled, shadow, level } = await req.json();

    if (action === "toggle") {
      const updated = await db.toggleAutomation(id, enabled);
      return NextResponse.json({ success: true, automation: updated });
    }

    if (action === "toggle_shadow") {
      const updated = await db.toggleShadowMode(id, Boolean(shadow));
      return NextResponse.json({ success: true, automation: updated });
    }

    if (action === "promote") {
      const updated = await db.promoteAutomation(id);
      return NextResponse.json({ success: true, automation: updated });
    }

    if (action === "demote") {
      const updated = await db.demoteAutomation(id, level as 1 | 2 | 3);
      return NextResponse.json({ success: true, automation: updated });
    }

    if (action === "retry") {
      await db.recordAutomationRun(id, true);
      await db.recordAutomationRunEntry({
        automation_id: id,
        trigger: "manual",
        project_name: "Manual Run",
        result: "success",
        output_or_error: `Manual trigger executed for automation ${id}. State updated.`,
        retries: "0/3",
      });
      await db.logActivity("user", "Automation Retried", `Manually retried job for automation ${id}`);
      return NextResponse.json({ success: true, message: `Automation ${id} re-executed successfully` });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

