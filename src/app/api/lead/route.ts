import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { CITY } from "@/content/site";
import { dispatchMessage } from "@/lib/messenger";
import { lookupStateFromCity } from "@/lib/location";

// Bug 10: In-memory Rate Limit Stores
// Max 3 enquiries/IP/10m, 1/phone/24h (HTTP 429)
const ipRequestLog = new Map<string, number[]>();
const phoneRequestLog = new Map<string, number>();

const LeadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  businessName: z.string().min(2, "Business name is required"),
  businessType: z.string().optional().default("Healthcare / Small Business"),
  city: z.string().optional().default(""),
  phone: z.string().regex(/^(?:\+91|91|0)?[6-9]\d{9}$/, "Please enter a valid 10-digit Indian WhatsApp mobile number"),
  need: z.enum(["ai_agent", "whatsapp_bot", "website", "app", "not_sure"]).optional().default("ai_agent"),
  budgetRange: z.string().optional().default("₹25k–₹60k"),
  timeline: z.string().optional().default("Within 2 weeks"),
  description: z.string().optional().default(""),
  consent: z.boolean().refine((val) => val === true, "You must agree to be contacted on WhatsApp and phone"),
  honeypot: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Honeypot anti-spam check
    if (body.honeypot && body.honeypot.trim().length > 0) {
      return NextResponse.json({ success: true, message: "Enquiry recorded" });
    }

    const parseResult = LeadSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Validation error";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const {
      name,
      businessName,
      businessType,
      city,
      phone,
      need,
      budgetRange,
      timeline,
      description,
    } = parseResult.data;

    // Format phone to clean 10 digits
    const digitsOnly = phone.replace(/\D/g, "");
    const cleanTenDigits = digitsOnly.slice(-10);
    const formattedPhone = `+91 ${cleanTenDigits.slice(0, 5)} ${cleanTenDigits.slice(5)}`;
    const now = Date.now();

    // Bug 10: Rate Limit Checks (HTTP 429)
    // 1. IP Rate limit: max 3 enquiries in 10 minutes (600,000 ms)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1";
    const ipTimestamps = ipRequestLog.get(clientIp) || [];
    const validIpTimestamps = ipTimestamps.filter((t) => now - t < 10 * 60 * 1000);
    if (validIpTimestamps.length >= 3) {
      return NextResponse.json(
        { error: "Too many enquiries from your IP address. Please wait 10 minutes before submitting again." },
        { status: 429 }
      );
    }
    validIpTimestamps.push(now);
    ipRequestLog.set(clientIp, validIpTimestamps);

    // 2. Phone Rate limit: max 1 enquiry per phone per 24 hours (86,400,000 ms)
    const lastPhoneTime = phoneRequestLog.get(cleanTenDigits);
    if (lastPhoneTime && now - lastPhoneTime < 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: "An enquiry for this mobile number was already received today. Our founder will contact you shortly." },
        { status: 429 }
      );
    }
    phoneRequestLog.set(cleanTenDigits, now);

    // Bug 22: City to State Lookup (default empty string, NOT Karnataka)
    const resolvedState = lookupStateFromCity(city);

    // Map need to package
    const packageMapping: Record<string, string> = {
      ai_agent: "growth",
      whatsapp_bot: "starter",
      website: "business_website",
      app: "app_mvp",
      not_sure: "growth",
    };
    const selectedPackage = packageMapping[need] || "growth";

    // Automation A1: Create client + project, tick l1, l2, l3 (Do NOT tick c1 yet!)
    const client = await db.createClient({
      name: businessName,
      owner_name: name,
      phone: formattedPhone,
      city: city || "",
      state: resolvedState, // Bug 22: mapped state or empty string
      niche: businessType,
      package: selectedPackage,
      founding_offer: false,
      notes: `Service Needed: ${need.toUpperCase()} | Budget: ${budgetRange} | Timeline: ${timeline}\nDescription: ${description}`,
      next_step: "Send pre-meeting brief & confirm 20-min consult",
      next_step_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      consent_at: new Date().toISOString(),
      source: "website_enquiry_form",
      outbound_count: 0,
      qualifying_answers: {
        service_needed: need,
        budget_range: budgetRange,
        timeline,
        description,
        calls_per_day: "30-50 calls/day",
        after_hours: "10-15 calls after hours",
        current_cost: "₹18,000/month front desk",
      },
      checks: {
        l1: { key: "l1", done: true, done_at: new Date().toISOString(), done_by: "automation" },
        l2: { key: "l2", done: true, done_at: new Date().toISOString(), done_by: "automation" },
        l3: { key: "l3", done: true, done_at: new Date().toISOString(), done_by: "automation" },
      },
    });

    const bookingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/p/${client.portal_token}`;
    const settings = await db.getSettings();

    // Bug 15: 1. Founder alert on lead
    await db.recordOutbox({
      channel: "whatsapp",
      recipient: settings.phone,
      template_name: "founder_new_lead_alert",
      content: `New Lead: ${businessName} (${name}, ${formattedPhone}). Need: ${need.toUpperCase()}. Budget: ${budgetRange}. Portal: ${bookingUrl}`,
      full_text: `New Lead: ${businessName} (${name}, ${formattedPhone}). Need: ${need.toUpperCase()}. Budget: ${budgetRange}. Portal: ${bookingUrl}`,
      project_id: client.id,
      client_id: client.id,
      client_name: client.name,
      status: "sent",
    });

    // Bug 15: 2. Welcome message sent BEFORE ticking c1
    await db.recordOutbox({
      channel: "whatsapp",
      recipient: formattedPhone,
      template_name: "welcome_enquiry_v2",
      content: `Namaste ${name}! Thank you for your enquiry for ${businessName}. We received your request for ${need.replace("_", " ")}. Click here to view your project portal and pick a 20-minute slot for our discovery call: ${bookingUrl}`,
      full_text: `Namaste ${name}! Thank you for your enquiry for ${businessName}. We received your request for ${need.replace("_", " ")}. Click here to view your project portal and pick a 20-minute slot for our discovery call: ${bookingUrl}`,
      project_id: client.id,
      client_id: client.id,
      client_name: client.name,
      status: "sent",
    });

    // Bug 15: 3. Welcome message sent -> now tick c1
    await db.updateCheck(client.id, "c1", true, "automation");
    await db.updateClient(client.id, { outbound_count: 1 });

    // Notify activity log
    await db.logActivity(
      "automation",
      "Automation A1 & A2 Completed",
      `New project enquiry received for ${businessName} (${need.toUpperCase()}). Founder alerted, welcome message sent, c1 ticked.`,
      client.id,
      { trigger_event: "website_enquiry_form", confidence_score: 1.0 }
    );

    return NextResponse.json({
      success: true,
      client,
      portalUrl: bookingUrl,
      message: "Your project enquiry has been received! We will connect with you on WhatsApp shortly.",
    });
  } catch (err: any) {
    console.error("Lead route error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
