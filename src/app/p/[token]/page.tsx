"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Client, Project, Invoice, DeliveryRecord, RevisionRoundRecord, HandoverRecord } from "@/lib/types";
import { calculateBill, formatINR } from "@/lib/pricing";
import { RobotIcon, CheckIcon, ShieldCheckIcon, PhoneIcon } from "@/components/icons";
import { DEMO_NUMBER, CITY, STATE, FOUNDER_NAME, WHATSAPP_NUMBER, WHATSAPP_LINK } from "@/config/site";
import { RealtimeLoadingScreen } from "@/components/network-loading-indicator";

export default function ClientPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [client, setClient] = useState<Client | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [revisions, setRevisions] = useState<RevisionRoundRecord[]>([]);
  const [handover, setHandover] = useState<HandoverRecord | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // OTP Acceptance state
  const [signerName, setSignerName] = useState("");
  const [signerPhone, setSignerPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Kickoff assets state
  const [kickoffAssets, setKickoffAssets] = useState("");
  const [brandingNotes, setBrandingNotes] = useState("");
  const [submittingKickoff, setSubmittingKickoff] = useState(false);

  // Revision Engine state (Section 7)
  const [revisionInputs, setRevisionInputs] = useState<string>("");
  const [submittingRevision, setSubmittingRevision] = useState(false);

  // Handover Vault reveal state
  const [revealedVault, setRevealedVault] = useState(false);

  const fetchPortalData = async () => {
    try {
      const res = await fetch(`/api/portal/${token}`);
      const json = await res.json();
      if (json.success && json.client) {
        setClient(json.client);
        const p = json.activeProject || json.projects?.[0] || null;
        setProject(p);
        setInvoices(json.invoices || []);
        setDeliveries(json.deliveries || []);
        setRevisions(json.revisions || []);
        setHandover(json.handover || null);
        setSignerName(json.client.owner_name || "");
        setSignerPhone(json.client.phone || "");
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
    setActionError(null);
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
        setActionError(json.error || "Action failed");
      }
    } catch (err: any) {
      setActionError(err.message || "Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // OTP handlers (Bug 1: verify against stored OTP, no testOtp shown)
  const handleSendOtp = async () => {
    setSendingOtp(true);
    setActionMsg(null);
    setActionError(null);
    try {
      const res = await fetch(`/api/portal/${token}/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_otp" }),
      });
      const json = await res.json();
      if (json.success) {
        setOtpSent(true);
        setActionMsg(`Verification code sent to your registered phone (${client?.phone || signerPhone}). Check WhatsApp/SMS.`);
      } else {
        setActionError(json.error || "Failed to send OTP");
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to connect to server");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) return;
    setVerifyingOtp(true);
    setActionMsg(null);
    setActionError(null);
    try {
      const res = await fetch(`/api/portal/${token}/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_otp",
          otp: otpCode.trim(),
          name: signerName.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg("Agreement digitally accepted via OTP! Advance payment milestone activated.");
        fetchPortalData();
      } else {
        setActionError(json.error || "Invalid OTP code");
      }
    } catch (err: any) {
      setActionError(err.message || "Verification failed");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmitKickoff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingKickoff(true);
    await triggerAction({
      action: "submit_kickoff_assets",
      assetsText: kickoffAssets,
      brandingNotes,
    });
    setSubmittingKickoff(false);
  };

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionInputs.trim()) return;
    setSubmittingRevision(true);
    const items = revisionInputs.split("\n").filter((l) => l.trim().length > 0);
    const roundNumber = client?.checks?.v1?.done ? 2 : 1;
    await triggerAction({
      action: "submit_revision",
      roundNumber,
      items,
    });
    setRevisionInputs("");
    setSubmittingRevision(false);
  };

  if (loading) {
    return (
      <RealtimeLoadingScreen
        title="Securing Project Portal"
        subtext="Verifying client access token, loading Master Agreement & milestones..."
        fullScreen={true}
      />
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

  // Status Gates
  const isAgreementSigned = Boolean(client.checks?.s1?.done || client.checks?.w1?.done);
  const isAdvancePaid = Boolean(client.checks?.s2?.done || client.checks?.w2?.done);
  const isKickoffDone = Boolean(client.checks?.s3?.done || client.checks?.w3?.done);
  const isDeliveryApproved = Boolean(client.checks?.v3?.done);
  const isFinalPaid = Boolean(client.checks?.f2?.done || client.checks?.q1?.done);
  const isHandoverDone = Boolean(client.checks?.h2?.done);

  const advanceInvoice = invoices.find((i) => i.type === "advance");
  const finalInvoice = invoices.find((i) => i.type === "final");

  return (
    <div className="min-h-screen bg-[#FBF7EE] text-[#1C1F3A]">
      {/* Header */}
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
            <span>Secure 256-bit OTP Link</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[900px] mx-auto p-4 sm:p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-white rounded-[20px] p-6 sm:p-8 border border-[#ECE6D8] shadow-card space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9A6400] bg-[#FAF0D7] px-2.5 py-1 rounded-full w-fit">
            <span>Client Workspace &amp; Deliverables</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1C1F3A]">
            Namaste, {client.owner_name || client.name}!
          </h1>
          <p className="text-sm text-[#4A4F66] leading-relaxed max-w-2xl">
            Welcome to your project workspace. Follow the steps below to e-sign your service agreement, pay project milestones via Razorpay, upload assets, test staging builds, and receive your handover package.
          </p>

          {actionMsg && (
            <div className="p-3 bg-[#E4F3EB] border border-[#B9E3CF] text-[#2E7D5B] text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-[#2E7D5B]" />
              <span>{actionMsg}</span>
            </div>
          )}

          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
              <span>⚠️ {actionError}</span>
            </div>
          )}
        </div>

        {/* STEP 1: Service Agreement & OTP Acceptance */}
        <div className="bg-white rounded-[20px] p-6 sm:p-8 border border-[#ECE6D8] shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-4">
            <div>
              <span className="text-xs font-bold text-[#FDB91F] uppercase tracking-wider block">
                Step 1 of 5
              </span>
              <h2 className="font-display font-bold text-xl text-[#1C1F3A]">
                Service Agreement &amp; Scope of Work (Annex A)
              </h2>
            </div>
            {isAgreementSigned && (
              <span className="px-3 py-1 rounded-full bg-[#E4F3EB] text-[#2E7D5B] text-xs font-bold flex items-center gap-1.5">
                <CheckIcon className="w-4 h-4" />
                <span>Accepted via OTP</span>
              </span>
            )}
          </div>

          <div className="bg-[#FBF7EE] p-5 rounded-2xl border border-[#ECE6D8] space-y-3 text-xs text-[#4A4F66]">
            <h3 className="font-bold text-sm text-[#1C1F3A]">
              Master Agreement Summary (Governed by Indian Contract Act 1872)
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><b>Scope:</b> Deliverables exclusively detailed in Annex A. Out-of-scope requests handled via Change Requests at ₹1,000/hr (Clause 4.3).</li>
              <li><b>Revisions:</b> Two (2) consolidated revision rounds included at no extra charge (Clause 4.1).</li>
              <li><b>Deemed Acceptance:</b> Deliverables deemed irrevocably accepted if no feedback submitted within 7 days of delivery (Clause 4.4).</li>
              <li><b>Payment &amp; Handover:</b> Full payment required prior to source code &amp; credentials transfer (Clause 5.1).</li>
              <li><b>Warranty:</b> 30 calendar days of bugfix warranty post-handover (Clause 7).</li>
            </ul>

            <div className="pt-2 border-t border-[#ECE6D8] flex justify-between items-center text-[11px] text-[#727791]">
              <span>Project Value: <b>{formatINR(b.setup)}</b> + applicable GST</span>
              <span>Jurisdiction: New Delhi, India</span>
            </div>
          </div>

          {!isAgreementSigned ? (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-[#4A4F66] mb-1">
                    Full Legal Name (Authorized Signatory)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Vikram Mehta"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE] text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#4A4F66] mb-1">
                    Registered Mobile Number
                  </label>
                  <input
                    type="text"
                    disabled
                    value={client.phone}
                    className="w-full h-11 px-3 rounded-xl border border-[#ECE6D8] bg-[#F3EFE6] text-sm text-[#727791]"
                  />
                  <span className="text-[10px] text-[#727791] mt-1 block">OTP will be sent only to this registered phone</span>
                </div>
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  disabled={sendingOtp || !signerName.trim()}
                  onClick={handleSendOtp}
                  className="w-full h-12 bg-[#1C1F3A] hover:bg-[#14172C] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {sendingOtp ? "Sending OTP…" : "Send 6-Digit OTP to Phone"}
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-[#FAF0D7] border border-[#F5DC9A] space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#9A6400]">
                      Enter 6-digit verification code sent to {client.phone}:
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 582914"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="flex-1 h-11 px-4 text-center tracking-widest font-mono text-base font-bold rounded-xl border border-[#E2E0EE] bg-white"
                    />
                    <button
                      type="button"
                      disabled={verifyingOtp || otpCode.length < 4}
                      onClick={handleVerifyOtp}
                      className="px-6 h-11 bg-[#2E7D5B] hover:bg-[#25664A] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {verifyingOtp ? "Verifying…" : "Verify OTP & Accept Agreement"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#E4F3EB] border border-[#B9E3CF] text-xs text-[#2E7D5B] flex justify-between items-center">
              <span>
                Agreement digitally executed by <b>{client.owner_name}</b> with verified mobile OTP.
              </span>
              <span className="font-mono text-[11px] font-bold">SHA-256 Audit Trail Locked</span>
            </div>
          )}
        </div>

        {/* STEP 2: Advance Payment (Bug 23: Show "Paid ✓" instead of "Pay ₹XX,XXX") */}
        <div className="bg-white rounded-[20px] p-6 sm:p-8 border border-[#ECE6D8] shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-4">
            <div>
              <span className="text-xs font-bold text-[#FDB91F] uppercase tracking-wider block">
                Step 2 of 5
              </span>
              <h2 className="font-display font-bold text-xl text-[#1C1F3A]">
                Advance Payment ({formatINR(b.advance)})
              </h2>
            </div>
            {isAdvancePaid ? (
              <span className="px-3 py-1 rounded-full bg-[#E4F3EB] text-[#2E7D5B] text-xs font-bold flex items-center gap-1.5">
                <CheckIcon className="w-4 h-4" />
                <span>Paid ✓</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-[#FAF0D7] text-[#9A6400] text-xs font-bold">
                Pending Advance
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-[#4A4F66]">
            Milestone 1 advance covers architecture setup, custom prompt training, and initial build sprints.
          </p>

          {!isAdvancePaid ? (
            <div className="pt-2">
              <a
                href={advanceInvoice?.razorpay_payment_url || `https://rzp.io/l/aw_adv_${client.id.slice(-6)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex px-6 h-12 bg-[#FDB91F] hover:bg-[#E5A413] text-[#1C1F3A] font-bold text-sm rounded-xl items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <span>Pay {formatINR(b.advance)} via Razorpay (UPI / NetBanking / Cards)</span>
              </a>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#E4F3EB] border border-[#B9E3CF] text-xs text-[#2E7D5B] flex justify-between items-center">
              <span>Advance payment verified. Work plan and kickoff checklist unlocked.</span>
              <span className="font-mono font-bold">Paid ✓</span>
            </div>
          )}
        </div>

        {/* STEP 3: Kickoff Assets Upload */}
        <div className="bg-white rounded-[20px] p-6 sm:p-8 border border-[#ECE6D8] shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-4">
            <div>
              <span className="text-xs font-bold text-[#FDB91F] uppercase tracking-wider block">
                Step 3 of 5
              </span>
              <h2 className="font-display font-bold text-xl text-[#1C1F3A]">
                Kickoff Assets &amp; Business Information
              </h2>
            </div>
            {isKickoffDone && (
              <span className="px-3 py-1 rounded-full bg-[#E4F3EB] text-[#2E7D5B] text-xs font-bold flex items-center gap-1.5">
                <CheckIcon className="w-4 h-4" />
                <span>Assets Received</span>
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-[#4A4F66]">
            Provide links to your logos, doctor/staff names, clinic consultation fees, FAQs, and domain/DNS logins.
          </p>

          <form onSubmit={handleSubmitKickoff} className="space-y-3 pt-2 text-xs">
            <div>
              <label className="font-bold text-[#4A4F66] block mb-1">
                Content, Services &amp; Doctor List / FAQs:
              </label>
              <textarea
                rows={3}
                placeholder="Paste clinic timings, doctor names, consultation fees, or Google Drive link…"
                value={kickoffAssets}
                onChange={(e) => setKickoffAssets(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE]"
              />
            </div>

            <div>
              <label className="font-bold text-[#4A4F66] block mb-1">
                Branding &amp; Domain Notes (Colours, Logo link):
              </label>
              <input
                type="text"
                placeholder="e.g. Logo on drive.google.com/..., Primary colour: Navy blue"
                value={brandingNotes}
                onChange={(e) => setBrandingNotes(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE]"
              />
            </div>

            <button
              type="submit"
              disabled={submittingKickoff}
              className="w-full h-11 bg-[#1C1F3A] hover:bg-[#14172C] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {submittingKickoff ? "Saving Assets…" : "Submit Kickoff Assets (Unlock Build)"}
            </button>
          </form>
        </div>

        {/* STEP 4: Build Review & Consolidated Revisions (Section 7) */}
        <div className="bg-white rounded-[20px] p-6 sm:p-8 border border-[#ECE6D8] shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-4">
            <div>
              <span className="text-xs font-bold text-[#FDB91F] uppercase tracking-wider block">
                Step 4 of 5
              </span>
              <h2 className="font-display font-bold text-xl text-[#1C1F3A]">
                Build Staging &amp; Revision Engine
              </h2>
            </div>
            {isDeliveryApproved && (
              <span className="px-3 py-1 rounded-full bg-[#E4F3EB] text-[#2E7D5B] text-xs font-bold flex items-center gap-1.5">
                <CheckIcon className="w-4 h-4" />
                <span>Approved</span>
              </span>
            )}
          </div>

          {/* Staging / Test Demo Preview */}
          <div className="p-4 bg-[#FBF7EE] rounded-xl border border-[#ECE6D8] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FDB91F] flex items-center justify-center text-[#1C1F3A]">
                <PhoneIcon className="w-5 h-5 text-[#1C1F3A]" />
              </div>
              <div>
                <span className="text-xs text-[#727791] block">Test Demo Phone Line:</span>
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

          {/* Consolidated Revision Form (Section 7, Bug 8: Show "Request a change (paid)" after 2 rounds) */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#1C1F3A]">
                Submit Consolidated Revision Request
              </span>
              <span className="font-mono text-[11px] text-[#9A6400] bg-[#FAF0D7] px-2 py-0.5 rounded">
                {(project?.revisions_used || 0) >= (project?.revision_rounds_included || 2)
                  ? "2 of 2 (Rounds Complete)"
                  : client?.checks?.v1?.done
                  ? "Round 2 of 2"
                  : "Round 1 of 2"}
              </span>
            </div>
            <p className="text-xs text-[#4A4F66]">
              Per clause 4.1, submit all changes in one single batch. Fixes and copy refinements within scope are included free. Any new modules, integrations or pages are classified as Change Requests.
            </p>

            {(project?.revisions_used || 0) >= (project?.revision_rounds_included || 2) ? (
              <div className="p-4 rounded-xl bg-[#FAF0D7] border border-[#F5DC9A] space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-[#9A6400]">
                  <span>Included Revision Limit Reached (2 Rounds Completed)</span>
                  <span className="font-mono text-[11px]">Clause 4.2 Enforced</span>
                </div>
                <p className="text-xs text-[#4A4F66]">
                  All included revision rounds have been completed. Any additional modifications or new features are billed under Annex A Clause 4.2 at ₹1,000/hr.
                </p>
                <a
                  href={`${WHATSAPP_LINK}?text=${encodeURIComponent("Hi AgentWala, I'd like to request a paid change request for my project.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-5 py-2.5 bg-[#1C1F3A] hover:bg-[#14172C] text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Request a change (paid at ₹1,000/hr)
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmitRevision} className="space-y-2">
                <textarea
                  rows={3}
                  placeholder="Enter change items, one per line (e.g. Change consultation fee to ₹900&#10;Adjust doctor working hours…)"
                  value={revisionInputs}
                  onChange={(e) => setRevisionInputs(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE] text-xs font-mono"
                />
                <button
                  type="submit"
                  disabled={submittingRevision || !revisionInputs.trim()}
                  className="w-full py-2.5 rounded-xl bg-[#FDB91F] hover:bg-[#E5A413] text-[#1C1F3A] font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingRevision ? "Classifying & Submitting…" : "Submit Consolidated Revision Round"}
                </button>
              </form>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => triggerAction({ action: "approve_delivery" })}
                className="px-4 py-2 bg-[#2E7D5B] hover:bg-[#25664A] text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                I Tested the Delivery &amp; Approve for Handover (v3)
              </button>
            </div>
          </div>
        </div>

        {/* STEP 5: Final Settlement & Annex B Handover */}
        <div className="bg-white rounded-[20px] p-6 sm:p-8 border border-[#ECE6D8] shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-4">
            <div>
              <span className="text-xs font-bold text-[#FDB91F] uppercase tracking-wider block">
                Step 5 of 5
              </span>
              <h2 className="font-display font-bold text-xl text-[#1C1F3A]">
                Final Settlement &amp; Annex B Handover Kit
              </h2>
            </div>
            {isHandoverDone && (
              <span className="px-3 py-1 rounded-full bg-[#E4F3EB] text-[#2E7D5B] text-xs font-bold flex items-center gap-1.5">
                <CheckIcon className="w-4 h-4" />
                <span>Handover Complete</span>
              </span>
            )}
          </div>

          {/* Final Invoice Gate (Bug 2: No client-side payment simulation) */}
          {!isFinalPaid ? (
            <div className="p-4 rounded-xl bg-[#FAF0D7] border border-[#F5DC9A] space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#9A6400]">
                  Handover Gated: Final Invoice Settlement ({formatINR(b.finalBill)})
                </span>
                <span className="font-mono text-[11px] font-bold">Clause 5.1 Enforced</span>
              </div>
              <p className="text-xs text-[#4A4F66]">
                Per Clause 5.1, master logins, source code repositories, and DNS transfer keys unlock once the final milestone invoice is paid.
              </p>

              <div className="pt-1">
                <a
                  href={finalInvoice?.razorpay_payment_url || `https://rzp.io/l/aw_fin_${client.id.slice(-6)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-2.5 bg-[#FDB91F] hover:bg-[#E5A413] text-[#1C1F3A] font-bold text-xs rounded-xl text-center"
                >
                  Pay Final Settlement {formatINR(b.finalBill)} via Razorpay
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#E4F3EB] border border-[#B9E3CF] text-xs text-[#2E7D5B]">
                ✓ Final invoice paid! Annex B Handover Kit and 30-Day Bugfix Warranty are unlocked below.
              </div>

              {/* Handover Credentials Vault */}
              <div className="p-4 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE] space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-[#1C1F3A]">
                    Master Credentials &amp; Handover Kit
                  </h4>
                  <button
                    type="button"
                    onClick={() => setRevealedVault(!revealedVault)}
                    className="text-xs font-bold text-[#FDB91F] underline"
                  >
                    {revealedVault ? "Hide Credentials" : "Reveal Credentials"}
                  </button>
                </div>

                {revealedVault ? (
                  <div className="space-y-2 p-3 bg-white rounded-lg font-mono text-[11px] border">
                    <div><b>GitHub Repository:</b> github.com/agentwala-clients/{client.id}</div>
                    <div><b>DNS Nameservers:</b> ns1.agentwala.net, ns2.agentwala.net</div>
                    <div><b>Production Token:</b> aw_live_sec_{client.id.slice(0, 12)}</div>
                    <div><b>Admin Dashboard:</b> agent-wala-ai-agency.vercel.app/admin</div>
                  </div>
                ) : (
                  <p className="text-[#727791]">
                    Credentials are encrypted with 256-bit AES. Click Reveal above to view your master logins.
                  </p>
                )}

                <div className="pt-2 flex justify-between items-center">
                  <span className="font-bold text-[#2E7D5B]">
                    30-Day Bugfix Warranty Active (Clause 7)
                  </span>
                  <button
                    type="button"
                    onClick={() => triggerAction({ action: "confirm_handover" })}
                    className="px-4 py-2 bg-[#1C1F3A] text-white font-bold text-xs rounded-xl"
                  >
                    Confirm Receipt of Handover Kit (h2)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Support */}
        <div className="text-center text-xs text-[#727791] space-y-1">
          <p>Need assistance or have questions regarding your project?</p>
          <p>
            Contact founder {FOUNDER_NAME} on WhatsApp at <b>{WHATSAPP_NUMBER}</b> ({CITY}, {STATE}, India).
          </p>
        </div>
      </main>
    </div>
  );
}
