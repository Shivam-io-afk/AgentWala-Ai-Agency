import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1C1F3A",
};

export const metadata: Metadata = {
  title: "AI Receptionist for Clinics in India | AgentWala",
  description:
    "AgentWala answers your clinic's calls and WhatsApp 24×7, books appointments straight into your calendar and sends reminders in Hindi, English and Hinglish. Live within a week.",
  keywords: [
    "AI receptionist for clinics",
    "clinic appointment booking AI",
    "WhatsApp bot for dental clinic",
    "healthcare AI receptionist India",
    "multilingual phone answering agent",
  ],
  authors: [{ name: "Shivam" }],
  creator: "AgentWala",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://agent-wala-ai-agency.vercel.app"),
  openGraph: {
    title: "AI Receptionist for Clinics in India | AgentWala",
    description:
      "Never miss a patient call again. AgentWala answers calls and WhatsApp 24×7, books appointments into your calendar and sends reminders in Hindi, English & Hinglish.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://agent-wala-ai-agency.vercel.app",
    siteName: "AgentWala",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AgentWala - AI Receptionist for Clinics",
      },
    ],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

import { NetworkLoadingProvider } from "@/components/network-loading-indicator";
import { DevToolbar } from "@/components/dev-toolbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${inter.variable} ${mono.variable}`}
    >
      <body className="font-sans antialiased text-[#1C1F3A] bg-white">
        <NetworkLoadingProvider>
          {children}
          <DevToolbar />
        </NetworkLoadingProvider>
      </body>
    </html>
  );
}

