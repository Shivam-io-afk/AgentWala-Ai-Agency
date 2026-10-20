"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Client, ActivityLogRecord, Invoice } from "@/lib/types";
import { PIPELINE_PHASES, ALL_STAGES, getClientStageIndex } from "@/lib/pipeline-constants";
import { calculateBill, formatINR } from "@/lib/pricing";

export default function AdminDashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Add lead form state
  const [newName, setNewName] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newNiche, setNewNiche] = useState("Dental clinic");
  const [newPackage, setNewPackage] = useState("growth");
  const [addingLead, setAddingLead] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/data");
      const json = await res.json();
      if (json.success) {
        setClients(json.clients || []);
        setInvoices(json.invoices || []);
        setLogs(json.logs || []);
      }
    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  // Funnel calculations
  const stageIndices = clients.map(getClientStageIndex);
  const totalLeads = stageIndices.length;
  const meetingsDone = stageIndices.filter((i) => i >= 4).length;
  const won = stageIndices.filter((i) => i >= 6).length;
  const live = stageIndices.filter((i) => i >= 8).length;
  const paid = stageIndices.filter((i) => i >= 10).length;

  const funnelSteps = [
    { label: "Leads", count: totalLeads },
    { label: "Meetings done", count: meetingsDone },
    { label: "Won", count: won },
    { label: "Live", count: live },
    { label: "Paid", count: paid },
  ];

  const maxFunnel = Math.max(1, totalLeads);

  // Financial calculations (incl. 18% GST)
  let collected = 0;
  let toCollect = 0;
  let mrr = 0;
  let openDeals = 0;

  clients.forEach((c) => {
    const idx = getClientStageIndex(c);
    const b = calculateBill(c.package, c.founding_offer);

    // If Won (stage 6) or higher, advance is collected
    if (idx >= 6) {
      collected += b.advance;
    }
    // If Paid (stage 10), final bill is collected
    if (idx >= 10) {
      collected += b.finalBill;
    }
    // If Won but not yet Paid, final bill is still to collect
    if (idx >= 6 && idx < 10) {
      toCollect += b.finalBill;
    }
    // If Live or Paid, monthly retainer is active
    if (idx >= 8) {
      mrr += b.monthlyRetainerWithGst;
    }
    // Open deals (before won)
    if (idx < 6) {
      openDeals += b.totalFirstBill;
    }
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueClients = clients.filter(
    (c) => c.next_step_date && c.next_step_date < todayStr && getClientStageIndex(c) < 10
  );
  const todayMeetings = clients.filter((c) => c.next_step_date === todayStr);

  return (
    <div className="space-y-8">
      {/* Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1B1F3B] dark:text-white">
            Client Pipeline &amp; OS
          </h1>
          <p className="text-sm text-[#585D7A] dark:text-[#A6A9C6] mt-1">
            Every client moves through 10 steps, from first lead to final bill paid. Tick the checklist and the stage moves on its own.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D5B] animate-pulse"></span>
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
              Money (incl. 18% GST)
            </h2>
            <p className="text-xs text-[#585D7A] dark:text-[#A6A9C6] mt-1">
              Advance = 50% setup + GST. Final bill = balance setup + month 1 + GST.
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
              {live + paid} Live Clients
            </span>
          </div>
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
              placeholder="e.g. Dr. Roy, 9820011122"
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
              <option value="starter">Starter ₹7,999/mo</option>
              <option value="growth">Growth ₹19,999/mo</option>
              <option value="pro">Pro ₹49,999/mo</option>
              <option value="creator">Creator Engine ₹14,999/mo</option>
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

                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] text-xs flex items-start justify-between gap-3"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
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
                        <b className="text-[#1B1F3B] dark:text-[#ECEBF7] truncate">
                          {log.action}
                        </b>
                      </div>
                      <p className="text-[#585D7A] dark:text-[#A6A9C6] leading-relaxed">
                        {log.detail}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#727791] font-mono whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
