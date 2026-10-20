/**
 * Single source of truth for all AgentWala pricing, packages, and billing calculations.
 */

export interface PricingPackage {
  id: string;
  name: string;
  verticalLabels?: Record<string, string>; // e.g. clinics: "Receptionist"
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
}

export const PACKAGES: Record<string, PricingPackage> = {
  starter: {
    id: "starter",
    name: "Starter",
    verticalLabels: {
      clinics: "WhatsApp",
    },
    setupRupees: 15000,
    monthlyRupees: 7999,
    setupPaise: 1500000,
    monthlyPaise: 799900,
    description: "1 WhatsApp or website bot with FAQs and booking support",
    badge: "For solo practitioners",
    features: [
      "1 WhatsApp or website bot",
      "FAQs and lead capture",
      "Calendar booking link sharing",
      "Up to ~1,000 conversations / month",
      "Hand-off to clinic staff with full chat",
    ],
    ctaText: "Start with Starter",
    bestFor: "Best for clinics, salons, real estate",
  },
  growth: {
    id: "growth",
    name: "Growth",
    verticalLabels: {
      clinics: "Receptionist",
    },
    setupRupees: 35000,
    monthlyRupees: 19999,
    setupPaise: 3500000,
    monthlyPaise: 1999900,
    recommended: true,
    badge: "Recommended",
    description: "AI receptionist on call + WhatsApp agent 24×7",
    features: [
      "AI receptionist (answers in Hindi, English & Hinglish)",
      "WhatsApp agent 24×7",
      "1,000 call minutes included (extra ₹8/min)",
      "Calendar booking & appointment management",
      "Google Calendar / CRM integration",
      "Automated WhatsApp reminders & confirmations",
      "Monthly performance report",
    ],
    ctaText: "Get Growth",
    bestFor: "Best for coaching, SMBs, startups & high-volume clinics",
  },
  pro: {
    id: "pro",
    name: "Pro",
    verticalLabels: {
      clinics: "Multi-branch",
    },
    setupRupees: 75000,
    monthlyRupees: 49999,
    setupPaise: 7500000,
    monthlyPaise: 4999900,
    description: "Full multi-doctor & multi-location suite with outbound care",
    badge: "Multi-location",
    features: [
      "Multiple AI agents (voice + WhatsApp)",
      "Multi-branch & multi-doctor routing",
      "Clinic software / EMR / CRM integration",
      "Outbound follow-up & recall calls",
      "Custom analytics & weekly transcript audits",
      "Dedicated account manager & SLA",
    ],
    ctaText: "Talk to us",
    bestFor: "Best for multi-branch clinics, hospital chains & large D2C brands",
  },
  creator: {
    id: "creator",
    name: "Creator Engine",
    verticalLabels: {},
    setupRupees: 0,
    monthlyRupees: 14999,
    setupPaise: 0,
    monthlyPaise: 1499900,
    description: "Organic content engine & Instagram DM automation",
    badge: "Personal brands",
    features: [
      "12 reel scripts a month",
      "Hooks, captions, hashtags",
      "Posting calendar & schedule",
      "Instagram DM auto-replies & qualification",
      "WhatsApp community engagement",
    ],
    ctaText: "For creators",
    bestFor: "Best for creators, doctors building personal brands & influencers",
  },
};

export const GST_RATE = 0.18; // 18% GST

export interface BillBreakdown {
  packageId: string;
  packageName: string;
  originalSetup: number;
  setup: number; // after founding offer if applicable
  monthly: number;
  subtotal: number; // setup + monthly
  gst: number; // 18% of subtotal
  totalFirstBill: number; // subtotal + gst
  advance: number; // 50% of setup + 18% GST on that setup
  finalBill: number; // balance setup + month 1 + GST
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

/**
 * Convert paise to formatted INR string
 */
export function formatPaise(paise: number): string {
  return formatINR(paise / 100);
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return Math.round(paise / 100);
}

/**
 * Calculate complete bill breakdown for a package
 * - Founding offer: 50% off setup
 * - Advance: 50% of setup + 18% GST
 * - Final bill: remaining setup + month 1 + 18% GST
 */
export function calculateBill(packageKey: string, foundingOffer: boolean = false): BillBreakdown {
  const pkg = PACKAGES[packageKey.toLowerCase()] || PACKAGES.growth;
  const originalSetup = pkg.setupRupees;
  const setup = foundingOffer ? Math.round(originalSetup * 0.5) : originalSetup;
  const monthly = pkg.monthlyRupees;

  const subtotal = setup + monthly;
  const gst = Math.round(subtotal * GST_RATE);
  const totalFirstBill = subtotal + gst;

  // Advance = 50% of setup + GST on that advance
  const advanceSubtotal = Math.round(setup * 0.5);
  const advanceGst = Math.round(advanceSubtotal * GST_RATE);
  const advance = advanceSubtotal + advanceGst;

  // Final bill = totalFirstBill - advance
  const finalBill = totalFirstBill - advance;

  const monthlyGst = Math.round(monthly * GST_RATE);
  const monthlyRetainerWithGst = monthly + monthlyGst;

  return {
    packageId: pkg.id,
    packageName: pkg.name,
    originalSetup,
    setup,
    monthly,
    subtotal,
    gst,
    totalFirstBill,
    advance,
    finalBill,
    foundingOfferApplied: foundingOffer,
    monthlyRetainerWithGst,
  };
}

