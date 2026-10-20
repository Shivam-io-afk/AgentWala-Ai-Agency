import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const bundle = await db.getClientDetailBundle(id);
    if (!bundle) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ...bundle,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const action = body.action;
    const projectId = body.project_id || id;

    if (action === "save_requirements") {
      const saved = await db.saveRequirements({
        project_id: projectId,
        ...body.data,
      });
      // Ticking r2
      await db.updateCheck(id, "r2", true, "user");
      return NextResponse.json({ success: true, requirements: saved });
    }

    if (action === "save_scope") {
      const saved = await db.saveScope({
        project_id: projectId,
        ...body.data,
      });
      await db.updateCheck(id, "p1", true, "user");
      return NextResponse.json({ success: true, scope: saved });
    }

    if (action === "save_agreement") {
      const saved = await db.saveAgreement({
        project_id: projectId,
        client_id: id,
        ...body.data,
      });
      await db.updateCheck(id, "p2", true, "automation");
      return NextResponse.json({ success: true, agreement: saved });
    }

    if (action === "create_task") {
      const newTask = await db.createTask({
        project_id: projectId,
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
        project_id: projectId,
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

    if (action === "create_delivery") {
      const now = new Date();
      const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const del = await db.createDelivery({
        project_id: projectId,
        round_number: Number(body.version || body.round_number) || 1,
        version: Number(body.version || body.round_number) || 1,
        type: body.type || "staging_link",
        url_or_number: body.url_or_ref || body.url_or_number || "",
        notes: body.notes,
        delivered_at: now.toISOString(),
        review_deadline: deadline.toISOString(),
      });
      return NextResponse.json({ success: true, delivery: del });
    }

    if (action === "confirm_revision_item") {
      await db.confirmRevisionItem(body.round_id, body.item_id, body.label, body.quote_hours);
      return NextResponse.json({ success: true });
    }

    if (action === "save_handover") {
      const saved = await db.saveHandover({
        project_id: projectId,
        ...body.data,
      });
      if (body.data.domain_transferred && body.data.source_code_transferred) {
        await db.updateCheck(id, "h1", true, "user");
      }
      return NextResponse.json({ success: true, handover: saved });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await db.updateClient(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, client: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const deleted = await db.deleteClient(id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

