"use client";

import React, { useEffect, useState } from "react";
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
} from "./icons";
import { ChatMockup } from "./chat-mockup";
import { FAQAccordion } from "./faq-accordion";
import { DemoForm } from "./demo-form";
import { PACKAGES, CARE_PLANS, formatINR, getAllPackagesWithSettings } from "@/lib/pricing";
import {
  DEMO_NUMBER,
  DEMO_NUMBER_RAW,
  WHATSAPP_NUMBER,
  WHATSAPP_NUMBER_RAW,
  WHATSAPP_LINK,
  EMAIL,
  CITY,
  STATE,
  FOUNDER_NAME,
} from "@/config/site";
import { verticalExists } from "@/content";

interface LandingPageProps {
  content: VerticalContent;
  initialSettings?: any;
}

export function LandingPage({ content, initialSettings }: LandingPageProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [pricingTab, setPricingTab] = useState<"ai" | "web_app">("ai");

  useEffect(() => {
    fetch("/api/public/pricing")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.package_prices) setSettings({ package_prices: d.package_prices });
      })
      .catch(() => {});
  }, []);

  const packages = getAllPackagesWithSettings(settings?.package_prices);

  const scrollToForm = (serviceKey?: string) => {
    if (serviceKey && typeof (window as any).selectServiceNeed === "function") {
      (window as any).selectServiceNeed(serviceKey);
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
              onClick={() => scrollToForm("ai_agent")}
              className="bg-[#1C1F3A] hover:bg-[#14172C] active:scale-[0.98] text-white text-[14.5px] font-semibold px-5 py-3 rounded-xl transition-all shadow-sm min-h-[48px] flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-[#FDB91F]"
            >
              Start Project
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Cream Background) */}
      <section className="bg-[#FBF7EE] pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 border-b border-[#ECE6D8]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF0D7] text-[#9A6400] text-xs sm:text-[13px] font-bold tracking-wide">
              <span>{(content as any).heroPill || content.badge}</span>
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-[54px] leading-[1.08] tracking-tight text-[#1C1F3A] text-balance">
              {content.heroH1}
            </h1>

            <p className="text-base sm:text-lg text-[#4A4F66] leading-relaxed max-w-xl text-balance">
              {(content as any).heroSubtext || content.heroSubtitle}
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#FDB91F] hover:bg-[#E5A413] active:scale-[0.98] text-[#1C1F3A] font-bold text-base px-6 py-3.5 rounded-xl transition-all shadow-sm min-h-[48px] flex items-center justify-center gap-2.5 cursor-pointer text-center"
              >
                <WhatsAppIcon className="w-5 h-5 text-[#1C1F3A]" />
                <span>Book a live demo on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => scrollToForm("ai_agent")}
                className="bg-[#1C1F3A] hover:bg-[#14172C] active:scale-[0.98] text-white font-bold text-base px-6 py-3.5 rounded-xl transition-all shadow-sm min-h-[48px] flex items-center justify-center cursor-pointer text-center"
              >
                Get a quote for my business
              </button>
            </div>

            <div className="pt-1 flex items-center gap-2 text-xs sm:text-[13px] text-[#727791]">
              <span className="w-2 h-2 rounded-full bg-[#1F7A3A] animate-pulse"></span>
              <span>
                Book a live demo on WhatsApp: <b>{WHATSAPP_NUMBER}</b> · Ask for an appointment in Hindi or English (30 sec demo)
              </span>
            </div>
          </div>

          {/* Right Column: Animated WhatsApp Chat Mockup */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <ChatMockup {...content.chatMockup} />
          </div>
        </div>
      </section>

      {/* 3. Built For Strip */}
      <section className="bg-white py-10 px-4 sm:px-6 border-b border-[#ECE6D8]">
        <div className="max-w-[1200px] mx-auto space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[#727791] text-center">
            {(content as any).builtForLabel || (content as any).builtForTitle || "Built For Small Businesses"}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {((content as any).builtForTags || (content as any).builtForItems || []).map((tag: string, idx: number) => (
              <span
                key={idx}
                className="px-4 py-2 rounded-full bg-[#FBF7EE] border border-[#ECE6D8] text-xs sm:text-[13px] font-semibold text-[#1C1F3A]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Problem Section */}
      <section className="bg-white py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto space-y-12">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1C1F3A] text-balance">
              {content.problemH2}
            </h2>
            <p className="text-[#4A4F66] text-base leading-relaxed">
              {(content as any).problemSubtitle || ""}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {content.problemCards.map((card: any, idx: number) => (
              <div
                key={idx}
                className="bg-[#FBF7EE] border border-[#ECE6D8] rounded-[18px] p-7 sm:p-8 flex flex-col justify-between space-y-6 hover:border-[#1C1F3A] transition-colors"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#9A6400] bg-[#FAF0D7] px-2.5 py-1 rounded-full">
                      {card.timeTag || card.statBadge || "Impact"}
                    </span>
                    {card.icon === "clock" ? (
                      <ClockIcon className="w-5 h-5 text-[#9A6400]" />
                    ) : (
                      <PhoneIcon className="w-5 h-5 text-[#9A6400]" />
                    )}
                  </div>
                  <h3 className="font-display font-bold text-xl sm:text-2xl text-[#1C1F3A]">
                    {card.title}
                  </h3>
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

      {/* 5. Services Section (Navy Background with 2 Groups) */}
      <section id="services" className="bg-[#1C1F3A] text-white py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <div className="space-y-3 max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-wider text-[#FDB91F]">
              What We Build
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-[42px] leading-tight text-balance text-white">
              AI agents, WhatsApp bots, websites and mobile apps.
            </h2>
            <p className="text-[#A6ABC8] text-base leading-relaxed">
              Every deliverable is production-ready, custom-built for your business, and comes with full code and account ownership.
            </p>
          </div>

          {/* Group 1: AI Agents & WhatsApp Bots */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#FDB91F]"></span>
              <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white">
                Group 1: AI Agents &amp; WhatsApp Bots
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                PACKAGES.starter,
                PACKAGES.growth,
                PACKAGES.pro,
                PACKAGES.creator,
              ].map((service) => (
                <div
                  key={service.id}
                  className="bg-[#252A4A] border border-[#343B66] rounded-[18px] p-6 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FDB91F]/20 text-[#FDB91F]">
                        {service.badge || "AI Service"}
                      </span>
                      <span className="font-mono text-xs text-[#A6ABC8]">
                        Setup: {formatINR(service.setupRupees)}
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-xl text-white">
                      {service.name}
                    </h4>
                    <p className="text-xs text-[#C4C8E0] leading-relaxed">
                      {service.description}
                    </p>

                    <div className="pt-2 border-t border-[#343B66] space-y-1.5">
                      <span className="text-[11px] font-mono text-[#FDB91F] font-bold block">
                        {formatINR(service.monthlyRupees)}/month
                      </span>
                      <ul className="space-y-1">
                        {service.features.slice(0, 3).map((f, i) => (
                          <li key={i} className="text-[11px] text-[#A6ABC8] flex items-center gap-1.5">
                            <CheckIcon className="w-3 h-3 text-[#FDB91F] flex-shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => scrollToForm(service.id)}
                    className="w-full py-2.5 rounded-xl bg-[#FDB91F] hover:bg-[#E5A413] text-[#1C1F3A] font-bold text-xs transition-colors cursor-pointer"
                  >
                    Select {service.name}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Group 2: Websites and Mobile Apps */}
          <div className="space-y-6 pt-4 border-t border-[#343B66]">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#5FCB98]"></span>
              <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white">
                Group 2: Websites &amp; Mobile Apps
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                PACKAGES.website_launch,
                PACKAGES.business_website,
                PACKAGES.ecommerce_store,
                PACKAGES.app_mvp,
              ].map((project) => (
                <div
                  key={project.id}
                  className="bg-[#252A4A] border border-[#343B66] rounded-[18px] p-6 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#5FCB98]/20 text-[#5FCB98]">
                        {project.badge || "Project"}
                      </span>
                      <span className="font-mono text-xs text-[#A6ABC8]">
                        2 Revision Rounds
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-xl text-white">
                      {project.name}
                    </h4>
                    <p className="text-xs text-[#C4C8E0] leading-relaxed">
                      {project.description}
                    </p>

                    <div className="pt-2 border-t border-[#343B66] space-y-1.5">
                      <span className="text-sm font-mono text-white font-bold block">
                        {formatINR(project.setupRupees)}
                      </span>
                      <ul className="space-y-1">
                        {project.features.slice(0, 3).map((f, i) => (
                          <li key={i} className="text-[11px] text-[#A6ABC8] flex items-center gap-1.5">
                            <CheckIcon className="w-3 h-3 text-[#5FCB98] flex-shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => scrollToForm(project.id)}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-[#FBF7EE] text-[#1C1F3A] font-bold text-xs transition-colors cursor-pointer"
                  >
                    Build {project.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. How We Work (5-Step Agency Strip - Section 4) */}
      <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 bg-white border-b border-[#ECE6D8]">
        <div className="max-w-[1200px] mx-auto space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9A6400] bg-[#FAF0D7] px-3 py-1 rounded-full">
              The Process
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1C1F3A]">
              How We Work
            </h2>
            <p className="text-[#4A4F66] text-base leading-relaxed">
              From first lead to final paid handover with complete transparency and zero guesswork.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                step: "01",
                title: "Free Call",
                desc: "We understand your business, volume, and exact feature requirements on a 20-min consult.",
              },
              {
                step: "02",
                title: "Proposal & Agreement",
                desc: "Detailed Annex A scope, transparent quote, and binding agreement signed with 1-tap OTP.",
              },
              {
                step: "03",
                title: "The Build",
                desc: "We build your project with weekly Friday progress notes and live staging access.",
              },
              {
                step: "04",
                title: "2 Revision Rounds",
                desc: "Submit consolidated change lists in your portal. Extra features handled as paid change requests.",
              },
              {
                step: "05",
                title: "Handover & Ownership",
                desc: "Full code and account transfer (Annex B kit), 30-day warranty, and optional monthly care plans.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-[#FBF7EE] border border-[#ECE6D8] rounded-[18px] p-6 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <span className="font-mono text-xs font-extrabold text-[#9A6400] bg-[#FAF0D7] px-2.5 py-1 rounded-md inline-block">
                    Step {item.step}
                  </span>
                  <h3 className="font-display font-bold text-lg text-[#1C1F3A]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#4A4F66] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="w-8 h-1 bg-[#FDB91F] rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Pricing Section with Tabs (AI Agents | Websites & Apps) */}
      <section id="pricing" className="bg-[#FBF7EE] py-20 sm:py-28 px-4 sm:px-6 border-b border-[#ECE6D8]">
        <div className="max-w-[1200px] mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1C1F3A]">
                Transparent Pricing. No Surprises.
              </h2>
              <p className="text-[#4A4F66] text-base leading-relaxed">
                Choose between turnkey AI agents with monthly retainers or fixed-scope web &amp; mobile app projects.
              </p>
            </div>

            {/* Pricing Tabs */}
            <div className="inline-flex p-1.5 rounded-xl bg-white border border-[#ECE6D8] shadow-xs text-xs font-bold">
              <button
                type="button"
                onClick={() => setPricingTab("ai")}
                className={`px-5 py-2.5 rounded-lg transition-all cursor-pointer ${
                  pricingTab === "ai"
                    ? "bg-[#1C1F3A] text-white shadow-xs"
                    : "text-[#4A4F66] hover:text-[#1C1F3A]"
                }`}
              >
                AI Agents &amp; Bots
              </button>
              <button
                type="button"
                onClick={() => setPricingTab("web_app")}
                className={`px-5 py-2.5 rounded-lg transition-all cursor-pointer ${
                  pricingTab === "web_app"
                    ? "bg-[#1C1F3A] text-white shadow-xs"
                    : "text-[#4A4F66] hover:text-[#1C1F3A]"
                }`}
              >
                Websites &amp; Mobile Apps
              </button>
            </div>
          </div>

          {/* Founding Offer Banner */}
          <div className="bg-[#1C1F3A] text-white p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#343B66] shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#FDB91F] animate-pulse flex-shrink-0"></span>
              <p className="text-sm sm:text-base font-semibold text-white">
                Founding Offer: 50% discount on setup/project fee for our first 5 clients.
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

          {/* Tab 1: AI Agents Cards */}
          {pricingTab === "ai" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch animate-fade-in">
              {[packages.starter, packages.growth, packages.pro].map((plan) => {
                const isPrimary = plan.id === "growth";
                return (
                  <div
                    key={plan.id}
                    className={`rounded-[18px] p-7 sm:p-8 flex flex-col justify-between transition-transform duration-200 ${
                      isPrimary
                        ? "bg-[#1C1F3A] text-white shadow-xl ring-2 ring-[#FDB91F] md:-translate-y-2"
                        : "bg-white text-[#1C1F3A] border border-[#ECE6D8] shadow-card"
                    }`}
                  >
                    <div className="space-y-6">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`font-display font-bold text-2xl ${isPrimary ? "text-white" : "text-[#1C1F3A]"}`}>
                          {plan.name}
                        </h3>
                        {plan.badge && (
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              isPrimary
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
                          <span className={`font-mono text-3xl sm:text-4xl font-extrabold ${isPrimary ? "text-white" : "text-[#1C1F3A]"}`}>
                            {formatINR(plan.monthlyRupees)}
                          </span>
                          <span className={`text-sm ${isPrimary ? "text-[#A6ABC8]" : "text-[#727791]"}`}>
                            /month
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${isPrimary ? "text-[#A6ABC8]" : "text-[#727791]"}`}>
                          One-time setup: {formatINR(plan.setupRupees)} (50% off with founding offer)
                        </p>
                      </div>

                      <ul className="space-y-3 pt-4 border-t border-[#ECE6D8]/20">
                        {plan.features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-[13.5px] leading-snug">
                            <CheckIcon
                              className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                isPrimary ? "text-[#FDB91F]" : "text-[#2E7D5B]"
                              }`}
                            />
                            <span className={isPrimary ? "text-[#ECEBF7]" : "text-[#4A4F66]"}>
                              {feat}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-8">
                      <button
                        type="button"
                        onClick={() => scrollToForm(plan.id)}
                        className={`w-full min-h-[48px] rounded-xl font-semibold text-sm sm:text-base transition-all flex items-center justify-center cursor-pointer shadow-xs ${
                          isPrimary
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
          )}

          {/* Tab 2: Websites & Mobile Apps Cards */}
          {pricingTab === "web_app" && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
                {[
                  packages.website_launch,
                  packages.business_website,
                  packages.ecommerce_store,
                  packages.app_mvp,
                ].map((plan) => {
                  const isPrimary = plan.id === "business_website";
                  return (
                    <div
                      key={plan.id}
                      className={`rounded-[18px] p-6 flex flex-col justify-between transition-transform duration-200 ${
                        isPrimary
                          ? "bg-[#1C1F3A] text-white shadow-xl ring-2 ring-[#FDB91F] md:-translate-y-1"
                          : "bg-white text-[#1C1F3A] border border-[#ECE6D8] shadow-card"
                      }`}
                    >
                      <div className="space-y-5">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className={`font-display font-bold text-xl ${isPrimary ? "text-white" : "text-[#1C1F3A]"}`}>
                            {plan.name}
                          </h3>
                          {plan.badge && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isPrimary
                                  ? "bg-[#FDB91F] text-[#1C1F3A]"
                                  : "bg-[#FAF0D7] text-[#9A6400]"
                              }`}
                            >
                              {plan.badge}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className={`font-mono text-2xl sm:text-3xl font-extrabold ${isPrimary ? "text-white" : "text-[#1C1F3A]"}`}>
                            {formatINR(plan.setupRupees)}
                          </span>
                          <p className={`text-xs mt-1 ${isPrimary ? "text-[#A6ABC8]" : "text-[#727791]"}`}>
                            One-time project fee · 2 revision rounds
                          </p>
                        </div>

                        <ul className="space-y-2.5 pt-3 border-t border-[#ECE6D8]/20">
                          {plan.features.map((feat, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-2 text-xs leading-snug">
                              <CheckIcon
                                className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                                  isPrimary ? "text-[#FDB91F]" : "text-[#2E7D5B]"
                                }`}
                              />
                              <span className={isPrimary ? "text-[#ECEBF7]" : "text-[#4A4F66]"}>
                                {feat}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-6">
                        <button
                          type="button"
                          onClick={() => scrollToForm(plan.id)}
                          className={`w-full min-h-[44px] rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center cursor-pointer shadow-xs ${
                            isPrimary
                              ? "bg-[#FDB91F] hover:bg-[#E5A413] text-[#1C1F3A]"
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

              {/* Optional Care Plans Strip */}
              <div className="p-6 rounded-2xl bg-white border border-[#ECE6D8] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9A6400] bg-[#FAF0D7] px-2.5 py-0.5 rounded">
                    Optional Support
                  </span>
                  <h4 className="font-display font-bold text-lg text-[#1C1F3A]">
                    Monthly Care Plans (Post-Warranty)
                  </h4>
                  <p className="text-xs text-[#4A4F66]">
                    Website Care: <b>₹1,999/month</b> (updates, backups, 2h edits) · App Care: <b>₹4,999/month</b> (bug fixes, OS updates, 4h edits)
                  </p>
                </div>

                <div className="text-xs text-[#727791] text-right">
                  <span>Additional changes outside scope: <b>₹1,000/hour</b></span>
                </div>
              </div>
            </div>
          )}
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
              — {FOUNDER_NAME}, founder of AgentWala ({CITY}, {STATE})
            </p>
          </div>
        </div>
      </section>

      {/* 9. FAQ Section */}
      <section id="faq" className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
        <div className="max-w-[1200px] mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1C1F3A]">
              Frequently Asked Questions
            </h2>
            <p className="text-[#4A4F66] text-sm sm:text-base">
              Everything clinics ask us about languages, setup, pricing and patient data.
            </p>
          </div>

          <FAQAccordion faqs={content.faqs} />
        </div>
      </section>

      {/* 10. Project Enquiry Form Section (Section 4) */}
      <DemoForm />

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
            <span>{CITY}, {STATE}, India</span>
            <span>·</span>
            <a href={`mailto:${EMAIL}`} className="hover:text-white transition-colors">
              {EMAIL}
            </a>
            <span>·</span>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
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
    </div>
  );
}
