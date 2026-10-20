"use client";

import React, { useState } from "react";
import { WhatsAppIcon, ArrowRightIcon, ShieldCheckIcon } from "./icons";
import { WHATSAPP_NUMBER_RAW } from "@/content/site";

interface DemoFormProps {
  h2: string;
  subtitle: string;
  namePlaceholder: string;
  businessPlaceholder: string;
  businessLabel: string;
  buttonText: string;
  successMessage: string;
  defaultPlan?: string;
  verticalSlug?: string;
}

export function DemoForm({
  h2,
  subtitle,
  namePlaceholder,
  businessPlaceholder,
  businessLabel,
  buttonText,
  successMessage,
  defaultPlan = "growth",
  verticalSlug = "clinics",
}: DemoFormProps) {
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(defaultPlan);
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    businessName: string;
    phone: string;
  } | null>(null);

  // Expose global function so pricing cards can smoothly pre-select plan and scroll
  React.useEffect(() => {
    (window as any).selectDemoPlan = (planId: string) => {
      setSelectedPlan(planId);
      const formEl = document.getElementById("demo-form");
      if (formEl) {
        formEl.scrollIntoView({ behavior: "smooth" });
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Spam honeypot detection
    if (honeypot) {
      console.warn("Honeypot triggered");
      setSubmittedData({ name, businessName, phone });
      return;
    }

    // Validate Indian mobile number (+91 and 10 digits starting 6-9)
    const cleanPhone = phone.replace(/[\s\-()]/g, "");
    const indianPhoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian WhatsApp mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          businessName: businessName.trim(),
          phone: cleanPhone,
          plan: selectedPlan,
          vertical: verticalSlug,
          honeypot,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to submit demo request.");
      }

      setSubmittedData({
        name: name.trim(),
        businessName: businessName.trim(),
        phone: cleanPhone,
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formattedWhatsAppUrl = submittedData
    ? `https://wa.me/${WHATSAPP_NUMBER_RAW.replace(/\+/g, "")}?text=${encodeURIComponent(
        `Hi AgentWala team! I am ${submittedData.name} from ${submittedData.businessName}. I just requested a free demo receptionist. Can we connect?`
      )}`
    : `https://wa.me/${WHATSAPP_NUMBER_RAW.replace(/\+/g, "")}`;

  return (
    <section id="demo-form" className="bg-[#FDB91F] py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Side: Pitch Copy */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#1C1F3A] leading-[1.15] text-balance">
            {h2}
          </h2>
          <p className="text-[#1C1F3A] text-opacity-90 text-base sm:text-lg max-w-lg leading-relaxed font-medium">
            {subtitle}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 text-xs sm:text-sm font-semibold text-[#1C1F3A] text-opacity-80">
            <div className="flex items-center gap-1.5">
              <ShieldCheckIcon className="w-4 h-4 text-[#1C1F3A]" />
              <span>Zero setup fees to build your demo</span>
            </div>
            <div className="hidden sm:inline">·</div>
            <div>No credit card needed</div>
          </div>
        </div>

        {/* Right Side: Form Card */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-[20px] p-6 sm:p-8 shadow-xl border border-[#E8D499]">
            {submittedData ? (
              <div className="space-y-5 text-center py-4">
                <div className="w-14 h-14 bg-[#E4F3EB] text-[#2E7D5B] rounded-full mx-auto flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-bold text-2xl text-[#1C1F3A]">
                    Demo request received!
                  </h3>
                  <p className="text-[#4A4F66] text-sm mt-2 leading-relaxed">
                    {successMessage}
                  </p>
                </div>

                <div className="pt-2">
                  <a
                    href={formattedWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 w-full bg-[#1F7A3A] hover:bg-[#18632F] text-white font-semibold text-base px-6 py-3.5 rounded-xl transition-all shadow-md min-h-[48px]"
                  >
                    <WhatsAppIcon className="w-5 h-5 text-white" />
                    <span>Or message us on WhatsApp now</span>
                  </a>
                  <p className="text-[12px] text-[#727791] mt-2">
                    Direct line with our founder Samar in Mumbai.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot anti-spam field */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  style={{ display: "none" }}
                  aria-hidden="true"
                />

                {/* Hidden plan field */}
                <input type="hidden" name="plan" value={selectedPlan} />

                <div>
                  <label htmlFor="lead-name" className="block text-xs font-bold text-[#4A4F66] uppercase tracking-wider mb-1.5">
                    Your name
                  </label>
                  <input
                    id="lead-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={namePlaceholder}
                    className="w-full min-h-[48px] px-4 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE] text-[#1C1F3A] text-base placeholder:text-[#8D92A8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1F3A] transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="lead-business" className="block text-xs font-bold text-[#4A4F66] uppercase tracking-wider mb-1.5">
                    {businessLabel}
                  </label>
                  <input
                    id="lead-business"
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={businessPlaceholder}
                    className="w-full min-h-[48px] px-4 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE] text-[#1C1F3A] text-base placeholder:text-[#8D92A8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1F3A] transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="lead-phone" className="block text-xs font-bold text-[#4A4F66] uppercase tracking-wider mb-1.5">
                    WhatsApp number
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-sm font-semibold text-[#1C1F3A] select-none pointer-events-none">
                      +91
                    </span>
                    <input
                      id="lead-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98200 12345"
                      className="w-full min-h-[48px] pl-14 pr-4 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE] text-[#1C1F3A] text-base font-mono placeholder:text-[#8D92A8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1F3A] transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-[#FDF0E1] border border-[#F3CFA2] text-[#B4540A] text-xs font-semibold rounded-lg leading-normal">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[50px] bg-[#1C1F3A] hover:bg-[#14172C] active:scale-[0.99] text-white font-semibold text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C1F3A]"
                >
                  {loading ? (
                    <span>Submitting demo request…</span>
                  ) : (
                    <>
                      <span>{buttonText}</span>
                      <ArrowRightIcon className="w-4 h-4 text-[#FDB91F]" />
                    </>
                  )}
                </button>

                <p className="text-center text-[12px] text-[#727791]">
                  We'll WhatsApp you within one working day. No spam.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
