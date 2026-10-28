/**
 * Single source of truth for all Agmeta pricing, packages, care plans, and billing calculations (v2).
 */

export interface PricingPackage {
  id: string;
  name: string;
  category: "ai_service" | "web_app";
  verticalLabels?: Record<string, string>;
  setupRupees: number;
  monthlyRupees: number;
  setupPaise: number;
  monthlyPaise: number;
  recommended?: boolean;
  badge?: string;
  description: string;
  features: string[];
  ctaText: string;
  bestFor: string;
  revisionRounds: number;
}

export const PACKAGES: Record<string, PricingPackage> = {
  // AI Services (Setup + Monthly Retainer)
  starter: {
    id: "starter",
    name: "Starter",
    category: "ai_service",
    verticalLabels: { clinics: "WhatsApp", salons: "WhatsApp Bot" },
    setupRupees: 15000,
    monthlyRupees: 7999,
    setupPaise: 1500000,
    monthlyPaise: 799900,
    description: "1 WhatsApp or website bot, FAQ + lead capture, ~1,000 conversations",
    badge: "Solo Businesses",
    features: [
      "1 WhatsApp or website bot",
      "FAQ answering & lead capture",
      "Calendar booking link sharing",
      "Up to ~1,000 conversations / month",
      "Hand-off to human team on request",
    ],
    ctaText: "Start with Starter",
    bestFor: "Best for solo practices, clinics, local salons & services",
    revisionRounds: 2,
  },
  growth: {
    id: "growth",
    name: "Growth",
    category: "ai_service",
    verticalLabels: { clinics: "AI Receptionist", salons: "Voice Receptionist" },
    setupRupees: 35000,
    monthlyRupees: 19999,
    setupPaise: 3500000,
    monthlyPaise: 1999900,
    recommended: true,
    badge: "Most Popular",
    description: "AI receptionist + WhatsApp bot, 1,000 call minutes, booking integration",
    features: [
      "AI phone receptionist (Hindi, English & Hinglish)",
      "WhatsApp conversational booking agent 24×7",
      "1,000 call minutes included (extra ₹8/min)",
      "Google Calendar & CRM sync",
      "Automated WhatsApp reminders & confirmations",
      "Monthly performance report",
    ],
    ctaText: "Get Growth",
    bestFor: "Best for busy clinics, consulting firms & growing small businesses",
    revisionRounds: 2,
  },
  pro: {
    id: "pro",
    name: "Pro",
    category: "ai_service",
    verticalLabels: { clinics: "Multi-branch", salons: "Enterprise" },
    setupRupees: 75000,
    monthlyRupees: 49999,
    setupPaise: 7500000,
    monthlyPaise: 4999900,
    description: "Multiple agents, CRM integration, outbound calling, monthly optimisation call",
    badge: "High Volume",
    features: [
      "Multiple AI agents (voice + WhatsApp)",
      "Multi-branch & multi-team routing",
      "Full CRM / ERP deep integration",
      "Outbound follow-up & recall campaigns",
      "Custom analytics & transcript audits",
      "Monthly optimization call & dedicated SLA",
    ],
    ctaText: "Talk to us",
    bestFor: "Best for multi-location businesses, hospital chains & brands",
    revisionRounds: 2,
  },
  creator: {
    id: "creator",
    name: "Creator Engine",
    category: "ai_service",
    verticalLabels: {},
    setupRupees: 0,
    monthlyRupees: 14999,
    setupPaise: 0,
    monthlyPaise: 1499900,
    description: "12 reel scripts/month, hooks, captions, hashtags, calendar, DM auto-replies",
    badge: "Creators & Influencers",
    features: [
      "12 reel / short scripts per month",
      "High-converting hooks, captions & hashtags",
      "Weekly posting calendar & content schedule",
      "Instagram DM qualification & lead auto-reply",
      "WhatsApp VIP community broadcasts",
    ],
    ctaText: "Start Creator Engine",
    bestFor: "Best for founders, doctors building personal brands & creators",
    revisionRounds: 2,
  },

  // Web & App Projects (One-time + optional Care Plan)
  website_launch: {
    id: "website_launch",
    name: "Website Launch",
    category: "web_app",
    setupRupees: 24999,
    monthlyRupees: 0,
    setupPaise: 2499900,
    monthlyPaise: 0,
    description: "Up to 5 pages, mobile-friendly, contact form + WhatsApp button, basic SEO, 2 revision rounds",
    badge: "Fast Turnaround",
    features: [
      "Up to 5 pages (Home, About, Services, Contact, etc.)",
      "100% mobile-friendly & ultra-fast loading",
      "Contact enquiry form + 1-tap WhatsApp button",
      "Basic on-page SEO & Google indexing",
      "2 revision rounds included",
    ],
    ctaText: "Build My Website",
    bestFor: "Best for new businesses, consultants & clinic landing pages",
    revisionRounds: 2,
  },
  business_website: {
    id: "business_website",
    name: "Business Website",
    category: "web_app",
    setupRupees: 59999,
    monthlyRupees: 0,
    setupPaise: 5999900,
    monthlyPaise: 0,
    recommended: true,
    badge: "Best Value",
    description: "Up to 15 pages, editable content (CMS), booking or enquiry forms, AI chat widget, 2 revision rounds",
    features: [
      "Up to 15 pages with custom modern design",
      "Easy CMS to edit text, photos & blog posts",
      "Appointment booking / enquiry workflows",
      "Integrated AI chat widget on website",
      "Complete analytics & conversion tracking",
      "2 revision rounds included",
    ],
    ctaText: "Build Business Site",
    bestFor: "Best for established businesses, healthcare centers & B2B firms",
    revisionRounds: 2,
  },
  ecommerce_store: {
    id: "ecommerce_store",
    name: "E-commerce Store",
    category: "web_app",
    setupRupees: 99999,
    monthlyRupees: 0,
    setupPaise: 9999900,
    monthlyPaise: 0,
    description: "Up to 100 products, payment gateway, order alerts on WhatsApp, 2 revision rounds",
    badge: "D2C Brands",
    features: [
      "Up to 100 products with inventory management",
      "Razorpay / UPI / Cards payment gateway setup",
      "Instant WhatsApp order confirmation & tracking alerts",
      "Discount coupons & abandoned cart recovery",
      "Admin dashboard for product updates & sales",
      "2 revision rounds included",
    ],
    ctaText: "Launch E-commerce",
    bestFor: "Best for retail shops, D2C brands & merchandise sellers",
    revisionRounds: 2,
  },
  app_mvp: {
    id: "app_mvp",
    name: "App MVP",
    category: "web_app",
    setupRupees: 299999,
    monthlyRupees: 0,
    setupPaise: 29999900,
    monthlyPaise: 0,
    description: "Android + iOS (cross-platform), 3–5 core features, admin panel, 2 revision rounds",
    badge: "Startups & Scaleups",
    features: [
      "Cross-platform mobile app (Android + iOS)",
      "3 to 5 core features with clean UI/UX",
      "Secure user auth & cloud database backend",
      "Web admin panel to manage users and content",
      "Assistance with Google Play & Apple App Store readiness",
      "2 revision rounds included",
    ],
    ctaText: "Build My App MVP",
    bestFor: "Best for tech startups, booking platforms & internal company tools",
    revisionRounds: 2,
  },
  custom: {
    id: "custom",
    name: "Custom Project",
    category: "web_app",
    setupRupees: 0,
    monthlyRupees: 0,
    setupPaise: 0,
    monthlyPaise: 0,
    description: "Tailored software development, custom AI models, or complex multi-system integrations",
    features: [
      "Custom feature scoping and architecture review",
      "Milestone-based delivery schedule",
      "Full IP & source code transfer upon completion",
      "Dedicated developer hours and SLA",
    ],
    ctaText: "Request Custom Quote",
    bestFor: "Complex web applications, enterprise software, custom bots",
    revisionRounds: 2,
  },
};

