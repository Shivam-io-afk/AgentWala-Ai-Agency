import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { CITY } from "@/content/site";

const LeadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  businessName: z.string().min(2, "Business name is required"),
  phone: z.string().regex(/^(?:\+91|91|0)?[6-9]\d{9}$/, "Invalid Indian mobile number"),
  plan: z.string().optional().default("growth"),
  vertical: z.string().optional().default("clinics"),
  honeypot: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Honeypot anti-spam check
    if (body.honeypot && body.honeypot.trim().length > 0) {
      return NextResponse.json({ success: true, message: "Lead recorded" });
    }

    const parseResult = LeadSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Validation error";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { name, businessName, phone, plan, vertical } = parseResult.data;

    // Format phone to standard +91 XXXXXXXXXX
    const digitsOnly = phone.replace(/\D/g, "");
    const cleanTenDigits = digitsOnly.slice(-10);
    const formattedPhone = `+91 ${cleanTenDigits.slice(0, 5)} ${cleanTenDigits.slice(5)}`;
    const now = new Date().toISOString();

    // Automation A1: Create client, tick l1 & l2, generate AI pain diagnosis
    const painAnalysis = `Potential missed patient enquiries after 8 PM and during heavy appointment rush hours. Recommend instant call forwarding to 24×7 multilingual receptionist.`;

    const client = await db.createClient({
      name: businessName,
      owner_name: name,
      phone: formattedPhone,
      city: CITY,
      niche: vertical === "clinics" ? "Dental / Healthcare clinic" : `${vertical} business`,
      package: plan,
      founding_offer: false,
      notes: `Lead source: Landing Page Demo Form. AI Diagnosis: ${painAnalysis}`,
      next_step: "Call client to schedule 20-min demo walkthrough",
      next_step_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      consent_at: now,
      source: "website_demo_form",
      checks: {
        l1: { key: "l1", done: true, done_at: now, done_by: "automation" },
        l2: { key: "l2", done: true, done_at: now, done_by: "automation" },
        c1: { key: "c1", done: true, done_at: now, done_by: "automation" }, // Automation A2: welcome message triggered
      },
    });

    // Send mock welcome message
    await db.createMessage({
      client_id: client.id,
      direction: "outbound",
      channel: "whatsapp",
      template: "welcome_demo_v1",
      body: `Namaste ${name}! Thank you for requesting a demo for ${businessName}. Our founder Samar will share a demo agent trained on your business in 48 hours.`,
      status: "delivered",
    });

    // Forward to external webhook (LEAD_WEBHOOK_URL) if configured
    const webhookUrl = process.env.LEAD_WEBHOOK_URL;
    if (webhookUrl && webhookUrl.startsWith("http")) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timestamp: now,
            leadId: client.id,
            name,
            businessName,
            phone: formattedPhone,
            plan,
            vertical,
            portalUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/p/${client.portal_token}`,
          }),
        });
        await db.logActivity(
          "automation",
          "Webhook Forwarded",
          `Lead forwarded to Google Apps Script / Sheet webhook: ${webhookUrl}`,
          client.id
        );
      } catch (webhookErr) {
        console.error("Failed to forward lead to webhook:", webhookErr);
      }
    } else {
      // Mock mode logging
      await db.logActivity(
        "automation",
        "Mock Webhook Executed",
        `[MOCK] Lead data prepared for Google Sheet sync: ${name} (${businessName}, ${formattedPhone})`,
        client.id
      );
    }

    return NextResponse.json({
      success: true,
      clientId: client.id,
      portalToken: client.portal_token,
      message: "Lead created and demo scheduled",
    });
  } catch (error: any) {
    console.error("Lead API error:", error);
    return NextResponse.json(
      { error: "Internal server error processing lead request" },
      { status: 500 }
    );
  }
}

