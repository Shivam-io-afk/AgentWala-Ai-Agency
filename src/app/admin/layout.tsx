"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RobotIcon } from "@/components/icons";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/admin" },
    { label: "Pipeline", href: "/admin/pipeline" },
    { label: "Invoices", href: "/admin/invoices" },
    { label: "Automations", href: "/admin/automations" },
    { label: "Templates", href: "/admin/templates" },
    { label: "Settings", href: "/admin/settings" },
  ];

  const toggleDark = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? "dark bg-[#12142A] text-[#ECEBF7]" : "bg-[#F6F5FB] text-[#1B1F3B]"}`}>
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-[#E2E0EE] dark:border-[#2F3356] bg-white dark:bg-[#1C1F3A] px-4 sm:px-8">
        <div className="max-w-[1240px] mx-auto h-16 flex items-center justify-between gap-4">
          {/* Logo & Portal title */}
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FDB91F] flex items-center justify-center text-[#1B1F3B] font-bold">
                <RobotIcon className="w-5 h-5 text-[#1B1F3B]" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight">
                AgentWala OS
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-[#1B1F3B] text-white dark:bg-[#ECEBF7] dark:text-[#12142A]"
                        : "text-[#585D7A] dark:text-[#A6A9C6] hover:bg-[#EAE8F5] dark:hover:bg-[#25294A]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Side: Quick Links & Theme Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleDark}
              className="p-2 rounded-lg text-xs font-medium border border-[#E2E0EE] dark:border-[#2F3356] hover:bg-[#EAE8F5] dark:hover:bg-[#25294A] transition-colors"
              title="Toggle Light / Dark mode"
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>

            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] text-[#585D7A] dark:text-[#A6A9C6] hover:text-[#1B1F3B] dark:hover:text-white transition-colors"
            >
              View Public Site ↗
            </Link>

            <div className="w-8 h-8 rounded-full bg-[#FAF0D7] text-[#9A6400] text-xs font-bold flex items-center justify-center border border-[#EEDB9F]">
              AW
            </div>

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356]"
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-3 border-t border-[#E2E0EE] dark:border-[#2F3356] space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
                    isActive
                      ? "bg-[#1B1F3B] text-white dark:bg-[#ECEBF7] dark:text-[#12142A]"
                      : "text-[#585D7A] dark:text-[#A6A9C6]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1240px] mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

