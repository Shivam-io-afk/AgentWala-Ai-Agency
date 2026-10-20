"use client";

import React, { useEffect, useState, useRef } from "react";
import { CheckIcon } from "./icons";
import { ChatMessage } from "@/content/clinics";

interface ChatMockupProps {
  avatarTitle: string;
  avatarInitials: string;
  statusText: string;
  messages: ChatMessage[];
  confirmationChip: string;
}

export function ChatMockup({
  avatarTitle,
  avatarInitials,
  statusText,
  messages,
  confirmationChip,
}: ChatMockupProps) {
  const [visibleCount, setVisibleCount] = useState<number>(0);
  const [showChip, setShowChip] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setVisibleCount(messages.length);
      setShowChip(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          // Animate messages one by one
          messages.forEach((_, idx) => {
            setTimeout(() => {
              setVisibleCount((prev) => Math.max(prev, idx + 1));
            }, (idx + 1) * 600);
          });

          // Show confirmation chip after last message
          setTimeout(() => {
            setShowChip(true);
          }, (messages.length + 1) * 650);
        }
      },
      { threshold: 0.25 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasAnimated, messages]);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[420px] mx-auto rounded-[22px] overflow-hidden shadow-2xl border border-[#E2DECE] bg-[#F7F5EE]"
      aria-label="Interactive demonstration of WhatsApp AI appointment booking"
    >
      {/* WhatsApp Chat Header */}
      <div className="bg-[#1C1F3A] text-white px-4 py-3.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#FDB91F] text-[#1C1F3A] font-bold text-sm flex items-center justify-center flex-shrink-0 font-display">
          {avatarInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate tracking-tight text-white">
            {avatarTitle}
          </div>
          <div className="text-[11.5px] text-[#A6ABC8] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#25D366] inline-block animate-pulse"></span>
            <span className="truncate">{statusText}</span>
          </div>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="p-4 space-y-3 min-h-[310px] flex flex-col justify-end bg-[#FAF8F2] bg-opacity-95">
        {messages.map((msg, index) => {
          const isVisible = visibleCount > index;
          const isPatient = msg.sender === "patient";

          return (
            <div
              key={msg.id}
              className={`flex flex-col transition-all duration-500 ease-out ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              } ${isPatient ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed shadow-sm ${
                  isPatient
                    ? "bg-[#D9FDD3] text-[#111B21] rounded-tr-xs"
                    : "bg-white text-[#1C1F3A] border border-[#ECE6D8] rounded-tl-xs"
                }`}
              >
                <p className="font-normal">{msg.text}</p>
                <div
                  className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${
                    isPatient ? "text-[#58735C]" : "text-[#878D9F]"
                  }`}
                >
                  <span>{msg.time}</span>
                  {isPatient && (
                    <span className="text-[#53BDEB]">
                      <svg width="14" height="14" viewBox="0 0 16 15" fill="none">
                        <path
                          d="M15 4.5L6.5 13L2 8.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M11.5 4.5L6.5 9.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Confirmation Chip */}
        <div
          className={`flex justify-center pt-2 transition-all duration-500 ${
            showChip ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E4F3EB] text-[#2E7D5B] text-xs font-semibold rounded-full border border-[#B9E3CF] shadow-xs">
            <CheckIcon className="w-3.5 h-3.5 text-[#2E7D5B]" />
            <span>{confirmationChip}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
