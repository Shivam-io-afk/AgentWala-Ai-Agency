import { DEMO_NUMBER, WHATSAPP_NUMBER, EMAIL, CITY, FOUNDER_NAME, FOUNDER_PHOTO } from "./site";

export interface ChatMessage {
  id: string;
  sender: "patient" | "agent";
  text: string;
  time: string;
}

export interface VerticalContent {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  badge: string;
  heroH1: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  demoLineText: string;
  chatMockup: {
    avatarTitle: string;
    avatarInitials: string;
    statusText: string;
    messages: ChatMessage[];
    confirmationChip: string;
  };
  builtForTitle: string;
  builtForItems: string[];
  problemH2: string;
  problemCards: {
    title: string;
    description: string;
    statBadge?: string;
  }[];
  servicesH2: string;
  servicesSubtitle?: string;
  serviceCards: {
    title: string;
    icon: "phone" | "whatsapp" | "content" | "order";
    description: string;
    bullets?: string[];
    bestFor?: string;
  }[];
  crossSell?: {
    text: string;
    linkText: string;
    targetVertical: string;
  };
  howItWorksH2: string;
  steps: {
    number: number;
    title: string;
    description: string;
  }[];
  pricingH2: string;
  pricingSubtext: string;
  foundingBanner: string;
  plans: {
    packageId: string;
    displayName: string;
    priceOverrideMonthly?: number;
    priceOverrideSetup?: number;
    setupNote: string;
    badge?: string;
    isPrimary?: boolean;
    features: string[];
    ctaText: string;
  }[];
  founderQuote: string;
  faqs: {
    question: string;
    answer: string;
  }[];
  formH2: string;
  formSubtitle: string;
  formNamePlaceholder: string;
  formBusinessPlaceholder: string;
  formBusinessLabel: string;
  formButtonText: string;
  formSuccessMessage: string;
  formWhatsAppPrefill: string;
}