export const CARE_PLANS = {
  website_care: {
    id: "website_care",
    name: "Website Care Plan",
    monthlyRupees: 1999,
    monthlyPaise: 199900,
    description: "Updates, backups, small edits (up to 2 hours/month), uptime check",
    features: [
      "Weekly security & plugin updates",
      "Automated daily cloud backups",
      "Up to 2 hours of small content edits per month",
      "24×7 uptime monitoring & crash alerts",
    ],
  },
  app_care: {
    id: "app_care",
    name: "App Care Plan",
    monthlyRupees: 4999,
    monthlyPaise: 499900,
    description: "Bug fixes, OS updates, small edits (up to 4 hours/month)",
    features: [
      "Operating system compatibility updates (iOS & Android)",
      "Ongoing bug fixes & performance patches",
      "Up to 4 hours of small feature tweaks per month",
      "Server monitoring & database health check",
    ],
  },
};

export const HOURLY_CHANGE_REQUEST_RATE_RUPEES = 1000;
export const GST_RATE = 0.18; // 18% standard GST rate in India

export interface BillOptions {
  gstRegistered?: boolean;
  clientState?: string;
  founderState?: string;
  milestonePlan?: "50_50" | "40_30_30";
  customPrices?: Record<string, number>;
}

export function getPackageWithSettings(pkgId: string, customPrices?: Record<string, number> | null): PricingPackage {
  const base = PACKAGES[pkgId] || PACKAGES.growth;
  if (!customPrices) return base;

  const setupKey = `${pkgId}_setup`;
  const monthlyKey = `${pkgId}_monthly`;
  const setupVal = customPrices[setupKey] ?? customPrices[pkgId] ?? base.setupRupees;
  const monthlyVal = customPrices[monthlyKey] ?? base.monthlyRupees;

  return {
    ...base,
    setupRupees: setupVal,
    setupPaise: setupVal * 100,
    monthlyRupees: monthlyVal,
    monthlyPaise: monthlyVal * 100,
  };
}

