import { DEMO_NUMBER, WHATSAPP_NUMBER, CITY } from "./site";
import { VerticalContent } from "./clinics";

export const salonsContent: VerticalContent = {
  slug: "salons",
  seoTitle: "AI Receptionist & Appointment Booking for Salons | AgentWala",
  seoDescription:
    "AgentWala answers your salon & spa calls and WhatsApp 24×7, books appointments for stylists and sends reminders in Hindi and English.",
  badge: "AI receptionist for salons & spas",
  heroH1: "Never miss a salon booking again.",
  heroSubtitle:
    "AgentWala answers client calls and WhatsApp 24×7, books stylists directly into your calendar, and sends reminders — in Hindi, English and Hinglish.",
  heroCtaPrimary: "Book a live demo on WhatsApp",
  heroCtaSecondary: "Build a demo for my salon",
  demoLineText: `Book a live demo on WhatsApp: ${WHATSAPP_NUMBER} · Instant response in Hindi or English`,
  chatMockup: {
    avatarTitle: "Glam Studio & Spa",
    avatarInitials: "GS",
    statusText: "AI receptionist · online 24×7",
    messages: [
      {
        id: "m1",
        sender: "patient",
        text: "Saturday afternoon hair coloring slot milega?",
        time: "11:20 AM",
      },
      {
        id: "m2",
        sender: "agent",
        text: "Haan ji! Saturday 2:30 PM aur 4:00 PM available hai. Aapka preferred stylist kaun hai?",
        time: "11:20 AM",
      },
      {
        id: "m3",
        sender: "patient",
        text: "Rohit. 2:30 PM book kar do.",
        time: "11:21 AM",
      },
      {
        id: "m4",
        sender: "agent",
        text: "Done! Saturday 2:30 PM with Rohit. Salon address aur reminder WhatsApp pe bhej diya hai.",
        time: "11:21 AM",
      },
    ],
    confirmationChip: "Added to salon calendar",
  },
  builtForTitle: "Built for",
  builtForItems: [
    "Hair salons",
    "Luxury spas",
    "Nail bars",
    "Skin aesthetic studios",
    "Barbershops",
    "Bridal studios",
  ],
  problemH2: "Clients book another salon when your front desk is busy with hair washes.",
  problemCards: [
    {
      title: "Peak hour rush",
      description:
        "Front desk staff cannot answer ringing phones while attending walk-ins. AI answers instantly.",
    },
    {
      title: "After 9 pm bookings",
      description:
        "Clients decide to get treatments late at night when salons are shut. Never lose night bookings.",
      statBadge: "Impact",
    },
    {
      title: "Zero no-shows",
      description:
        "Automated WhatsApp reminders prevent clients from forgetting appointments.",
    },
  ],
  servicesH2: "Your salon receptionist on phone & WhatsApp.",
  servicesSubtitle: "Full salon booking coverage without hiring extra front desk shifts.",
  serviceCards: [
    {
      title: "AI Receptionist",
      icon: "phone",
      description:
        "Answers calls, schedules stylists, shares pricing for keratin, highlights and facials, and navigates parking directions.",
      bestFor: "Best for busy premium salons and studios",
    },
    {
      title: "WhatsApp Booking Agent",
      icon: "whatsapp",
      description:
        "Shares service menu card PDF, books time slots, and sends morning appointment reminder nudges.",
      bestFor: "Best for salons with high Instagram DM & WhatsApp enquiries",
    },
  ],
  crossSell: {
    text: "Run a clinic instead?",
    linkText: "See AgentWala for clinics",
    targetVertical: "clinics",
  },
  howItWorksH2: "Live in three steps.",
  steps: [
    {
      number: 1,
      title: "Free 20-minute call",
      description: "We review your salon menu, timings, and stylist schedules.",
    },
    {
      number: 2,
      title: "We build and test it",
      description: "Trained on your service rates and tested on 50 real client questions.",
    },
    {
      number: 3,
      title: "Forward calls, go live",
      description: "Forward your reception number and start receiving booked slots in your calendar.",
    },
  ],
  pricingH2: "Simple salon pricing. Works every shift.",
  pricingSubtext: "Prices exclude 18% GST. Founding offer: 50% off setup for first 5 salons.",
  foundingBanner: "Founding salon offer — first 5 salons: setup fee waived!",
  plans: [
    {
      packageId: "starter",
      displayName: "WhatsApp Bot",
      priceOverrideMonthly: 5999,
      priceOverrideSetup: 0,
      setupNote: "no setup fee, 3-month minimum",
      features: [
        "WhatsApp menu & rate card sharing",
        "Stylist appointment booking",
        "Location & timings FAQs",
        "Up to ~1,000 conversations",
      ],
      ctaText: "Start with WhatsApp",
    },
    {
      packageId: "growth",
      displayName: "Salon Receptionist",
      priceOverrideMonthly: 12999,
      priceOverrideSetup: 9999,
      setupNote: "₹9,999 setup, waived for founding salons",
      badge: "Most popular",
      isPrimary: true,
      features: [
        "Voice receptionist + WhatsApp agent",
        "600 call minutes included then ₹8/min",
        "Stylist scheduling & calendar sync",
        "Hindi + English conversation",
        "WhatsApp booking reminders",
      ],
      ctaText: "Get Salon Receptionist",
    },
    {
      packageId: "pro",
      displayName: "Multi-outlet Chain",
      priceOverrideMonthly: 29999,
      priceOverrideSetup: 35000,
      setupNote: "custom setup",
      features: [
        "Multi-branch salon routing",
        "CRM & POS integration",
        "Client re-engagement & loyalty nudges",
        "Monthly performance review",
      ],
      ctaText: "Talk to us",
    },
  ],
  founderQuote: "We're a small team in Rewa, MP. You'll talk to me, not a support queue — and if the agent gets something wrong, I fix it that week.",
  faqs: [
    {
      question: "Can it recommend specific stylists?",
      answer: "Yes, it knows each stylist's roster, specialty, and available slots.",
    },
    {
      question: "Can it send our salon menu and rate card?",
      answer: "Yes, it automatically sends your PDF menu or rate list on WhatsApp when requested.",
    },
    {
      question: "Do I need new hardware?",
      answer: "No, it works with call forwarding from your existing landline or mobile.",
    },
    {
      question: "Can clients cancel or reschedule?",
      answer: "Yes, clients can reschedule on call or WhatsApp according to your policy.",
    },
  ],
  formH2: "Hear it answer your salon's calls.",
  formSubtitle: "We'll build a custom demo agent trained on your salon services in 48 hours.",
  formNamePlaceholder: "Ananya Roy",
  formBusinessPlaceholder: "Glam Studio",
  formBusinessLabel: "Salon name and location",
  formButtonText: "Build my free demo",
  formSuccessMessage: "We've received your salon details! We'll WhatsApp you within one working day.",
  formWhatsAppPrefill: "Hi AgentWala! I want to try the salon receptionist demo.",
};

