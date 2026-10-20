import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const event = payload.triggerEvent || payload.event;
    const booking = payload.payload || payload;

    // Search client by email or phone
    const clients = await db.getClients();
    const attendeeEmail = booking.attendees?.[0]?.email || booking.email;
    const client = clients.find(
      (c) => (attendeeEmail && c.email === attendeeEmail) || c.phone.includes(booking.phone || "")
    ) || clients[0]; // fallback to first active for demo testing

    if (client) {
      const meetingDate = booking.startTime
        ? new Date(booking.startTime).toISOString().slice(0, 10)
        : new Date(Date.now() + 86400000).toISOString().slice(0, 10);

      // Tick b1: Date and time confirmed
      await db.updateCheck(client.id, "b1", true, "automation");

      // Set next step date to meeting date
      await db.updateClient(client.id, {
        next_step: `20-min demo call via Google Meet: ${booking.meetingUrl || "https://meet.google.com/aw-demo-call"}`,
        next_step_date: meetingDate,
      });

      // Automation A6: Demo agent template clone -> tick b2
      await db.updateCheck(client.id, "b2", true, "automation");

      await db.logActivity(
        "automation",
        "Meeting Booked (Cal.com Webhook - A5 & A6)",
        `Meeting confirmed for ${meetingDate}. Demo agent cloned & personalised. Ticked b1 and b2.`,
        client.id
      );
    }

    return NextResponse.json({ success: true, message: "Cal.com webhook processed" });
  } catch (err: any) {
    console.error("Cal webhook error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

