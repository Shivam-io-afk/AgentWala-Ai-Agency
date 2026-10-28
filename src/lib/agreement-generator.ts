import crypto from "crypto";
import { Client, Project, Settings, RequirementRecord } from "./types";
import { formatINR } from "./pricing";

export interface AgreementData {
  client: Client;
  project?: Project | null;
  settings?: Settings | null;
  requirements?: RequirementRecord | null;
  acceptedAt?: string;
  acceptedName?: string;
  acceptedPhone?: string;
  documentHash?: string;
}

/**
 * Computes a SHA-256 hash of text for digital audit trail
 */
export function computeDocumentHash(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Generates populated Service Agreement HTML from Master Template
 */
export function generateAgreementHtml(data: AgreementData): { html: string; hash: string } {
  const { client, project, settings, requirements } = data;

  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const founderName = settings?.founder_name || "Shivam";
  const businessName = "Agmeta";
  const founderAddress = settings?.address || "Rewa, Madhya Pradesh 486001, India";
  const gstStatus = settings?.gst_registered && settings?.gstin
    ? `GSTIN: ${settings.gstin}`
    : "Not registered under GST";

  const clientLegalName = client.name || "Client";
  const clientOwner = client.owner_name || "Authorized Signatory";
  const clientAddress = client.city ? `${client.city}, ${client.state || "India"}` : "India";
  const clientGstin = "Unregistered / Consumer";

  const projectName = project?.name || `${client.name} AI Agent & Automation`;
  const serviceType = project?.service_type || "AI Agent & Automation";
  const priceINR = project?.price_paise ? project.price_paise / 100 : 35000;
  const monthlyINR = project?.monthly_paise ? project.monthly_paise / 100 : 19999;
  const milestonePlan = project?.milestone_plan || (priceINR > 100000 ? "40_30_30" : "50_50");

  const features = requirements?.features?.length
    ? requirements.features
    : [
        "AI automated phone answering in Hindi, English and Hinglish",
        "WhatsApp 24x7 automated appointment booking bot",
        "Integration with appointment calendar and morning reminder messages",
        "Two included revision rounds and 30-day bugfix warranty",
      ];

  const rawScreens = requirements?.pages_screens || requirements?.pages_or_screens || [];
  const screens: string[] = rawScreens.length
    ? rawScreens
    : ["Receptionist Conversation Flow", "Booking Intake Screen", "Admin Calendar View"];

  const rawTextForHash = `
Agmeta Client Service Agreement
Date: ${dateStr}
Provider: ${founderName} dba ${businessName}, ${founderAddress}, ${gstStatus}
Client: ${clientLegalName}, ${clientAddress}, Rep by: ${clientOwner}
Project: ${projectName} (${serviceType})
Price: INR ${priceINR}, Monthly: INR ${monthlyINR}
Milestone: ${milestonePlan}
Features: ${features.join("; ")}
`;

  const documentHash = computeDocumentHash(rawTextForHash.trim());

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Service Agreement - ${client.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1B1F3B; max-width: 800px; margin: 0 auto; padding: 32px 20px; }
    h1 { font-size: 24px; color: #1B1F3B; border-bottom: 2px solid #FDB91F; padding-bottom: 12px; }
    h2 { font-size: 16px; margin-top: 24px; color: #1B1F3B; border-left: 4px solid #FDB91F; padding-left: 8px; }
    p, li { font-size: 13px; color: #3A3E5B; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
    th, td { border: 1px solid #E2E0EE; padding: 8px 12px; text-align: left; }
    th { background: #F6F5FB; font-weight: bold; }
    .hash-box { background: #F6F5FB; border: 1px dashed #B8B5CE; padding: 12px; font-family: monospace; font-size: 11px; margin: 20px 0; border-radius: 6px; word-break: break-all; }
    .signature-card { background: #E4F3EB; border: 1px solid #BCE8B4; padding: 16px; border-radius: 8px; margin: 24px 0; }
  </style>
</head>
<body>
  <h1>Master Service Agreement &amp; Scope of Work</h1>
  <p><b>Date:</b> ${dateStr}</p>
  <p><b>Agreement Reference:</b> AG-MSA-${client.id.slice(0, 8).toUpperCase()}</p>

  <h2>1. Parties and Project</h2>
  <p>This Agreement is entered into between:</p>
  <ul>
    <li><b>Service Provider:</b> ${founderName}, trading as <b>Agmeta</b>, ${founderAddress}, ${gstStatus} (&quot;Agmeta&quot;, &quot;we&quot;).</li>
    <li><b>Client:</b> ${clientLegalName}, ${clientAddress}, ${clientGstin}, represented by <b>${clientOwner}</b> (&quot;Client&quot;, &quot;you&quot;).</li>
  </ul>
  <p><b>Project:</b> ${projectName}, classified as <b>${serviceType}</b>.</p>
  <p><b>1.1 Online Orders:</b> For standard packages bought on our website, you accept this Agreement and Annex A in the client portal at checkout, and the Agreement starts when the advance is paid. We may decline an online order within 2 working days of payment, in which case we refund the full amount.</p>

  <h2>2. Scope, Timeline and Responsibilities</h2>
  <p><b>2.1 Scope:</b> We will deliver exclusively what is stipulated in Annex A. Any addition or alteration outside Annex A is handled as a Change Request under Clause 4.3.</p>
  <p><b>2.2 Delivery Timeline:</b> Estimated target is <b>${requirements?.deadline || "14 business days"}</b> from receipt of advance and client assets.</p>
  <p><b>2.3 Point of Contact:</b> Client designates ${clientOwner} as the sole authorized representative for approvals and change instructions.</p>
  <p><b>2.7 Content You Approve:</b> We may prepare text, FAQs, images and your agent's knowledge base using AI tools, from information you give or link to us. You review and approve this content in the portal before it goes live, and you are responsible for the accuracy of facts, prices, offers and any health, legal or financial claims in it. Images we add are your own, licensed, or AI-generated.</p>
  <p><b>2.8 Team and Subcontractors:</b> We may use vetted team members or freelancers for parts of the work. Each of them is bound by confidentiality and assigns their work to us, sees only what their task needs, and does not contact you directly. Agmeta stays fully responsible for the work and remains your single point of contact.</p>

  <h2>3. Fees, Milestones and Invoicing</h2>
  <p><b>3.1 Project Fee:</b> ${formatINR(priceINR)} (plus applicable GST if registered).</p>
  <p><b>3.2 Monthly Retainer / Care Plan:</b> ${formatINR(monthlyINR)}/month, commencing upon handover, cancellable with 30 days' notice.</p>
  <p><b>3.3 Milestone Schedule (${milestonePlan === "40_30_30" ? "40% / 30% / 30%" : "50% / 50%"}):</b></p>
  <table>
    <thead>
      <tr><th>Milestone</th><th>Percentage</th><th>Due Event</th></tr>
    </thead>
    <tbody>
      <tr><td>1. Advance Payment</td><td>${milestonePlan === "40_30_30" ? "40%" : "50%"}</td><td>Due on signing; work begins upon receipt</td></tr>
      ${milestonePlan === "40_30_30" ? `<tr><td>2. Mid-Project Demo</td><td>30%</td><td>Due upon demo link / test line presentation</td></tr>` : ""}
      <tr><td>${milestonePlan === "40_30_30" ? "3" : "2"}. Handover Balance</td><td>${milestonePlan === "40_30_30" ? "30%" : "50%"}</td><td>Due prior to credentials &amp; source transfer</td></tr>
    </tbody>
  </table>

  <h2>4. Revisions, Change Requests and Deemed Acceptance</h2>
  <p><b>4.1 Included Revisions:</b> Two (2) consolidated rounds of revisions are included at no extra charge.</p>
  <p><b>4.2 Submission:</b> Revisions must be submitted as a consolidated batch within 7 days of delivery.</p>
  <p><b>4.3 Change Requests:</b> Features or workflows not in Annex A are quoted separately as Change Requests at <b>₹1,000/hour</b>.</p>
  <p><b>4.4 Deemed Acceptance:</b> If no revision notice is submitted within seven (7) days of delivery sharing, the milestone is deemed irrevocably accepted.</p>

  <h2>5. Handover, Intellectual Property and Warranty</h2>
  <p><b>5.1 Handover Gate:</b> Final payment is an absolute prerequisite. Credentials, domain DNS, and repositories are released only after settlement.</p>
  <p><b>5.2 Intellectual Property:</b> Upon receipt of full payment, all custom deliverables belong to the Client.</p>
  <p><b>5.3 30-Day Warranty:</b> 30 calendar days of bugfix warranty starting from handover, covering defects deviating from Annex A.</p>

  <h2>6. Annex A: Scope of Work</h2>
  <p><b>Included Features:</b></p>
  <ul>
    ${features.map((f) => `<li>${f}</li>`).join("")}
  </ul>
  <p><b>Pages / Screens / Flows:</b></p>
  <ul>
    ${screens.map((s: string) => `<li>${s}</li>`).join("")}
  </ul>

  <h2>7. Acceptance &amp; Digital Audit Trail</h2>
  <div class="hash-box">
    <b>Document SHA-256 Hash:</b> ${documentHash}<br>
    <b>Governing Law:</b> Indian Contract Act, 1872 &amp; Information Technology Act, 2000.<br>
    <b>Jurisdiction:</b> Courts of New Delhi, India.
  </div>

  ${
    data.acceptedAt
      ? `
  <div class="signature-card">
    <p><b>✓ Digitally Accepted via OTP</b></p>
    <p><b>Accepted by:</b> ${data.acceptedName || clientOwner}</p>
    <p><b>Mobile Verified:</b> ${data.acceptedPhone || client.phone}</p>
    <p><b>Timestamp:</b> ${new Date(data.acceptedAt).toUTCString()}</p>
    <p><b>Audit Hash:</b> ${data.documentHash || documentHash}</p>
  </div>`
      : `
  <p><i>Pending electronic acceptance via OTP in Client Portal.</i></p>`
  }
</body>
</html>
  `;

  return { html, hash: documentHash };
}

