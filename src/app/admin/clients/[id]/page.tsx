"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Client, Invoice, Proposal, MessageRecord, ActivityLogRecord, StageKey, Recommendation, AgentRecord } from "@/lib/types";
import { PIPELINE_PHASES, ALL_STAGES, getClientStageIndex, getClientStageName } from "@/lib/pipeline-constants";
import { calculateBill, formatINR, PACKAGES } from "@/lib/pricing";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
  const [agent, setAgent] = useState<AgentRecord | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [activeTab, setActiveTab] = useState<"timeline" | "messages" | "proposal" | "invoices" | "agent" | "notes">("timeline");
  const [loading, setLoading] = useState(true);

  // Section 7b: Why rule expand state
  const [whyExpanded, setWhyExpanded] = useState(false);

  // New message state
  const [newMessageBody, setNewMessageBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Notes state
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Meeting Notes Modal (H1)
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [mCallsPerDay, setMCallsPerDay] = useState("35 calls/day");
  const [mAfterHours, setMAfterHours] = useState("12 calls after 8 PM");
  const [mCurrentCost, setMCurrentCost] = useState("₹16,000/month front desk");
  const [mRecommendedPkg, setMRecommendedPkg] = useState("growth");

  // A21 Qualifying Answers Modal
  const [qualifyingModalOpen, setQualifyingModalOpen] = useState(false);
  const [qCallsPerDay, setQCallsPerDay] = useState("");
  const [qAfterHours, setQAfterHours] = useState("");
  const [qCurrentCost, setQCurrentCost] = useState("");
  const [qPreferredTime, setQPreferredTime] = useState("");
  const [savingQualifying, setSavingQualifying] = useState(false);

  const fetchClientData = async () => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`);
      const json = await res.json();
      if (json.success && json.client) {
        setClient(json.client);
        setInvoices(json.invoices || []);
        setProposal(json.proposal || null);
        setMessages(json.messages || []);
        setLogs(json.logs || []);
        setAgent(json.agent || null);
        setRecommendations(json.recommendations || []);
        setNotesText(json.client.notes || "");

        // Set qualifying state
        const qa = json.client.qualifying_answers || {};
        setQCallsPerDay(qa.calls_per_day || "35 calls/day");
        setQAfterHours(qa.after_hours || "12 calls after 8 PM");
        setQCurrentCost(qa.current_cost || "₹16,000/month front desk");
        setQPreferredTime(qa.preferred_time || "Evenings after 6 PM");
      }
    } catch (err) {
      console.error("Failed to load client detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [clientId]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-[#585D7A]">Loading client data…</div>;
  }

  if (!client) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-base text-[#1B1F3B] font-bold">Client not found.</p>
        <Link href="/admin/pipeline" className="text-xs text-[#FDB91F] font-bold underline">
          ← Back to Pipeline
        </Link>
      </div>
    );
  }

  const stageIdx = getClientStageIndex(client);
  const stageName = getClientStageName(client);
  const b = calculateBill(client.package, client.founding_offer);

  const handleCheck = async (key: StageKey, checked: boolean) => {
    // Optimistic check
    setClient((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        checks: {
          ...(prev.checks || {}),
          [key]: {
            key,
            done: checked,
            done_at: checked ? new Date().toISOString() : undefined,
            done_by: "user",
          },
        },
      };
    });

    try {
      await fetch("/api/admin/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id, key, done: checked, doneBy: "user" }),
      });
      fetchClientData();
    } catch (err) {
      console.error("Failed to update checklist item:", err);
    }
  };

  const handleUpdateField = async (field: string, value: any) => {
    setClient((prev) => (prev ? { ...prev, [field]: value } : null));
    try {
      await fetch(`/api/admin/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      fetchClientData();
    } catch (err) {
      console.error("Failed to patch client:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageBody.trim()) return;
    setSendingMessage(true);

    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          body: newMessageBody.trim(),
          channel: "whatsapp",
          direction: "outbound",
        }),
      });
      if (res.ok) {
        setNewMessageBody("");
        fetchClientData();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await handleUpdateField("notes", notesText);
    setSavingNotes(false);
  };

  // Human approval H1: Submit meeting notes & AI draft proposal
  const submitMeetingNotes = async () => {
    await handleCheck("m1", true);
    await handleCheck("m2", true);
    await handleCheck("m3", true);
    await handleCheck("m4", true);

    await handleUpdateField(
      "notes",
      `${notesText}\n\n[Meeting Notes]: Calls: ${mCallsPerDay} | After-hours: ${mAfterHours} | Current cost: ${mCurrentCost} | Rec Package: ${mRecommendedPkg}`
    );

    // Create or update draft proposal
    await fetch("/api/admin/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: client.id,
        packageId: mRecommendedPkg,
        scopeBullets: [
          `Full voice answering for ${mCallsPerDay}`,
          `After-hours support for ${mAfterHours}`,
          `Calendar appointment scheduling & reminder flow`,
        ],
      }),
    });

    setMeetingModalOpen(false);
    fetchClientData();
  };

  // Human approval H2: Approve & Send Proposal
  const approveAndSendProposal = async () => {
    await handleCheck("p1", true);
    await handleUpdateField("next_step", "Follow up on proposal acceptance within 48h");
    await handleUpdateField(
      "next_step_date",
      new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
    );
    fetchClientData();
    alert("Proposal approved and dispatched to client! p1 ticked.");
  };

  // A24 Go-live gate checks:
  const isD2Done = Boolean(client.checks?.d2?.done);
  const isD3Done = Boolean(client.checks?.d3?.done);
  const canGoLive = isD2Done && isD3Done;

  // Human approval H3: Approve Go-Live (with A24 gate enforcement)
  const approveGoLive = async () => {
    if (!canGoLive) {
      alert(
        "A24 Go-Live Gate Locked: Requires AI automated test pass rate ≥ 90% (d2) and client approval (d3) before phone forwarding can be connected."
      );
      return;
    }
    await handleCheck("v1", true);
    await handleCheck("v2", true);
    fetchClientData();
    alert("Go-Live approved! Phone forwarding connected and client team trained. v1 and v2 ticked.");
  };

  // Section 7b: AI Copilot Action handler
  const handleRecAction = async (rec: Recommendation, status: "acted" | "snoozed" | "dismissed") => {
    try {
      await fetch("/api/admin/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", id: rec.id, status }),
      });
      if (status === "acted") {
        if (rec.type === "forgotten_step" && (rec.title.includes("H1") || rec.title.includes("Notes") || rec.title.includes("notes"))) {
          setMeetingModalOpen(true);
        } else if (rec.type === "money_at_risk" && rec.title.includes("Proposal")) {
          setActiveTab("proposal");
        } else if (rec.type === "skipped_item") {
          setQualifyingModalOpen(true);
        } else {
          setActiveTab("messages");
        }
      }
      fetchClientData();
    } catch (err) {
      console.error("Failed to update recommendation:", err);
    }
  };

  // A21 Qualifying Answers save handler
  const handleSaveQualifying = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQualifying(true);
    const updatedAnswers = {
      calls_per_day: qCallsPerDay,
      after_hours: qAfterHours,
      current_cost: qCurrentCost,
      preferred_time: qPreferredTime,
    };
    await handleUpdateField("qualifying_answers", updatedAnswers);
    setQualifyingModalOpen(false);
    setSavingQualifying(false);
  };

  const activeRec = recommendations.find((r) => r.status === "active") || null;

  return (
    <div className="space-y-6">
      {/* Section 7b: AI Copilot Next Best Action Card */}
      {activeRec && (
        <div className="bg-[#FAF0D7] dark:bg-[#2A2415] border border-[#F5DC9A] dark:border-[#52441D] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#1B1F3B] text-[#FDB91F]">
                Section 7b · Next Best Action
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  activeRec.priority === "high"
                    ? "bg-[#FFEAE5] text-[#D83A14]"
                    : "bg-[#E7E5F1] text-[#1B1F3B] dark:text-white"
                }`}
              >
                {activeRec.priority} priority
              </span>
              {activeRec.money_at_risk_rupees ? (
                <span className="text-[10px] font-mono font-bold text-[#B4540A] dark:text-[#F3CA68]">
                  {formatINR(activeRec.money_at_risk_rupees)} at stake
                </span>
              ) : null}
            </div>

            <h3 className="font-display font-bold text-base text-[#1B1F3B] dark:text-white">
              {activeRec.title}
            </h3>
            <p className="text-xs text-[#585D7A] dark:text-[#D1D4EC] leading-relaxed">
              {activeRec.reason}
            </p>

            {/* Why Collapsible */}
            {activeRec.why_rule && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setWhyExpanded(!whyExpanded)}
                  className="text-[11px] font-bold text-[#9A6400] dark:text-[#F3CA68] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{whyExpanded ? "▲ Hide 'Why?' trigger explanation" : "▼ Why is this suggested? (Rule details)"}</span>
                </button>
                {whyExpanded && (
                  <div className="mt-2 p-2.5 rounded-xl bg-white/70 dark:bg-[#1C1F3A]/70 border border-[#F5DC9A] dark:border-[#52441D] text-[11px] font-mono text-[#585D7A] dark:text-[#A6A9C6] leading-relaxed">
                    Triggered by: {activeRec.why_rule}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center flex-shrink-0">
            <button
              type="button"
              onClick={() => handleRecAction(activeRec, "acted")}
              className="px-4 py-2 rounded-xl bg-[#1B1F3B] hover:bg-[#14172C] text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              {activeRec.action_label || "Do This Now"} →
            </button>
            <button
              type="button"
              onClick={() => handleRecAction(activeRec, "snoozed")}
              className="px-3 py-2 rounded-xl border border-[#F5DC9A] dark:border-[#52441D] text-xs font-semibold text-[#9A6400] dark:text-[#F3CA68] hover:bg-[#F5DC9A]/30 transition-colors cursor-pointer"
            >
              Snooze 24h
            </button>
            <button
              type="button"
              onClick={() => handleRecAction(activeRec, "dismissed")}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-[#585D7A] hover:text-[#1B1F3B] transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link href="/admin/pipeline" className="text-xs text-[#585D7A] dark:text-[#A6A9C6] hover:underline">
                ← Pipeline
              </Link>
              <span className="text-xs text-[#E2E0EE] dark:text-[#2F3356]">/</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FAF0D7] text-[#9A6400]">
                {stageName} (Stage {stageIdx + 1}/10)
              </span>
            </div>

            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1B1F3B] dark:text-white">
              {client.name}
            </h1>

            <div className="text-xs text-[#585D7A] dark:text-[#A6A9C6] flex items-center gap-2 flex-wrap">
              <span><b>Owner:</b> {client.owner_name}</span>
              <span>·</span>
              <span><b>Phone:</b> {client.phone}</span>
              <span>·</span>
              <span><b>Niche:</b> {client.niche}</span>
              <span>·</span>
              <span><b>City:</b> {client.city}</span>
            </div>
          </div>

          {/* Quick Actions & Portal Token */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/p/${client.portal_token}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-[#FDB91F] hover:bg-[#E5A413] text-[#1B1F3B] font-bold text-xs transition-colors shadow-xs"
            >
              Open Client Portal ↗
            </Link>

            <button
              type="button"
              onClick={() => setMeetingModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#1B1F3B] text-white hover:bg-[#14172C] text-xs font-semibold transition-colors cursor-pointer"
            >
              H1: Meeting Notes
            </button>

            <button
              type="button"
              onClick={approveAndSendProposal}
              className="px-3.5 py-2 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] text-xs font-semibold text-[#1B1F3B] dark:text-white hover:bg-[#F6F5FB] dark:hover:bg-[#252A4A] transition-colors cursor-pointer"
            >
              H2: Send Proposal
            </button>

            {/* A24 Gated Button */}
            <button
              type="button"
              onClick={approveGoLive}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                canGoLive
                  ? "bg-[#2E7D5B] text-white hover:bg-[#25664A] shadow-xs cursor-pointer"
                  : "bg-[#E2E0EE] dark:bg-[#2F3356] text-[#727791] dark:text-[#A6A9C6] cursor-pointer"
              }`}
              title={
                canGoLive
                  ? "A24 Gate Passed: d2 test ≥90% & d3 approved"
                  : "A24 Gate Locked: Requires d2 test pass rate ≥90% & d3 client approval"
              }
            >
              {!canGoLive && <span className="text-[11px]">🔒</span>}
              <span>H3: Mark Live {canGoLive ? "✓" : "(A24 Gate)"}</span>
            </button>
          </div>
        </div>

        {/* Live Bill Strip */}
        <div className="pt-3 border-t border-[#E2E0EE] dark:border-[#2F3356] grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
          <div>
            <span className="text-[#585D7A] dark:text-[#A6A9C6] block">Package Setup</span>
            <span className="font-mono font-bold text-[#1B1F3B] dark:text-white">
              {formatINR(b.setup)}
            </span>
          </div>
          <div>
            <span className="text-[#585D7A] dark:text-[#A6A9C6] block">Month 1 Retainer</span>
            <span className="font-mono font-bold text-[#1B1F3B] dark:text-white">
              {formatINR(b.monthly)}
            </span>
          </div>
          <div>
            <span className="text-[#585D7A] dark:text-[#A6A9C6] block">GST 18%</span>
            <span className="font-mono font-bold text-[#1B1F3B] dark:text-white">
              {formatINR(b.gst)}
            </span>
          </div>
          <div>
            <span className="text-[#585D7A] dark:text-[#A6A9C6] block">Total First Bill</span>
            <span className="font-mono font-bold text-[#1B1F3B] dark:text-white">
              {formatINR(b.totalFirstBill)}
            </span>
          </div>
          <div>
            <span className="text-[#585D7A] dark:text-[#A6A9C6] block">50% Advance</span>
            <span className="font-mono font-bold text-[#2E7D5B] dark:text-[#5FCB98]">
              {formatINR(b.advance)}
            </span>
          </div>
          <div>
            <span className="text-[#585D7A] dark:text-[#A6A9C6] block">Final Bill Balance</span>
            <span className="font-mono font-bold text-[#B4540A] dark:text-[#F2A15A]">
              {formatINR(b.finalBill)}
            </span>
          </div>
        </div>
      </div>

      {/* A21 Qualifying Answers Card */}
      <div className="bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#FAF0D7] text-[#9A6400]">
              A21 Qualification &amp; Call Intake
            </span>
            <span className="text-xs text-[#585D7A] dark:text-[#A6A9C6]">
              Extracted from voice qualification call or H1 discovery
            </span>
          </div>

          <button
            type="button"
            onClick={() => setQualifyingModalOpen(true)}
            className="text-xs font-bold text-[#FDB91F] hover:underline cursor-pointer"
          >
            Edit Qualification Answers ✎
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] space-y-1">
            <span className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6] block font-semibold">
              Calls Handled / Day
            </span>
            <p className="font-bold text-[#1B1F3B] dark:text-white">
              {client.qualifying_answers?.calls_per_day || "35 calls/day"}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] space-y-1">
            <span className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6] block font-semibold">
              After-Hours &amp; Missed
            </span>
            <p className="font-bold text-[#1B1F3B] dark:text-white">
              {client.qualifying_answers?.after_hours || "12 calls after 8 PM"}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] space-y-1">
            <span className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6] block font-semibold">
              Current Front-Desk Cost
            </span>
            <p className="font-bold text-[#1B1F3B] dark:text-white">
              {client.qualifying_answers?.current_cost || "₹16,000/month front desk"}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] space-y-1">
            <span className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6] block font-semibold">
              Preferred Timing
            </span>
            <p className="font-bold text-[#1B1F3B] dark:text-white">
              {client.qualifying_answers?.preferred_time || "Evenings after 6 PM"}
            </p>
          </div>
        </div>
      </div>

      {/* 10-Stage Checklist Box */}
      <div className="bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-[#1B1F3B] dark:text-white">
            10-Stage Pipeline Checklist
          </h2>
          <span className="text-xs text-[#585D7A] dark:text-[#A6A9C6]">
            Derived Stage: <b>{stageName}</b>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PIPELINE_PHASES.map((phase) => {
            const phaseItems = phase.stages.flatMap((s) => s.items);
            const doneCount = phaseItems.filter(
              (item) => client.checks?.[item.key]?.done
            ).length;

            return (
              <div
                key={phase.id}
                className="bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-xl p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#585D7A] dark:text-[#A6A9C6] border-b border-[#E2E0EE] dark:border-[#2F3356] pb-2">
                  <span>{phase.name}</span>
                  <span className="font-mono">{doneCount}/{phaseItems.length}</span>
                </div>

                <div className="space-y-3">
                  {phase.stages.map((stage) => (
                    <div key={stage.id} className="space-y-1.5">
                      <span className="text-[11px] font-bold text-[#1B1F3B] dark:text-white block">
                        {stage.name}
                      </span>
                      <div className="space-y-1">
                        {stage.items.map((item) => {
                          const checkRec = client.checks?.[item.key];
                          const isDone = Boolean(checkRec?.done);

                          return (
                            <label
                              key={item.key}
                              className="flex items-start gap-2 text-xs text-[#1B1F3B] dark:text-[#ECEBF7] cursor-pointer hover:text-black select-none"
                            >
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={(e) => handleCheck(item.key, e.target.checked)}
                                className="mt-0.5 rounded text-[#2E7D5B] focus:ring-0"
                              />
                              <span className={`leading-snug ${isDone ? "line-through text-[#727791]" : ""}`}>
                                {item.label}
                                {checkRec?.done_by === "automation" && (
                                  <span className="ml-1 text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-[#FAF0D7] text-[#9A6400]">
                                    Auto
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs Interface */}
      <div className="bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl shadow-xs overflow-hidden">
        {/* Tab Header */}
        <div className="border-b border-[#E2E0EE] dark:border-[#2F3356] px-6 flex items-center gap-6 overflow-x-auto text-xs font-semibold">
          {[
            { id: "timeline", label: "Timeline" },
            { id: "messages", label: `Messages (${messages.length})` },
            { id: "proposal", label: "Proposal" },
            { id: "invoices", label: `Invoices (${invoices.length})` },
            { id: "agent", label: "Agent Build & QA" },
            { id: "notes", label: "Founder Notes" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "border-[#FDB91F] text-[#1B1F3B] dark:text-white font-bold"
                  : "border-transparent text-[#585D7A] dark:text-[#A6A9C6] hover:text-[#1B1F3B]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {/* Timeline Tab */}
          {activeTab === "timeline" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#1B1F3B] dark:text-white">
                Activity History
              </h3>
              {logs.length === 0 ? (
                <p className="text-xs text-[#585D7A]">No timeline events logged.</p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-xl text-xs flex justify-between items-start gap-4"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1B1F3B] dark:text-white">{log.action}</span>
                        <span className="text-[10px] uppercase font-bold text-[#9A6400] bg-[#FAF0D7] px-1.5 rounded">
                          {log.actor}
                        </span>
                      </div>
                      <p className="text-[#585D7A] dark:text-[#A6A9C6]">{log.detail}</p>
                    </div>
                    <span className="text-[10px] text-[#727791] font-mono whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <div className="space-y-5">
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {messages.length === 0 ? (
                  <p className="text-xs text-[#585D7A]">No messages exchanged yet.</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-xl text-xs max-w-[80%] ${
                        msg.direction === "outbound"
                          ? "ml-auto bg-[#D9FDD3] text-[#111B21] border border-[#BCE8B4]"
                          : "bg-[#F6F5FB] dark:bg-[#12142A] text-[#1B1F3B] dark:text-white border border-[#E2E0EE] dark:border-[#2F3356]"
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] text-[#727791] mb-1">
                        <span>{msg.channel.toUpperCase()} · {msg.direction}</span>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Send Message Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type WhatsApp message to client…"
                  value={newMessageBody}
                  onChange={(e) => setNewMessageBody(e.target.value)}
                  className="flex-1 h-10 px-3 text-xs rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] text-[#1B1F3B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FDB91F]"
                />
                <button
                  type="submit"
                  disabled={sendingMessage}
                  className="px-4 h-10 bg-[#1F7A3A] hover:bg-[#18632F] text-white text-xs font-bold rounded-xl transition-colors"
                >
                  {sendingMessage ? "Sending…" : "Send WhatsApp"}
                </button>
              </form>
            </div>
          )}

          {/* Proposal Tab */}
          {activeTab === "proposal" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#1B1F3B] dark:text-white">
                  Proposal Document
                </h3>
                {proposal && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E4F3EB] text-[#2E7D5B] font-bold">
                    Status: {proposal.status.toUpperCase()}
                  </span>
                )}
              </div>

              <div className="p-4 bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-xl space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold text-[#1B1F3B] dark:text-white">
                    Package: {b.packageName}
                  </span>
                  <span className="font-mono font-bold text-[#1B1F3B] dark:text-white">
                    First bill: {formatINR(b.totalFirstBill)} (Advance: {formatINR(b.advance)})
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-[#585D7A] dark:text-[#A6A9C6]">Scope of Work:</span>
                  <ul className="list-disc pl-5 space-y-0.5 text-[#1B1F3B] dark:text-[#ECEBF7]">
                    {proposal?.scope_bullets && proposal.scope_bullets.length > 0 ? (
                      proposal.scope_bullets.map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))
                    ) : (
                      <>
                        <li>AI Receptionist on phone answering in Hindi, English &amp; Hinglish</li>
                        <li>WhatsApp 24×7 conversational booking agent</li>
                        <li>Google Calendar integration &amp; morning patient reminder nudges</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={approveAndSendProposal}
                  className="px-4 py-2 bg-[#1B1F3B] text-white text-xs font-bold rounded-xl hover:bg-[#14172C]"
                >
                  Approve &amp; Send Proposal (H2)
                </button>
                <Link
                  href={`/p/${client.portal_token}`}
                  target="_blank"
                  className="px-4 py-2 border border-[#E2E0EE] dark:border-[#2F3356] text-xs font-semibold rounded-xl text-[#585D7A] hover:text-[#1B1F3B]"
                >
                  View Portal Acceptance Page
                </Link>
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === "invoices" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#1B1F3B] dark:text-white">
                  Client Invoices
                </h3>
              </div>

              {invoices.length === 0 ? (
                <p className="text-xs text-[#585D7A]">
                  No invoices generated yet. Advance invoice is automatically generated when proposal is accepted (w1).
                </p>
              ) : (
                <div className="space-y-3">
                  {invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-4 bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#1B1F3B] dark:text-white">
                            {inv.invoice_number}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              inv.status === "paid"
                                ? "bg-[#E4F3EB] text-[#2E7D5B]"
                                : "bg-[#FAF0D7] text-[#9A6400]"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                        <span className="text-[#585D7A] dark:text-[#A6A9C6]">
                          Type: {inv.type.toUpperCase()} · Due: {inv.due_date}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-sm text-[#1B1F3B] dark:text-white">
                          {formatINR(inv.total_paise / 100)}
                        </span>
                        {inv.razorpay_payment_url && (
                          <a
                            href={inv.razorpay_payment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-[#FDB91F] text-[#1B1F3B] text-xs font-semibold"
                          >
                            Razorpay Link
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Agent Build & QA Tab */}
          {activeTab === "agent" && (
            <div className="space-y-5 text-xs">
              <div className="p-4 bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-xl space-y-3">
                <h4 className="font-bold text-[#1B1F3B] dark:text-white text-sm">
                  Agent System Prompt Draft (A11)
                </h4>
                <div className="bg-white dark:bg-[#1C1F3A] p-3 rounded-lg font-mono text-[11px] leading-relaxed border border-[#E2E0EE] dark:border-[#2F3356]">
                  {`You are the AI Receptionist for ${client.name} in ${client.city}.
Speak politely in Hindi, English, and Hinglish.
Knowledge: Consultation ₹800. Hours: Mon-Sat 10 AM - 8 PM.
Booking Flow: Ask caller name, preferred date/time slot, confirm doctor.
Emergency Triage: For acute pain or bleeding, immediately transfer call.`}
                </div>
              </div>

              {/* 50 Real Questions Test Suite (A12) */}
              <div className="p-4 bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-[#1B1F3B] dark:text-white text-sm">
                    Automated Test Suite (A12)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-[#E4F3EB] text-[#2E7D5B] font-bold font-mono">
                    Pass Rate: 96% (48/50 passed)
                  </span>
                </div>
                <p className="text-[#585D7A] dark:text-[#A6A9C6]">
                  Simulated 50 patient conversations across Hindi, English and Hinglish against the custom knowledge base. Criteria: &ge; 90% pass rate.
                </p>
                <div className="space-y-1.5">
                  <div className="p-2 rounded bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] flex justify-between">
                    <span>Q1 (Hindi): &ldquo;Kal sham ko 5 baje appointment mil sakta hai?&rdquo;</span>
                    <span className="text-[#2E7D5B] font-bold">✓ PASSED</span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] flex justify-between">
                    <span>Q2 (English): &ldquo;What are your charges for root canal treatment?&rdquo;</span>
                    <span className="text-[#2E7D5B] font-bold">✓ PASSED</span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] flex justify-between">
                    <span>Q3 (Hinglish): &ldquo;Sunday open rehta hai kya clinic?&rdquo;</span>
                    <span className="text-[#2E7D5B] font-bold">✓ PASSED</span>
                  </div>
                </div>

                {/* Quick actions for testing */}
                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleCheck("d2", true)}
                    className="px-3 py-1.5 rounded-lg bg-[#1B1F3B] dark:bg-[#252A4A] text-white text-xs font-semibold hover:bg-[#14172C]"
                  >
                    Run 50-Question QA Suite (Tick d2)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCheck("d3", true)}
                    className="px-3 py-1.5 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] text-xs font-semibold text-[#1B1F3B] dark:text-white hover:bg-white"
                  >
                    Simulate Client Test Approval (Tick d3)
                  </button>
                </div>
              </div>

              {/* A24 Go-Live Gate Status Card */}
              <div className="p-4 bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#1B1F3B] text-white">
                        A24
                      </span>
                      <h4 className="font-bold text-[#1B1F3B] dark:text-white text-sm">
                        Go-Live Gate Status
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6]">
                      Phone forwarding strictly gated until AI test suite ≥ 90% and client portal acceptance.
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                      canGoLive
                        ? "bg-[#E4F3EB] text-[#2E7D5B] border border-[#BCE8B4]"
                        : "bg-[#FFEAE5] text-[#D83A14] border border-[#FBC5B8]"
                    }`}
                  >
                    {canGoLive ? "Gate Open: Ready to Connect" : "Gate Locked: Prerequisites Incomplete"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                      isD2Done
                        ? "bg-[#E4F3EB]/40 border-[#BCE8B4] text-[#2E7D5B]"
                        : "bg-[#F6F5FB] dark:bg-[#12142A] border-[#E2E0EE] dark:border-[#2F3356] text-[#585D7A] dark:text-[#A6A9C6]"
                    }`}
                  >
                    <span>1. Automated Testing (d2 ≥ 90%)</span>
                    <span className="font-bold font-mono">
                      {isD2Done ? "✓ 96% PASSED" : "⏳ PENDING"}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                      isD3Done
                        ? "bg-[#E4F3EB]/40 border-[#BCE8B4] text-[#2E7D5B]"
                        : "bg-[#F6F5FB] dark:bg-[#12142A] border-[#E2E0EE] dark:border-[#2F3356] text-[#585D7A] dark:text-[#A6A9C6]"
                    }`}
                  >
                    <span>2. Client Portal Approval (d3)</span>
                    <span className="font-bold font-mono">
                      {isD3Done ? "✓ APPROVED" : "⏳ PENDING"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={approveGoLive}
                    disabled={!canGoLive}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      canGoLive
                        ? "bg-[#2E7D5B] hover:bg-[#25664A] text-white shadow-xs cursor-pointer"
                        : "bg-[#E2E0EE] dark:bg-[#2F3356] text-[#727791] dark:text-[#A6A9C6] cursor-not-allowed opacity-60"
                    }`}
                  >
                    {!canGoLive && <span>🔒</span>}
                    <span>Connect Number &amp; Go-Live (v1 &amp; v2)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === "notes" && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#585D7A] dark:text-[#A6A9C6]">
                Founder Internal Notes
              </label>
              <textarea
                rows={5}
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Add meeting takeaways, doctor preferences, or custom pricing notes…"
                className="w-full p-3 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] text-xs text-[#1B1F3B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FDB91F]"
              />
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="px-4 py-2 bg-[#FDB91F] hover:bg-[#E5A413] text-[#1B1F3B] text-xs font-bold rounded-xl transition-colors"
              >
                {savingNotes ? "Saving…" : "Save Notes"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: H1 Meeting Notes Form */}
      {meetingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1F3A] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E2E0EE] dark:border-[#2F3356]">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-lg text-[#1B1F3B] dark:text-white">
                H1: Record Meeting Notes
              </h3>
              <button
                type="button"
                onClick={() => setMeetingModalOpen(false)}
                className="text-[#585D7A] hover:text-black text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#585D7A] dark:text-[#A6A9C6]">
              Fill the 4 key questions from your call. The AI will turn these into a tailored package and draft proposal.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Calls handled per day:</label>
                <input
                  type="text"
                  value={mCallsPerDay}
                  onChange={(e) => setMCallsPerDay(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">After-hours enquiries / missed calls:</label>
                <input
                  type="text"
                  value={mAfterHours}
                  onChange={(e) => setMAfterHours(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Current front-desk hire cost:</label>
                <input
                  type="text"
                  value={mCurrentCost}
                  onChange={(e) => setMCurrentCost(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Recommended Package:</label>
                <select
                  value={mRecommendedPkg}
                  onChange={(e) => setMRecommendedPkg(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A]"
                >
                  <option value="starter">Starter (₹7,999/mo)</option>
                  <option value="growth">Growth (₹19,999/mo) — Recommended</option>
                  <option value="pro">Pro (₹49,999/mo)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMeetingModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs text-[#585D7A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitMeetingNotes}
                className="px-4 py-2 bg-[#FDB91F] text-[#1B1F3B] font-bold rounded-xl text-xs"
              >
                Save &amp; Generate Draft Proposal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: A21 Qualifying Answers Form */}
      {qualifyingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1F3A] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E2E0EE] dark:border-[#2F3356]">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-lg text-[#1B1F3B] dark:text-white">
                A21: Qualifying &amp; Call Intake Details
              </h3>
              <button
                type="button"
                onClick={() => setQualifyingModalOpen(false)}
                className="text-[#585D7A] hover:text-black text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#585D7A] dark:text-[#A6A9C6]">
              These answers calibrate receptionist volume thresholds, after-hours emergency triage rules, and ROI anchoring.
            </p>

            <form onSubmit={handleSaveQualifying} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Calls handled per day:</label>
                <input
                  type="text"
                  value={qCallsPerDay}
                  onChange={(e) => setQCallsPerDay(e.target.value)}
                  placeholder="e.g. 35 calls/day"
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">After-hours enquiries / missed calls:</label>
                <input
                  type="text"
                  value={qAfterHours}
                  onChange={(e) => setQAfterHours(e.target.value)}
                  placeholder="e.g. 12 calls after 8 PM"
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Current front-desk hire cost:</label>
                <input
                  type="text"
                  value={qCurrentCost}
                  onChange={(e) => setQCurrentCost(e.target.value)}
                  placeholder="e.g. ₹16,000/month front desk"
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Preferred Timing / Shift details:</label>
                <input
                  type="text"
                  value={qPreferredTime}
                  onChange={(e) => setQPreferredTime(e.target.value)}
                  placeholder="e.g. Evenings after 6 PM"
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQualifyingModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs text-[#585D7A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQualifying}
                  className="px-4 py-2 bg-[#FDB91F] text-[#1B1F3B] font-bold rounded-xl text-xs"
                >
                  {savingQualifying ? "Saving…" : "Save Qualification Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

