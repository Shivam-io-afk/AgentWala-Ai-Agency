import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    await db.resetDemoData();
    const projects = await db.getProjects();
    const clients = await db.getClients();
    return NextResponse.json({
      success: true,
      message: "Demo database reset cleanly to exactly 3 Example projects (Lead, Proposal Sent, Handed Over with paid invoices).",
      projectCount: projects.length,
      clientCount: clients.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
