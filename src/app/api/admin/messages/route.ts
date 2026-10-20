import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { clientId, body, channel = "whatsapp", direction = "outbound" } = await req.json();

    if (!clientId || !body) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const msg = await db.createMessage({
      client_id: clientId,
      body,
      channel,
      direction,
      status: "delivered",
    });

    await db.logActivity(
      "user",
      "Message Sent",
      `Sent ${channel} message to client: "${body.slice(0, 40)}..."`,
      clientId
    );

    return NextResponse.json({ success: true, message: msg });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
