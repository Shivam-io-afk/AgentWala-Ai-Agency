import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const clients = await db.getClients();
    const invoices = await db.getInvoices();
    const logs = await db.getActivityLogs(25);
    const automations = await db.getAutomations();
    const settings = await db.getSettings();

    return NextResponse.json({
      success: true,
      clients,
      invoices,
      logs,
      automations,
      settings,
    });
  } catch (err: any) {
    console.error("Admin data route error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
