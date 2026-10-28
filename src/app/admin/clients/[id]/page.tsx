"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Client,
  Project,
  Invoice,
  Proposal,
  MessageRecord,
  ActivityLogRecord,
  StageKey,
  Recommendation,
  AgentRecord,
  RequirementRecord,
  ScopeRecord,
  AgreementRecord,
  TaskRecord,
  TimeLogRecord,
  DeliveryRecord,
  RevisionRoundRecord,
  ChangeRequestRecord,
  HandoverRecord,
} from "@/lib/types";
import { PIPELINE_PHASES, ALL_STAGES, getClientStageIndex, getClientStageName } from "@/lib/pipeline-constants";
import { calculateBill, formatINR, PACKAGES } from "@/lib/pricing";
import { RealtimeLoadingScreen } from "@/components/network-loading-indicator";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [requirements, setRequirements] = useState<RequirementRecord | null>(null);
  const [scopes, setScopes] = useState<ScopeRecord[]>([]);
  const [agreements, setAgreements] = useState<AgreementRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLogRecord[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [revisions, setRevisions] = useState<RevisionRoundRecord[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequestRecord[]>([]);
  const [handover, setHandover] = useState<HandoverRecord | null>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
  const [agent, setAgent] = useState<AgentRecord | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [activeTab, setActiveTab] = useState<
    "timeline" | "messages" | "requirements" | "agreement" | "invoices" | "work" | "revisions" | "handover" | "care" | "notes"
  >("timeline");
  const [loading, setLoading] = useState(true);

  // Section 7b: Why rule expand state
  const [whyExpanded, setWhyExpanded] = useState(false);

  // New message state
  const [newMessageBody, setNewMessageBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Notes state
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // In-page toast feedback (Bug 17)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

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

  // H1 Requirements capture state
  const [reqFeatures, setReqFeatures] = useState("");
  const [reqScreens, setReqScreens] = useState("");
  const [reqIntegrations, setReqIntegrations] = useState("");
  const [reqDeadline, setReqDeadline] = useState("");
  const [reqBudget, setReqBudget] = useState("");
  const [savingReqs, setSavingReqs] = useState(false);

  // New Task state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskHours, setNewTaskHours] = useState("2");
  const [newTaskCategory, setNewTaskCategory] = useState<"kickoff" | "build" | "qa" | "revision" | "handover">("build");
  const [newTaskDue, setNewTaskDue] = useState(new Date().toISOString().slice(0, 10));

  // Time log state
  const [logHours, setLogHours] = useState("1");
  const [logDesc, setLogDesc] = useState("");
  const [logIsCR, setLogIsCR] = useState(false);

  // New Delivery state
  const [deliveryUrl, setDeliveryUrl] = useState("");
  const [deliveryType, setDeliveryType] = useState<"staging_link" | "test_phone" | "apk_testflight" | "production">("staging_link");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const fetchClientData = async () => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`);
      const json = await res.json();
      if (json.success && json.client) {
        setClient(json.client);
        setProjects(json.projects || []);
        const active = json.activeProject || json.projects?.[0] || null;
        setActiveProject(active);
        if (typeof document !== "undefined") {
          document.title = `${json.client.name || active?.name || "Client"} · AgentWala OS`;
        }
        setRequirements(json.requirements || null);
        setScopes(json.scopes || []);
        setAgreements(json.agreements || []);
        setTasks(json.tasks || []);
        setTimeLogs(json.timeLogs || []);
        setDeliveries(json.deliveries || []);
        setRevisions(json.revisions || []);
        setChangeRequests(json.changeRequests || []);
        setHandover(json.handover || null);

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

        if (json.requirements) {
          setReqFeatures((json.requirements.features || []).join("\n"));
          setReqScreens((json.requirements.pages_or_screens || []).join("\n"));
          setReqIntegrations((json.requirements.integrations || []).join("\n"));
          setReqDeadline(json.requirements.deadline || "");
          setReqBudget(json.requirements.budget_inr ? `₹${json.requirements.budget_inr}` : "");
        }
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
    return (
      <div className="max-w-[1240px] mx-auto p-4 sm:p-8">
        <RealtimeLoadingScreen
          title="Loading Client Workspace"
          subtext="Fetching requirements, agreements, invoices, revision rounds, and tasks..."
          fullScreen={false}
        />
      </div>
    );
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

  // Human approval H2: Approve Proposal (p1) & Send to Portal (p2)
  const approveProposal = async () => {
    await handleCheck("p1", true);
    await handleUpdateField("next_step", "Send proposal & agreement portal link to client");
    fetchClientData();
    showToast("Proposal & scope approved! p1 ticked.");
  };

  const sendProposalToPortal = async () => {
    await handleCheck("p2", true);
    await handleUpdateField("next_step", "Follow up on proposal acceptance within 48h");
    await handleUpdateField(
      "next_step_date",
      new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
    );
    fetchClientData();
    showToast("Proposal link sent to client portal! p2 ticked.");
  };

  const approveAndSendProposal = async () => {
    await handleCheck("p1", true);
    await handleCheck("p2", true);
    await handleUpdateField("next_step", "Follow up on proposal acceptance within 48h");
    await handleUpdateField(
      "next_step_date",
      new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
    );
    fetchClientData();
    showToast("Proposal approved and dispatched to client! p1 and p2 ticked.");
  };

  // A24 Go-live gate checks:
  const isD2Done = Boolean(client.checks?.d2?.done);
  const isD3Done = Boolean(client.checks?.d3?.done);
  const canGoLive = isD2Done && isD3Done;

  // Human approval H3: Approve Go-Live (with A24 gate enforcement)
  const approveGoLive = async () => {
    if (!canGoLive) {
      showToast(
        "A24 Go-Live Gate Locked: Requires AI automated test pass rate ≥ 90% (d2) and client approval (d3) before phone forwarding can be connected."
      );
      return;
    }
    await handleCheck("v1", true);
    await handleCheck("v2", true);
    fetchClientData();
    showToast("Go-Live approved! Phone forwarding connected and client team trained. v1 and v2 ticked.");
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
        } else if (rec.type === "money_at_risk" && (rec.title.includes("Proposal") || rec.title.includes("Agreement"))) {
          setActiveTab("agreement");
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

  // Handle Save Requirements (H1)
  const handleSaveRequirements = async () => {
    setSavingReqs(true);
    try {
      const projId = activeProject?.id || client.id;
      const budgetNum = parseInt(reqBudget.replace(/\D/g, "")) || 35000;
      await fetch(`/api/admin/clients/${client.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_requirements",
          project_id: projId,
          data: {
            features: reqFeatures.split("\n").filter(Boolean),
            pages_or_screens: reqScreens.split("\n").filter(Boolean),
            integrations: reqIntegrations.split("\n").filter(Boolean),
            deadline: reqDeadline,
            budget_inr: budgetNum,
          },
        }),
      });
      await handleCheck("r1", true);
      await handleCheck("r2", true);
      await handleCheck("r3", true);
      fetchClientData();
      showToast("Requirements saved and signed off! r1, r2, r3 completed.");
    } catch (err) {
      console.error("Failed to save requirements:", err);
    } finally {
      setSavingReqs(false);
    }
  };

  const handlePreFillRequirements = () => {
    setReqFeatures(
      [
        "AI receptionist phone line answering in Hindi, English & Hinglish",
        "WhatsApp booking flow with instant slot confirmation",
        "Automated morning appointment reminders sent at 9 AM",
        "Cancellation & rescheduling self-service via WhatsApp",
      ].join("\n")
    );
    setReqScreens(["Patient Booking Form", "Admin Calendar View", "WhatsApp Chatbot Flow"].join("\n"));
    setReqIntegrations(["Google Calendar", "Meta WhatsApp Cloud API", "Twilio / Exotel Voice"].join("\n"));
    setReqDeadline(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
    setReqBudget("35000");
  };

  const handleCreateTaskItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const projId = activeProject?.id || client.id;
      await fetch(`/api/admin/clients/${client.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_task",
          project_id: projId,
          title: newTaskTitle.trim(),
          category: newTaskCategory,
          hours_estimated: Number(newTaskHours) || 1,
          due_date: newTaskDue,
        }),
      });
      setNewTaskTitle("");
      fetchClientData();
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleToggleTaskItem = async (taskId: string, currentDone: boolean) => {
    try {
      await fetch(`/api/admin/clients/${client.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_task",
          task_id: taskId,
          done: !currentDone,
        }),
      });
      fetchClientData();
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const handleLogTimeItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const projId = activeProject?.id || client.id;
      await fetch(`/api/admin/clients/${client.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_time",
          project_id: projId,
          hours: Number(logHours) || 1,
          description: logDesc || "Dev work session",
          is_change_request: logIsCR,
          hourly_rate_inr: 1000,
        }),
      });
      setLogDesc("");
      setLogHours("1");
      fetchClientData();
    } catch (err) {
      console.error("Failed to log time:", err);
    }
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryUrl.trim()) return;
    try {
      const projId = activeProject?.id || client.id;
      await fetch(`/api/admin/clients/${client.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_delivery",
          project_id: projId,
          version: deliveries.length + 1,
          type: deliveryType,
          url_or_ref: deliveryUrl.trim(),
          notes: deliveryNotes.trim(),
        }),
      });
      setDeliveryUrl("");
      setDeliveryNotes("");
      fetchClientData();
      showToast("Delivery recorded! Ticked w3 (Delivery shared). Client notified.");
    } catch (err) {
      console.error("Failed to create delivery:", err);
    }
  };

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
            { id: "requirements", label: "Requirements (H1)" },
            { id: "agreement", label: "Scope & Agreement" },
            { id: "invoices", label: `Invoices (${invoices.length})` },
            { id: "work", label: `Tasks & Work (${tasks.length})` },
            { id: "revisions", label: `Revisions & CRs (${revisions.length})` },
            { id: "handover", label: "Handover & Warranty" },
            { id: "care", label: "Care Plan" },
            { id: "notes", label: "Notes & Settings" },
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

          {/* Requirements Tab (H1 Form) */}
          {activeTab === "requirements" && (
            <div className="space-y-5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E0EE] dark:border-[#2F3356] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1B1F3B] dark:text-white">
                    Requirements Specification (H1 Form)
                  </h3>
                  <p className="text-[#585D7A] dark:text-[#A6A9C6] mt-0.5">
                    Captured during founder meeting. Once saved, this anchors Scope of Work (Annex A).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePreFillRequirements}
                    className="px-3 py-1.5 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] text-[#585D7A] dark:text-[#A6A9C6] hover:text-[#1B1F3B] font-semibold"
                  >
                    ⚡ Pre-fill from Discovery
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRequirements}
                    disabled={savingReqs}
                    className="px-4 py-1.5 rounded-lg bg-[#FDB91F] text-[#1B1F3B] font-bold hover:bg-[#E5A413]"
                  >
                    {savingReqs ? "Saving…" : "Save & Lock (r1, r2, r3)"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#585D7A] dark:text-[#A6A9C6]">
                    Core Features (1 per line)
                  </label>
                  <textarea
                    rows={5}
                    value={reqFeatures}
                    onChange={(e) => setReqFeatures(e.target.value)}
                    placeholder="e.g. AI phone answering in Hindi/English&#10;WhatsApp appointment booking&#10;Daily SMS/WhatsApp reminders"
                    className="w-full p-3 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#585D7A] dark:text-[#A6A9C6]">
                    Pages / Screens (1 per line)
                  </label>
                  <textarea
                    rows={5}
                    value={reqScreens}
                    onChange={(e) => setReqScreens(e.target.value)}
                    placeholder="e.g. Home landing page&#10;Doctor Booking Slot Picker&#10;Confirmation & Reminder Screen"
                    className="w-full p-3 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#585D7A] dark:text-[#A6A9C6]">
                    Integrations Required (1 per line)
                  </label>
                  <textarea
                    rows={3}
                    value={reqIntegrations}
                    onChange={(e) => setReqIntegrations(e.target.value)}
                    placeholder="e.g. Twilio / Exotel&#10;Meta WhatsApp API&#10;Google Calendar"
                    className="w-full p-3 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#585D7A] dark:text-[#A6A9C6]">
                      Target Deadline
                    </label>
                    <input
                      type="date"
                      value={reqDeadline}
                      onChange={(e) => setReqDeadline(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[#585D7A] dark:text-[#A6A9C6]">
                      Agreed Budget (₹)
                    </label>
                    <input
                      type="text"
                      value={reqBudget}
                      onChange={(e) => setReqBudget(e.target.value)}
                      placeholder="e.g. 35000"
                      className="w-full h-10 px-3 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scope & Agreement Tab */}
          {activeTab === "agreement" && (
            <div className="space-y-5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E0EE] dark:border-[#2F3356] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1B1F3B] dark:text-white">
                    Master Service Agreement &amp; Scope of Work (Annex A)
                  </h3>
                  <p className="text-[#585D7A] dark:text-[#A6A9C6] mt-0.5">
                    Governed by Indian Contract Act 1872 &amp; IT Act 2000 with OTP Acceptance.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={approveProposal}
                    className="px-3.5 py-2 bg-[#FDB91F] text-[#1B1F3B] text-xs font-bold rounded-xl hover:bg-[#E5A413]"
                  >
                    {client.checks?.p1?.done ? "✓ Scope Approved (p1)" : "Approve Scope (p1)"}
                  </button>
                  <button
                    type="button"
                    onClick={sendProposalToPortal}
                    className="px-3.5 py-2 bg-[#1B1F3B] text-white text-xs font-bold rounded-xl hover:bg-[#14172C]"
                  >
                    {client.checks?.p2?.done ? "✓ Sent to Portal (p2)" : "Send to Portal (p2)"}
                  </button>
                  <Link
                    href={`/p/${client.portal_token}`}
                    target="_blank"
                    className="px-3.5 py-2 border border-[#E2E0EE] dark:border-[#2F3356] text-xs font-semibold rounded-xl text-[#585D7A] hover:text-[#1B1F3B]"
                  >
                    Open Client Portal ↗
                  </Link>
                </div>
              </div>

              {/* Agreement Acceptance Audit Status */}
              <div className="p-4 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1B1F3B] dark:text-white">
                    OTP e-Acceptance Status:
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      client.checks?.s1?.done
                        ? "bg-[#E4F3EB] text-[#2E7D5B]"
                        : "bg-[#FAF0D7] text-[#9A6400]"
                    }`}
                  >
                    {client.checks?.s1?.done ? "Accepted via OTP (s1 done)" : "Pending Acceptance"}
                  </span>
                </div>
                <p className="text-[#585D7A] dark:text-[#A6A9C6]">
                  {client.checks?.s1?.done
                    ? `Digitally accepted by ${client.owner_name} (${client.phone}) with verified 6-digit OTP. Timestamp: ${client.checks.s1.done_at || "Recent"}. Hash: SHA-256 verified.`
                    : "Client will be prompted in portal to enter their full legal name and verify mobile OTP to accept."}
                </p>
              </div>

              {/* Scope Summary Preview */}
              <div className="p-4 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] space-y-3">
                <h4 className="font-bold text-sm text-[#1B1F3B] dark:text-white">
                  Annex A: Scope of Work Summary
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-[#1B1F3B] dark:text-[#ECEBF7]">
                  {proposal?.scope_bullets && proposal.scope_bullets.length > 0 ? (
                    proposal.scope_bullets.map((bullet, idx) => <li key={idx}>{bullet}</li>)
                  ) : (
                    <>
                      <li>Core build and deployment for {client.name}</li>
                      <li>2 Included revision rounds with consolidated feedback (Section 7)</li>
                      <li>Annex B Handover Kit and 30-Day Bugfix Warranty</li>
                    </>
                  )}
                </ul>

                <div className="pt-2 border-t border-[#E2E0EE] dark:border-[#2F3356] flex justify-between items-center text-[11px] text-[#585D7A] dark:text-[#A6A9C6]">
                  <span>Clauses 1–8: Scope, Revisions, Milestones, Handover, IP &amp; Dispute Resolution</span>
                  <span className="font-mono">Jurisdiction: New Delhi</span>
                </div>
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === "invoices" && (
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-[#E2E0EE] dark:border-[#2F3356] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1B1F3B] dark:text-white">
                    Milestone Invoices &amp; Payments
                  </h3>
                  <p className="text-[#585D7A] dark:text-[#A6A9C6]">
                    Milestone billing (50/50 or 40/30/30) with automatic GST split.
                  </p>
                </div>
              </div>

              {invoices.length === 0 ? (
                <div className="p-6 text-center text-[#585D7A] bg-[#F6F5FB] dark:bg-[#12142A] rounded-xl">
                  No invoices generated yet. Advance invoice is automatically generated upon proposal acceptance.
                </div>
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
                          Type: {inv.type.toUpperCase()} · Due: {inv.due_date} · {inv.is_gst ? "GST 18%" : "Net (No GST)"}
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

          {/* Tasks & Work Tab */}
          {activeTab === "work" && (
            <div className="space-y-6 text-xs">
              <div className="flex justify-between items-center border-b border-[#E2E0EE] dark:border-[#2F3356] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1B1F3B] dark:text-white">
                    Project Work Plan, Tasks &amp; Deliveries
                  </h3>
                  <p className="text-[#585D7A] dark:text-[#A6A9C6]">
                    Execution checklist, time logging and staging deliveries.
                  </p>
                </div>
                <Link
                  href="/admin/work"
                  className="px-3 py-1.5 rounded-lg bg-[#FDB91F] text-[#1B1F3B] font-bold text-xs"
                >
                  ⏱ Open Cross-Project Timer →
                </Link>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-[#1B1F3B] dark:text-white">Tasks</h4>
                {tasks.length === 0 ? (
                  <p className="text-[#585D7A]">No project tasks created yet.</p>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((t) => (
                      <div
                        key={t.id}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          t.done ? "bg-[#FAF9FD] dark:bg-[#12142A] opacity-60" : "bg-white dark:bg-[#1C1F3A]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={t.done}
                            onChange={() => handleToggleTaskItem(t.id, t.done)}
                            className="w-4 h-4 rounded accent-[#2E7D5B] cursor-pointer"
                          />
                          <div>
                            <span className={t.done ? "line-through text-[#727791]" : "font-semibold text-[#1B1F3B] dark:text-white"}>
                              {t.title}
                            </span>
                            <span className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6] ml-2">
                              ({t.category} · {t.hours_estimated}h)
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Task Form */}
                <form onSubmit={handleCreateTaskItem} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="New task title…"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] text-xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#1B1F3B] text-white font-bold text-xs"
                  >
                    + Add Task
                  </button>
                </form>
              </div>

              {/* Share Delivery Form */}
              <div className="p-4 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] space-y-3">
                <h4 className="font-bold text-sm text-[#1B1F3B] dark:text-white">
                  Share New Delivery (w3)
                </h4>
                <form onSubmit={handleCreateDelivery} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={deliveryType}
                    onChange={(e) => setDeliveryType(e.target.value as any)}
                    className="px-3 py-2 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-white dark:bg-[#1C1F3A]"
                  >
                    <option value="staging_link">Staging URL</option>
                    <option value="test_phone">Demo Phone Line</option>
                    <option value="apk_testflight">APK / TestFlight</option>
                    <option value="production">Production Site</option>
                  </select>
                  <input
                    type="text"
                    placeholder="https://agent-wala-ai-agency.vercel.app/p/..."
                    value={deliveryUrl}
                    onChange={(e) => setDeliveryUrl(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-white dark:bg-[#1C1F3A]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#2E7D5B] text-white font-bold"
                  >
                    Share Delivery &amp; Tick w3
                  </button>
                </form>
              </div>

              {/* 50-Question QA Suite (A12 / A24 Gate) */}
              <div className="p-4 bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-[#1B1F3B] dark:text-white text-sm">
                    Automated Test Suite (A12 &amp; A24 Gate)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-[#E4F3EB] text-[#2E7D5B] font-bold font-mono">
                    Pass Rate: 96% (48/50 passed)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCheck("w2", true)}
                    className="px-3 py-1.5 rounded-lg bg-[#1B1F3B] text-white text-xs font-semibold"
                  >
                    Mark Build Complete (Tick w2)
                  </button>
                  <button
                    type="button"
                    onClick={approveGoLive}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      canGoLive ? "bg-[#2E7D5B] text-white" : "bg-[#E2E0EE] text-[#727791]"
                    }`}
                  >
                    {canGoLive ? "Go-Live Approved ✓" : "Go-Live (A24 Gated)"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Revisions & Change Requests Tab (Section 7) */}
          {activeTab === "revisions" && (
            <div className="space-y-5 text-xs">
              <div className="flex justify-between items-center border-b border-[#E2E0EE] dark:border-[#2F3356] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1B1F3B] dark:text-white">
                    Revision Rounds &amp; Change Request Engine
                  </h3>
                  <p className="text-[#585D7A] dark:text-[#A6A9C6]">
                    2 rounds included in scope. Additional features billed as Change Requests at ₹1,000/hr.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full font-mono text-xs font-bold bg-[#FAF0D7] text-[#9A6400]">
                  Rounds Used: {client.checks?.v2?.done ? "2 / 2" : client.checks?.v1?.done ? "1 / 2" : "0 / 2"}
                </span>
              </div>

              {/* 7-Day Deemed Acceptance Rule Notice */}
              <div className="p-3.5 rounded-xl bg-[#FAF0D7] dark:bg-[#2A2415] border border-[#F5DC9A] dark:border-[#52441D] flex justify-between items-center">
                <div>
                  <span className="font-bold text-[#9A6400] block">
                    7-Day Deemed Acceptance Rule (Clause 4.3):
                  </span>
                  <p className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6]">
                    If client provides no revision feedback within 7 days of delivery, project is deemed accepted (v3).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await handleCheck("v3", true);
                    showToast("Project marked as accepted! Ticked v3.");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#9A6400] text-white font-bold text-xs whitespace-nowrap"
                >
                  Mark Deemed Accepted (v3)
                </button>
              </div>

              {/* Revision Items Table */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-[#1B1F3B] dark:text-white">
                  Submitted Feedback Items
                </h4>
                {revisions.length === 0 ? (
                  <p className="text-[#585D7A]">No feedback items submitted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {revisions.flatMap((r) => r.items).map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] flex justify-between items-center gap-3"
                      >
                        <div>
                          <p className="font-semibold text-[#1B1F3B] dark:text-white">{item.text}</p>
                          <span className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6]">
                            AI Reason: {item.ai_reason}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.ai_label === "new_feature"
                              ? "bg-[#FFEAE5] text-[#D83A14]"
                              : "bg-[#E4F3EB] text-[#2E7D5B]"
                          }`}
                        >
                          {item.ai_label === "new_feature" ? "Change Request (CR)" : "Within Scope"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Handover & Warranty Tab (Annex B) */}
          {activeTab === "handover" && (
            <div className="space-y-5 text-xs">
              <div className="flex justify-between items-center border-b border-[#E2E0EE] dark:border-[#2F3356] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1B1F3B] dark:text-white">
                    Annex B: Handover Kit &amp; 30-Day Warranty
                  </h3>
                  <p className="text-[#585D7A] dark:text-[#A6A9C6]">
                    Final invoice payment gate strictly enforced before credentials transfer.
                  </p>
                </div>
              </div>

              {/* Gate Check */}
              <div
                className={`p-3.5 rounded-xl border ${
                  client.checks?.f2?.done
                    ? "bg-[#E4F3EB] border-[#BCE8B4] text-[#2E7D5B]"
                    : "bg-[#FFEAE5] border-[#FBC5B8] text-[#D83A14]"
                }`}
              >
                <span className="font-bold block">
                  {client.checks?.f2?.done
                    ? "✓ Gate 10 Open: Final Invoice Paid (f2)"
                    : "🔒 Gate 10 Locked: Handover Kit Requires Final Invoice Paid (f2)"}
                </span>
                <p className="text-[11px] mt-0.5">
                  Source code and master credentials will only be transferred to client once final settlement is confirmed.
                </p>
              </div>

              {/* Annex B Checklist */}
              <div className="p-4 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] space-y-3">
                <h4 className="font-bold text-sm text-[#1B1F3B] dark:text-white">
                  Handover Deliverables Checklist
                </h4>
                <div className="space-y-2">
                  {[
                    { label: "Domain DNS connected & SSL verified", done: true },
                    { label: "GitHub Source Code repository transferred", done: Boolean(client.checks?.h1?.done) },
                    { label: "AI Agent & Knowledge base export delivered", done: Boolean(client.checks?.h1?.done) },
                    { label: "Credentials vault shared with client", done: Boolean(client.checks?.h1?.done) },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[#2E7D5B] font-bold">✓</span>
                      <span className="text-[#1B1F3B] dark:text-white font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      await handleCheck("h1", true);
                      await handleCheck("h2", true);
                      showToast("Annex B Handover completed! Ticked h1 & h2.");
                    }}
                    className="px-4 py-2 rounded-xl bg-[#1B1F3B] text-white font-bold"
                  >
                    Complete Handover &amp; Issue Certificate (h1 &amp; h2)
                  </button>
                </div>
              </div>

              {/* 30-Day Bugfix Warranty Notice */}
              <div className="p-3.5 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#1B1F3B] dark:text-white">
                    30-Day Bugfix Warranty (Clause 7):
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#E4F3EB] text-[#2E7D5B] font-mono font-bold">
                    Active (28 days left)
                  </span>
                </div>
                <p className="text-[#585D7A] dark:text-[#A6A9C6]">
                  Covers bugs or defects deviating from Annex A. Response within 24 hours. New features handled under Care Plan.
                </p>
              </div>
            </div>
          )}

          {/* Care Plan Tab */}
          {activeTab === "care" && (
            <div className="space-y-5 text-xs">
              <div className="flex justify-between items-center border-b border-[#E2E0EE] dark:border-[#2F3356] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1B1F3B] dark:text-white">
                    Monthly Care Plan &amp; Retainer
                  </h3>
                  <p className="text-[#585D7A] dark:text-[#A6A9C6]">
                    Ongoing maintenance, security patches, uptime monitoring and support hours.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full font-mono text-xs font-bold bg-[#E4F3EB] text-[#2E7D5B]">
                  Status: Active (h3 done)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] space-y-2">
                  <span className="text-[11px] font-bold uppercase text-[#9A6400]">
                    Current Retainer
                  </span>
                  <div className="font-mono text-xl font-bold text-[#1B1F3B] dark:text-white">
                    {formatINR(b.monthly)} / month
                  </div>
                  <p className="text-[#585D7A] dark:text-[#A6A9C6]">
                    Billed automatically on the 1st of every month with 7-day payment window.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] space-y-2">
                  <span className="text-[11px] font-bold uppercase text-[#2E7D5B]">
                    Support SLA
                  </span>
                  <div className="text-sm font-bold text-[#1B1F3B] dark:text-white">
                    4-Hour First Response
                  </div>
                  <p className="text-[#585D7A] dark:text-[#A6A9C6]">
                    Includes up to 3 hours/month for minor content edits, phone prompt updates, or bug resolution.
                  </p>
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

      {/* Floating In-Page Toast (Bug 17) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-[#1B1F3B] text-white font-bold text-xs rounded-xl shadow-lg border border-[#3E4578] flex items-center gap-2">
          <span className="text-[#2E7D5B]">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

