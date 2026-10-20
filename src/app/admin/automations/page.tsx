"use client";

import React, { useEffect, useState } from "react";
import { AutomationSetting } from "@/lib/types";

export default function AdminAutomationsPage() {
  const [automations, setAutomations] = useState<AutomationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>("all");

  const fetchAutomations = async () => {
    try {
      const res = await fetch("/api/admin/automations");
      const json = await res.json();
      if (json.success) {
        setAutomations(json.automations || []);
      }
    } catch (err) {
      console.error("Failed to load automations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    try {
      await fetch("/api/admin/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", id, enabled: !currentEnabled }),
      });
      fetchAutomations();
    } catch (err) {
      console.error("Failed to toggle automation:", err);
    }
  };

  const handleToggleShadow = async (id: string, currentShadow: boolean) => {
    try {
      await fetch("/api/admin/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_shadow", id, shadow: !currentShadow }),
      });
      fetchAutomations();
    } catch (err) {
      console.error("Failed to toggle shadow mode:", err);
    }
  };

  const handlePromote = async (id: string) => {
    try {
      await fetch("/api/admin/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "promote", id }),
      });
      fetchAutomations();
    } catch (err) {
      console.error("Failed to promote automation:", err);
    }
  };

  const handleDemote = async (id: string, newLevel: 1 | 2 | 3) => {
    try {
      await fetch("/api/admin/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "demote", id, level: newLevel }),
      });
      fetchAutomations();
    } catch (err) {
      console.error("Failed to change automation level:", err);
    }
  };

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      await fetch("/api/admin/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry", id }),
      });
      fetchAutomations();
    } catch (err) {
      console.error("Failed to retry automation:", err);
    } finally {
      setRetryingId(null);
    }
  };

  const filtered = automations.filter((auto) => {
    if (filterLevel === "all") return true;
    if (filterLevel === "shadow") return auto.shadow_mode;
    return String(auto.level) === filterLevel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1B1F3B] dark:text-white">
            Automations Engine (A1–A24)
          </h1>
          <p className="text-xs sm:text-sm text-[#585D7A] dark:text-[#A6A9C6] mt-1">
            Graduated automation with 3 safety levels, 7-day shadow mode, confidence gates, and consecutive approval promotion.
          </p>
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-[#F6F5FB] dark:bg-[#12142A] p-1 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] text-xs">
          {[
            { id: "all", label: `All (${automations.length})` },
            { id: "1", label: "Level 1: Auto" },
            { id: "2", label: "Level 2: AI + Approve" },
            { id: "3", label: "Level 3: Human" },
            { id: "shadow", label: "Shadow Mode" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterLevel(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                filterLevel === tab.id
                  ? "bg-[#1B1F3B] text-white dark:bg-[#FDB91F] dark:text-[#1B1F3B]"
                  : "text-[#585D7A] dark:text-[#A6A9C6] hover:text-[#1B1F3B] dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Safety Rules Explainer Banner */}
      <div className="bg-[#FAF0D7] dark:bg-[#2A2415] border border-[#F5DC9A] dark:border-[#52441D] rounded-xl p-4 text-xs text-[#9A6400] dark:text-[#F3CA68] flex items-start gap-3">
        <span className="font-bold text-base leading-none">ℹ</span>
        <div className="space-y-1">
          <p className="font-bold">Automated Safety Architecture Active</p>
          <p className="leading-relaxed opacity-90">
            Automations start in <b>Level 2 (AI + Approve)</b> with <b>Shadow Mode</b> for 7 days. After <b>15 consecutive approvals without edits</b>, an automation can be promoted to <b>Level 1 (Auto)</b>. Outbound messages are checked against Quiet Hours (9 PM–9 AM IST), 48h client reply pause, and AI confidence threshold (&ge; 0.8).
          </p>
        </div>
      </div>

      {/* Automations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-[#585D7A]">
            Loading automations engine…
          </div>
        ) : (
          filtered.map((auto) => (
            <div
              key={auto.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                auto.enabled
                  ? "bg-white dark:bg-[#1C1F3A] border-[#E2E0EE] dark:border-[#2F3356] shadow-xs"
                  : "bg-[#F6F5FB] dark:bg-[#15172C] border-[#E2E0EE] dark:border-[#282B4B] opacity-60"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#1B1F3B] text-white">
                        {auto.id}
                      </span>
                      <h3 className="font-bold text-sm text-[#1B1F3B] dark:text-white">
                        {auto.name}
                      </h3>

                      {/* Level Badges */}
                      {auto.level === 1 && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#E4F3EB] text-[#2E7D5B] border border-[#BCE8B4]">
                          Level 1 · Auto
                        </span>
                      )}
                      {auto.level === 2 && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#FAF0D7] text-[#9A6400] border border-[#F5DC9A]">
                          Level 2 · AI + Approve
                        </span>
                      )}
                      {auto.level === 3 && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#E7E5F1] text-[#1B1F3B] border border-[#D5D2E8]">
                          Level 3 · Human Only
                        </span>
                      )}

                      {/* Shadow Mode Tag */}
                      {auto.shadow_mode && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#FFEAE5] text-[#D83A14] border border-[#FBC5B8]">
                          Shadow Active
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#585D7A] dark:text-[#A6A9C6] leading-relaxed pt-1">
                      {auto.description}
                    </p>
                  </div>

                  {/* On / Off Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggle(auto.id, auto.enabled)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors flex-shrink-0 cursor-pointer ${
                      auto.enabled ? "bg-[#2E7D5B]" : "bg-[#A6A9C6]"
                    }`}
                    aria-label={`Toggle ${auto.name}`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        auto.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Level Controls & Shadow Mode Bar */}
                <div className="bg-[#F6F5FB] dark:bg-[#12142A] p-3 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[#585D7A] dark:text-[#A6A9C6] font-medium">Control:</span>
                      <select
                        value={auto.level}
                        onChange={(e) => handleDemote(auto.id, Number(e.target.value) as 1 | 2 | 3)}
                        className="bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-lg px-2 py-1 text-xs font-semibold text-[#1B1F3B] dark:text-white"
                      >
                        <option value={1}>Level 1 (Auto)</option>
                        <option value={2}>Level 2 (AI + Approve)</option>
                        <option value={3}>Level 3 (Human Only)</option>
                      </select>
                    </div>

                    {/* Shadow Mode Toggle */}
                    <label className="flex items-center gap-1.5 cursor-pointer text-[#585D7A] dark:text-[#A6A9C6] hover:text-[#1B1F3B] dark:hover:text-white select-none">
                      <input
                        type="checkbox"
                        checked={auto.shadow_mode}
                        onChange={() => handleToggleShadow(auto.id, auto.shadow_mode)}
                        className="rounded text-[#D83A14] focus:ring-0"
                      />
                      <span className="font-semibold text-[11px]">7-Day Shadow Mode</span>
                    </label>
                  </div>

                  {/* Level 2 Promotion Tracker */}
                  {auto.level === 2 && (
                    <div className="pt-2 border-t border-[#E2E0EE] dark:border-[#2F3356] flex items-center justify-between gap-2 flex-wrap">
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6] block">
                          Promotion tracker (target: 15):
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-[#E2E0EE] dark:bg-[#2F3356] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#2E7D5B] rounded-full transition-all"
                              style={{ width: `${Math.min(100, (auto.consecutive_no_edit_approvals / 15) * 100)}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-[#1B1F3B] dark:text-white text-[11px]">
                            {auto.consecutive_no_edit_approvals}/15
                          </span>
                        </div>
                      </div>

                      {(auto.consecutive_no_edit_approvals >= 15 || auto.can_promote) && (
                        <button
                          type="button"
                          onClick={() => handlePromote(auto.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#2E7D5B] hover:bg-[#25664A] text-white font-bold text-[11px] transition-colors shadow-xs"
                        >
                          Promote to Level 1?
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Footer */}
              <div className="mt-4 pt-3 border-t border-[#E2E0EE] dark:border-[#2F3356] flex items-center justify-between text-[11px] text-[#585D7A] dark:text-[#A6A9C6]">
                <div className="flex items-center gap-3">
                  <span>
                    Success: <b className="font-mono text-[#2E7D5B]">{auto.success_count}</b>
                  </span>
                  <span>
                    Failed: <b className="font-mono text-[#B4540A]">{auto.failure_count}</b>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#727791]">
                    {auto.last_run
                      ? new Date(auto.last_run).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })
                      : "Active"}
                  </span>
                  <button
                    type="button"
                    disabled={retryingId === auto.id}
                    onClick={() => handleRetry(auto.id)}
                    className="px-2.5 py-1 rounded bg-[#E7E5F1] text-[#1B1F3B] hover:bg-[#D5D2E8] font-semibold text-[10.5px] cursor-pointer disabled:opacity-50"
                  >
                    {retryingId === auto.id ? "Running…" : "Trigger Run"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
