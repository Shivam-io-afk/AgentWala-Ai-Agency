"use client";

import React from "react";
import Link from "next/link";
import { VerticalContent } from "@/content/clinics";
import {
  RobotIcon,
  PhoneIcon,
  WhatsAppIcon,
  CheckIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ContentEngineIcon,
  OrderAgentIcon,
} from "./icons";
import { ChatMockup } from "./chat-mockup";
import { FAQAccordion } from "./faq-accordion";
import { DemoForm } from "./demo-form";
import { PACKAGES, formatINR } from "@/lib/pricing";
import {
  DEMO_NUMBER,
  DEMO_NUMBER_RAW,
  WHATSAPP_NUMBER,
  WHATSAPP_NUMBER_RAW,
  EMAIL,
  CITY,
  FOUNDER_NAME,
} from "@/content/site";
import { verticalExists } from "@/content";

interface LandingPageProps {
  content: VerticalContent;
}

export function LandingPage({ content }: LandingPageProps) {
  const scrollToForm = (planId?: string) => {
    if (planId && typeof (window as any).selectDemoPlan === "function") {
      (window as any).selectDemoPlan(planId);
    } else {
      const el = document.getElementById("demo-form");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const showCrossSell = content.crossSell && verticalExists(content.crossSell.targetVertical);

  return (
    <div className="min-h-screen bg-white text-[#1C1F3A] font-sans antialiased selection:bg-[#FDB91F] selection:text-[#1C1F3A]">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#ECE6D8] px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group focus-visible:outline-2 focus-visible:outline-[#FDB91F]">
            <div className="w-10 h-10 rounded-xl bg-[#FDB91F] flex items-center justify-center text-[#1C1F3A] shadow-xs group-hover:scale-105 transition-transform">
              <RobotIcon className="w-6 h-6 text-[#1C1F3A]" />
            </div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-[#1C1F3A]">
              AgentWala
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-[#4A4F66]">
            <a href="#how-it-works" className="hover:text-[#1C1F3A] transition-colors">
              How it works
            </a>
            <a href="#services" className="hover:text-[#1C1F3A] transition-colors">
              Services
            </a>
            <a href="#pricing" className="hover:text-[#1C1F3A] transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[#1C1F3A] transition-colors">
              FAQ
            </a>
          </nav>

          {/* CTA & Admin Link */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="hidden sm:inline-flex text-xs font-semibold px-3 py-2 text-[#4A4F66] hover:text-[#1C1F3A] border border-[#ECE6D8] rounded-lg transition-colors"
            >
              Admin OS
            </Link>
            <button
              type="button"
              onClick={() => scrollToForm("growth")}
              className="bg-[#1C1F3A] hover:bg-[#14172C] active:scale-[0.98] text-white text-[14.5px] font-semibold px-5 py-3 rounded-xl transition-all shadow-sm min-h-[48px] flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-[#FDB91F]"
            >
              Book free demo
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Cream Background) */}
      <section className="bg-[#FBF7EE] pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 border-b border-[#ECE6D8]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Column: Headline and Call to Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF0D7] border border-[#EEDB9F] text-[#9A6400] text-xs font-bold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-[#FDB91F]"></span>
              <span>{content.badge}</span>
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-[58px] leading-[1.08] text-[#1C1F3A] tracking-tight text-balance">
              {content.heroH1}
            </h1>

            <p className="text-base sm:text-lg text-[#4A4F66] leading-relaxed max-w-xl font-normal">
              {content.heroSubtitle}
            </p>

            {/* Hero Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center">
              <a
                href={`tel:${DEMO_NUMBER_RAW}`}
                className="bg-[#FDB91F] hover:bg-[#E5A413] text-[#1C1F3A] font-bold text-base px-6 py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2.5 min-h-[48px] focus-visible:outline-2 focus-visible:outline-[#1C1F3A]"
              >
                <PhoneIcon className="w-5 h-5 text-[#1C1F3A]" />
                <span>{content.heroCtaPrimary}</span>
              </a>

              <button
                type="button"
                onClick={() => scrollToForm("growth")}
                className="bg-[#1C1F3A] hover:bg-[#14172C] text-white font-semibold text-base px-6 py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 min-h-[48px] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#FDB91F]"
              >
                <span>{content.heroCtaSecondary}</span>
                <ArrowRightIcon className="w-4 h-4 text-[#FDB91F]" />
              </button>
            </div>

            {/* Small demo phone line callout */}
            <div className="pt-1 text-xs sm:text-[13.5px] text-[#727791] flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-[#1C1F3A]">Demo line: {DEMO_NUMBER}</span>
              <span>·</span>
              <span>Ask for an appointment in Hindi or English — it takes 30 seconds.</span>
            </div>
          </div>

          {/* Right Column: WhatsApp Chat Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <ChatMockup
              avatarTitle={content.chatMockup.avatarTitle}
              avatarInitials={content.chatMockup.avatarInitials}
              statusText={content.chatMockup.statusText}
              messages={content.chatMockup.messages}
              confirmationChip={content.chatMockup.confirmationChip}
            />
          </div>
        </div>
      </section>

      {/* 3. Built For Strip */}
      <section className="bg-white py-8 border-b border-[#ECE6D8] px-4 sm:px-6 overflow-hidden">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#727791] flex-shrink-0">
            {content.builtForTitle}
          </span>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2 text-sm font-semibold text-[#1C1F3A]">
            {content.builtForItems.map((item, idx) => (
              <span key={idx} className="flex items-center gap-2">
                <span>{item}</span>
                {idx !== content.builtForItems.length - 1 && (
                  <span className="text-[#D8D2C2] hidden sm:inline">/</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Problem Section */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
        <div className="max-w-[1200px] mx-auto space-y-14">
          <div className="max-w-2xl">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1C1F3A] leading-tight text-balance">
              {content.problemH2}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {content.problemCards.map((card, idx) => (
              <div
                key={idx}
                className="bg-[#FBF7EE] border border-[#ECE6D8] rounded-[18px] p-7 sm:p-8 flex flex-col justify-between space-y-6 hover:border-[#DECDB2] transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-xl sm:text-2xl text-[#1C1F3A]">
                      {card.title}
                    </h3>
                    {card.statBadge && (
                      <span className="text-xs font-mono font-bold bg-[#FAF0D7] text-[#9A6400] px-2.5 py-1 rounded-md">
                        {card.statBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-[14.5px] text-[#4A4F66] leading-relaxed">
                    {card.description}
                  </p>
                </div>
                <div className="w-8 h-1 bg-[#FDB91F] rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. What You Get / Services (Navy Background) */}
      <section id="services" className="bg-[#1C1F3A] text-white py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto space-y-12">
          <div className="space-y-3 max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-wider text-[#FDB91F]">
              Services
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-[42px] leading-tight text-balance text-white">
              {content.servicesH2}
            </h2>
            {content.servicesSubtitle && (
              <p className="text-[#A6ABC8] text-base leading-relaxed">
                {content.servicesSubtitle}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {content.serviceCards.map((service, idx) => (
              <div
                key={idx}
                className="bg-[#252A4A] border border-[#343B66] rounded-[18px] p-8 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FDB91F] text-[#1C1F3A] flex items-center justify-center">
                    {service.icon === "phone" ? (
                      <PhoneIcon className="w-6 h-6 text-[#1C1F3A]" />
                    ) : (
                      <WhatsAppIcon className="w-6 h-6 text-[#1C1F3A]" />
                    )}
                  </div>
                  <h3 className="font-display font-bold text-2xl text-white">
                    {service.title}
                  </h3>
                  <p className="text-[#C4C8E0] text-[15px] leading-relaxed">
                    {service.description}
                  </p>

                  {service.bullets && (
                    <ul className="space-y-2 pt-2 border-t border-[#343B66]">
                      {service.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-center gap-2.5 text-xs sm:text-sm text-[#A6ABC8]">
                          <CheckIcon className="w-4 h-4 text-[#FDB91F] flex-shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {service.bestFor && (
                  <div className="text-xs font-semibold text-[#878EB3] pt-3 border-t border-[#343B66]">
                    {service.bestFor}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Cross sell strip */}
          {showCrossSell && (
            <div className="pt-4 text-center">
              <span className="text-sm text-[#A6ABC8] mr-2">
                {content.crossSell?.text}
              </span>
              <Link
                href={`/${content.crossSell?.targetVertical}`}
                className="text-sm font-bold text-[#FDB91F] hover:underline inline-flex items-center gap-1"
              >
                <span>{content.crossSell?.linkText}</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 6. How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
        <div className="max-w-[1200px] mx-auto space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1C1F3A]">
              {content.howItWorksH2}
            </h2>
            <p className="text-[#4A4F66] text-base">
              No complex setup or engineering needed. Up and running on your current number in 7 days.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {content.steps.map((step) => (
              <div
                key={step.number}
                className="bg-[#FBF7EE] border border-[#ECE6D8] rounded-[18px] p-8 space-y-5"
              >
                <div className="w-10 h-10 rounded-full bg-[#FDB91F] text-[#1C1F3A] font-display font-extrabold text-base flex items-center justify-center">
                  {step.number}
                </div>
                <h3 className="font-display font-bold text-xl text-[#1C1F3A]">
                  {step.title}
                </h3>
                <p className="text-[14.5px] text-[#4A4F66] leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Pricing (Cream Background) */}
      <section id="pricing" className="bg-[#FBF7EE] py-20 sm:py-28 px-4 sm:px-6 border-y border-[#ECE6D8]">
        <div className="max-w-[1200px] mx-auto space-y-12">
          <div className="max-w-3xl space-y-3">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1C1F3A]">
              {content.pricingH2}
            </h2>
            <p className="text-[#4A4F66] text-[15px] leading-relaxed">
              {content.pricingSubtext}
            </p>
          </div>

          {/* Founding Offer Banner */}
          <div className="bg-[#1C1F3A] text-white p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#343B66] shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#FDB91F] animate-pulse flex-shrink-0"></span>
              <p className="text-sm sm:text-base font-semibold text-white">
                {content.foundingBanner}
              </p>
            </div>
            <button
              type="button"
              onClick={() => scrollToForm("growth")}
              className="bg-[#FDB91F] hover:bg-[#E5A413] text-[#1C1F3A] text-xs sm:text-sm font-bold px-4 py-2 rounded-lg whitespace-nowrap cursor-pointer"
            >
              Claim spot
            </button>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {content.plans.map((plan) => {
              const basePkg = PACKAGES[plan.packageId] || PACKAGES.growth;
              const monthlyPrice = plan.priceOverrideMonthly ?? basePkg.monthlyRupees;
              const isDark = Boolean(plan.isPrimary);

              return (
                <div
                  key={plan.packageId}
                  className={`rounded-[18px] p-7 sm:p-8 flex flex-col justify-between transition-transform duration-200 ${
                    isDark
                      ? "bg-[#1C1F3A] text-white shadow-xl ring-2 ring-[#FDB91F] md:-translate-y-2"
                      : "bg-white text-[#1C1F3A] border border-[#ECE6D8] shadow-card"
                  }`}
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-display font-bold text-2xl ${isDark ? "text-white" : "text-[#1C1F3A]"}`}>
                        {plan.displayName}
                      </h3>
                      {plan.badge && (
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            isDark
                              ? "bg-[#FDB91F] text-[#1C1F3A]"
                              : "bg-[#FAF0D7] text-[#9A6400]"
                          }`}
                        >
                          {plan.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className={`font-mono text-3xl sm:text-4xl font-extrabold ${isDark ? "text-white" : "text-[#1C1F3A]"}`}>
                          {formatINR(monthlyPrice)}
                        </span>
                        <span className={`text-sm ${isDark ? "text-[#A6ABC8]" : "text-[#727791]"}`}>
                          /month
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${isDark ? "text-[#A6ABC8]" : "text-[#727791]"}`}>
                        {plan.setupNote}
                      </p>
                    </div>

                    {/* Features list */}
                    <ul className="space-y-3 pt-4 border-t border-[#ECE6D8]/20">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-[13.5px] leading-snug">
                          <CheckIcon
                            className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                              isDark ? "text-[#FDB91F]" : "text-[#2E7D5B]"
                            }`}
                          />
                          <span className={isDark ? "text-[#ECEBF7]" : "text-[#4A4F66]"}>
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8">
                    <button
                      type="button"
                      onClick={() => scrollToForm(plan.packageId)}
                      className={`w-full min-h-[48px] rounded-xl font-semibold text-sm sm:text-base transition-all flex items-center justify-center cursor-pointer shadow-xs ${
                        isDark
                          ? "bg-[#FDB91F] hover:bg-[#E5A413] text-[#1C1F3A] font-bold"
                          : "bg-white hover:bg-[#FBF7EE] text-[#1C1F3A] border-2 border-[#1C1F3A]"
                      }`}
                    >
                      {plan.ctaText}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. Founder Strip */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white border-b border-[#ECE6D8]">
        <div className="max-w-[800px] mx-auto flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full bg-[#1C1F3A] text-[#FDB91F] font-display font-bold text-2xl flex items-center justify-center border-4 border-[#FDB91F] flex-shrink-0 shadow-md">
            S
          </div>
          <div className="space-y-2">
            <blockquote className="text-base sm:text-lg text-[#1C1F3A] font-medium italic leading-relaxed">
              &ldquo;{content.founderQuote}&rdquo;
            </blockquote>
            <p className="text-xs sm:text-sm font-bold text-[#727791] uppercase tracking-wider">
              — {FOUNDER_NAME}, founder of AgentWala ({CITY}, India)
            </p>
          </div>
        </div>
      </section>

      {/* 9. FAQ Section */}
      <section id="faq" className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
        <div className="max-w-[1200px] mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1C1F3A]">
              Questions owners ask us
            </h2>
            <p className="text-[#4A4F66] text-sm sm:text-base">
              Everything you need to know about setting up your AI receptionist.
            </p>
          </div>

          <FAQAccordion faqs={content.faqs} />
        </div>
      </section>

      {/* 10. Demo Form Section */}
      <DemoForm
        h2={content.formH2}
        subtitle={content.formSubtitle}
        namePlaceholder={content.formNamePlaceholder}
        businessPlaceholder={content.formBusinessPlaceholder}
        businessLabel={content.formBusinessLabel}
        buttonText={content.formButtonText}
        successMessage={content.formSuccessMessage}
        verticalSlug={content.slug}
      />

      {/* 11. Footer (Navy) */}
      <footer className="bg-[#1C1F3A] text-[#A6ABC8] py-14 px-4 sm:px-6 border-t border-[#2A2E50]">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FDB91F] flex items-center justify-center text-[#1C1F3A]">
              <RobotIcon className="w-5 h-5 text-[#1C1F3A]" />
            </div>
            <span className="font-display font-bold text-white text-lg">
              AgentWala
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-center text-[#A6ABC8]">
            <span>{CITY}, India</span>
            <span>·</span>
            <a href={`mailto:${EMAIL}`} className="hover:text-white transition-colors">
              {EMAIL}
            </a>
            <span>·</span>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER_RAW.replace(/\+/g, "")}`}
              className="hover:text-white transition-colors"
            >
              WhatsApp {WHATSAPP_NUMBER}
            </a>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#727791]">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <span>© 2026 AgentWala</span>
          </div>
        </div>
      </footer>

      {/* 12. Floating Green WhatsApp Button */}
      <aside aria-label="WhatsApp quick chat" className="fixed bottom-6 right-6 z-50">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER_RAW.replace(/\+/g, "")}?text=${encodeURIComponent(
            content.formWhatsAppPrefill
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="w-14 h-14 bg-[#1F7A3A] hover:bg-[#18632F] text-white rounded-full flex items-center justify-center shadow-float hover:scale-105 active:scale-95 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F7A3A]"
        >
          <WhatsAppIcon className="w-7 h-7 text-white" />
        </a>
      </aside>
    </div>
  );
}

