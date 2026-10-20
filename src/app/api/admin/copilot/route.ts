import { NextRequest, NextResponse } from "next/server";
import { runCopilotAudit } from "@/lib/copilot";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const recommendations = await runCopilotAudit();
    const settings = await db.getSettings();
    return NextResponse.json({
      success: true,
      recommendations,
      language: settings.copilot_language || "hinglish",
      pauseAllOutbound: Boolean(settings.pause_all_outbound),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, language, pauseAll } = body;

    if (action === "toggle_kill_switch") {
      await db.toggleGlobalKillSwitch(Boolean(pauseAll));
      return NextResponse.json({ success: true, pauseAllOutbound: pauseAll });
    }

    if (action === "toggle_language") {
      await db.updateSettings({ copilot_language: language });
      return NextResponse.json({ success: true, language });
    }

    if (action === "dismiss" || action === "snooze" || action === "acted") {
      if (id) {
        await db.updateRecommendationStatus(id, action);
      }
      return NextResponse.json({ success: true, status: action });
    }

    return NextResponse.json({ success: false, error: "Invalid copilot action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

