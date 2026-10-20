"use client";

import React, { useState } from "react";
import { DEMO_NUMBER, BOOKING_LINK, FOUNDER_NAME } from "@/content/site";

interface Template {
  id: string;
  name: string;
  channel: "WhatsApp" | "Email" | "Proposal";
  trigger: string;
  body: string;
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "welcome_demo",
    name: "A2: Welcome Message (WhatsApp)",
    channel: "WhatsApp",
    trigger: "Sent within 2 minutes of website lead form submission",
    body: `Namaste {{owner_name}} ji!

Thank you for your interest in AgentWala for {{business_name}}.

I'm ${FOUNDER_NAME}, founder of AgentWala. You can test our demo receptionist right now by calling:
📞 {{demo_number}}

Want to see how it works for {{business_name}} specifically? Pick a convenient 20-min walkthrough slot here:
📅 {{booking_link}}

Feel free to reply directly to this chat if you have any questions!`,
  },
  {
    id: "meeting_reminder_24h",
    name: "A7: Meeting Reminder 24h Before (WhatsApp)",
    channel: "WhatsApp",
    trigger: "Sent automatically 24 hours prior to scheduled Cal.com demo",
    body: `Namaste {{owner_name}} ji!

Quick reminder: Our 20-minute AgentWala demo for {{business_name}} is tomorrow at {{meeting_time}}.

We will have a customized voice demo ready for you to call live. Looking forward to our chat!`,
  },
  {
    id: "proposal_delivery",
    name: "A8: Proposal & Investment Summary",
    channel: "WhatsApp",
    trigger: "Sent upon founder one-tap approval (H2)",
    body: `Namaste {{owner_name}} ji!

Here is the customized proposal for {{business_name}} with the {{package_name}} package.

View & Accept Proposal:
👉 {{portal_link}}

Included: AI receptionist answering phone calls in Hindi & English, WhatsApp 24×7 booking agent, and calendar sync. Setup fee is 50% waived under our founding offer.`,
  },
  {
    id: "onboarding_request",
    name: "A10: Onboarding Intake Form (WhatsApp)",
    channel: "WhatsApp",
    trigger: "Dispatched automatically upon 50% advance confirmation (w2)",
    body: `Payment received with thanks, {{owner_name}} ji!

To train your AI receptionist on {{business_name}}'s exact timings, consultation fees, and doctor availability, please fill our quick 3-minute form:
📝 {{onboarding_link}}

We will build and run 50 test simulations within 48 hours!`,
  },
];

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedBody, setEditedBody] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const startEdit = (tpl: Template) => {
    setEditingId(tpl.id);
    setEditedBody(tpl.body);
    setSavedSuccess(false);
  };

  const saveEdit = () => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === editingId ? { ...t, body: editedBody } : t))
    );
    setEditingId(null);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-[#1B1F3B] dark:text-white">
            Message Templates
          </h1>
          <p className="text-xs sm:text-sm text-[#585D7A] dark:text-[#A6A9C6] mt-1">
            Meta-approved WhatsApp templates and proposal messages with dynamic variable substitution.
          </p>
        </div>

        {savedSuccess && (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#E4F3EB] text-[#2E7D5B]">
            ✓ Template updated successfully
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {templates.map((tpl) => {
          const isEditing = editingId === tpl.id;

          return (
            <div
              key={tpl.id}
              className="bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#1B1F3B] dark:text-white">
                    {tpl.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FAF0D7] text-[#9A6400]">
                    {tpl.channel}
                  </span>
                </div>
                <p className="text-[11px] text-[#727791]">{tpl.trigger}</p>

                {isEditing ? (
                  <textarea
                    rows={8}
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] text-xs font-mono text-[#1B1F3B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FDB91F]"
                  />
                ) : (
                  <pre className="p-3.5 rounded-xl bg-[#FAF9FD] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] text-xs font-sans whitespace-pre-wrap text-[#1B1F3B] dark:text-[#ECEBF7] leading-relaxed">
                    {tpl.body}
                  </pre>
                )}
              </div>

              <div className="pt-2 flex justify-between items-center text-xs">
                <div className="flex gap-1.5 text-[10.5px] text-[#727791]">
                  <span>Variables:</span>
                  <code className="bg-[#E7E5F1] dark:bg-[#2B2F52] px-1 rounded text-[#1B1F3B] dark:text-white">
                    {"{{owner_name}}"}
                  </code>
                  <code className="bg-[#E7E5F1] dark:bg-[#2B2F52] px-1 rounded text-[#1B1F3B] dark:text-white">
                    {"{{business_name}}"}
                  </code>
                </div>

                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 border rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="px-3 py-1 bg-[#FDB91F] text-[#1B1F3B] font-bold rounded-lg text-xs"
                    >
                      Save Template
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(tpl)}
                    className="px-3 py-1 rounded bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] text-xs font-semibold hover:bg-[#EAE8F5]"
                  >
                    Edit Template
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

