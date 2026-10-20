"use client";

import React, { useState } from "react";
import { ChevronDownIcon } from "./icons";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  faqs: FAQItem[];
}

export function FAQAccordion({ faqs }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  // Structured Data Schema for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      {/* Inject FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        const headingId = `faq-head-${index}`;
        const panelId = `faq-body-${index}`;

        return (
          <div
            key={index}
            className="border border-[#ECE6D8] rounded-[14px] bg-white overflow-hidden transition-all duration-200"
          >
            <button
              type="button"
              id={headingId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(index)}
              className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-semibold text-[#1C1F3A] hover:bg-[#FBF7EE] transition-colors focus-visible:outline-2 focus-visible:outline-[#FDB91F]"
            >
              <span className="text-[15.5px] sm:text-base leading-snug">{faq.question}</span>
              <ChevronDownIcon
                className={`w-5 h-5 text-[#4A4F66] flex-shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={headingId}
              hidden={!isOpen}
              className={`px-5 pb-5 pt-1 text-[14.5px] text-[#4A4F66] leading-relaxed border-t border-[#F5EFE3] ${
                isOpen ? "block" : "hidden"
              }`}
            >
              <p>{faq.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
