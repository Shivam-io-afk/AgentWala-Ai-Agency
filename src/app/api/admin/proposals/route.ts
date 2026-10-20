import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateBill, formatINR, rupeesToPaise } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const { clientId, packageId = "growth", scopeBullets = [] } = await req.json();

    const client = await db.getClientById(clientId);
    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    const b = calculateBill(packageId, client.founding_offer);

    const proposal = await db.createProposal({
      client_id: clientId,
      version: 1,
      package_id: packageId,
      setup_paise: rupeesToPaise(b.setup),
      monthly_paise: rupeesToPaise(b.monthly),
      gst_paise: rupeesToPaise(b.gst),
      total_first_bill_paise: rupeesToPaise(b.totalFirstBill),
      advance_paise: rupeesToPaise(b.advance),
      scope_bullets: scopeBullets,
      status: "draft",
    });

    await db.logActivity(
      "user",
      "Draft Proposal Created",
      `Proposal created for ${client.name} (${b.packageName}, First bill: ${formatINR(b.totalFirstBill)})`,
      clientId
    );

    return NextResponse.json({ success: true, proposal });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
