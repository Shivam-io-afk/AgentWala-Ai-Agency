# Agmeta: AI Receptionist Agency & Client Pipeline OS

Production web app and automated agency OS for **Agmeta**, an Indian AI-agent agency setting up autonomous receptionists for clinics, salons, coaching centres, and small businesses.

Built with **Next.js 15 (App Router)**, **TypeScript**, and **Tailwind CSS**. Designed to run 100% locally out of the box with zero external API keys via intelligent mock drivers, or deployed directly to **Vercel + Supabase**.

---

## Features

1. **Approved Landing Page Website (`/` & `/[vertical]`)**
   - Matches the approved design in `design/agmeta-landing.html` and screenshots.
   - Dynamic vertical system: `/` defaults to `/content/clinics.ts`. Dynamically supports any niche (e.g. `/salons`, `/coaching`) just by adding a content file.
   - Prices pulled directly from single source of truth `lib/pricing.ts`.
   - Hinglish animated WhatsApp chat mockup (respects `prefers-reduced-motion`).
   - Accessible FAQ accordion with `FAQPage` JSON-LD schema for SEO.
   - Free demo form with Indian phone validation (`+91` 10 digits starting 6–9), honeypot anti-spam protection, wired to automation A1 and `LEAD_WEBHOOK_URL`.
   - Floating WhatsApp button with pre-filled message.
   - DPDP-compliant `/privacy` and `/terms` pages.
   - Mobile-first, WCAG AA contrast, custom Google fonts (*Bricolage Grotesque*, *Inter*, *IBM Plex Mono*).

2. **Agmeta OS Admin Panel (`/admin`)**
   - **Dashboard (`/admin`)**: 5-step conversion funnel (Leads → Meetings done → Won → Live → Paid), money breakdown (Collected, Still to collect, MRR, Open deals), today's focus items (overdue steps, meetings), and live activity feed.
   - **Pipeline (`/admin/pipeline`)**: Dual view — Kanban board (10 columns) and List view matching `Agmeta Client Pipeline.html` with 10-segment progress tracks, overdue badges, phase filter chips, and live checkbox updates.
   - **Client Detail (`/admin/clients/[id]`)**: Full 10-stage checklist (25 items) with Auto/Human badges and auto-derived stages, Bill Box, Tabs (Timeline, Messages, Proposal, Invoices, Agent Build/QA, Notes), and human approval triggers (H1 Meeting Notes, H2 Send Proposal, H3 Approve Go-Live).
   - **Invoices (`/admin/invoices`)**: Sequential financial year GST tax invoices (`AW/2026-27/XXXX`), Razorpay payment links, and HTML/PDF preview.
   - **Automations (`/admin/automations`)**: Controls for all 20 automations (A1–A20), toggles, execution logs, and one-click retry.
   - **Templates (`/admin/templates`)**: WhatsApp and email template editor with dynamic `{{variables}}`.
   - **Settings (`/admin/settings`)**: Business registration, GSTIN, bank UPI, and active integration status.

3. **Client Portal (`/p/[token]`)**
   - Secure token-based access (no password needed).
   - View and accept proposal with e-signature (triggers A9).
   - Pay 50% advance and final invoices via Razorpay links.
   - Fill clinic onboarding intake form (triggers A10 & A11).
   - Call dedicated test demo line and click Approve (triggers A13).
   - Download GST invoices.

4. **Zero-Key Mock Engine & Offline Simulation**
   - If any API key is missing (Supabase, Razorpay, Meta WhatsApp, Resend, Gemini/Claude), the system gracefully falls back to local file persistence (`.data/db.json`) and logs all outbound communications to `activity_log`.

---

## Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

