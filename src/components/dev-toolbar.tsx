"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatRupees, formatDateTimeIST } from "@/lib/formatters";

interface OutboxItem {
  id: string;
  channel: "whatsapp" | "email" | "otp";
  recipient: string;
  template_name: string;
  subject?: string;
  content: string;
  project_id?: string;
  project_name?: string;
  client_id?: string;
  client_name?: string;
  status: "sent" | "failed";
  error?: string;
  created_at: string;
}

interface ProjectOption {
  id: string;
  client_id: string;
  name: string;
  client_name?: string;
}

interface InvoiceOption {
  id: string;
  invoice_number: string;
  project_id?: string;
  client_id: string;
  type: string;
  total_paise: number;
  status: string;
}

export function DevToolbar() {
  // Only render in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"outbox" | "jobs" | "clock" | "webhooks" | "integrations" | "reset">("outbox");

  // Clock state
  const [currentIST, setCurrentIST] = useState<string>("Loading clock...");
  const [customDateTime, setCustomDateTime] = useState<string>("");
  const [clockOffset, setClockOffset] = useState<number>(0);

  // Outbox state
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [outboxFilterProject, setOutboxFilterProject] = useState<string>("all");
  const [selectedOutboxItem, setSelectedOutboxItem] = useState<OutboxItem | null>(null);

  // Entities for webhooks
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);

  // Webhook forms
  const [calProject, setCalProject] = useState("");
  const [calDate, setCalDate] = useState("");
  const [calTime, setCalTime] = useState("11:00 AM");

  const [rzpInvoice, setRzpInvoice] = useState("");
  const [rzpEvent, setRzpEvent] = useState<"payment.captured" | "payment.failed">("payment.captured");
  const [rzpSendTwice, setRzpSendTwice] = useState(false);

  const [waProject, setWaProject] = useState("");
  const [waMessage, setWaMessage] = useState("Namaste Shivam ji! We need an appointment receptionist for our clinic.");

  // Dev settings (chaos & integrations)
  const [integrations, setIntegrations] = useState<Record<string, string>>({
    whatsapp: "mock",
    email: "mock",
    razorpay: "mock",
    cal: "mock",
    ai: "mock",
  });
  const [forceFailure, setForceFailure] = useState<Record<string, boolean>>({
    whatsapp: false,
    email: false,
    razorpay: false,
    cal: false,
    ai: false,
  });

  // Action status / feedback
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchClock = async () => {
    try {
      const res = await fetch("/api/dev/clock");
      const data = await res.json();
      if (data.success) {
        setCurrentIST(data.currentIST);
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchOutbox = async () => {
    try {
      const res = await fetch("/api/dev/outbox");
      const data = await res.json();
      if (data.success) {
        setOutbox(data.outbox || []);
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchEntities = async () => {
    try {
      const res = await fetch("/api/admin/data");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProjects(data.projects || []);
          setInvoices(data.invoices || []);
          if (data.projects?.length > 0 && !calProject) {
            setCalProject(data.projects[0].id);
            setWaProject(data.projects[0].id);
          }
          if (data.invoices?.length > 0 && !rzpInvoice) {
            setRzpInvoice(data.invoices[0].id);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchDevSettings = async () => {
    try {
      const res = await fetch("/api/dev/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setIntegrations(data.settings.integrations || {});
        setForceFailure(data.settings.force_failure || {});
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchClock();
    fetchOutbox();
    fetchEntities();
    fetchDevSettings();
    const interval = setInterval(fetchClock, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTimeAction = async (action: "advance" | "set" | "reset", ms?: number, iso?: string) => {
    setActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch("/api/dev/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ms, iso }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentIST(data.currentIST);
        setClockOffset(data.offset_ms || 0);
        setActionFeedback(`Virtual Clock Updated: ${data.currentIST}`);
      }
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunJobsNow = async () => {
    setActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch("/api/dev/jobs", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setActionFeedback(`✓ Ran ${data.jobsRan} jobs. Pipeline updated at ${data.virtualTimeIST}`);
        fetchOutbox();
      }
    } catch (err: any) {
      setActionFeedback(`Error running jobs: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFireWebhook = async (type: "cal_booking" | "razorpay_payment" | "whatsapp_inbound") => {
    setActionLoading(true);
    setActionFeedback(null);
    try {
      let body: any = { type };
      if (type === "cal_booking") {
        body = { ...body, projectId: calProject, date: calDate, time: calTime };
      } else if (type === "razorpay_payment") {
        body = { ...body, invoiceId: rzpInvoice, event: rzpEvent, sendTwice: rzpSendTwice };
      } else if (type === "whatsapp_inbound") {
        body = { ...body, projectId: waProject, messageText: waMessage };
      }

      const res = await fetch("/api/dev/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback(`✓ ${data.message}`);
        fetchOutbox();
        fetchEntities();
      } else {
        setActionFeedback(`⚠️ Webhook Failed: ${data.error}`);
      }
    } catch (err: any) {
      setActionFeedback(`Error firing webhook: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFailure = async (serviceKey: string) => {
    const updated = { ...forceFailure, [serviceKey]: !forceFailure[serviceKey] };
    setForceFailure(updated);
    try {
      await fetch("/api/dev/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force_failure: updated }),
      });
      setActionFeedback(`Chaos setting updated: ${serviceKey} failure = ${updated[serviceKey] ? "ON" : "OFF"}`);
    } catch (e) {
      // ignore
    }
  };

  const handleResetDemoData = async () => {
    if (!confirm("Are you sure you want to reset the database to the 3 clean Example projects?")) return;
    setActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch("/api/dev/reset", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setActionFeedback(`✓ ${data.message}`);
        fetchOutbox();
        fetchEntities();
        window.location.reload();
      }
    } catch (err: any) {
      setActionFeedback(`Error resetting demo data: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOutbox = outbox.filter((item) => {
    if (outboxFilterProject === "all") return true;
    return item.project_id === outboxFilterProject;
  });

  return (
    <>
      {/* Floating Trigger Pill */}
      <div className="fixed bottom-3 left-3 z-[9990] font-sans">
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            fetchOutbox();
            fetchClock();
            fetchEntities();
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C1F3A] hover:bg-[#2A2E54] text-white border border-[#FDB91F] shadow-xl text-xs font-semibold cursor-pointer transition-all hover:scale-105"
        >
          <span className="w-2 h-2 rounded-full bg-[#FDB91F] animate-ping" />
          <span>🛠️ Dev Tools</span>
          <span className="bg-[#FAF0D7] text-[#9A6400] text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
            {outbox.length}
          </span>
          <span className="text-[10px] text-gray-300 font-mono hidden sm:inline">
            {currentIST.split(",")[1] || "IST"}
          </span>
        </button>
      </div>

      {/* Main Dev Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-x-2 bottom-12 sm:bottom-14 sm:left-4 sm:right-auto sm:w-[650px] max-h-[85vh] z-[9995] bg-[#1C1F3A] text-white border-2 border-[#FDB91F] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-[#14172C] border-b border-[#2F3356] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-base">🛠️</span>
              <div>
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  AgentWala OS · Local QA Control Deck
                  <span className="text-[9px] font-mono bg-[#FDB91F] text-[#1C1F3A] px-1.5 py-0.2 rounded font-bold uppercase">
                    Dev Mode
                  </span>
                </h3>
                <p className="text-[10px] text-gray-300 font-mono">
                  App Virtual Clock: <b className="text-[#FFD066]">{currentIST}</b>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white font-bold px-2 py-1 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#2F3356] bg-[#181B34] text-xs font-semibold overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("outbox")}
              className={`px-3.5 py-2.5 whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
                activeTab === "outbox"
                  ? "border-[#FDB91F] text-[#FDB91F] bg-[#1C1F3A]"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              📬 Mock Outbox ({outbox.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("jobs")}
              className={`px-3.5 py-2.5 whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
                activeTab === "jobs"
                  ? "border-[#FDB91F] text-[#FDB91F] bg-[#1C1F3A]"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              ⚡ Run Jobs Now
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("clock")}
              className={`px-3.5 py-2.5 whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
                activeTab === "clock"
                  ? "border-[#FDB91F] text-[#FDB91F] bg-[#1C1F3A]"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              ⏳ Time Travel
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("webhooks")}
              className={`px-3.5 py-2.5 whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
                activeTab === "webhooks"
                  ? "border-[#FDB91F] text-[#FDB91F] bg-[#1C1F3A]"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              🪝 Test Webhooks
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("integrations")}
              className={`px-3.5 py-2.5 whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
                activeTab === "integrations"
                  ? "border-[#FDB91F] text-[#FDB91F] bg-[#1C1F3A]"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              🔌 Integrations &amp; Chaos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("reset")}
              className={`px-3.5 py-2.5 whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
                activeTab === "reset"
                  ? "border-red-400 text-red-400 bg-[#1C1F3A]"
                  : "border-transparent text-gray-400 hover:text-red-300"
              }`}
            >
              ⚠️ Reset Demo Data
            </button>
          </div>

          {/* Feedback banner */}
          {actionFeedback && (
            <div className="bg-[#242A4E] border-b border-[#3D4478] px-3.5 py-2 text-xs font-mono text-[#FFD066] flex items-center justify-between">
              <span className="truncate">{actionFeedback}</span>
              <button
                type="button"
                onClick={() => setActionFeedback(null)}
                className="text-gray-400 hover:text-white ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Tab Contents */}
          <div className="p-4 overflow-y-auto flex-1 text-xs space-y-4">
            {/* 1. MOCK OUTBOX TAB */}
            {activeTab === "outbox" && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-semibold">Filter Project:</span>
                    <select
                      value={outboxFilterProject}
                      onChange={(e) => setOutboxFilterProject(e.target.value)}
                      className="bg-[#24284A] border border-[#3E4578] rounded-lg px-2 py-1 text-white text-xs font-mono"
                    >
                      <option value="all">All Projects ({outbox.length})</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchOutbox}
                      className="px-2.5 py-1 bg-[#24284A] hover:bg-[#323868] text-gray-300 rounded-lg text-xs"
                    >
                      🔄 Refresh
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch("/api/dev/outbox", { method: "DELETE" });
                        fetchOutbox();
                      }}
                      className="px-2.5 py-1 bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800 rounded-lg text-xs"
                    >
                      Clear Outbox
                    </button>
                  </div>
                </div>

                {filteredOutbox.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 bg-[#14172C] rounded-xl border border-dashed border-[#2F3356]">
                    No messages in Outbox yet. When the app sends a WhatsApp, email or OTP, it will appear here.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredOutbox.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => setSelectedOutboxItem(msg)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedOutboxItem?.id === msg.id
                            ? "bg-[#282E5A] border-[#FDB91F]"
                            : "bg-[#14172C] border-[#2F3356] hover:border-gray-500"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                msg.channel === "whatsapp"
                                  ? "bg-[#1F7A3A]/30 text-emerald-400 border border-emerald-600/50"
                                  : msg.channel === "otp"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-600/50"
                                  : "bg-blue-500/20 text-blue-300 border border-blue-600/50"
                              }`}
                            >
                              {msg.channel}
                            </span>
                            <span className="font-semibold text-white truncate max-w-[200px]">
                              {msg.recipient}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              ({msg.template_name})
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap">
                            {formatDateTimeIST(msg.created_at)}
                          </span>
                        </div>

                        {msg.subject && (
                          <div className="text-[11px] font-bold text-gray-200 truncate">
                            Subject: {msg.subject}
                          </div>
                        )}

                        <div className="text-gray-300 text-[11px] line-clamp-2 mt-1 font-sans">
                          {msg.content}
                        </div>

                        {msg.project_id && (
                          <div className="mt-2 pt-1 border-t border-[#2F3356] flex justify-between items-center text-[10px]">
                            <span className="text-gray-400">Project: {msg.project_name || msg.project_id}</span>
                            <Link
                              href={`/admin/clients/${msg.client_id || msg.project_id}`}
                              className="text-[#FDB91F] hover:underline font-semibold"
                            >
                              View Project Timeline →
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Expanded Message Modal Detail */}
                {selectedOutboxItem && (
                  <div className="p-3.5 bg-[#242A52] border border-[#FDB91F] rounded-xl space-y-2 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-xs">
                        Full Outbox Message Payload ({selectedOutboxItem.template_name})
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedOutboxItem(null)}
                        className="text-gray-300 hover:text-white"
                      >
                        ✕ Close
                      </button>
                    </div>
                    <div className="text-[11px] text-gray-300 font-mono">
                      To: <b>{selectedOutboxItem.recipient}</b> · Channel: <b>{selectedOutboxItem.channel}</b>
                    </div>
                    <pre className="bg-[#12142A] p-3 rounded-lg text-[11px] text-gray-200 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {selectedOutboxItem.content}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* 2. RUN JOBS NOW TAB */}
            {activeTab === "jobs" && (
              <div className="space-y-4">
                <div className="p-4 bg-[#14172C] border border-[#2F3356] rounded-xl space-y-3">
                  <h4 className="font-bold text-white text-sm">Automated Job Runner</h4>
                  <p className="text-gray-300 leading-relaxed text-xs">
                    Manually trigger the scheduled job processor right now. It checks due dates, lead nurture timers, deemed acceptance deadlines, monthly care plans, and daily digests using the current virtual app time.
                  </p>
                  <button
                    type="button"
                    onClick={handleRunJobsNow}
                    disabled={actionLoading}
                    className="w-full py-3 bg-[#FDB91F] hover:bg-[#E5A413] text-[#1C1F3A] font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <span>⚡ Run All Scheduled Automations Now</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. TIME TRAVEL TAB */}
            {activeTab === "clock" && (
              <div className="space-y-4">
                <div className="p-4 bg-[#14172C] border border-[#2F3356] rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      Virtual System Clock
                    </span>
                    <span className="font-mono text-[11px] text-emerald-400 font-semibold">
                      ● Active &amp; Synchronized
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-[#FDB91F]">
                    {currentIST}
                  </div>
                  <p className="text-[11px] text-gray-300">
                    All app logic (jobs, reminders, quiet hours, invoice due dates, 7-day deemed acceptance, 30-day warranty countdown) runs on this clock.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTimeAction("advance", 3600000)}
                    disabled={actionLoading}
                    className="p-2.5 bg-[#24284A] hover:bg-[#343B6E] rounded-xl font-bold text-xs border border-[#3E4578] cursor-pointer"
                  >
                    +1 Hour
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTimeAction("advance", 86400000)}
                    disabled={actionLoading}
                    className="p-2.5 bg-[#24284A] hover:bg-[#343B6E] rounded-xl font-bold text-xs border border-[#3E4578] cursor-pointer"
                  >
                    +1 Day
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTimeAction("advance", 7 * 86400000)}
                    disabled={actionLoading}
                    className="p-2.5 bg-[#24284A] hover:bg-[#343B6E] rounded-xl font-bold text-xs border border-[#3E4578] cursor-pointer"
                  >
                    +7 Days
                  </button>
                </div>

                <div className="p-3.5 bg-[#14172C] border border-[#2F3356] rounded-xl space-y-2">
                  <label className="block text-xs font-semibold text-gray-300">
                    Jump to Specific Date &amp; Time
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="datetime-local"
                      value={customDateTime}
                      onChange={(e) => setCustomDateTime(e.target.value)}
                      className="bg-[#24284A] border border-[#3E4578] rounded-lg px-3 py-1.5 text-white font-mono text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => customDateTime && handleTimeAction("set", undefined, new Date(customDateTime).toISOString())}
                      disabled={!customDateTime || actionLoading}
                      className="px-3 py-1.5 bg-[#FDB91F] text-[#1C1F3A] font-bold rounded-lg text-xs cursor-pointer disabled:opacity-50"
                    >
                      Set Time
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTimeAction("reset")}
                  disabled={actionLoading}
                  className="w-full py-2.5 bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800 rounded-xl font-bold text-xs cursor-pointer"
                >
                  ↺ Reset Clock to Real-Time
                </button>
              </div>
            )}

            {/* 4. WEBHOOKS SIMULATOR TAB */}
            {activeTab === "webhooks" && (
              <div className="space-y-4">
                {/* Cal.com Booking Webhook */}
                <div className="p-3.5 bg-[#14172C] border border-[#2F3356] rounded-xl space-y-2.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span>📅</span> Cal.com Discovery Meeting Webhook
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <select
                      value={calProject}
                      onChange={(e) => setCalProject(e.target.value)}
                      className="bg-[#24284A] border border-[#3E4578] rounded-lg px-2.5 py-1.5 text-white text-xs"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={calDate}
                      onChange={(e) => setCalDate(e.target.value)}
                      className="bg-[#24284A] border border-[#3E4578] rounded-lg px-2.5 py-1.5 text-white text-xs"
                    />
                    <input
                      type="time"
                      value={calTime && calTime.length === 5 ? calTime : "11:00"}
                      onChange={(e) => setCalTime(e.target.value)}
                      className="bg-[#24284A] border border-[#3E4578] rounded-lg px-2.5 py-1.5 text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleFireWebhook("cal_booking")}
                      disabled={actionLoading}
                      className="bg-[#FDB91F] hover:bg-[#E5A413] text-[#1C1F3A] font-bold rounded-lg text-xs py-1.5 cursor-pointer"
                    >
                      Fire Booking Webhook
                    </button>
                  </div>
                </div>

                {/* Razorpay Webhook */}
                <div className="p-3.5 bg-[#14172C] border border-[#2F3356] rounded-xl space-y-2.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span>💳</span> Razorpay Payment Webhook
                  </h4>
                  <div className="space-y-2">
                    <select
                      value={rzpInvoice}
                      onChange={(e) => setRzpInvoice(e.target.value)}
                      className="w-full bg-[#24284A] border border-[#3E4578] rounded-lg px-2.5 py-1.5 text-white text-xs font-mono"
                    >
                      {invoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoice_number} ({inv.type}) — {formatRupees(inv.total_paise / 100)} [{inv.status}]
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-gray-300">
                        <input
                          type="checkbox"
                          checked={rzpSendTwice}
                          onChange={(e) => setRzpSendTwice(e.target.checked)}
                          className="rounded text-[#FDB91F]"
                        />
                        <span>Send Same Event Twice (Test Idempotency)</span>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRzpEvent("payment.captured");
                          handleFireWebhook("razorpay_payment");
                        }}
                        disabled={actionLoading}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs py-2 cursor-pointer"
                      >
                        ✓ Simulate Payment Captured
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRzpEvent("payment.failed");
                          handleFireWebhook("razorpay_payment");
                        }}
                        disabled={actionLoading}
                        className="px-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg text-xs py-2 cursor-pointer"
                      >
                        Simulate Failure
                      </button>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Inbound Webhook */}
                <div className="p-3.5 bg-[#14172C] border border-[#2F3356] rounded-xl space-y-2.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span>💬</span> Inbound WhatsApp Reply Simulator
                  </h4>
                  <div className="space-y-2">
                    <select
                      value={waProject}
                      onChange={(e) => setWaProject(e.target.value)}
                      className="w-full bg-[#24284A] border border-[#3E4578] rounded-lg px-2.5 py-1.5 text-white text-xs"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={waMessage}
                      onChange={(e) => setWaMessage(e.target.value)}
                      placeholder="Enter incoming client message (or 'stop' to test opt-out)..."
                      className="w-full bg-[#24284A] border border-[#3E4578] rounded-lg px-3 py-1.5 text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleFireWebhook("whatsapp_inbound")}
                      disabled={actionLoading}
                      className="w-full bg-[#1F7A3A] hover:bg-[#259146] text-white font-bold rounded-lg text-xs py-2 cursor-pointer"
                    >
                      Send Inbound Message Webhook
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. INTEGRATIONS & CHAOS TAB */}
            {activeTab === "integrations" && (
              <div className="space-y-4">
                <div className="p-3.5 bg-[#14172C] border border-[#2F3356] rounded-xl space-y-3">
                  <h4 className="font-bold text-white text-xs">External Integrations Mode</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {Object.entries(integrations).map(([name, mode]) => (
                      <div key={name} className="p-2.5 bg-[#24284A] rounded-xl border border-[#3E4578] flex items-center justify-between">
                        <span className="font-semibold text-xs capitalize">{name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-600/40 uppercase">
                          {mode}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-[#14172C] border border-[#2F3356] rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-white text-xs">Chaos &amp; Force Failure Toggles</h4>
                    <span className="text-[10px] text-gray-400">Test automation retries &amp; alerts</span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(forceFailure).map(([service, isFailing]) => (
                      <div key={service} className="flex items-center justify-between p-2 rounded-lg bg-[#24284A] border border-[#3E4578]">
                        <span className="text-xs text-gray-200 capitalize">
                          Force <b>{service}</b> failure
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleFailure(service)}
                          className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                            isFailing
                              ? "bg-red-600 text-white shadow-sm"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          {isFailing ? "FAILING (ON)" : "NORMAL (OFF)"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. RESET DEMO DATA TAB */}
            {activeTab === "reset" && (
              <div className="p-4 bg-red-950/20 border border-red-800/60 rounded-xl space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-red-900/40 text-red-400 flex items-center justify-center mx-auto text-xl font-bold">
                  ⚠️
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-red-300 text-sm">Reset Database to 3 Clean Examples</h4>
                  <p className="text-gray-300 text-xs max-w-md mx-auto">
                    Restores the local database to exactly 3 example projects:
                    <br />
                    1. <b>Example 1: Sunrise Dental Clinic</b> (Lead, Stage 1)
                    <br />
                    2. <b>Example 2: Apsara Beauty Lounge</b> (Proposal Sent, Stage 4)
                    <br />
                    3. <b>Example 3: Metro Fitness Gym</b> (Handed Over with paid invoices, Stage 10)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  disabled={actionLoading}
                  className="w-full py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg cursor-pointer"
                >
                  Confirm &amp; Reset Demo Data Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