export const clinicsContent: VerticalContent = {
  slug: "clinics",
  seoTitle: "AI Receptionist for Clinics in India | AgentWala",
  seoDescription:
    "AgentWala answers your clinic's calls and WhatsApp 24×7, books appointments straight into your calendar and sends reminders in Hindi, English and Hinglish. Live within a week.",
  badge: "AI receptionist for clinics",
  heroH1: "Never miss a patient call again.",
  heroSubtitle:
    "AgentWala answers your clinic's calls and WhatsApp 24×7, books appointments straight into your calendar and sends reminders — in Hindi, English and Hinglish. Live within a week, on your existing number.",
  heroCtaPrimary: "Call our demo receptionist",
  heroCtaSecondary: "Build a demo for my clinic",
  demoLineText: `Demo line: ${DEMO_NUMBER} · Ask for an appointment in Hindi or English — it takes 30 seconds.`,
  chatMockup: {
    avatarTitle: "Sunrise Dental Clinic",
    avatarInitials: "SC",
    statusText: "AI receptionist · online 24×7",
    messages: [
      {
        id: "m1",
        sender: "patient",
        text: "Kal shaam 6 baje appointment mil sakta hai?",
        time: "10:14 AM",
      },
      {
        id: "m2",
        sender: "agent",
        text: "Haan ji! Kal 6:00 PM ka slot free hai. Aapka naam bata dijiye, main book kar deta hoon.",
        time: "10:14 AM",
      },
      {
        id: "m3",
        sender: "patient",
        text: "Priya Shah",
        time: "10:15 AM",
      },
      {
        id: "m4",
        sender: "agent",
        text: "Booked, Priya ji. Wednesday, 6:00 PM. Ek reminder aapko kal subah WhatsApp par mil jayega.",
        time: "10:15 AM",
      },
    ],
    confirmationChip: "Added to clinic calendar",
  },
  builtForTitle: "Built for",
  builtForItems: [
    "Dental clinics",
    "Skin & hair clinics",
    "Physiotherapy",
    "Eye clinics",
    "Diagnostic labs",
    "IVF & women's health",
  ],
  problemH2: "Every unanswered call is a patient booking with the clinic down the road.",
  problemCards: [
    {
      title: "After 8 pm",
      description:
        "Patients call when the clinic is closed or the front desk is busy. Your AI receptionist picks up every time.",
    },
    {
      title: "2 calls at once",
      description:
        "A receptionist handles one call at a time. The AI answers every line in parallel, so no one hears a busy tone.",
      statBadge: "₹14–18k",
    },
    {
      title: "Fewer no-shows",
      description:
        "Every booking gets a WhatsApp confirmation and a reminder the morning of the appointment.",
    },
  ],
  servicesH2: "One receptionist on the phone and on WhatsApp.",
  servicesSubtitle: "Full patient reception without managing shifts, sick leaves, or language barriers.",
  serviceCards: [
    {
      title: "AI Receptionist",
      icon: "phone",
      description:
        "Answers every call in Hindi, English and Hinglish; books, moves and cancels appointments; knows your doctors, timings, fees and location; transfers urgent calls to staff instantly.",
      bullets: [
        "Speaks fluent Hindi, English & Hinglish",
        "Direct Google Calendar & clinic software sync",
        "Emergency and urgent symptom triage routing",
      ],
      bestFor: "Best for high call-volume dental, skin & specialty clinics",
    },
    {
      title: "WhatsApp Agent",
      icon: "whatsapp",
      description:
        "Replies 24×7; shares fees, treatment info and directions; sends confirmations and reminders; hands complex questions to your team with the full chat.",
      bullets: [
        "Instant instant reply 24×7",
        "Pre-op instructions & clinic location map cards",
        "Automated morning appointment reminders",
      ],
      bestFor: "Best for clinics answering repetitive fee and timing chats",
    },
  ],
  crossSell: {
    text: "Run a salon instead?",
    linkText: "See AgentWala for salons",
    targetVertical: "salons",
  },
  howItWorksH2: "Live in three steps.",
  steps: [
    {
      number: 1,
      title: "Free 20-minute call",
      description:
        "Tell us where you lose patients. We pick the one agent that fixes it first.",
    },
    {
      number: 2,
      title: "We build and test it",
      description:
        "We build and test it on 50 real patient questions; you call it yourself before go-live.",
    },
    {
      number: 3,
      title: "Forward calls, go live",
      description:
        "Forward your calls, go live; monthly report of calls answered and appointments booked.",
    },
  ],
  pricingH2: "Less than one receptionist. Works every shift.",
  pricingSubtext:
    "Front-desk hire costs ₹14–18k/month for one shift, one language, one call at a time. Prices exclude 18% GST. WhatsApp message charges from Meta billed at cost.",
  foundingBanner:
    "Founding clinic offer — first 5 clinics: setup fee waived, and we build your demo agent before you pay anything.",
  plans: [
    {
      packageId: "starter",
      displayName: "WhatsApp",
      priceOverrideMonthly: 5999,
      priceOverrideSetup: 0,
      setupNote: "no setup fee, 3-month minimum",
      features: [
        "WhatsApp agent 24×7",
        "Appointment booking & reminders",
        "Clinic fees, timings & directions FAQs",
        "Up to ~1,000 conversations",
        "Staff escalation with full chat history",
      ],
      ctaText: "Start with WhatsApp",
    },
    {
      packageId: "growth",
      displayName: "Receptionist",
      priceOverrideMonthly: 12999,
      priceOverrideSetup: 9999,
      setupNote: "₹9,999 setup, waived for founding clinics",
      badge: "Most clinics",
      isPrimary: true,
      features: [
        "AI receptionist + WhatsApp agent",
        "600 call minutes included then ₹8/min",
        "Google Calendar booking sync",
        "Answers in Hindi, English & Hinglish",
        "Morning reminder nudges on WhatsApp",
        "Monthly calls & bookings report",
      ],
      ctaText: "Get the receptionist",
    },
    {
      packageId: "pro",
      displayName: "Multi-branch",
      priceOverrideMonthly: 29999,
      priceOverrideSetup: 35000,
      setupNote: "setup quoted per branch",
      features: [
        "Every branch and doctor in one agent",
        "Clinic software / EMR / CRM integration",
        "Outbound follow-up and recall calls",
        "Dedicated VIP line & priority SLA",
        "Monthly optimisation call with founder",
      ],
      ctaText: "Talk to us",
    },
  ],
  founderQuote: `We're a small team in ${CITY}. You'll talk to me, not a support queue — and if the agent gets something wrong, I fix it that week.`,
  faqs: [
    {
      question: "Which languages can the agent speak?",
      answer:
        "Hindi, English, Hinglish by default; Marathi, Gujarati, Tamil and others on request.",
    },
    {
      question: "Will it give medical advice?",
      answer:
        "No. Bookings, timings, fees, directions only. Clinical or urgent questions go straight to staff with the chat attached.",
    },
    {
      question: "Do I need a new number or software?",
      answer:
        "No. Keep your number, forward calls when busy or after hours. Bookings go to Google Calendar or a simple sheet.",
    },
    {
      question: "What does WhatsApp cost on top?",
      answer:
        "Meta charges for some business messages like reminders; passed on at cost, shown on the monthly bill.",
    },
    {
      question: "Is patient data safe?",
      answer:
        "Only what booking needs, stored securely, data-processing agreement with every clinic in line with India's DPDP Act.",
    },
  ],
  formH2: "Hear it answer your own clinic's calls.",
  formSubtitle:
    "Send us a few details and we'll build a free demo receptionist for your clinic in 48 hours — before you pay anything.",
  formNamePlaceholder: "Dr. Priya Mehta",
  formBusinessPlaceholder: "Sunrise Dental Clinic",
  formBusinessLabel: "Clinic name and type",
  formButtonText: "Build my free demo",
  formSuccessMessage: "We've received your clinic's details! We'll WhatsApp you within one working day.",
  formWhatsAppPrefill:
    "Hi AgentWala team! I just requested a free demo receptionist for my clinic. Can we connect?",
};