- Public Landing Page: [http://localhost:3000](http://localhost:3000)
- Salons Vertical: [http://localhost:3000/salons](http://localhost:3000/salons)
- Admin Dashboard: [http://localhost:3000/admin](http://localhost:3000/admin)
- Admin Pipeline: [http://localhost:3000/admin/pipeline](http://localhost:3000/admin/pipeline)
- Example Client Detail: [http://localhost:3000/admin/clients/c-ex-1](http://localhost:3000/admin/clients/c-ex-1)
- Example Client Portal: [http://localhost:3000/p/tok_sunrise_dent_782](http://localhost:3000/p/tok_sunrise_dent_782)

### 3. Run Automated Tests
```bash
npm run test
```

---

## Setting up `LEAD_WEBHOOK_URL` with Google Sheets

When visitors submit the demo form on the website, the lead is stored locally, triggers Automation A1, and forwards the JSON payload to `LEAD_WEBHOOK_URL`.

### Google Apps Script Code
To log all website leads directly into a Google Sheet:

1. Create a new Google Sheet. In row 1, set headers:
   `Timestamp | Lead ID | Name | Business Name | Phone | Plan | Vertical | Portal URL`
2. In the Google Sheet, go to **Extensions → Apps Script**.
3. Replace the code with the following:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.timestamp || new Date(),
      data.leadId,
      data.name,
      data.businessName,
      data.phone,
      data.plan,
      data.vertical,
      data.portalUrl
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the Web App URL (ends with `/exec`).
6. Add it to your `.env.local`:
```env
LEAD_WEBHOOK_URL="https://script.google.com/macros/s/AKfycb.../exec"
```

---

## How to Add a New Vertical Page

The site uses a dynamic route `/[vertical]`. To add a new vertical (e.g. `/coaching`):

1. Create a new content file at `src/content/coaching.ts` using `VerticalContent` interface:
```typescript
import { VerticalContent } from "./clinics";
import { DEMO_NUMBER, CITY } from "./site";

export const coachingContent: VerticalContent = {
  slug: "coaching",
  seoTitle: "AI Receptionist for Coaching Classes & Tuition Centres | Agmeta",
  seoDescription: "Agmeta answers admission queries, fees and timing questions for coaching centres.",
  badge: "AI receptionist for coaching centres",
  heroH1: "Never miss a student admission enquiry.",
  heroSubtitle: "Agmeta answers parent calls and WhatsApp 24×7, books demo classes into your schedule, and sends batch updates.",
  heroCtaPrimary: "Book a live demo on WhatsApp",
  heroCtaSecondary: "Build a demo for my institute",
  demoLineText: `Book a live demo on WhatsApp: ${WHATSAPP_NUMBER} · Ask about course fees and batch timings.`,
  chatMockup: { ... },
  builtForTitle: "Built for",
  builtForItems: ["JEE / NEET coaching", "UPSC institutes", "Commerce academies", "Language schools"],
  problemH2: "Every unanswered enquiry is a student joining the centre next door.",
  problemCards: [ ... ],
  servicesH2: "One receptionist for student admissions.",
  serviceCards: [ ... ],
  howItWorksH2: "Live in three steps.",
  steps: [ ... ],
  pricingH2: "Simple fee pricing. Works every shift.",
  pricingSubtext: "Prices exclude 18% GST.",
  foundingBanner: "Founding offer: 50% off setup for first 5 institutes.",
  plans: [ ... ],
  founderQuote: `We're a small team in Rewa, MP. You'll talk to me, not a support queue.`,
  faqs: [ ... ],
  formH2: "Hear it answer your institute's calls.",
  formSubtitle: "Send us a few details and we will build a free demo agent in 48 hours.",
  formNamePlaceholder: "Prof. Rajesh Sharma",
  formBusinessPlaceholder: "Apex IIT Academy",
  formBusinessLabel: "Institute name and courses",
  formButtonText: "Build my free demo",
  formSuccessMessage: "We've received your institute details!",
  formWhatsAppPrefill: "Hi Agmeta! I want to test the coaching demo receptionist.",
};
```

2. Register it in `src/content/index.ts`:
```typescript
import { coachingContent } from "./coaching";

export const VERTICALS: Record<string, VerticalContent> = {
  clinics: clinicsContent,
  salons: salonsContent,
  coaching: coachingContent,
};
```
3. Visit [http://localhost:3000/coaching](http://localhost:3000/coaching). It is immediately live with custom metadata, Open Graph preview, and form wiring!

---

## Deploying to Vercel + Supabase

### 1. Database (Supabase)
1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run the script in `supabase/app_state.sql` (creates `public.app_state` with Row Level Security).
3. In Project Settings → API, copy your **Project URL**, **Anon Key**, and **Service Role Key**.

### 2. Deploy to Vercel
1. Push code to your GitHub repository (e.g. `https://github.com/Shivam-io-afk/Agmeta-Ai-Agency-`).
2. In [Vercel](https://vercel.com), import the repository.
3. In **Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SITE_URL`: Your Vercel production URL (e.g. `https://agent-wala-ai-agency.vercel.app`)
   - `AUTH_SECRET`: A secure random string with 32+ characters (e.g. generated via `openssl rand -hex 32`)
   - `FOUNDER_EMAILS`: Comma-separated allowlist of authorized founder emails (e.g. `shivam.mishra.cuh@gmail.com`)
   - `FOUNDER_LOGIN_CODE`: Direct login fallback code (32+ chars) allowing instant founder login without waiting for Resend
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role secret
   - Optional: `RESEND_API_KEY` (for sending live magic login link emails), `EMAIL_FROM`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `META_WHATSAPP_TOKEN`, `AI_API_KEY`
4. Deploy! All state (leads, invoices, checklist, dev time travel) will now persist seamlessly across Vercel serverless invocations.

---

## Environment Variables Reference

| Variable | Description | Required? |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Base public URL of the website (e.g. `https://agent-wala-ai-agency.vercel.app`) | Recommended |
| `AUTH_SECRET` | HMAC secret for session and magic login token signing (32+ chars) | **Required in production** |
| `FOUNDER_EMAILS` | Comma-separated list of founder emails authorized to log in | **Required in production** |
| `FOUNDER_LOGIN_CODE` | Direct founder login fallback code (bypasses email delivery) | Recommended fallback |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Recommended (uses ephemeral /tmp on Vercel) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Optional |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role secret (bypasses RLS to manage `app_state`) | Recommended for persistence on Vercel |
| `LEAD_WEBHOOK_URL` | Webhook URL for Google Apps Script / Sheet sync | Optional |
| `RESEND_API_KEY` | Resend Email API Key (for live magic link dispatch) | Optional |
| `EMAIL_FROM` | Sender email address for Resend | Optional (default: `Agmeta <shivam.mishra.cuh@gmail.com>`) |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | Optional (uses mock payment URLs if absent) |
| `RAZORPAY_KEY_SECRET` | Razorpay Secret | Optional |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Webhook verification secret | Optional |
| `META_WHATSAPP_TOKEN` | WhatsApp Cloud API Bearer Token | Optional (logs messages to outbox) |
| `META_PHONE_NUMBER_ID` | WhatsApp Phone Number ID | Optional |
| `AI_API_KEY` | Gemini or Anthropic Claude API Key | Optional (uses simulation engine if absent) |
| `AI_PROVIDER` | `gemini` or `anthropic` | Optional (default: `gemini`) |


# Agmeta-Ai-Agency-
