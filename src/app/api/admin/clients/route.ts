import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newClient = await db.createClient({
      name: body.name,
      owner_name: body.owner_name,
      phone: body.phone || "+91 91010 10101",
      niche: body.niche || "Local business",
      package: body.package || "growth",
      founding_offer: Boolean(body.founding_offer),
      notes: body.notes || "",
      next_step: body.next_step || "",
      next_step_date: body.next_step_date || "",
      checks: {
        l1: { key: "l1", done: true, done_at: new Date().toISOString(), done_by: "user" },
      },
    });

    return NextResponse.json({ success: true, client: newClient });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