export function getAllPackagesWithSettings(customPrices?: Record<string, number> | null): Record<string, PricingPackage> {
  if (!customPrices) return PACKAGES;
  const result: Record<string, PricingPackage> = {};
  for (const [id] of Object.entries(PACKAGES)) {
    result[id] = getPackageWithSettings(id, customPrices);
  }
  return result;
}

export interface BillBreakdown {
  packageId: string;
  packageName: string;
  originalSetup: number;
  setup: number; // after founding offer if applicable
  monthly: number;
  subtotal: number; // setup + monthly
  isGst: boolean;
  gstRate: number;
  gst: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalFirstBill: number;
  milestonePlan: "50_50" | "40_30_30";
  advance: number;
  midMilestone: number;
  finalBill: number;
  foundingOfferApplied: boolean;
  monthlyRetainerWithGst: number;
}

/**
 * Format any number in Indian Rupee format with ₹ symbol
 * e.g. formatINR(19999) => "₹19,999"
 */
export function formatINR(rupees: number): string {
  const rounded = Math.round(rupees);
  return "₹" + new Intl.NumberFormat("en-IN").format(rounded);
}

export function formatPaise(paise: number): string {
  return formatINR(paise / 100);
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return Math.round(paise / 100);
}

export function calculateMilestoneParts(feeRupees: number, plan: "50_50" | "40_30_30"): number[] {
  const fee = Math.round(feeRupees);
  if (plan === "40_30_30") {
    const adv = Math.round(fee * 0.4);
    const mid = Math.round(fee * 0.3);
    const fin = fee - (adv + mid);
    return [adv, mid, fin];
  } else {
    const adv = Math.round(fee * 0.5);
    const fin = fee - adv;
    return [adv, fin];
  }
}

