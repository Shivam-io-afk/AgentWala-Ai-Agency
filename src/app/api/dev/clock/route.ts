import { NextRequest, NextResponse } from "next/server";
import { getAppDate, getAppTimeISO, getAppTimeIST, advanceAppTime, setAppTime, resetAppTime, syncClockFromStorage } from "@/lib/clock";
import { db } from "@/lib/db";

export async function GET() {
  await syncClockFromStorage();
  return NextResponse.json({
    success: true,
    currentISO: getAppTimeISO(),
    currentIST: getAppTimeIST(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ms, iso } = body;

    let res;
    if (action === "advance") {
      res = advanceAppTime(Number(ms) || 0);
      await db.logActivity("system", "Dev Time Travel: Advanced Time", `Virtual time advanced by ${Math.round((ms || 0) / 3600000)}h to ${res.currentIST}`);
    } else if (action === "set") {
      res = setAppTime(iso);
      await db.logActivity("system", "Dev Time Travel: Set Time", `Virtual time set to ${res.currentIST}`);
    } else if (action === "reset") {
      res = resetAppTime();
      await db.logActivity("system", "Dev Time Travel: Reset Time", `Virtual clock reset to real-time (${res.currentIST})`);
    } else {
      return NextResponse.json({ success: false, error: "Invalid clock action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ...res,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

