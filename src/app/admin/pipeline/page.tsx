"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Client, StageKey } from "@/lib/types";
import {
  PIPELINE_PHASES,
  ALL_STAGES,
  getClientStageIndex,
  getClientStageName,
  getClientProgressPercentage,
} from "@/lib/pipeline-constants";
import { calculateBill, formatINR, PACKAGES } from "@/lib/pricing";

export default function AdminPipelinePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openDetails, setOpenDetails] = useState<Set<string>>(new Set());

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/admin/data");
      const json = await res.json();
      if (json.success) {
        setClients(json.clients || []);
      }
    } catch (err) {
      console.error("Failed to load clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCheckChange = async (clientId: string, key: StageKey, checked: boolean) => {
    // Optimistic UI update
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        const newChecks = { ...(c.checks || {}) };
        newChecks[key] = {
          key,
          done: checked,
          done_at: checked ? new Date().toISOString() : undefined,
          done_by: "user",
        };
        return { ...c, checks: newChecks };
      })
    );

    try {
      await fetch("/api/admin/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, key, done: checked, doneBy: "user" }),
      });
      fetchClients();
    } catch (err) {
      console.error("Failed to update check:", err);
    }
  };

  const handleFieldChange = async (clientId: string, field: string, value: any) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, [field]: value } : c))
    );

    try {
      await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      fetchClients();
    } catch (err) {
      console.error("Failed to update client field:", err);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("Are you sure you want to permanently remove this client?")) return;
    try {
      await fetch(`/api/admin/clients/${clientId}`, { method: "DELETE" });
      fetchClients();
    } catch (err) {
      console.error("Failed to delete client:", err);
    }
  };

  const toggleDetail = (id: string) => {
    setOpenDetails((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const idx = getClientStageIndex(c);
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    if (phaseFilter === "all") return true;
    if (phaseFilter === "done") return idx >= 10;
    const pId = Number(phaseFilter);
    return idx < 10 && ALL_STAGES[idx].phaseId === pId;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-[#1B1F3B] dark:text-white">
            Client Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-[#585D7A] dark:text-[#A6A9C6]">
            Every client moves through 10 steps. Ticking the checklist automatically updates the stage.
          </p>
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-2">
          <div className="bg-[#E7E5F1] dark:bg-[#2B2F52] p-1 rounded-xl flex items-center">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-white dark:bg-[#1C1F3A] text-[#1B1F3B] dark:text-white shadow-xs"
                  : "text-[#585D7A] dark:text-[#A6A9C6]"
              }`}
            >
              List View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-[#1C1F3A] text-[#1B1F3B] dark:text-white shadow-xs"
                  : "text-[#585D7A] dark:text-[#A6A9C6]"
              }`}
            >
              Kanban Board
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar: Phase Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Phase Filter Chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setPhaseFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              phaseFilter === "all"
                ? "bg-[#1B1F3B] text-white border-[#1B1F3B] dark:bg-[#ECEBF7] dark:text-[#12142A]"
                : "bg-white dark:bg-[#1C1F3A] text-[#585D7A] dark:text-[#A6A9C6] border-[#E2E0EE] dark:border-[#2F3356]"
            }`}
          >
            All <span className="font-mono ml-1">{clients.length}</span>
          </button>
          {PIPELINE_PHASES.map((p) => {
            const count = clients.filter((c) => {
              const idx = getClientStageIndex(c);
              return idx < 10 && ALL_STAGES[idx].phaseId === p.id;
            }).length;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPhaseFilter(String(p.id))}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  phaseFilter === String(p.id)
                    ? "bg-[#1B1F3B] text-white border-[#1B1F3B] dark:bg-[#ECEBF7] dark:text-[#12142A]"
                    : "bg-white dark:bg-[#1C1F3A] text-[#585D7A] dark:text-[#A6A9C6] border-[#E2E0EE] dark:border-[#2F3356]"
                }`}
              >
                {p.name} <span className="font-mono ml-1">{count}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setPhaseFilter("done")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              phaseFilter === "done"
                ? "bg-[#1B1F3B] text-white border-[#1B1F3B] dark:bg-[#ECEBF7] dark:text-[#12142A]"
                : "bg-white dark:bg-[#1C1F3A] text-[#585D7A] dark:text-[#A6A9C6] border-[#E2E0EE] dark:border-[#2F3356]"
            }`}
          >
            Completed <span className="font-mono ml-1">{clients.filter((c) => getClientStageIndex(c) >= 10).length}</span>
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search name, phone…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 px-3 text-xs rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-white dark:bg-[#1C1F3A] text-[#1B1F3B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FDB91F]"
          />
        </div>
      </div>

      {/* View Mode: List View */}
      {viewMode === "list" && (
        <div className="space-y-3">
          {filteredClients.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#585D7A] dark:text-[#A6A9C6] bg-white dark:bg-[#1C1F3A] rounded-2xl border border-[#E2E0EE] dark:border-[#2F3356]">
              No clients match this filter.
            </div>
          ) : (
            filteredClients.map((client) => {
              const stageIdx = getClientStageIndex(client);
              const stageName = getClientStageName(client);
              const pct = getClientProgressPercentage(client);
              const b = calculateBill(client.package, client.founding_offer);
              const isOpen = openDetails.has(client.id);
              const isOverdue =
                client.next_step_date && client.next_step_date < todayStr && stageIdx < 10;

              return (
                <div
                  key={client.id}
                  className="bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl overflow-hidden transition-all shadow-xs"
                >
                  {/* Summary Row */}
                  <div
                    onClick={() => toggleDetail(client.id)}
                    className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 items-center gap-4 cursor-pointer hover:bg-[#FAF9FD] dark:hover:bg-[#232747]"
                  >
                    {/* Client Identity (4 cols) */}
                    <div className="md:col-span-4 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-[#1B1F3B] dark:text-white">
                          {client.name}
                        </span>
                        {client.is_example && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E7E5F1] text-[#585D7A]">
                            Example
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#585D7A] dark:text-[#A6A9C6] flex items-center gap-1.5 flex-wrap">
                        <span>{client.owner_name}</span>
                        {client.owner_name && <span>·</span>}
                        <span>{client.niche}</span>
                        <span>·</span>
                        <span className="font-semibold">{b.packageName}</span>
                      </div>
                    </div>

                    {/* 10-Segment Progress Track (5 cols) */}
                    <div className="md:col-span-5 space-y-1.5">
                      <div className="grid grid-cols-10 gap-1 h-2.5">
                        {ALL_STAGES.map((s, idx) => (
                          <div
                            key={s.id}
                            title={s.name}
                            className={`rounded-xs transition-colors ${
                              idx < stageIdx
                                ? "bg-[#2E7D5B] dark:bg-[#5FCB98]"
                                : idx === stageIdx
                                ? "bg-[#FDB91F]"
                                : "bg-[#E7E5F1] dark:bg-[#2B2F52]"
                            }`}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#1B1F3B] dark:text-[#ECEBF7]">
                          <b>{stageName}</b>
                          {stageIdx < 10 && (
                            <span className="text-[#585D7A] dark:text-[#A6A9C6] font-normal ml-1">
                              · {ALL_STAGES[stageIdx].phaseName}
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-[11px] text-[#585D7A] dark:text-[#A6A9C6]">
                          {pct}%
                        </span>
                      </div>
                    </div>

                    {/* Status Pill & Bill (3 cols) */}
                    <div className="md:col-span-3 flex md:flex-col items-center md:items-end justify-between gap-1.5 text-right">
                      {stageIdx >= 10 ? (
                        <span className="px-2.5 py-1 rounded-full bg-[#E4F3EB] text-[#2E7D5B] text-xs font-bold">
                          Paid
                        </span>
                      ) : isOverdue ? (
                        <span className="px-2.5 py-1 rounded-full bg-[#FDF0E1] text-[#B4540A] text-xs font-bold">
                          Overdue {client.next_step_date}
                        </span>
                      ) : client.next_step_date ? (
                        <span className="px-2.5 py-1 rounded-full bg-[#E4F3EB] text-[#2E7D5B] text-xs font-semibold">
                          Next: {client.next_step_date}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-[#E7E5F1] text-[#585D7A] text-xs">
                          In Progress
                        </span>
                      )}

                      <span className="font-mono font-bold text-sm text-[#1B1F3B] dark:text-white">
                        {formatINR(b.totalFirstBill)} first bill
                      </span>
                    </div>
                  </div>

                  {/* Expandable Phase Checklist & Controls */}
                  {isOpen && (
                    <div className="border-t border-[#E2E0EE] dark:border-[#2F3356] p-5 sm:p-6 bg-[#FAF9FD] dark:bg-[#181B34] space-y-6">
                      {/* 5 Phase Checklist Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {PIPELINE_PHASES.map((phase) => {
                          const phaseItems = phase.stages.flatMap((s) => s.items);
                          const doneCount = phaseItems.filter(
                            (item) => client.checks?.[item.key]?.done
                          ).length;

                          return (
                            <div
                              key={phase.id}
                              className="bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-xl p-3.5 space-y-3"
                            >
                              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#585D7A] dark:text-[#A6A9C6] border-b border-[#E2E0EE] dark:border-[#2F3356] pb-2">
                                <span>{phase.name}</span>
                                <span className="font-mono">
                                  {doneCount}/{phaseItems.length}
                                </span>
                              </div>

                              <div className="space-y-3">
                                {phase.stages.map((stage) => (
                                  <div key={stage.id} className="space-y-1.5">
                                    <span className="text-[11.5px] font-bold text-[#1B1F3B] dark:text-white block">
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
                                              onChange={(e) =>
                                                handleCheckChange(client.id, item.key, e.target.checked)
                                              }
                                              className="mt-0.5 rounded border-[#E2E0EE] text-[#2E7D5B] focus:ring-0"
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

                      {/* Fields & Configuration */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white dark:bg-[#1C1F3A] p-4 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356]">
                        <div>
                          <label className="block text-xs font-semibold text-[#585D7A] dark:text-[#A6A9C6] mb-1">
                            Package
                          </label>
                          <select
                            value={client.package}
                            onChange={(e) => handleFieldChange(client.id, "package", e.target.value)}
                            className="w-full h-9 text-xs rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] text-[#1B1F3B] dark:text-white"
                          >
                            {Object.entries(PACKAGES).map(([k, p]) => (
                              <option key={k} value={k}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#585D7A] dark:text-[#A6A9C6] mb-1">
                            Next step date
                          </label>
                          <input
                            type="date"
                            value={client.next_step_date || ""}
                            onChange={(e) => handleFieldChange(client.id, "next_step_date", e.target.value)}
                            className="w-full h-9 px-2 text-xs rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] text-[#1B1F3B] dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#585D7A] dark:text-[#A6A9C6] mb-1">
                            Next step / notes
                          </label>
                          <input
                            type="text"
                            value={client.next_step || ""}
                            placeholder="e.g. Follow up on Thursday"
                            onChange={(e) => handleFieldChange(client.id, "next_step", e.target.value)}
                            className="w-full h-9 px-3 text-xs rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] text-[#1B1F3B] dark:text-white"
                          />
                        </div>

                        <div className="flex items-center pt-5">
                          <label className="flex items-center gap-2 text-xs font-semibold text-[#1B1F3B] dark:text-white cursor-pointer">
                            <input
                              type="checkbox"
                              checked={client.founding_offer}
                              onChange={(e) => handleFieldChange(client.id, "founding_offer", e.target.checked)}
                              className="rounded text-[#FDB91F] focus:ring-0"
                            />
                            <span>Founding offer (50% off setup)</span>
                          </label>
                        </div>
                      </div>

                      {/* Live Bill Box */}
                      <div className="p-4 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
                        <div>
                          <span className="text-[#585D7A] dark:text-[#A6A9C6] block">Setup</span>
                          <span className="font-mono font-bold text-[#1B1F3B] dark:text-white">
                            {formatINR(b.setup)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#585D7A] dark:text-[#A6A9C6] block">Month 1</span>
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
                          <span className="text-[#585D7A] dark:text-[#A6A9C6] block">First bill total</span>
                          <span className="font-mono font-bold text-[#1B1F3B] dark:text-white">
                            {formatINR(b.totalFirstBill)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#585D7A] dark:text-[#A6A9C6] block">Advance (on Won)</span>
                          <span className="font-mono font-bold text-[#2E7D5B] dark:text-[#5FCB98]">
                            {formatINR(b.advance)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#585D7A] dark:text-[#A6A9C6] block">Final bill</span>
                          <span className="font-mono font-bold text-[#B4540A] dark:text-[#F2A15A]">
                            {formatINR(b.finalBill)}
                          </span>
                        </div>
                      </div>

                      {/* Client Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/clients/${client.id}`}
                            className="px-3.5 py-2 rounded-lg bg-[#1B1F3B] text-white hover:bg-[#14172C] text-xs font-semibold transition-colors"
                          >
                            Open Client Detail &amp; Tabs →
                          </Link>
                          <Link
                            href={`/p/${client.portal_token}`}
                            target="_blank"
                            className="px-3 py-2 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] text-xs font-semibold text-[#585D7A] dark:text-[#A6A9C6] hover:text-[#1B1F3B] transition-colors"
                          >
                            Client Portal Preview ↗
                          </Link>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteClient(client.id)}
                          className="px-3 py-1.5 text-xs text-[#B4540A] hover:underline"
                        >
                          Remove client
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* View Mode: Kanban Board */}
      {viewMode === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1400px]">
            {ALL_STAGES.map((stage) => {
              const stageClients = clients.filter(
                (c) => getClientStageIndex(c) === stage.id
              );

              return (
                <div
                  key={stage.id}
                  className="w-72 flex-shrink-0 bg-white dark:bg-[#1C1F3A] rounded-2xl border border-[#E2E0EE] dark:border-[#2F3356] p-3.5 flex flex-col space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#E2E0EE] dark:border-[#2F3356] pb-2">
                    <span className="font-bold text-xs text-[#1B1F3B] dark:text-white truncate">
                      {stage.id + 1}. {stage.name}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#585D7A] dark:text-[#A6A9C6] bg-[#F6F5FB] dark:bg-[#12142A] px-2 py-0.5 rounded-full">
                      {stageClients.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 min-h-[300px]">
                    {stageClients.length === 0 ? (
                      <div className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6] text-center py-8">
                        No clients here
                      </div>
                    ) : (
                      stageClients.map((client) => {
                        const b = calculateBill(client.package, client.founding_offer);
                        const isOverdue =
                          client.next_step_date &&
                          client.next_step_date < todayStr &&
                          stage.id < 10;

                        return (
                          <div
                            key={client.id}
                            className="p-3 rounded-xl bg-[#FAF9FD] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] space-y-2 text-xs shadow-2xs"
                          >
                            <div className="flex justify-between items-start">
                              <Link
                                href={`/admin/clients/${client.id}`}
                                className="font-bold text-[#1B1F3B] dark:text-white hover:underline truncate"
                              >
                                {client.name}
                              </Link>
                              <span className="text-[10px] text-[#727791]">
                                {client.niche.split(" ")[0]}
                              </span>
                            </div>

                            <div className="flex justify-between text-[11px] text-[#585D7A] dark:text-[#A6A9C6]">
                              <span>{client.owner_name}</span>
                              <span className="font-mono font-semibold">
                                {formatINR(b.totalFirstBill)}
                              </span>
                            </div>

                            {client.next_step_date && (
                              <div
                                className={`text-[10px] px-2 py-0.5 rounded flex items-center justify-between ${
                                  isOverdue
                                    ? "bg-[#FDF0E1] text-[#B4540A] font-bold"
                                    : "bg-[#E4F3EB] text-[#2E7D5B]"
                                }`}
                              >
                                <span>{isOverdue ? "Overdue" : "Next"}</span>
                                <span>{client.next_step_date}</span>
                              </div>
                            )}

                            <div className="pt-1 flex justify-end">
                              <Link
                                href={`/admin/clients/${client.id}`}
                                className="text-[10.5px] font-semibold text-[#FDB91F] hover:underline"
                              >
                                Details →
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
