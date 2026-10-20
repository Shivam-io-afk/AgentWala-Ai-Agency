import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const tasks = await db.getTasks();
    const timeLogs = await db.getTimeLogs();
    const projects = await db.getProjects();
    const clients = await db.getClients();
    const settings = await db.getSettings();

    // Map projects with client details
    const projectsWithClients = projects.map((p) => {
      const client = clients.find((c) => c.id === p.client_id);
      return {
        ...p,
        client_name: client?.name || "Unknown Client",
        client_owner: client?.owner_name || "",
        client_phone: client?.phone || "",
      };
    });

    return NextResponse.json({
      success: true,
      tasks,
      timeLogs,
      projects: projectsWithClients,
      settings,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === "create_task") {
      const newTask = await db.createTask({
        project_id: body.project_id,
        title: body.title,
        category: body.category || "build",
        hours_estimated: Number(body.hours_estimated) || 1,
        due_date: body.due_date,
      });
      return NextResponse.json({ success: true, task: newTask });
    }

    if (action === "toggle_task") {
      const updated = await db.updateTask(body.task_id, { done: Boolean(body.done) });
      return NextResponse.json({ success: true, task: updated });
    }

    if (action === "log_time") {
      const now = new Date().toISOString();
      const rateINR = Number(body.hourly_rate_inr) || 1000;
      const newLog = await db.logTime({
        project_id: body.project_id,
        task_id: body.task_id,
        hours: Number(body.hours) || 1,
        logged_date: body.logged_date || now.slice(0, 10),
        hourly_rate_paise: rateINR * 100,
        hourly_rate_inr: rateINR,
        description: body.description || "Work session",
        is_change_request: Boolean(body.is_change_request),
      });
      return NextResponse.json({ success: true, timeLog: newLog });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

