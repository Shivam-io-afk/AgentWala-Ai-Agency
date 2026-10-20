"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Invoice, Client } from "@/lib/types";
import { formatINR } from "@/lib/pricing";
import { RealtimeLoadingScreen } from "@/components/network-loading-indicator";

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/admin/data");
      const json = await res.json();
      if (json.success) {
        setInvoices(json.invoices || []);
        const clientMap: Record<string, Client> = {};
        (json.clients || []).forEach((c: Client) => {
          clientMap[c.id] = c;
        });
        setClients(clientMap);
      }
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleTogglePaid = async (invId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "paid" ? "sent" : "paid";
    try {
      await fetch("/api/admin/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invId, status: nextStatus }),
      });
      fetchInvoices();
    } catch (err) {
      console.error("Failed to update invoice status:", err);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (filter === "all") return true;
    return inv.status === filter;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <RealtimeLoadingScreen
          title="Loading Invoices &amp; Tax Registers"
          subtext="Fetching milestone invoices, payment links, and GST breakdowns..."
          fullScreen={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-[#1B1F3B] dark:text-white">
            Invoices &amp; Payments
          </h1>
          <p className="text-xs sm:text-sm text-[#585D7A] dark:text-[#A6A9C6]">
            Sequential financial year GST tax invoices (AW/2026-27/XXXX) and Razorpay integration.
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2">
          {["all", "paid", "sent", "draft"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                filter === f
                  ? "bg-[#1B1F3B] text-white dark:bg-[#ECEBF7] dark:text-[#12142A]"
                  : "bg-white dark:bg-[#1C1F3A] text-[#585D7A] dark:text-[#A6A9C6] border border-[#E2E0EE] dark:border-[#2F3356]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F6F5FB] dark:bg-[#12142A] text-[#585D7A] dark:text-[#A6A9C6] border-b border-[#E2E0EE] dark:border-[#2F3356]">
              <tr>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Invoice #</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Client</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Due Date</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Subtotal</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">GST (18%)</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Total</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E0EE] dark:divide-[#2F3356]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#585D7A]">
                    Loading invoices…
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#585D7A]">
                    No invoices recorded in this category.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const client = clients[inv.client_id];
                  const isPaid = inv.status === "paid";

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-[#FAF9FD] dark:hover:bg-[#232747] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1B1F3B] dark:text-white">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#1B1F3B] dark:text-white">
                        {client ? (
                          <Link href={`/admin/clients/${client.id}`} className="hover:underline">
                            {client.name}
                          </Link>
                        ) : (
                          "Client Account"
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#E7E5F1] text-[#1B1F3B]">
                          {inv.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#585D7A] dark:text-[#A6A9C6]">
                        {inv.due_date}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#585D7A] dark:text-[#A6A9C6]">
                        {formatINR(inv.subtotal_paise / 100)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#585D7A] dark:text-[#A6A9C6]">
                        {formatINR(((inv.cgst_paise || 0) + (inv.sgst_paise || 0) + (inv.igst_paise || 0) + (inv.gst_paise || 0)) / 100)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1B1F3B] dark:text-white">
                        {formatINR(inv.total_paise / 100)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isPaid
                              ? "bg-[#E4F3EB] text-[#2E7D5B]"
                              : "bg-[#FAF0D7] text-[#9A6400]"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {inv.razorpay_payment_url && (
                          <a
                            href={inv.razorpay_payment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded bg-[#FDB91F] text-[#1B1F3B] font-semibold text-[11px] inline-block"
                          >
                            Pay Link
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleTogglePaid(inv.id, inv.status)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                            isPaid
                              ? "border border-[#E2E0EE] text-[#585D7A] hover:bg-[#F6F5FB]"
                              : "bg-[#2E7D5B] text-white hover:bg-[#25664A]"
                          }`}
                        >
                          {isPaid ? "Mark Unpaid" : "Mark Paid"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

