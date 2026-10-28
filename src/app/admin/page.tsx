"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Client, Project, ActivityLogRecord, Invoice, Recommendation, Settings, UsageCostRecord } from "@/lib/types";
import { PIPELINE_PHASES, ALL_STAGES, getClientStageIndex } from "@/lib/pipeline-constants";
import { calculateBill, formatINR, PACKAGES, getAllPackagesWithSettings } from "@/lib/pricing";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [usageCosts, setUsageCosts] = useState<UsageCostRecord[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [pauseAllOutbound, setPauseAllOutbound] = useState(false);
  const [copilotLanguage, setCopilotLanguage] = useState<"hinglish" | "english">("hinglish");
  const [expandedWhy, setExpandedWhy] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Add lead form state
  const [newName, setNewName] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newNiche, setNewNiche] = useState("Dental clinic");
  const [newPackage, setNewPackage] = useState("growth");
  const [addingLead, setAddingLead] = useState(false);

  const fetchData = async () => {
    try {
      const [adminRes, copilotRes] = await Promise.all([
        fetch("/api/admin/data"),
        fetch("/api/admin/copilot"),
      ]);

      const adminJson = await adminRes.json();
      if (adminJson.success) {
        setClients(adminJson.clients || []);
        setProjects(adminJson.projects || []);
        setInvoices(adminJson.invoices || []);
        setLogs(adminJson.logs || []);
        setUsageCosts(adminJson.usageCosts || []);
        if (adminJson.settings) {
          setSettings(adminJson.settings);
          if (adminJson.settings.pause_all_outbound !== undefined) {
            setPauseAllOutbound(Boolean(adminJson.settings.pause_all_outbound));
          }
        }
      }

      const copilotJson = await copilotRes.json();
      if (copilotJson.success) {
        setRecommendations(copilotJson.recommendations || []);
        if (copilotJson.language) setCopilotLanguage(copilotJson.language);
        if (copilotJson.pauseAllOutbound !== undefined) {
          setPauseAllOutbound(Boolean(copilotJson.pauseAllOutbound));
        }
      }
    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGst = async () => {
    if (!settings) return;
    const nextState = !settings.gst_registered;
    setSettings((prev) => (prev ? { ...prev, gst_registered: nextState } : null));
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gst_registered: nextState }),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to toggle GST setting:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleKillSwitch = async () => {
    const nextState = !pauseAllOutbound;
    setPauseAllOutbound(nextState);
    try {
      await fetch("/api/admin/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_kill_switch", pauseAll: nextState }),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to toggle global kill switch:", err);
    }
  };

  const handleLanguageToggle = async (lang: "hinglish" | "english") => {
    setCopilotLanguage(lang);
    try {
      await fetch("/api/admin/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_language", language: lang }),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to change copilot language:", err);
    }
  };

  const handleCopilotAction = async (rec: Recommendation, action: "do_it" | "snooze" | "dismiss") => {
    if (action === "do_it") {
      await fetch("/api/admin/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "acted", id: rec.id }),
      });
      if (rec.action_payload?.url) {
        router.push(rec.action_payload.url);
      } else {
        fetchData();
      }
      return;
    }

    try {
      await fetch("/api/admin/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id: rec.id }),
      });
      // Remove from view
      setRecommendations((prev) => prev.filter((r) => r.id !== rec.id));
    } catch (err) {
      console.error("Failed to handle copilot action:", err);
    }
  };

  const toggleWhy = (id: string) => {
    setExpandedWhy((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAddingLead(true);

    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          owner_name: newOwner.trim(),
          niche: newNiche,
          package: newPackage,
          founding_offer: false,
        }),
      });
      if (res.ok) {
        setNewName("");
        setNewOwner("");
        fetchData();
      }
    } catch (err) {
      console.error("Failed to create lead:", err);
    } finally {
      setAddingLead(false);
    }
  };

  const packages = getAllPackagesWithSettings(settings?.package_prices);

  // Real Funnel calculations from actual projects
  const totalLeads = projects.length || clients.length;
  const qualified = projects.filter((p) => getClientStageIndex(p) >= 1).length;
  const meetingsDone = projects.filter((p) => getClientStageIndex(p) >= 4).length;
  const won = projects.filter((p) => getClientStageIndex(p) >= 5).length;
  const handedOver = projects.filter((p) => getClientStageIndex(p) >= 9).length;

  const funnelSteps = [
    { label: "Leads", count: totalLeads },
    { label: "Qualified", count: qualified },
    { label: "Meetings done", count: meetingsDone },
    { label: "Won", count: won },
    { label: "Handed over", count: handedOver },
  ];

  const maxFunnel = Math.max(1, totalLeads);

  // Real financial calculations from actual invoices in the database
  let collected = 0;
  let toCollect = 0;

  invoices.forEach((inv) => {
    const amount = inv.total_paise / 100;
    if (inv.status === "paid") {
      collected += amount;
    } else if (inv.status === "sent" || inv.status === "draft") {
      toCollect += amount;
    }
  });

  // MRR: sum active retainers / care plans of projects at stage 8+
  let mrr = 0;
  projects.forEach((p) => {
    const idx = getClientStageIndex(p);
    if (idx >= 8 && p.monthly_paise) {
      const monthlyPaise = p.monthly_paise;
      const monthlyRupees = monthlyPaise / 100;
      const isGst = Boolean(settings?.gst_registered);
      const tax = isGst ? monthlyRupees * 0.18 : 0;
      mrr += monthlyRupees + tax;
    }
  });

  // Open deals: sum project fees of pipeline projects before signed (stage < 5)
  let openDeals = 0;
  projects.forEach((p) => {
    const idx = getClientStageIndex(p);
    if (idx < 5 && p.price_paise) {
      openDeals += p.price_paise / 100;
    }
  });

  // Real 12-month revenue chart: monthly totals calculated from paid invoices in the database
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();

  const revenueChartData: { month: string; amount: number; projected: boolean }[] = [];

  for (let offset = -5; offset <= 6; offset++) {
    const d = new Date(currentYear, currentMonth + offset, 1);
    const mName = monthNames[d.getMonth()];
    const yStr = d.getFullYear();
    const isPastOrCurrent = offset <= 0;

    if (isPastOrCurrent) {
      const totalForMonth = invoices
        .filter((inv) => {
          if (inv.status !== "paid") return false;
          const invDate = new Date(inv.paid_at || inv.created_at);
          return invDate.getMonth() === d.getMonth() && invDate.getFullYear() === yStr;
        })
        .reduce((sum, inv) => sum + inv.total_paise / 100, 0);

      revenueChartData.push({
        month: mName,
        amount: totalForMonth,
        projected: false,
      });
    } else {
      const projectedRevenue = mrr + (openDeals > 0 ? Math.round(openDeals / 6) : 0);
      revenueChartData.push({
        month: mName,
        amount: projectedRevenue,
        projected: true,
      });
    }
  }

  const maxChartAmount = Math.max(10000, ...revenueChartData.map((b) => b.amount));

  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueClients = clients.filter(
    (c) => c.next_step_date && c.next_step_date < todayStr && getClientStageIndex(c) < 10
  );
  const todayMeetings = clients.filter((c) => c.next_step_date === todayStr);

  return (
    <div className="space-y-6">
      {/* Safety Rule 1: Global Kill Switch Banner */}
      <div
        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          pauseAllOutbound
            ? "bg-[#FDF0E1] dark:bg-[#3A2A1C] border-[#F3CFA2] dark:border-[#633A18] text-[#B4540A] dark:text-[#F2A15A]"
            : "bg-white dark:bg-[#1C1F3A] border-[#E2E0EE] dark:border-[#2F3356]"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${
              pauseAllOutbound ? "bg-[#B4540A] animate-ping" : "bg-[#2E7D5B]"
            }`}
          />
          <div>
            <div className="text-xs sm:text-sm font-bold">
              {pauseAllOutbound
                ? "🛑 SAFETY KILL SWITCH ACTIVE: ALL OUTBOUND MESSAGES PAUSED"
                : "Active Safety Monitor: 9 Safety Rules & Shadow Mode Active"}
            </div>
            <div className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6] mt-0.5">
              {pauseAllOutbound
                ? "No automated WhatsApp, email, or invoice notifications are leaving the app."
                : "Outgoing communications abide by 9 PM - 9 AM quiet hours, 3-message caps, and 48h client reply pauses."}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleKillSwitch}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex-shrink-0 ${
            pauseAllOutbound
              ? "bg-[#2E7D5B] text-white hover:bg-[#25664A]"
              : "border border-[#B4540A] text-[#B4540A] hover:bg-[#FDF0E1]"
          }`}
        >
          {pauseAllOutbound ? "Resume Outbound Messages" : "Pause All Outbound Messages"}
        </button>
      </div>

      {/* SECTION 7b: AI COPILOT ("Aaj kya karna hai") */}
      <div className="bg-white dark:bg-[#1C1F3A] border-2 border-[#FDB91F] rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E0EE] dark:border-[#2F3356] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-[#FDB91F] text-[#1B1F3B] font-bold text-xs flex items-center justify-center">
              🤖
            </span>
            <div>
              <h2 className="font-display font-extrabold text-lg text-[#1B1F3B] dark:text-white">
                {copilotLanguage === "hinglish" ? "Aaj kya karna hai (AI Copilot)" : "Today's Action Items (AI Copilot)"}
              </h2>
              <p className="text-[11.5px] text-[#585D7A] dark:text-[#A6A9C6]">
                Ranked by money at risk and urgency · Recommends only, never acts without your click
              </p>
            </div>
          </div>

          {/* Language Switch */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#F6F5FB] dark:bg-[#12142A] p-1 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] text-xs">
            <button
              type="button"
              onClick={() => handleLanguageToggle("hinglish")}
              className={`px-2 py-0.5 rounded font-semibold transition-all ${
                copilotLanguage === "hinglish"
                  ? "bg-[#1B1F3B] text-white dark:bg-white dark:text-[#12142A]"
                  : "text-[#585D7A] dark:text-[#A6A9C6]"
              }`}
            >
              Hinglish
            </button>
            <button
              type="button"
              onClick={() => handleLanguageToggle("english")}
              className={`px-2 py-0.5 rounded font-semibold transition-all ${
                copilotLanguage === "english"
                  ? "bg-[#1B1F3B] text-white dark:bg-white dark:text-[#12142A]"
                  : "text-[#585D7A] dark:text-[#A6A9C6]"
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Action List */}
        <div className="space-y-3">
          {recommendations.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#2E7D5B] bg-[#E4F3EB] rounded-xl font-semibold">
              ✓ Sab sorted hai! No pending alerts or money at risk right now.
            </div>
          ) : (
            recommendations.map((rec) => {
              const isWhyOpen = expandedWhy.has(rec.id);

              return (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl bg-[#FAF9FD] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] space-y-2.5 transition-all text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          rec.priority === "high"
                            ? "bg-[#FDF0E1] text-[#B4540A]"
                            : rec.priority === "medium"
                            ? "bg-[#FAF0D7] text-[#9A6400]"
                            : "bg-[#E4F3EB] text-[#2E7D5B]"
                        }`}
                      >
                        {rec.priority}
                      </span>
                      {rec.client_name && (
                        <span className="font-bold text-[#1B1F3B] dark:text-white">
                          {rec.client_name}
                        </span>
                      )}
                      <span className="font-semibold text-[#1B1F3B] dark:text-[#ECEBF7]">
                        {rec.title}
                      </span>
                    </div>

                    {rec.money_at_risk_rupees && (
                      <span className="font-mono text-xs font-bold text-[#B4540A] bg-[#FDF0E1] px-2 py-0.5 rounded">
                        {formatINR(rec.money_at_risk_rupees)} at risk
                      </span>
                    )}
                  </div>

                  <p className="text-[#585D7A] dark:text-[#A6A9C6] leading-relaxed text-[12.5px]">
                    {rec.reason}
                  </p>

                  {/* Why? rule explanation */}
                  {isWhyOpen && rec.why_rule && (
                    <div className="p-2.5 rounded-lg bg-[#EAE8F5] dark:bg-[#202447] text-[11px] text-[#4A4F66] dark:text-[#A6A9C6] font-mono leading-normal">
                      ℹ️ <b>Rule &amp; Data:</b> {rec.why_rule}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleWhy(rec.id)}
                      className="text-[11px] font-semibold text-[#727791] hover:underline"
                    >
                      {isWhyOpen ? "Hide 'Why?'" : "Why this recommendation? →"}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopilotAction(rec, "dismiss")}
                        className="px-2.5 py-1 text-[11px] text-[#727791] hover:text-[#1B1F3B] dark:hover:text-white"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopilotAction(rec, "snooze")}
                        className="px-2.5 py-1 text-[11px] text-[#585D7A] dark:text-[#A6A9C6] border rounded-lg hover:bg-white dark:hover:bg-[#1C1F3A]"
                      >
                        Snooze 1d
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopilotAction(rec, "do_it")}
                        className="px-3.5 py-1 bg-[#FDB91F] hover:bg-[#E5A413] text-[#1B1F3B] font-bold rounded-lg text-xs transition-colors shadow-xs"
                      >
                        {rec.action_label}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Section: Spending Caps Guardrails & GST Switch */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Spending Caps (8 cols) */}
        <div className="md:col-span-8 bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D5B]" />
              <h3 className="font-display font-bold text-sm text-[#1B1F3B] dark:text-white">
                Monthly Running Budget &amp; Spending Caps
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#E4F3EB] text-[#2E7D5B] font-bold">
              Target: &lt;₹9,000/mo cap
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* AI LLM Spend */}
            <div className="p-3 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356]">
              <div className="flex justify-between items-center text-[11px] text-[#585D7A] dark:text-[#A6A9C6]">
                <span>AI &amp; LLM Tokens</span>
                <span className="font-mono font-bold">₹1,420 / ₹5,000</span>
              </div>
              <div className="w-full bg-[#E7E5F1] dark:bg-[#2B2F52] h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-[#2E7D5B] h-full rounded-full" style={{ width: "28%" }} />
              </div>
              <span className="text-[10px] text-[#2E7D5B] font-semibold mt-1 block">
                ✓ 28% of ₹5k cap (Safe)
              </span>
            </div>

            {/* Voice API Spend */}
            <div className="p-3 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356]">
              <div className="flex justify-between items-center text-[11px] text-[#585D7A] dark:text-[#A6A9C6]">
                <span>Voice Agent Mins</span>
                <span className="font-mono font-bold">₹980 / ₹3,000</span>
              </div>
              <div className="w-full bg-[#E7E5F1] dark:bg-[#2B2F52] h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-[#2E7D5B] h-full rounded-full" style={{ width: "32%" }} />
              </div>
              <span className="text-[10px] text-[#2E7D5B] font-semibold mt-1 block">
                ✓ 32% of ₹3k cap (Safe)
              </span>
            </div>

            {/* Total Operating Cost */}
            <div className="p-3 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356]">
              <div className="flex justify-between items-center text-[11px] text-[#585D7A] dark:text-[#A6A9C6]">
                <span>Total Running Cost</span>
                <span className="font-mono font-bold">₹3,600 / ₹9,000</span>
              </div>
              <div className="w-full bg-[#E7E5F1] dark:bg-[#2B2F52] h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-[#FDB91F] h-full rounded-full" style={{ width: "40%" }} />
              </div>
              <span className="text-[10px] text-[#585D7A] dark:text-[#A6A9C6] font-semibold mt-1 block">
                40% of agency budget
              </span>
            </div>
          </div>
        </div>

        {/* GST Switch & Quick Work Link (4 cols) */}
        <div className="md:col-span-4 bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#585D7A] dark:text-[#A6A9C6]">
              GST Mode Switch
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                settings?.gst_registered
                  ? "bg-[#E4F3EB] text-[#2E7D5B]"
                  : "bg-[#FAF0D7] text-[#9A6400]"
              }`}
            >
              {settings?.gst_registered ? "GST: 18% Enabled" : "GST: Disabled (0%)"}
            </span>
          </div>

          <p className="text-[11.5px] text-[#585D7A] dark:text-[#A6A9C6] leading-relaxed">
            {settings?.gst_registered
              ? "All invoices split 9% CGST + 9% SGST (or 18% IGST for interstate clients)."
              : "Not registered under GST. Invoices note: 'Not registered under GST — All prices net'."}
          </p>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E2E0EE] dark:border-[#2F3356]">
            <button
              type="button"
              onClick={handleToggleGst}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                settings?.gst_registered
                  ? "border border-[#B4540A] text-[#B4540A] hover:bg-[#FDF0E1]"
                  : "bg-[#1B1F3B] text-white hover:bg-[#2A2F54]"
              }`}
            >
              {settings?.gst_registered ? "Turn GST OFF" : "Turn GST ON (18%)"}
            </button>

            <Link
              href="/admin/work"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#FDB91F] text-[#1B1F3B] hover:bg-[#E5A413] transition-colors"
            >
              ⏱ Open My Work Board →
            </Link>
          </div>
        </div>
      </div>

      {/* Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-[#1B1F3B] dark:text-white">
            Client Pipeline &amp; Funnel
          </h1>
          <p className="text-sm text-[#585D7A] dark:text-[#A6A9C6] mt-1">
            Every client moves through 10 steps, from first lead to final bill paid.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D5B] animate-pulse" />
          <span className="text-xs font-semibold text-[#585D7A] dark:text-[#A6A9C6]">
            {loading ? "Syncing…" : "Local OS Mock Engine Active"}
          </span>
        </div>
      </div>

      {/* Funnel & Money Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Funnel (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-[#1B1F3B] dark:text-white">
              Conversion Funnel
            </h2>
            <span className="text-xs text-[#585D7A] dark:text-[#A6A9C6] font-mono">
              {clients.length} Total Accounts
            </span>
          </div>

          <div className="space-y-3.5">
            {funnelSteps.map((step, idx) => {
              const prev = idx > 0 ? funnelSteps[idx - 1].count : null;
              const rate =
                idx === 0
                  ? "100%"
                  : prev && prev > 0
                  ? `${Math.round((step.count / prev) * 100)}% of above`
                  : "—";

              return (
                <div
                  key={step.label}
                  className="grid grid-cols-12 items-center gap-3 text-xs sm:text-sm font-medium"
                >
                  <div className="col-span-4 sm:col-span-3 flex justify-between pr-2">
                    <span className="text-[#1B1F3B] dark:text-[#ECEBF7]">{step.label}</span>
                    <b className="font-mono font-bold text-[#1B1F3B] dark:text-white">
                      {step.count}
                    </b>
                  </div>
                  <div className="col-span-5 sm:col-span-6 bg-[#E7E5F1] dark:bg-[#2B2F52] h-5 rounded-md overflow-hidden p-0.5">
                    <div
                      className="bg-[#FDB91F] h-full rounded-sm transition-all duration-500"
                      style={{ width: `${Math.max(4, (step.count / maxFunnel) * 100)}%` }}
                    />
                  </div>
                  <div className="col-span-3 text-right text-xs text-[#585D7A] dark:text-[#A6A9C6] font-mono">
                    {rate}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Money Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <h2 className="font-display font-bold text-lg text-[#1B1F3B] dark:text-white">
              Money {settings?.gst_registered ? "(incl. 18% GST)" : ""}
            </h2>
            <p className="text-xs text-[#585D7A] dark:text-[#A6A9C6] mt-1">
              {settings?.gst_registered
                ? "Advance = 50% setup + GST. Final bill = balance setup + month 1 + GST."
                : "Advance = 50% setup. Final bill = balance setup + month 1."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356]">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#585D7A] dark:text-[#A6A9C6]">
                Collected
              </span>
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#2E7D5B] dark:text-[#5FCB98] mt-1 block">
                {formatINR(collected)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356]">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#585D7A] dark:text-[#A6A9C6]">
                Still to collect
              </span>
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#B4540A] dark:text-[#F2A15A] mt-1 block">
                {formatINR(toCollect)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356]">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#585D7A] dark:text-[#A6A9C6]">
                Monthly MRR
              </span>
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#1B1F3B] dark:text-white mt-1 block">
                {formatINR(mrr)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356]">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#585D7A] dark:text-[#A6A9C6]">
                Open deals
              </span>
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#585D7A] dark:text-[#A6A9C6] mt-1 block">
                {formatINR(openDeals)}
              </span>
            </div>
          </div>

          <div className="text-[11.5px] text-[#585D7A] dark:text-[#A6A9C6] flex items-center justify-between pt-2 border-t border-[#E2E0EE] dark:border-[#2F3356]">
            <span>Recurring monthly retainers</span>
            <span className="font-mono font-semibold text-[#1B1F3B] dark:text-white">
              {projects.filter((p) => getClientStageIndex(p) >= 8).length} Live Clients
            </span>
          </div>
        </div>
      </div>

      {/* 12-Month Revenue Trend & Projection Chart */}
      <div className="bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E0EE] dark:border-[#2F3356] pb-3">
          <div>
            <h2 className="font-display font-bold text-lg text-[#1B1F3B] dark:text-white">
              12-Month Revenue Trend &amp; Projection
            </h2>
            <p className="text-xs text-[#585D7A] dark:text-[#A6A9C6]">
              Past 6 months actuals from paid invoices + next 6 months projection based on active retainers.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#2E7D5B] bg-[#E4F3EB] px-2.5 py-1 rounded-lg">
            ARR: {formatINR(mrr * 12)}
          </span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-2 items-end h-40">
          {revenueChartData.map((bar) => {
            const heightPercent = Math.max(10, Math.round((bar.amount / maxChartAmount) * 100));

            return (
              <div key={bar.month} className="flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-mono text-[#585D7A] dark:text-[#A6A9C6] hidden sm:block">
                  ₹{Math.round(bar.amount / 1000)}k
                </span>
                <div
                  className={`w-full rounded-t-md transition-all ${
                    bar.projected
                      ? "bg-[#EEDB9F] dark:bg-[#52441D] border-t-2 border-dashed border-[#FDB91F]"
                      : "bg-[#FDB91F]"
                  }`}
                  style={{ height: `${heightPercent}%` }}
                  title={`${bar.month}: ₹${bar.amount.toLocaleString("en-IN")} (${bar.projected ? "Projected" : "Actual"})`}
                />
                <span className="text-[10px] font-bold text-[#1B1F3B] dark:text-white">
                  {bar.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Add Lead Section */}
      <div className="bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="font-display font-bold text-lg text-[#1B1F3B] dark:text-white">
          Add a lead
        </h2>

        <form onSubmit={handleAddLead} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
          <div>
            <label className="block text-xs font-semibold text-[#585D7A] dark:text-[#A6A9C6] mb-1">
              Business name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Eye Hospital"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] text-sm text-[#1B1F3B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FDB91F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#585D7A] dark:text-[#A6A9C6] mb-1">
              Owner / Contact
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Roy, 98XXXXXXXX"
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] text-sm text-[#1B1F3B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FDB91F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#585D7A] dark:text-[#A6A9C6] mb-1">
              Niche
            </label>
            <select
              value={newNiche}
              onChange={(e) => setNewNiche(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] text-sm text-[#1B1F3B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FDB91F]"
            >
              <option value="Dental clinic">Dental clinic</option>
              <option value="Skin & hair clinic">Skin &amp; hair clinic</option>
              <option value="Physiotherapy">Physiotherapy</option>
              <option value="Diagnostic lab">Diagnostic lab</option>
              <option value="Salon & spa">Salon &amp; spa</option>
              <option value="Coaching institute">Coaching institute</option>
              <option value="Local business">Local business</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#585D7A] dark:text-[#A6A9C6] mb-1">
              Likely package
            </label>
            <select
              value={newPackage}
              onChange={(e) => setNewPackage(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] text-sm text-[#1B1F3B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FDB91F]"
            >
              <optgroup label="AI Voice & WhatsApp Agents">
                <option value="growth">Growth {formatINR(packages.growth.setupRupees)} setup ({formatINR(packages.growth.monthlyRupees)}/mo)</option>
                <option value="starter">Starter {formatINR(packages.starter.setupRupees)} setup ({formatINR(packages.starter.monthlyRupees)}/mo)</option>
                <option value="pro">Pro {formatINR(packages.pro.setupRupees)} setup ({formatINR(packages.pro.monthlyRupees)}/mo)</option>
                <option value="creator">Creator Engine {formatINR(packages.creator.monthlyRupees)}/mo</option>
              </optgroup>
              <optgroup label="Websites & Mobile Apps">
                <option value="business_website">Business Website {formatINR(packages.business_website.setupRupees)}</option>
                <option value="website_launch">Website Launch {formatINR(packages.website_launch.setupRupees)}</option>
                <option value="ecommerce_store">E-Commerce Store {formatINR(packages.ecommerce_store.setupRupees)}</option>
                <option value="app_mvp">Mobile App MVP {formatINR(packages.app_mvp.setupRupees)}</option>
              </optgroup>
            </select>
          </div>

          <button
            type="submit"
            disabled={addingLead}
            className="w-full h-10 bg-[#FDB91F] hover:bg-[#E5A413] text-[#1B1F3B] font-bold text-sm rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-xs disabled:opacity-50"
          >
            {addingLead ? "Adding…" : "Add lead"}
          </button>
        </form>
      </div>

      {/* Today Section & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today Focus Card (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-[#1B1F3B] dark:text-white">
              Today&apos;s Focus
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF0D7] text-[#9A6400] font-semibold">
              {todayStr}
            </span>
          </div>

          <div className="space-y-3">
            {overdueClients.length > 0 && (
              <div className="p-3.5 bg-[#FDF0E1] dark:bg-[#3A2A1C] border border-[#F3CFA2] dark:border-[#523A25] rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-[#B4540A] dark:text-[#F2A15A]">
                  <span>⚠️ Overdue Next Steps ({overdueClients.length})</span>
                </div>
                <div className="space-y-1.5">
                  {overdueClients.slice(0, 3).map((oc) => (
                    <div key={oc.id} className="flex justify-between items-center text-[#B4540A] dark:text-[#F2A15A]">
                      <Link href={`/admin/clients/${oc.id}`} className="hover:underline font-semibold">
                        {oc.name}
                      </Link>
                      <span className="font-mono text-[11px]">{oc.next_step_date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {todayMeetings.length > 0 ? (
              <div className="p-3.5 bg-[#E4F3EB] dark:bg-[#183428] border border-[#B9E3CF] dark:border-[#25523F] rounded-xl text-xs space-y-2">
                <span className="font-bold text-[#2E7D5B] dark:text-[#5FCB98] block">
                  📅 Meetings Scheduled Today ({todayMeetings.length})
                </span>
                {todayMeetings.map((tm) => (
                  <div key={tm.id} className="flex justify-between text-[#2E7D5B] dark:text-[#5FCB98]">
                    <Link href={`/admin/clients/${tm.id}`} className="hover:underline font-semibold">
                      {tm.name}
                    </Link>
                    <span>{tm.owner_name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#585D7A] dark:text-[#A6A9C6] py-3 text-center border border-dashed border-[#E2E0EE] dark:border-[#2F3356] rounded-xl">
                No meetings scheduled today.
              </div>
            )}

            <div className="pt-2 flex justify-between text-xs">
              <Link
                href="/admin/pipeline"
                className="font-semibold text-[#FDB91F] hover:underline"
              >
                View full Kanban &amp; List Pipeline →
              </Link>
              <Link
                href="/admin/automations"
                className="text-[#585D7A] dark:text-[#A6A9C6] hover:underline"
              >
                Check Automations
              </Link>
            </div>
          </div>
        </div>

        {/* Activity Feed (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-[#1B1F3B] dark:text-white">
              Live Activity Feed
            </h2>
            <span className="text-xs text-[#585D7A] dark:text-[#A6A9C6]">
              Latest actions across automations &amp; clients
            </span>
          </div>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <p className="text-xs text-[#585D7A] dark:text-[#A6A9C6] text-center py-6">
                No activity logs recorded yet.
              </p>
            ) : (
              logs.slice(0, 8).map((log) => {
                const isAuto = log.actor === "automation";
                const isClient = log.actor === "client";
                const proj = projects.find((p) => p.id === log.project_id || p.client_id === log.client_id || p.id === log.client_id);
                const client = clients.find((c) => c.id === log.client_id || c.id === log.project_id);
                const projectName = proj?.name || client?.name || "System";

                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] text-xs flex items-start justify-between gap-3"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isAuto
                              ? "bg-[#FAF0D7] text-[#9A6400]"
                              : isClient
                              ? "bg-[#E4F3EB] text-[#2E7D5B]"
                              : "bg-[#E2E0EE] text-[#1B1F3B]"
                          }`}
                        >
                          {log.actor}
                        </span>
                        <span className="text-[10.5px] font-semibold text-[#585D7A] dark:text-[#A6A9C6] px-1.5 py-0.5 rounded bg-[#EAE7F6] dark:bg-[#25284B] truncate max-w-[160px]">
                          {projectName}
                        </span>
                        <b className="text-[#1B1F3B] dark:text-[#ECEBF7] truncate">
                          {log.action}
                        </b>
                        {log.shadow && (
                          <span className="text-[9px] font-mono px-1 rounded bg-[#E7E5F1] text-[#585D7A]">
                            SHADOW
                          </span>
                        )}
                      </div>
                      <p className="text-[#585D7A] dark:text-[#A6A9C6] leading-relaxed">
                        {log.detail}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#727791] font-mono whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        hour: "2-digit",
                        minute: "2-digit",
                      })} IST
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
