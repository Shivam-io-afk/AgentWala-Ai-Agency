import Link from "next/link";
import { RobotIcon } from "@/components/icons";
import { CITY, EMAIL, WHATSAPP_NUMBER } from "@/content/site";

export const metadata = {
  title: "Terms of Service | AgentWala",
  description: "Terms and conditions of service for AgentWala AI receptionists and client pipeline.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-[#1C1F3A]">
      <header className="border-b border-[#ECE6D8] px-4 py-6 bg-[#FBF7EE]">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FDB91F] flex items-center justify-center text-[#1C1F3A]">
              <RobotIcon className="w-5 h-5 text-[#1C1F3A]" />
            </div>
            <span className="font-display font-bold text-xl text-[#1C1F3A]">AgentWala</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-[#4A4F66] hover:text-[#1C1F3A]">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto py-12 px-4 space-y-8 leading-relaxed text-[#4A4F66]">
        <div className="space-y-2 border-b border-[#ECE6D8] pb-6">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1C1F3A]">
            Terms of Service
          </h1>
          <p className="text-sm text-[#727791]">
            Effective Date: October 2026 · AgentWala Technologies Private Limited
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-[#1C1F3A]">1. Scope of Service</h2>
          <p>
            AgentWala provides autonomous voice reception and WhatsApp AI messaging software for clinics and small businesses in India. Services include inbound telephone handling, multilingual appointment booking, calendar synchronization, and automated reminders.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-[#1C1F3A]">2. Pricing, Invoicing &amp; GST</h2>
          <p>
            All listed prices exclude 18% Goods &amp; Services Tax (GST). Invoices are rendered in Indian Rupees (INR) with explicit GSTIN, HSN/SAC codes, and state tax breakdowns. Setup advance (50% of setup fee + GST) is collected prior to custom voice prompt provisioning.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-[#1C1F3A]">3. WhatsApp Messaging &amp; Telecom Fees</h2>
          <p>
            Outbound WhatsApp template utility messages (e.g. appointment confirmations and reminder notifications) incur pass-through Meta Business API messaging charges billed directly at cost on your monthly invoice. Extra voice telephony minutes beyond the plan allowance are billed at ₹8/minute.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-[#1C1F3A]">4. Uptime &amp; Human Escalation</h2>
          <p>
            While our voice and chat agents achieve &gt;99.5% operational availability, clients agree to maintain an active staff fallback line for immediate transfer of complex or emergency clinical calls.
          </p>
        </section>

        <section className="space-y-3 border-t border-[#ECE6D8] pt-6 text-sm text-[#727791]">
          <p>
            Questions? Contact legal@agentwala.in or write to: AgentWala, {CITY}, Maharashtra, India.
          </p>
        </section>
      </main>
    </div>
  );
}

