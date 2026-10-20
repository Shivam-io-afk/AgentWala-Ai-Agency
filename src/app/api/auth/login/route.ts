import { NextRequest, NextResponse } from "next/server";
import { generateMagicToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAppTimeISO } from "@/lib/clock";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Valid email is required" }, { status: 400 });
    }

    const token = generateMagicToken(email.toLowerCase().trim());
    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const verifyUrl = `${proto}://${host}/api/auth/verify?token=${token}`;

    // Record in Mock Outbox so founder can see it immediately in dev toolbar
    await db.recordOutbox({
      channel: "email",
      recipient: email,
      template_name: "founder_magic_link",
      subject: "AgentWala OS: One-Click Magic Login Link",
      content: `Namaste! Here is your secure one-click login link for AgentWala OS:\n\n${verifyUrl}\n\nThis link expires in 15 minutes. If you did not request this, you can ignore this message.`,
    });

    await db.logActivity(
      "system",
      "Founder Magic Link Dispatched",
      `Login magic link generated and sent to ${email} (viewable in Mock Outbox)`
    );

    return NextResponse.json({
      success: true,
      message: `Magic link dispatched to ${email}. Check your email or the Dev Outbox.`,
      verifyUrl,
      token,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

