"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { TaskRecord, TimeLogRecord, Project } from "@/lib/types";
import { formatINR } from "@/lib/pricing";
import { RealtimeLoadingScreen } from "@/components/network-loading-indicator";

interface ProjectWithClient extends Project {
  client_name?: string;
  client_owner?: string;
  client_phone?: string;
}

export default function MyWorkBoardPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLogRecord[]>([]);
  const [projects, setProjects] = useState<ProjectWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProject, setNewTaskProject] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<"kickoff" | "build" | "qa" | "revision" | "handover">("build");
  const [newTaskHours, setNewTaskHours] = useState("2");
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [addingTask, setAddingTask] = useState(false);

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerProject, setTimerProject] = useState("");
  const [timerDescription, setTimerDescription] = useState("");
  const [timerIsCR, setTimerIsCR] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Manual log time form state
  const [manualProject, setManualProject] = useState("");
  const [manualHours, setManualHours] = useState("1");
  const [manualDesc, setManualDesc] = useState("");
  const [manualIsCR, setManualIsCR] = useState(false);
  const [loggingTime, setLoggingTime] = useState(false);

  // Filter
  const [taskFilter, setTaskFilter] = useState<"all" | "today" | "pending" | "done">("pending");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/work");
      const json = await res.json();
      if (json.success) {
        setTasks(json.tasks || []);
        setTimeLogs(json.timeLogs || []);
        const projs = json.projects || [];
        setProjects(projs);
        if (projs.length > 0 && !newTaskProject) {
          setNewTaskProject(projs[0].id);
          setTimerProject(projs[0].id);
          setManualProject(projs[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch work board data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Timer tick
  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning]);

  const handleStartTimer = () => {
    if (!timerProject) {
      alert("Please select a project for the timer");
      return;
    }
    setTimerRunning(true);
  };

  const handleStopTimer = async () => {
    setTimerRunning(false);
    const durationHours = Math.max(0.1, Number((timerSeconds / 3600).toFixed(2)));
    try {
      await fetch("/api/admin/work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_time",
          project_id: timerProject,
          hours: durationHours,
          description: timerDescription || "Focused build work session",
          is_change_request: timerIsCR,
          hourly_rate_inr: 1000,
        }),
      });
      setTimerSeconds(0);
      setTimerDescription("");
      fetchData();
    } catch (err) {
      console.error("Failed to log timer time:", err);
    }
  };

  const handleToggleTask = async (task: TaskRecord) => {
    const nextDone = !task.done;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: nextDone } : t)));
    try {
      await fetch("/api/admin/work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_task",
          task_id: task.id,
          done: nextDone,
        }),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskProject) return;
    setAddingTask(true);
    try {
      await fetch("/api/admin/work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_task",
          project_id: newTaskProject,
          title: newTaskTitle.trim(),
          category: newTaskCategory,
          hours_estimated: Number(newTaskHours) || 1,
          due_date: newTaskDueDate,
        }),
      });
      setNewTaskTitle("");
      fetchData();
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setAddingTask(false);
    }
  };

  const handleManualLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualProject || !manualHours) return;
    setLoggingTime(true);
    try {
      await fetch("/api/admin/work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_time",
          project_id: manualProject,
          hours: Number(manualHours),
          description: manualDesc.trim() || "Manual work log",
          is_change_request: manualIsCR,
          hourly_rate_inr: 1000,
        }),
      });
      setManualDesc("");
      setManualHours("1");
      fetchData();
    } catch (err) {
      console.error("Failed to log manual time:", err);
    } finally {
      setLoggingTime(false);
    }
  };

  // Timer display helper
  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Task filtering
  const todayStr = new Date().toISOString().slice(0, 10);
  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === "pending") return !t.done;
    if (taskFilter === "done") return t.done;
    if (taskFilter === "today") return !t.done && t.due_date === todayStr;
    return true;
  });

  // Calculate project hours & profitability
  const projectMetrics = projects.map((proj) => {
    const projLogs = timeLogs.filter((l) => l.project_id === proj.id);
    const totalHours = projLogs.reduce((acc, l) => acc + (l.hours || 0), 0);
    const crHours = projLogs.filter((l) => l.is_change_request).reduce((acc, l) => acc + (l.hours || 0), 0);
    const projectPriceINR = (proj.price_paise || 0) / 100;
    const crRevenueINR = crHours * 1000;
    const totalRevenueINR = projectPriceINR + crRevenueINR;
    // Founder realization rate
    const realizationRate = totalHours > 0 ? Math.round(totalRevenueINR / totalHours) : 0;

    return {
      proj,
      totalHours,
      crHours,
      totalRevenueINR,
      realizationRate,
    };
  });

  if (loading) {
    return (
      <div className="max-w-[1240px] mx-auto p-4 sm:p-8">
        <RealtimeLoadingScreen
          title="Loading Work Board"
          subtext="Fetching tasks, build timers, time logs, and profitability realization..."
          fullScreen={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FDB91F]" />
            <span className="text-xs font-bold text-[#FDB91F] uppercase tracking-wider">
              Solo Founder Execution Cockpit
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1B1F3B] dark:text-white mt-1">
            My Work Board &amp; Time Tracker
          </h1>
          <p className="text-xs sm:text-sm text-[#585D7A] dark:text-[#A6A9C6] mt-0.5">
            Cross-project task list, live build timer, hourly tracking for Change Requests (₹1,000/hr) &amp; project profit realization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/pipeline"
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] text-[#1B1F3B] dark:text-white hover:bg-[#F6F5FB]"
          >
            ← View Pipeline
          </Link>
        </div>
      </div>

      {/* Top Banner: Live Timer & Quick Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Timer Widget (7 cols) */}
        <div className="lg:col-span-7 bg-[#1B1F3B] text-white rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full ${timerRunning ? "bg-[#2E7D5B] animate-ping" : "bg-[#FDB91F]"}`} />
              <h2 className="font-display font-bold text-base text-white">
                Live Build Timer
              </h2>
            </div>
            <span className="text-xs text-[#A6A9C6] font-mono">
              Rate: ₹1,000/hr billable
            </span>
          </div>

          <div className="flex items-center justify-center py-2">
            <span className="font-mono text-4xl sm:text-5xl font-extrabold tracking-wider text-[#FDB91F]">
              {formatTimer(timerSeconds)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#A6A9C6] mb-1">
                Project
              </label>
              <select
                value={timerProject}
                onChange={(e) => setTimerProject(e.target.value)}
                disabled={timerRunning}
                className="w-full px-3 py-2 rounded-xl bg-[#2A2F54] border border-[#3E4577] text-white text-xs"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.service_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A6A9C6] mb-1">
                Session Task / Note
              </label>
              <input
                type="text"
                placeholder="e.g. Setting up Twilio webhook..."
                value={timerDescription}
                onChange={(e) => setTimerDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#2A2F54] border border-[#3E4577] text-white text-xs placeholder:text-[#6F76A5]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#2A2F54] flex-wrap gap-2">
            <label className="flex items-center gap-2 text-xs text-[#ECEBF7] cursor-pointer">
              <input
                type="checkbox"
                checked={timerIsCR}
                onChange={(e) => setTimerIsCR(e.target.checked)}
                className="rounded accent-[#FDB91F]"
              />
              <span>Is this an out-of-scope Change Request (CR)?</span>
            </label>

            <div className="flex items-center gap-2">
              {!timerRunning ? (
                <button
                  type="button"
                  onClick={handleStartTimer}
                  className="px-5 py-2 rounded-xl bg-[#FDB91F] text-[#1B1F3B] font-bold text-xs hover:bg-[#E5A413] transition-colors shadow-xs"
                >
                  ▶ Start Timer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopTimer}
                  className="px-5 py-2 rounded-xl bg-[#B4540A] text-white font-bold text-xs hover:bg-[#974506] transition-colors shadow-xs"
                >
                  ⏹ Stop &amp; Log Hours
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Manual Time Log (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h2 className="font-display font-bold text-base text-[#1B1F3B] dark:text-white">
              Log Past Hours
            </h2>
            <p className="text-xs text-[#585D7A] dark:text-[#A6A9C6] mt-0.5">
              Quickly record offline dev, client meetings, or bug fixes.
            </p>
          </div>

          <form onSubmit={handleManualLogTime} className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#585D7A] dark:text-[#A6A9C6] mb-1">
                Project
              </label>
              <select
                value={manualProject}
                onChange={(e) => setManualProject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] text-[#1B1F3B] dark:text-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#585D7A] dark:text-[#A6A9C6] mb-1">
                  Hours Spent
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={manualHours}
                  onChange={(e) => setManualHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] text-[#1B1F3B] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#585D7A] dark:text-[#A6A9C6] mb-1">
                  Billable Type
                </label>
                <select
                  value={manualIsCR ? "cr" : "scope"}
                  onChange={(e) => setManualIsCR(e.target.value === "cr")}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] text-[#1B1F3B] dark:text-white"
                >
                  <option value="scope">Included in Scope</option>
                  <option value="cr">Change Request (₹1,000/hr)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#585D7A] dark:text-[#A6A9C6] mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="What was built or debugged?"
                value={manualDesc}
                onChange={(e) => setManualDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] text-[#1B1F3B] dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loggingTime}
              className="w-full py-2.5 rounded-xl bg-[#1B1F3B] dark:bg-white text-white dark:text-[#1B1F3B] font-bold text-xs hover:opacity-90 transition-opacity"
            >
              {loggingTime ? "Logging…" : "Log Hours to Project"}
            </button>
          </form>
        </div>
      </div>

      {/* Project Profitability & Realization Section */}
      <div className="bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-[#1B1F3B] dark:text-white">
              Project Profitability &amp; Realization Rate
            </h2>
            <p className="text-xs text-[#585D7A] dark:text-[#A6A9C6] mt-0.5">
              Target: &gt;₹2,500/hour founder realization on fixed fee projects.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#2E7D5B] bg-[#E4F3EB] px-2.5 py-1 rounded-lg">
            CR Rate: ₹1,000/hr
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projectMetrics.map(({ proj, totalHours, crHours, totalRevenueINR, realizationRate }) => (
            <div
              key={proj.id}
              className="p-4 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A6400] bg-[#FAF0D7] px-2 py-0.5 rounded">
                    {proj.service_type}
                  </span>
                  <h3 className="font-bold text-sm text-[#1B1F3B] dark:text-white mt-1.5 line-clamp-1">
                    {proj.name}
                  </h3>
                  <p className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6]">
                    {proj.client_name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E2E0EE] dark:border-[#2F3356] text-center">
                <div>
                  <span className="block text-[10px] uppercase text-[#585D7A] dark:text-[#A6A9C6]">
                    Revenue
                  </span>
                  <span className="font-mono text-xs font-bold text-[#1B1F3B] dark:text-white">
                    {formatINR(totalRevenueINR)}
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] uppercase text-[#585D7A] dark:text-[#A6A9C6]">
                    Hours Logged
                  </span>
                  <span className="font-mono text-xs font-bold text-[#1B1F3B] dark:text-white">
                    {totalHours}h {crHours > 0 ? `(${crHours}h CR)` : ""}
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] uppercase text-[#585D7A] dark:text-[#A6A9C6]">
                    Realization
                  </span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      realizationRate >= 2500 ? "text-[#2E7D5B]" : "text-[#B4540A]"
                    }`}
                  >
                    {realizationRate > 0 ? `₹${realizationRate}/h` : "—"}
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <Link
                  href={`/admin/clients/${proj.client_id}`}
                  className="block text-center text-[11px] font-bold text-[#FDB91F] hover:underline"
                >
                  Open Client Workspace →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Task List & Quick Add */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Task List (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E0EE] dark:border-[#2F3356] pb-3">
            <div>
              <h2 className="font-display font-bold text-lg text-[#1B1F3B] dark:text-white">
                Active Tasks
              </h2>
              <p className="text-xs text-[#585D7A] dark:text-[#A6A9C6]">
                {filteredTasks.length} task(s) matching filter
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 text-xs bg-[#F6F5FB] dark:bg-[#12142A] p-1 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356]">
              {(["pending", "today", "done", "all"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setTaskFilter(filter)}
                  className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                    taskFilter === filter
                      ? "bg-[#1B1F3B] text-white dark:bg-white dark:text-[#12142A]"
                      : "text-[#585D7A] dark:text-[#A6A9C6]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#585D7A] dark:text-[#A6A9C6] bg-[#F6F5FB] dark:bg-[#12142A] rounded-xl font-medium">
                No tasks found for this view. Create one below to stay organized!
              </div>
            ) : (
              filteredTasks.map((t) => {
                const proj = projects.find((p) => p.id === t.project_id);
                return (
                  <div
                    key={t.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      t.done
                        ? "bg-[#FAF9FD] dark:bg-[#12142A] opacity-60 border-[#E2E0EE] dark:border-[#2F3356]"
                        : "bg-white dark:bg-[#1C1F3A] border-[#E2E0EE] dark:border-[#2F3356] shadow-2xs hover:border-[#FDB91F]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={() => handleToggleTask(t)}
                        className="w-4 h-4 rounded accent-[#2E7D5B] cursor-pointer"
                      />
                      <div>
                        <div
                          className={`text-xs sm:text-sm font-semibold text-[#1B1F3B] dark:text-white ${
                            t.done ? "line-through text-[#727791]" : ""
                          }`}
                        >
                          {t.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#585D7A] dark:text-[#A6A9C6]">
                          <span className="font-semibold text-[#1B1F3B] dark:text-[#ECEBF7]">
                            {proj?.name || "General"}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{t.category}</span>
                          <span>•</span>
                          <span>Est: {t.hours_estimated}h</span>
                          {t.due_date && (
                            <>
                              <span>•</span>
                              <span
                                className={
                                  !t.done && t.due_date < todayStr
                                    ? "text-[#B4540A] font-bold"
                                    : ""
                                }
                              >
                                Due: {t.due_date}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTimerProject(t.project_id);
                          setTimerDescription(t.title);
                          setTimerRunning(true);
                        }}
                        title="Start timer for this task"
                        className="p-1.5 rounded-lg text-xs font-semibold text-[#FDB91F] bg-[#FAF0D7] hover:bg-[#FCE19B]"
                      >
                        ⏱
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Quick Add Task Form (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="font-display font-bold text-base text-[#1B1F3B] dark:text-white">
            Add New Task
          </h2>

          <form onSubmit={handleAddTask} className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#585D7A] dark:text-[#A6A9C6] mb-1">
                Task Title
              </label>
              <input
                type="text"
                placeholder="e.g. Test Razorpay webhook..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] text-[#1B1F3B] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#585D7A] dark:text-[#A6A9C6] mb-1">
                Project
              </label>
              <select
                value={newTaskProject}
                onChange={(e) => setNewTaskProject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] text-[#1B1F3B] dark:text-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#585D7A] dark:text-[#A6A9C6] mb-1">
                  Category
                </label>
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] text-[#1B1F3B] dark:text-white capitalize"
                >
                  <option value="kickoff">Kickoff</option>
                  <option value="build">Build</option>
                  <option value="qa">Internal QA</option>
                  <option value="revision">Revision</option>
                  <option value="handover">Handover</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#585D7A] dark:text-[#A6A9C6] mb-1">
                  Hours Est.
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={newTaskHours}
                  onChange={(e) => setNewTaskHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] text-[#1B1F3B] dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#585D7A] dark:text-[#A6A9C6] mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] text-[#1B1F3B] dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={addingTask}
              className="w-full py-2.5 rounded-xl bg-[#FDB91F] hover:bg-[#E5A413] text-[#1B1F3B] font-bold text-xs transition-colors shadow-xs"
            >
              {addingTask ? "Adding…" : "+ Add Task to Board"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

