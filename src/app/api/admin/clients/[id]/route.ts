import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const client = await db.getClientById(id);
    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }
    const invoices = await db.getInvoicesByClientId(id);
    const proposal = await db.getProposalByClientId(id);
    const messages = await db.getMessages(id);
    const logs = await db.getActivityLogs(50, id);
    const agent = await db.getAgentByClientId(id);
    const allRecs = await db.getRecommendations("active");
    const recommendations = allRecs.filter((r) => r.client_id === id);

    return NextResponse.json({
      success: true,
      client,
      invoices,
      proposal,
      messages,
      logs,
      agent,
      recommendations,
    });
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

