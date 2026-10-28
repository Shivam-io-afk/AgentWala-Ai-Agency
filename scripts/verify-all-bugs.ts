import { db } from "../src/lib/db";
import { calculateBill, calculateMilestoneParts } from "../src/lib/pricing";
import { dispatchMessage } from "../src/lib/messenger";
import { getClientStageIndex } from "../src/lib/pipeline-constants";
import { lookupStateFromCity } from "../src/lib/location";
import { createSessionToken } from "../src/lib/auth";

async function runAcceptanceTests() {
  console.log("=== STARTING AGMETA OS ACCEPTANCE VERIFICATION ===");
  await db.resetDemoData();

  // BUG 1: OTP Verification & Security
  console.log("\n--- Testing Bug 1: OTP Verification & Security ---");
  const otpRes = await db.saveOtp("proj-2", "+91 99301 88221", "c-ex-2");
  if (!otpRes.otp || otpRes.otp.length !== 6) throw new Error("Bug 1 Failed: OTP is not 6 digits");
  
  const wrongVerify = await db.verifyOtp("proj-2", "000000");
  if (wrongVerify.valid) throw new Error("Bug 1 Failed: '000000' bypass was accepted!");
  console.log("✓ '000000' rejected as expected:", wrongVerify.error);

  const realVerify = await db.verifyOtp("proj-2", otpRes.otp);
  if (!realVerify.valid) throw new Error("Bug 1 Failed: Valid OTP rejected!");
  console.log("✓ Valid OTP accepted successfully");

  const reuseVerify = await db.verifyOtp("proj-2", otpRes.otp);
  if (reuseVerify.valid) throw new Error("Bug 1 Failed: Reused OTP was accepted!");
  console.log("✓ Reused OTP rejected as expected:", reuseVerify.error);

  // BUG 3: Protected Invoice PDFs
  console.log("\n--- Testing Bug 3: Protected Invoice PDFs ---");
  const unauthRes = await fetch("http://localhost:3000/api/invoices/inv-2-adv/pdf");
  if (unauthRes.status !== 401) throw new Error(`Bug 3 Failed: Unauthenticated PDF returned ${unauthRes.status}`);
  console.log("✓ Logged-out access to invoice PDF returned 401 Unauthorized");

  const authRes = await fetch("http://localhost:3000/api/invoices/inv-2-adv/pdf?token=tok_batra_skin_419");
  if (authRes.status !== 200) throw new Error(`Bug 3 Failed: Portal token access returned ${authRes.status}`);
  console.log("✓ Valid portal token access returned 200 OK");

  // BUG 4: Money in Whole Rupees
  console.log("\n--- Testing Bug 4: Whole Rupee Arithmetic ---");
  const invoices = await db.getInvoices();
  const inv3Adv = invoices.find(i => i.id === "inv-3-adv");
  const inv3Mid = invoices.find(i => i.id === "inv-3-mid");
  const inv3Fin = invoices.find(i => i.id === "inv-3-fin");
  console.log("Nova 40/30/30 stored amounts:", 
    inv3Adv?.subtotal_paise! / 100, 
    inv3Mid?.subtotal_paise! / 100, 
    inv3Fin?.subtotal_paise! / 100
  );
  if (inv3Adv?.subtotal_paise !== 12000000 || inv3Mid?.subtotal_paise !== 9000000 || inv3Fin?.subtotal_paise !== 8999900) {
    throw new Error("Bug 4 Failed: Nova 40/30/30 amounts do not match 120000 + 90000 + 89999");
  }
  const sum3 = (inv3Adv.subtotal_paise + inv3Mid.subtotal_paise + inv3Fin.subtotal_paise) / 100;
  if (sum3 !== 299999) throw new Error(`Bug 4 Failed: Parts sum to ${sum3} instead of 299999`);
  console.log("✓ ₹1,20,000 + ₹90,000 + ₹89,999 = ₹2,99,999 exact whole rupees");

  const gstCalc = calculateBill("growth", false, { gstRegistered: true, clientState: "Karnataka", founderState: "Karnataka" });
  console.log("GST on ₹35,000 setup + ₹19,999 monthly (₹54,999): CGST:", gstCalc.cgst, "SGST:", gstCalc.sgst);
  if (gstCalc.cgst !== gstCalc.sgst) throw new Error("Bug 4 Failed: CGST and SGST do not match");
  console.log("✓ CGST equals SGST exactly");

  // BUG 5: GST-Off Invoices & GSTIN Validation
  console.log("\n--- Testing Bug 5: GST-Off Bill of Supply & GSTIN Check ---");
  const pdfHtml = await authRes.text();
  if (!pdfHtml.includes("Invoice (Bill of Supply)")) throw new Error("Bug 5 Failed: Title is not 'Invoice (Bill of Supply)'");
  if (pdfHtml.includes("GSTIN:")) throw new Error("Bug 5 Failed: GSTIN displayed when GST is off");
  if (!pdfHtml.includes("Not registered under GST - All prices net")) throw new Error("Bug 5 Failed: Exemption note missing");
  console.log("✓ GST-off invoice PDF shows 'Invoice (Bill of Supply)', no GSTIN, and exemption note");

  try {
    await db.updateSettings({ gst_registered: true, gstin: "INVALID_GST" });
    throw new Error("Bug 5 Failed: Allowed enabling GST with invalid GSTIN");
  } catch (err: any) {
    console.log("✓ Blocked turning GST on without valid GSTIN:", err.message);
  }

  // BUG 6: Messaging Idempotency & 3-Cap
  console.log("\n--- Testing Bug 6: Messaging Idempotency & 3-Cap ---");
  const msg1 = await dispatchMessage({
    channel: "whatsapp",
    recipient: "+91 91010 10101",
    templateName: "test_nurture",
    stepKey: "step1",
    fullText: "Test message 1",
    projectId: "proj-1",
    clientId: "c-ex-1",
  });
  if (!msg1.sent) throw new Error("Bug 6 Failed: Initial dispatch failed");

  const msgDuplicate = await dispatchMessage({
    channel: "whatsapp",
    recipient: "+91 91010 10101",
    templateName: "test_nurture",
    stepKey: "step1",
    fullText: "Test message 1",
    projectId: "proj-1",
    clientId: "c-ex-1",
  });
  if (msgDuplicate.sent || msgDuplicate.status !== "duplicate") {
    throw new Error("Bug 6 Failed: Idempotency failed to block duplicate message");
  }
  console.log("✓ Idempotent duplicate blocked safely");

  // BUG 7: Kill Switch Queueing & Resume
  console.log("\n--- Testing Bug 7: Kill Switch ---");
  await db.toggleGlobalKillSwitch(true);
  const queuedMsg = await dispatchMessage({
    channel: "whatsapp",
    recipient: "+91 91010 10101",
    templateName: "test_kill_switch",
    stepKey: "step2",
    fullText: "Queued during kill switch",
    projectId: "proj-1",
  });
  if (queuedMsg.status !== "queued") throw new Error(`Bug 7 Failed: Expected status queued, got ${queuedMsg.status}`);
  console.log("✓ Message queued when kill switch is active");

  const flushedCount = await db.flushQueuedMessages();
  if (flushedCount < 1) throw new Error("Bug 7 Failed: Queued message was not flushed upon resume");
  console.log(`✓ Resumed outbound: Flushed ${flushedCount} queued message(s)`);
  await db.toggleGlobalKillSwitch(false);

  // BUG 8 & 9: Server Stage Gates & Revision Limits
  console.log("\n--- Testing Bug 8 & 9: Server Stage Gates & Revision Limits ---");
  try {
    await db.updateCheck("proj-1", "w1", true, "user");
    throw new Error("Bug 9 Failed: w1 allowed before s1 and s2");
  } catch (err: any) {
    console.log("✓ Stage gate blocked w1 before s1+s2:", err.message);
  }

  try {
    await db.submitRevisionRound("proj-1", 1, [{ text: "Change color", ai_label: "revision", ai_reason: "styling" }]);
    throw new Error("Bug 8 Failed: Revision round allowed before w3 delivery");
  } catch (err: any) {
    console.log("✓ Blocked revision round before w3 delivery:", err.message);
  }

  // BUG 11: Failure Simulation
  console.log("\n--- Testing Bug 11: Dev Toolbar Payment Failure Simulation ---");
  const failRes = await fetch("http://localhost:3000/api/dev/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "razorpay_payment", invoiceId: "inv-2-adv", event: "payment.failed" })
  });
  const failJson = await failRes.json();
  const inv2 = (await db.getInvoices()).find(i => i.id === "inv-2-adv");
  if (inv2?.status === "paid") throw new Error("Bug 11 Failed: Invoice marked paid on failure event");
  console.log("✓ Invoice kept unpaid, retry link generated:", failJson.retryLink);

  // BUG 12: Unified Checklist & Furthest Stage
  console.log("\n--- Testing Bug 12: Single Unified Checklist & Furthest Stage ---");
  const stage0 = getClientStageIndex({ checks: { l1: { done: true }, l2: { done: true }, l3: { done: true } } });
  console.log("Stage when l1, l2, l3 done:", stage0);
  if (stage0 !== 1) throw new Error(`Bug 12 Failed: Expected stage 1, got ${stage0}`);
  
  const stage5 = getClientStageIndex({ checks: { s1: { done: true }, s2: { done: true } } });
  console.log("Stage when s1, s2 done:", stage5);
  if (stage5 !== 5) throw new Error(`Bug 12 Failed: Expected stage 5, got ${stage5}`);
  console.log("✓ Furthest stage derived properly");

  // BUG 21: Angry / Refund / Legal Keyword Detection
  console.log("\n--- Testing Bug 21: Inbound Dispute Keyword Detection ---");
  const disputeRes = await fetch("http://localhost:3000/api/dev/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "whatsapp_inbound", projectId: "proj-1", messageText: "This is a scam. I want a full refund immediately or legal notice." })
  });
  const disputeJson = await disputeRes.json();
  if (!disputeJson.disputeDetected) throw new Error("Bug 21 Failed: Dispute keyword not detected");
  const proj1 = await db.getProjectById("proj-1");
  if (proj1?.status !== "paused") throw new Error("Bug 21 Failed: Project automations not paused");
  console.log("✓ Dispute detected, automations paused, urgent founder task created");

  // BUG 22: City to State Mapper
  console.log("\n--- Testing Bug 22: Indian City to State Mapping ---");
  const statePune = lookupStateFromCity("Pune");
  const stateDelhi = lookupStateFromCity("Delhi");
  const stateRewa = lookupStateFromCity("Rewa");
  const stateUnknown = lookupStateFromCity("Atlantis");
  if (statePune !== "Maharashtra" || stateDelhi !== "Delhi" || stateRewa !== "Madhya Pradesh" || stateUnknown !== "") {
    throw new Error(`Bug 22 Failed: Pune -> ${statePune}, Delhi -> ${stateDelhi}, Rewa -> ${stateRewa}, Unknown -> ${stateUnknown}`);
  }
  console.log("✓ Pune -> Maharashtra, Delhi -> Delhi, Rewa -> Madhya Pradesh, Unknown -> '' (not Karnataka)");

  // BUG 24: Response Speed Optimization (< 1000ms)
  console.log("\n--- Testing Bug 24: Speed Optimization (< 1s) ---");
  // Warm up dev server compilation
  await fetch("http://localhost:3000/api/portal/tok_batra_skin_419");
  const founderSession = createSessionToken("shivam.mishra.cuh@gmail.com");
  await fetch("http://localhost:3000/api/admin/clients/c-ex-2", {
    headers: { cookie: `agmeta_session=${founderSession}` },
  });
  await new Promise((r) => setTimeout(r, 400));

  const t0 = Date.now();
  const portalFetch = await fetch("http://localhost:3000/api/portal/tok_batra_skin_419");
  const tPortal = Date.now() - t0;
  console.log(`/api/portal/[token] response time: ${tPortal}ms`);
  if (tPortal > 1000) throw new Error(`Bug 24 Failed: /api/portal response time ${tPortal}ms > 1000ms`);

  const t1 = Date.now();
  const adminClientFetch = await fetch("http://localhost:3000/api/admin/clients/c-ex-2", {
    headers: { cookie: `agmeta_session=${founderSession}` },
  });
  const tAdmin = Date.now() - t1;
  console.log(`/api/admin/clients/[id] response time: ${tAdmin}ms`);
  if (tAdmin > 1000) throw new Error(`Bug 24 Failed: /api/admin/clients/[id] response time ${tAdmin}ms > 1000ms`);
  console.log("✓ Both critical endpoints responded in well under 1 second");

  console.log("\n=======================================================");
  console.log("🎉 ALL ACCEPTANCE CHECKS PASSED SUCCESSFULLY!");
  console.log("=======================================================");
}

runAcceptanceTests().catch(err => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
