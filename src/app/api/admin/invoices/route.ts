import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const invoices = await db.getInvoices();
    return NextResponse.json({ success: true, invoices });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    const updated = await db.updateInvoice(id, {
      status,
      paid_at: status === "paid" ? new Date().toISOString() : undefined,
    });

    if (updated && status === "paid") {
      // If advance invoice paid, tick w2
      if (updated.type === "advance") {
        await db.updateCheck(updated.client_id, "w2", true, "user");
      }
      // If final invoice paid, tick q1
      if (updated.type === "final") {
        await db.updateCheck(updated.client_id, "q1", true, "user");
      }
    }

    return NextResponse.json({ success: true, invoice: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
