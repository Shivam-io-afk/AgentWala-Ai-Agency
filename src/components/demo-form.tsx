"use client";

import React, { useState } from "react";
import { WhatsAppIcon, ArrowRightIcon, ShieldCheckIcon } from "./icons";
import { WHATSAPP_NUMBER_RAW } from "@/config/site";

interface DemoFormProps {
  h2?: string;
  subtitle?: string;
  buttonText?: string;
  successMessage?: string;
  defaultNeed?: string;
}

export function DemoForm({
  h2 = "Tell us about your project",
  subtitle = "Whether you need a 24×7 AI receptionist, a high-converting website, or a cross-platform mobile app — we'll review your requirements and share an exact proposal within 24 hours.",
  buttonText = "Submit Project Enquiry",
  defaultNeed = "ai_agent",
}: DemoFormProps) {
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [need, setNeed] = useState(defaultNeed);
  const [budgetRange, setBudgetRange] = useState("₹25k–₹60k");
  const [timeline, setTimeline] = useState("Within 2 weeks");
  const [description, setDescription] = useState("");
  // Bug 10: Consent checkbox starts unticked
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    businessName: string;
    phone: string;
    need: string;
    portalUrl?: string;
  } | null>(null);

  // Expose global helper so pricing cards can scroll and pre-select need
  React.useEffect(() => {
    (window as any).selectServiceNeed = (serviceKey: string) => {
      setNeed(serviceKey);
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
      setSubmittedData({ name, businessName, phone, need });
      return;
    }

    if (!consent) {
      setError("Please check the consent box to proceed.");
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
          businessType: businessType.trim(),
          city: city.trim(),
          phone: cleanPhone,
          need,
          budgetRange,
          timeline,
          description: description.trim(),
          consent,
          honeypot,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to submit project enquiry.");
      }

      setSubmittedData({
        name: name.trim(),
        businessName: businessName.trim(),
        phone: cleanPhone,
        need,
        portalUrl: json.portalUrl,
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getNeedLabel = (val: string) => {
    switch (val) {
      case "ai_agent":
        return "AI Voice Receptionist";
      case "whatsapp_bot":
        return "WhatsApp Booking Bot";
      case "website":
        return "Custom Website";
      case "app":
        return "Mobile App (MVP)";
      default:
        return "Tailored Solution";
    }
  };

  return (
    <section id="demo-form" className="py-16 sm:py-24 bg-[#FBF7EE] border-t border-[#ECE6D8]">
      <div className="max-w-[760px] mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-[22px] border border-[#ECE6D8] p-6 sm:p-10 shadow-sm">
          {submittedData ? (
            <div className="text-center space-y-6 py-6 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-[#E4F3EB] text-[#1F7A3A] mx-auto flex items-center justify-center">
                <ShieldCheckIcon className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1C1F3A]">
                  Enquiry Received!
                </h3>
                <p className="text-sm sm:text-base text-[#4A4F66] max-w-md mx-auto leading-relaxed">
                  Thank you, <b>{submittedData.name}</b>. We have registered your enquiry for <b>{submittedData.businessName}</b> regarding <b>{getNeedLabel(submittedData.need)}</b>.
                </p>
              </div>

              <div className="p-4 bg-[#FBF7EE] rounded-xl border border-[#ECE6D8] max-w-md mx-auto text-xs text-[#4A4F66] space-y-1.5 text-left">
                <div className="flex justify-between">
                  <span className="font-semibold text-[#1C1F3A]">Service Needed:</span>
                  <span>{getNeedLabel(submittedData.need)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-[#1C1F3A]">WhatsApp Number:</span>
                  <span className="font-mono">{submittedData.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-[#1C1F3A]">Next Step:</span>
                  <span className="text-[#1F7A3A] font-bold">Discovery call &amp; quote in 24h</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {submittedData.portalUrl && (
                  <a
                    href={submittedData.portalUrl}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-[#1C1F3A] text-white font-bold text-sm hover:bg-[#2E335E] transition-colors"
                  >
                    <span>View Project Portal</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </a>
                )}
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER_RAW}?text=Hi%20Agmeta%2C%20I%20just%20submitted%20an%20enquiry%20for%20${encodeURIComponent(submittedData.businessName)}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-[#1F7A3A] text-white font-bold text-sm hover:bg-[#18632F] transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Chat with Founder on WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center space-y-2">
                <span className="inline-block text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[#FAF0D7] text-[#9A6400]">
                  Get Started
                </span>
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1C1F3A]">
                  {h2}
                </h2>
                <p className="text-xs sm:text-sm text-[#4A4F66] max-w-lg mx-auto leading-relaxed">
                  {subtitle}
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Anti-spam honeypot */}
              <input
                type="text"
                name="user_website_url"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <div className="space-y-4 text-xs">
                {/* What do you need selector */}
                <div>
                  <label className="font-bold text-[#1C1F3A] block mb-2">
                    What do you need? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: "ai_agent", label: "AI Agent" },
                      { id: "whatsapp_bot", label: "WhatsApp Bot" },
                      { id: "website", label: "Website" },
                      { id: "app", label: "Mobile App" },
                      { id: "not_sure", label: "Not sure" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setNeed(item.id)}
                        className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                          need === item.id
                            ? "bg-[#1C1F3A] text-white border-[#1C1F3A] shadow-xs"
                            : "bg-[#FBF7EE] text-[#4A4F66] border-[#ECE6D8] hover:border-[#1C1F3A]"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name & Business Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-[#1C1F3A] block mb-1">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Vikram Mehta / Ananya Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE] text-[#1C1F3A] focus:outline-none focus:ring-2 focus:ring-[#FDB91F]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#1C1F3A] block mb-1">
                      Business / Brand Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sunrise Dental Care / Nova Fitness"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE] text-[#1C1F3A] focus:outline-none focus:ring-2 focus:ring-[#FDB91F]"
                    />
                  </div>
                </div>

                {/* Business Type & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-[#1C1F3A] block mb-1">
                      Business Type / Industry
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Clinic, Salon, Small Business"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE] text-[#1C1F3A] focus:outline-none focus:ring-2 focus:ring-[#FDB91F]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#1C1F3A] block mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rewa, Indore, Bhopal"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE] text-[#1C1F3A] focus:outline-none focus:ring-2 focus:ring-[#FDB91F]"
                    />
                  </div>
                </div>

                {/* WhatsApp Phone Number */}
                <div>
                  <label className="font-bold text-[#1C1F3A] block mb-1">
                    WhatsApp Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-[#ECE6D8] bg-[#FAF0D7] text-[#1C1F3A] font-bold text-xs">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="98XXX XXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 h-11 px-3.5 rounded-r-xl border border-[#ECE6D8] bg-[#FBF7EE] text-[#1C1F3A] focus:outline-none focus:ring-2 focus:ring-[#FDB91F]"
                    />
                  </div>
                  <p className="text-[11px] text-[#4A4F66] mt-1">
                    We will send your proposal draft &amp; demo walkthrough to this WhatsApp number.
                  </p>
                </div>

                {/* Budget Range & Timeline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-[#1C1F3A] block mb-1">
                      Budget Range
                    </label>
                    <select
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE] text-[#1C1F3A] font-medium focus:outline-none focus:ring-2 focus:ring-[#FDB91F]"
                    >
                      <option value="Under ₹25k">Under ₹25,000</option>
                      <option value="₹25k–₹60k">₹25,000 – ₹60,000</option>
                      <option value="₹60k–₹1L">₹60,000 – ₹1,00,000</option>
                      <option value="₹1L–₹3L">₹1,00,000 – ₹3,00,000</option>
                      <option value="Above ₹3L">Above ₹3,00,000</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#1C1F3A] block mb-1">
                      When do you want it?
                    </label>
                    <select
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE] text-[#1C1F3A] font-medium focus:outline-none focus:ring-2 focus:ring-[#FDB91F]"
                    >
                      <option value="Immediately (within 1 week)">Immediately (within 1 week)</option>
                      <option value="Within 2 weeks">Within 2 weeks</option>
                      <option value="Within 1 month">Within 1 month</option>
                      <option value="Just exploring">Just exploring</option>
                    </select>
                  </div>
                </div>

                {/* Short Description */}
                <div>
                  <label className="font-bold text-[#1C1F3A] block mb-1">
                    Project Overview or Current Bottlenecks (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about the features you want or what challenges you're facing (e.g. missed after-hours calls, need online booking, custom customer portal)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE] text-[#1C1F3A] focus:outline-none focus:ring-2 focus:ring-[#FDB91F]"
                  />
                </div>

                {/* DPDP Consent Checkbox */}
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none text-[11px] text-[#4A4F66]">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 rounded text-[#1C1F3A] focus:ring-0"
                  />
                  <span>
                    I agree to be contacted on WhatsApp and phone about my project enquiry. We respect your privacy and will never share your details or send unsolicited spam.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-[#FDB91F] hover:bg-[#E5A413] text-[#1C1F3A] font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <span>{loading ? "Submitting Enquiry…" : buttonText}</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