/**
 * Calculate complete bill breakdown for a package or project
 * - Founding offer: 50% off setup / project fee
 * - GST switch: if gstRegistered is false, 0% GST and no GST added anywhere
 * - Milestones:
 *   - If setup > ₹1,00,000 or milestonePlan is "40_30_30":
 *     Advance 40%, Mid-project 30%, Final 30% (+ month 1 if AI service)
 *   - Otherwise:
 *     Advance 50%, Mid-project 0%, Final 50% (+ month 1 if AI service)
 */
export function calculateBill(
  packageKey: string,
  foundingOffer: boolean = false,
  options: BillOptions = {}
): BillBreakdown {
  const pkg = getPackageWithSettings(packageKey.toLowerCase(), options.customPrices);
  const originalSetup = pkg.setupRupees;
  const setup = foundingOffer ? Math.round(originalSetup * 0.5) : originalSetup;
  const monthly = pkg.monthlyRupees;

  const isGst = Boolean(options.gstRegistered);
  const gstRate = isGst ? GST_RATE : 0.0;
  const subtotal = setup + monthly;

  // State-based GST split
  const founderState = (options.founderState || "Karnataka").toLowerCase().trim();
  const clientState = (options.clientState || "Karnataka").toLowerCase().trim();
  const isInterState = isGst && (founderState !== clientState);

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isGst) {
    if (isInterState) {
      igst = Math.round(subtotal * 0.18);
    } else {
      cgst = Math.round(subtotal * 0.09);
      sgst = cgst; // SGST = same as CGST
    }
  }

  const gst = isGst ? (isInterState ? igst : cgst + sgst) : 0;
  const totalFirstBill = subtotal + gst;

  // Milestones: 40/30/30 for projects > ₹1,00,000 or explicitly set
  const isLargeProject = setup > 100000;
  const plan: "50_50" | "40_30_30" = options.milestonePlan || (isLargeProject ? "40_30_30" : "50_50");

  let advance = 0;
  let midMilestone = 0;
  let finalBill = 0;

  const calcMilestoneGst = (amount: number) => {
    if (!isGst) return 0;
    if (isInterState) return Math.round(amount * 0.18);
    const half = Math.round(amount * 0.09);
    return half * 2;
  };

  if (plan === "40_30_30") {
    // advance = round(fee * %), last milestone = fee - sum of earlier parts
    const advSub = Math.round(setup * 0.4);
    const midSub = Math.round(setup * 0.3);
    const finSub = setup - (advSub + midSub);

    advance = advSub + calcMilestoneGst(advSub);
    midMilestone = midSub + calcMilestoneGst(midSub);
    finalBill = finSub + calcMilestoneGst(finSub);
  } else {
    // 50/50 plan
    const advSub = Math.round(setup * 0.5);
    const finSub = setup - advSub;

    advance = advSub + calcMilestoneGst(advSub);
    midMilestone = 0;
    finalBill = finSub + calcMilestoneGst(finSub);
  }

  // Monthly retainer (for AI services)
  const monthlyGst = isGst ? (isInterState ? Math.round(monthly * 0.18) : Math.round(monthly * 0.09) * 2) : 0;
  const monthlyRetainerWithGst = monthly + monthlyGst;

  // Add monthly to final bill if AI service
  if (pkg.category === "ai_service" && monthly > 0) {
    finalBill += monthlyRetainerWithGst;
  }

  return {
    packageId: pkg.id,
    packageName: pkg.name,
    originalSetup,
    setup,
    monthly,
    subtotal,
    isGst,
    gstRate,
    gst,
    cgst,
    sgst,
    igst,
    totalFirstBill,
    milestonePlan: plan,
    advance,
    midMilestone,
    finalBill,
    foundingOfferApplied: foundingOffer,
    monthlyRetainerWithGst,
  };
}
