import { NextRequest, NextResponse } from "next/server";
import { generateMagicToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Valid email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isProd = process.env.NODE_ENV === "production";
    const genericSuccessMsg = "If your email is registered as an authorized founder, a login link has been sent.";

    // In production, enforce FOUNDER_EMAILS allowlist
    if (isProd) {
      const allowedEmails = (process.env.FOUNDER_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      if (!allowedEmails.includes(normalizedEmail)) {
        return NextResponse.json({
          success: true,
          message: genericSuccessMsg,
        });
      }
    }

    const token = generateMagicToken(normalizedEmail);

    // Build verifyUrl from NEXT_PUBLIC_SITE_URL when set, fallback to host header
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    let baseUrl = siteUrl;
    if (!baseUrl) {
      const host = req.headers.get("host") || "localhost:3000";
      const proto = req.headers.get("x-forwarded-proto") || "http";
      baseUrl = `${proto}://${host}`;
    }
    const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;

    const resendApiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM || "AgentWala <shivam.mishra.cuh@gmail.com>";

    if (resendApiKey) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: emailFrom,
            to: [normalizedEmail],
            subject: "AgentWala OS: One-Click Magic Login Link",
            html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #ECE6D8;border-radius:16px;background:#FBF7EE;">
              <h2 style="color:#1C1F3A;margin-top:0;">Founder Command Center</h2>
              <p style="color:#4A4F66;font-size:14px;">Namaste! Here is your secure one-click login link for AgentWala OS:</p>
              <div style="margin:24px 0;">
                <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#FDB91F;color:#1C1F3A;font-weight:bold;text-decoration:none;border-radius:10px;font-size:14px;">Log In to AgentWala OS →</a>
              </div>
              <p style="color:#727791;font-size:12px;">Or copy this URL into your browser:<br/><span style="word-break:break-all;color:#1C1F3A;">${verifyUrl}</span></p>
              <p style="color:#9A9EA7;font-size:11px;margin-top:24px;border-top:1px solid #ECE6D8;padding-top:12px;">This link expires in 15 minutes. If you did not request this, you can ignore this email.</p>
            </div>`,
          }),
        });

        if (!resendRes.ok) {
          const errText = await resendRes.text();
          console.error("[auth] Resend API error:", errText);
        }
      } catch (err) {
        console.error("[auth] Failed to send email via Resend:", err);
      }
    } else {
      // Mock outbox behaviour (viewable in Dev Toolbar)
      await db.recordOutbox({
        channel: "email",
        recipient: normalizedEmail,
        template_name: "founder_magic_link",
        subject: "AgentWala OS: One-Click Magic Login Link",
        content: `Namaste! Here is your secure one-click login link for AgentWala OS:\n\n${verifyUrl}\n\nThis link expires in 15 minutes. If you did not request this, you can ignore this message.`,
      });
    }

    await db.logActivity(
      "system",
      "Founder Magic Link Dispatched",
      `Login magic link generated for ${normalizedEmail}`
    );

    const resData: any = {
      success: true,
      message: isProd
        ? genericSuccessMsg
        : `Magic link dispatched to ${normalizedEmail}. Check your email or the Dev Outbox.`,
    };

    if (!isProd) {
      resData.verifyUrl = verifyUrl;
      resData.token = token;
    }

    return NextResponse.json(resData);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
