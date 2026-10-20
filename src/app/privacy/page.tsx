import Link from "next/link";
import { RobotIcon } from "@/components/icons";
import { CITY, EMAIL, WHATSAPP_NUMBER } from "@/content/site";

export const metadata = {
  title: "Privacy Policy | AgentWala",
  description: "AgentWala DPDP Act compliant privacy policy and patient data security guidelines.",
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-[#727791]">
            Last updated: October 2026 · Compliant with India&apos;s Digital Personal Data Protection (DPDP) Act, 2023
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-[#1C1F3A]">1. Data We Collect &amp; Why</h2>
          <p>
            AgentWala acts as a Data Processor on behalf of clinics, salons, and businesses (the Data Fiduciaries). We collect and process only the minimal information strictly necessary to facilitate appointment bookings and customer queries:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Caller name and telephone/WhatsApp number.</li>
            <li>Requested appointment date, time, and service/doctor department.</li>
            <li>Call audio and transcript summaries strictly for appointment confirmation and quality assurance.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-[#1C1F3A]">2. No Medical Advice &amp; Protected Health Data</h2>
          <p>
            AgentWala receptionists are programmed strictly for administrative tasks (timings, appointments, fee transparency, clinic directions). The AI is explicitly barred from offering diagnostic opinions, prescriptions, or clinical triage. Sensitive health details are never requested or stored.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-[#1C1F3A]">3. Data Security &amp; India Residency</h2>
          <p>
            All patient records and transcripts are encrypted in transit (TLS 1.3) and at rest (AES-256). We maintain explicit Data Processing Agreements (DPA) with all subscriber clinics in compliance with India&apos;s DPDP Act.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-[#1C1F3A]">4. Rights to Access, Rectification &amp; Erasure</h2>
          <p>
            Any customer or patient can request a copy of their conversational logs or ask for permanent data erasure by emailing our Data Grievance Officer at{" "}
            <a href={`mailto:${EMAIL}`} className="text-[#1C1F3A] font-semibold underline">
              {EMAIL}
            </a>
            . Requests are fulfilled within 48 business hours.
          </p>
        </section>

        <section className="space-y-3 border-t border-[#ECE6D8] pt-6 text-sm text-[#727791]">
          <p>
            AgentWala Technologies Private Limited · {CITY}, India · Phone/WhatsApp: {WHATSAPP_NUMBER}
          </p>
        </section>
      </main>
    </div>
  );
}
