"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Client, Invoice, Proposal } from "@/lib/types";
import { calculateBill, formatINR } from "@/lib/pricing";
import { RobotIcon, CheckIcon, ShieldCheckIcon, PhoneIcon } from "@/components/icons";
import { DEMO_NUMBER, CITY } from "@/content/site";

export default function ClientPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [client, setClient] = useState<Client | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Proposal acceptance state
  const [signerName, setSignerName] = useState("");

  // Onboarding form state
  const [timings, setTimings] = useState("Mon-Sat: 10:00 AM - 8:00 PM, Sun: Closed");
  const [consultationFee, setConsultationFee] = useState("₹800 consultation fee");
  const [doctors, setDoctors] = useState("Dr. Vikram Mehta (BDS, MDS), Dr. Ananya (Associate)");
  const [handoffPhone, setHandoffPhone] = useState("+91 98200 45678 (Reception desk)");
  const [faqs, setFaqs] = useState("Root canal: ₹4,500. Dental cleaning: ₹1,500. Parking: Available in building basement.");

  const fetchPortalData = async () => {
    try {
      const res = await fetch(`/api/portal/${token}`);
      const json = await res.json();
      if (json.success && json.client) {
        setClient(json.client);
        setProposal(json.proposal || null);
        setInvoices(json.invoices || []);
        setSignerName(json.client.owner_name || "");
      }
    } catch (err) {
      console.error("Portal error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [token]);

  const triggerAction = async (payload: any) => {
    setActionLoading(true);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/portal/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg(json.message);
        fetchPortalData();
      } else {
        alert(json.error || "Action failed");
      }
    } catch (err) {
      console.error("Portal action error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#FDB91F] flex items-center justify-center text-[#1C1F3A] mx-auto animate-pulse">
            <RobotIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-[#1C1F3A]">Loading secure client portal…</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-[#ECE6D8] max-w-md text-center space-y-3 shadow-md">
          <h2 className="font-display font-bold text-xl text-[#1C1F3A]">Link Invalid or Expired</h2>
          <p className="text-xs text-[#4A4F66]">
            This client portal link is no longer valid. Please check the URL sent to your WhatsApp or contact AgentWala support.
          </p>
        </div>
      </div>
    );
  }

  const b = calculateBill(client.package, client.founding_offer);
  const isProposalAccepted = client.checks?.w1?.done;
  const isAdvancePaid = client.checks?.w2?.done;
  const isOnboardingSubmitted = client.checks?.w3?.done;
  const isAgentApproved = client.checks?.d3?.done;
  const isFinalBillPaid = client.checks?.q1?.done;

  return (
    <div className="min-h-screen bg-[#FBF7EE] text-[#1C1F3A]">
      {/* Portal Header */}
      <header className="bg-white border-b border-[#ECE6D8] px-4 sm:px-8 py-4 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FDB91F] flex items-center justify-center text-[#1C1F3A]">
              <RobotIcon className="w-5 h-5 text-[#1C1F3A]" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-[#1C1F3A] block leading-tight">
                AgentWala Portal
              </span>
              <span className="text-[11px] text-[#727791]">
                Prepared for {client.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#2E7D5B] bg-[#E4F3EB] px-3 py-1.5 rounded-full border border-[#B9E3CF]">
            <ShieldCheckIcon className="w-4 h-4 text-[#2E7D5B]" />
            <span>Secure 256-bit Link</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[900px] mx-auto p-4 sm:p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-white rounded-[20px] p-6 sm:p-8 border border-[#ECE6D8] shadow-card space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9A6400] bg-[#FAF0D7] px-2.5 py-1 rounded-full w-fit">
            <span>Client Onboarding &amp; Deliverables</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1C1F3A]">
            Namaste, {client.owner_name || client.name}!
          </h1>
          <p className="text-sm text-[#4A4F66] leading-relaxed max-w-2xl">
            Welcome to your AgentWala project dashboard. From here, you can review your custom AI receptionist proposal, submit clinic timings and FAQs, test drive your demo receptionist, and download official GST tax invoices.
          </p>

          {actionMsg && (
            <div className="p-3 bg-[#E4F3EB] border border-[#B9E3CF] text-[#2E7D5B] text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-[#2E7D5B]" />
              <span>{actionMsg}</span>
            </div>
          )}
        </div>

        {/* STEP 1: Proposal & Acceptance */}
        <div className="bg-white rounded-[20px] p-6 sm:p-8 border border-[#ECE6D8] shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-4">
            <div>
              <span className="text-xs font-bold text-[#FDB91F] uppercase tracking-wider block">
                Step 1 of 4
              </span>
              <h2 className="font-display font-bold text-xl text-[#1C1F3A]">
                AI Receptionist Proposal &amp; Scope
              </h2>
            </div>
            {isProposalAccepted && (
              <span className="px-3 py-1 rounded-full bg-[#E4F3EB] text-[#2E7D5B] text-xs font-bold flex items-center gap-1.5">
                <CheckIcon className="w-4 h-4" />
                <span>Accepted</span>
              </span>
            )}
          </div>

          <div className="bg-[#FBF7EE] p-5 rounded-2xl border border-[#ECE6D8] space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-display font-bold text-lg text-[#1C1F3A]">
                  {b.packageName} AI Receptionist Suite
                </h3>
                <p className="text-xs text-[#727791] mt-0.5">
                  Tailored for {client.niche} · Multilingual call &amp; WhatsApp answering
                </p>
              </div>
              <span className="font-mono font-bold text-lg text-[#1C1F3A]">
                {formatINR(b.monthly)}/mo
              </span>
            </div>

            <ul className="space-y-2 text-xs sm:text-sm text-[#4A4F66]">
              <li className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-[#2E7D5B] flex-shrink-0" />
                <span>Answers phone calls 24×7 in Hindi, English, and Hinglish</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-[#2E7D5B] flex-shrink-0" />
                <span>Automated appointment booking directly to Google Calendar</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-[#2E7D5B] flex-shrink-0" />
                <span>WhatsApp conversational agent with location, timings &amp; fee FAQs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-[#2E7D5B] flex-shrink-0" />
                <span>Emergency triage &amp; immediate handoff to clinic staff</span>
              </li>
            </ul>

            {/* Investment Summary */}
            <div className="pt-3 border-t border-[#ECE6D8] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[#727791] block">Setup (50% Off Applied)</span>
                <span className="font-mono font-bold text-[#1C1F3A]">{formatINR(b.setup)}</span>
              </div>
              <div>
                <span className="text-[#727791] block">Month 1 Retainer</span>
                <span className="font-mono font-bold text-[#1C1F3A]">{formatINR(b.monthly)}</span>
              </div>
              <div>
                <span className="text-[#727791] block">GST (18%)</span>
                <span className="font-mono font-bold text-[#1C1F3A]">{formatINR(b.gst)}</span>
              </div>
              <div>
                <span className="text-[#727791] block">First Bill Total</span>
                <span className="font-mono font-bold text-[#1C1F3A]">{formatINR(b.totalFirstBill)}</span>
              </div>
            </div>
          </div>

          {!isProposalAccepted ? (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase text-[#4A4F66] mb-1">
                  E-Signature: Type your full name to accept proposal
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Vikram Mehta"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full h-11 px-4 text-sm rounded-xl border border-[#ECE6D8] bg-[#FBF7EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1F3A]"
                />
              </div>

              <button
                type="button"
                disabled={actionLoading || !signerName.trim()}
                onClick={() =>
                  triggerAction({ action: "accept_proposal", acceptedName: signerName })
                }
                className="w-full h-12 bg-[#1C1F3A] hover:bg-[#14172C] text-white font-bold text-sm rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>Accept Proposal &amp; Lock 50% Founding Setup Discount</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#E4F3EB] border border-[#B9E3CF] text-xs text-[#2E7D5B] flex justify-between items-center">
              <span>
                Proposal accepted by <b>{client.owner_name}</b>. Advance payment invoice generated.
              </span>
              <span className="font-mono text-[11px]">e-Signed</span>
            </div>
          )}
        </div>

        {/* STEP 2: Advance Payment */}
        <div className="bg-white rounded-[20px] p-6 sm:p-8 border border-[#ECE6D8] shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-4">
            <div>
              <span className="text-xs font-bold text-[#FDB91F] uppercase tracking-wider block">
                Step 2 of 4
              </span>
              <h2 className="font-display font-bold text-xl text-[#1C1F3A]">
                50% Setup Advance ({formatINR(b.advance)})
              </h2>
            </div>
            {isAdvancePaid && (
              <span className="px-3 py-1 rounded-full bg-[#E4F3EB] text-[#2E7D5B] text-xs font-bold flex items-center gap-1.5">
                <CheckIcon className="w-4 h-4" />
                <span>Paid</span>
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-[#4A4F66]">
            Advance payment covers custom prompt calibration, phone routing provisioning, and multi-language testing before go-live.
          </p>

          {!isAdvancePaid ? (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={`https://rzp.io/i/adv_${client.id.slice(-6)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-12 bg-[#FDB91F] hover:bg-[#E5A413] text-[#1C1F3A] font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <span>Pay {formatINR(b.advance)} via Razorpay (UPI / NetBanking / Cards)</span>
              </a>

              {/* Instant mock button for testing without live Razorpay */}
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => triggerAction({ action: "mock_pay_advance" })}
                className="px-4 h-12 border border-[#ECE6D8] text-xs font-semibold rounded-xl text-[#727791] hover:text-[#1C1F3A] hover:bg-[#FBF7EE] transition-colors"
              >
                [Simulate Payment Webhook]
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#E4F3EB] border border-[#B9E3CF] text-xs text-[#2E7D5B] flex justify-between items-center">
              <span>Advance payment of {formatINR(b.advance)} confirmed.</span>
              <span className="font-mono font-bold">GST Tax Receipt Sent</span>
            </div>
          )}
        </div>

        {/* STEP 3: Onboarding Details Intake */}
        <div className="bg-white rounded-[20px] p-6 sm:p-8 border border-[#ECE6D8] shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-4">
            <div>
              <span className="text-xs font-bold text-[#FDB91F] uppercase tracking-wider block">
                Step 3 of 4
              </span>
              <h2 className="font-display font-bold text-xl text-[#1C1F3A]">
                Clinic Information &amp; FAQs
              </h2>
            </div>
            {isOnboardingSubmitted && (
              <span className="px-3 py-1 rounded-full bg-[#E4F3EB] text-[#2E7D5B] text-xs font-bold flex items-center gap-1.5">
                <CheckIcon className="w-4 h-4" />
                <span>Submitted</span>
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-[#4A4F66]">
            Provide your operating hours, doctor names, consultation fees, and emergency numbers. Our AI will automatically ingest this to build your custom agent knowledge base.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              triggerAction({
                action: "submit_onboarding",
                timings,
                consultationFee,
                doctors,
                handoffPhone,
                faqs,
              });
            }}
            className="space-y-4 pt-2 text-xs"
          >
            <div>
              <label className="font-bold text-[#4A4F66] block mb-1">
                Clinic Timings &amp; Working Days:
              </label>
              <input
                type="text"
                value={timings}
                onChange={(e) => setTimings(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE]"
              />
            </div>

            <div>
              <label className="font-bold text-[#4A4F66] block mb-1">
                Consultation Fees &amp; Common Treatments:
              </label>
              <input
                type="text"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE]"
              />
            </div>

            <div>
              <label className="font-bold text-[#4A4F66] block mb-1">
                Doctors &amp; Specialists:
              </label>
              <input
                type="text"
                value={doctors}
                onChange={(e) => setDoctors(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE]"
              />
            </div>

            <div>
              <label className="font-bold text-[#4A4F66] block mb-1">
                Staff Phone Number for Emergency Call Forwarding:
              </label>
              <input
                type="text"
                value={handoffPhone}
                onChange={(e) => setHandoffPhone(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE]"
              />
            </div>

            <div>
              <label className="font-bold text-[#4A4F66] block mb-1">
                Top Patient Questions &amp; Parking / Location notes:
              </label>
              <textarea
                rows={3}
                value={faqs}
                onChange={(e) => setFaqs(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE]"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full h-11 bg-[#1C1F3A] hover:bg-[#14172C] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isOnboardingSubmitted ? "Update Onboarding Details" : "Submit Clinic Details & Generate AI Knowledge Base"}
            </button>
          </form>
        </div>

        {/* STEP 4: Test Agent & Approve Go-Live */}
        <div className="bg-white rounded-[20px] p-6 sm:p-8 border border-[#ECE6D8] shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-4">
            <div>
              <span className="text-xs font-bold text-[#FDB91F] uppercase tracking-wider block">
                Step 4 of 4
              </span>
              <h2 className="font-display font-bold text-xl text-[#1C1F3A]">
                Test Drive Your Agent &amp; Final Approval
              </h2>
            </div>
            {isAgentApproved && (
              <span className="px-3 py-1 rounded-full bg-[#E4F3EB] text-[#2E7D5B] text-xs font-bold flex items-center gap-1.5">
                <CheckIcon className="w-4 h-4" />
                <span>Approved</span>
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-[#4A4F66]">
            Call your dedicated test line to try booking an appointment in Hindi or English before you connect your real clinic number.
          </p>

          <div className="p-4 bg-[#FBF7EE] rounded-xl border border-[#ECE6D8] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FDB91F] flex items-center justify-center text-[#1C1F3A]">
                <PhoneIcon className="w-5 h-5 text-[#1C1F3A]" />
              </div>
              <div>
                <span className="text-xs text-[#727791] block">Test Demo Line:</span>
                <span className="font-mono font-bold text-sm text-[#1C1F3A]">{DEMO_NUMBER}</span>
              </div>
            </div>
            <a
              href={`tel:${DEMO_NUMBER.replace(/\s+/g, "")}`}
              className="px-4 py-2 bg-[#1C1F3A] text-white text-xs font-bold rounded-xl"
            >
              Call Test Agent
            </a>
          </div>

          {!isAgentApproved ? (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => triggerAction({ action: "approve_agent" })}
              className="w-full h-11 bg-[#2E7D5B] hover:bg-[#25664A] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              I Tested the Agent &amp; Approve for Live Go-Live
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-[#E4F3EB] border border-[#B9E3CF] text-xs text-[#2E7D5B]">
              Agent approved! Our founder Samar will connect your official clinic number within 24 hours.
            </div>
          )}
        </div>

        {/* Footer Support Callout */}
        <div className="text-center text-xs text-[#727791] space-y-1">
          <p>Need assistance with your onboarding or setup?</p>
          <p>
            Call or WhatsApp founder Samar directly at <b>+91 98200 12345</b> ({CITY}, India).
          </p>
        </div>
      </main>
    </div>
  );
}
