"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { appPath } from "@/lib/site";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-navy-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- small static brand mark */}
          <img src="/hqlogo.png" alt="Audax HQ" className="h-9 w-auto" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-navy-200 transition-colors hover:text-cream-50"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href={appPath("/login")} className="text-sm font-medium text-navy-200 transition-colors hover:text-cream-50">
            Sign in
          </Link>
          <Link
            href={appPath("/signup")}
            className="rounded-xl bg-burnt-500 px-4 py-2.5 text-sm font-semibold text-cream-50 shadow-sm transition-colors hover:bg-burnt-400"
          >
            Start for free
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="cursor-pointer text-cream-50 lg:hidden"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-navy-700 bg-navy-900 transition-[max-height] duration-300 lg:hidden",
          open ? "max-h-96" : "max-h-0 border-t-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-5 py-4">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-200 transition-colors hover:bg-navy-800 hover:text-cream-50"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-navy-700 pt-4">
            <Link
              href={appPath("/login")}
              className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-navy-200 hover:bg-navy-800 hover:text-cream-50"
            >
              Sign in
            </Link>
            <Link
              href={appPath("/signup")}
              className="rounded-xl bg-burnt-500 px-3 py-2.5 text-center text-sm font-semibold text-cream-50 hover:bg-burnt-400"
            >
              Start for free
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
